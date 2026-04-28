from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from app.config.settings_resolver import (
    clean_overrides,
    resolve_org_settings,
    resolve_settings_with_sources,
    validate_settings,
)
from app.errors import ApiError
from app.middleware.auth import require_auth
from app.middleware.roles import require_project_role
from app.models.energy import Energy
from app.models.generated_invoice import GeneratedInvoice
from app.models.material_invoice import MaterialInvoice
from app.models.organization import Organization, OrgType
from app.models.organization_member import OrganizationMember
from app.models.project import Project, ProjectStatus
from app.models.project_material import ProjectMaterial
from app.models.project_member import ProjectRole
from app.models.project_transport import ProjectTransport
from app.models.project_waste_item import ProjectWasteItem
from app.models.transport import Transport
from app.models.transport_report import TransportReport
from app.models.waste_invoice import WasteInvoice
from app.services.recalculation import recalculate_project
from app.utils.db import db_commit

project_bp = Blueprint("projects", __name__, url_prefix="/projects")


def _get_user_org_id(session, user_id: int) -> int | None:
    """Return the organization_id for the user's first active membership."""
    membership = (
        session.query(OrganizationMember)
        .filter(OrganizationMember.user_id == user_id)
        .first()
    )
    return membership.organization_id if membership else None


@project_bp.route("", methods=["POST"])
@require_auth
def create_project():
    """Create a new project linked to the authenticated user's organization."""
    payload = request.get_json(silent=True) or {}

    name = payload.get("name", "").strip()
    if not name:
        raise ApiError(
            "Prosjektnavn er påkrevd.",
            code="MISSING_FIELD",
            suggestion="Oppgi et navn for prosjektet.",
        )

    session = g.db

    organization_id = _get_user_org_id(session, g.current_user_id)
    if not organization_id:
        raise ApiError(
            "Brukeren er ikke medlem av noen organisasjon.",
            code="NO_ORGANIZATION",
            suggestion=(
                "Du må være tilknyttet en organisasjon for å opprette prosjekter."
            ),
        )

    customer_id = payload.get("customer_id") or None
    customer_name = (payload.get("customer_name") or "").strip()
    if customer_name and not customer_id:
        customer = (
            session.query(Organization)
            .filter(
                Organization.name == customer_name,
                Organization.org_type == OrgType.CUSTOMER,
            )
            .first()
        )
        if not customer:
            customer = Organization(name=customer_name, org_type=OrgType.CUSTOMER)
            session.add(customer)
            session.flush()
        customer_id = customer.id

    project = Project(
        name=name,
        organization_id=organization_id,
        created_by_user_id=g.current_user_id,
        project_number=payload.get("project_number") or None,
        customer_id=customer_id,
        status=ProjectStatus.ACTIVE,
    )

    session.add(project)

    with db_commit(
        session,
        "Kunne ikke opprette prosjektet.",
        "SAVE_FAILED",
        integrity_msg="Kunne ikke opprette prosjektet — duplikat eller ugyldig data.",
    ):
        pass

    session.refresh(project)
    return jsonify(project.to_dict()), 201


@project_bp.route("", methods=["GET"])
@require_auth
def list_projects():
    """Return all projects belonging to the authenticated user's organization."""

    session = g.db

    organization_id = _get_user_org_id(session, g.current_user_id)
    if not organization_id:
        raise ApiError(
            "Brukeren er ikke medlem av noen organisasjon.",
            code="NO_ORGANIZATION",
            suggestion="Du må være tilknyttet en organisasjon for å se prosjekter.",
        )

    projects = (
        session.query(Project)
        .filter(Project.organization_id == organization_id)
        .order_by(Project.created_at.desc())
        .all()
    )

    return jsonify([p.to_dict() for p in projects])


@project_bp.route("/<int:project_id>", methods=["GET"])
@require_auth
def get_project(project_id: int):
    """Return a single project by ID, scoped to the user's organization."""

    session = g.db

    organization_id = _get_user_org_id(session, g.current_user_id)
    if not organization_id:
        raise ApiError(
            "Brukeren er ikke medlem av noen organisasjon.",
            code="NO_ORGANIZATION",
        )

    project = (
        session.query(Project)
        .filter(
            Project.id == project_id,
            Project.organization_id == organization_id,
        )
        .first()
    )

    if not project:
        raise ApiError("Prosjektet ble ikke funnet.", code="NOT_FOUND", status=404)

    return jsonify(project.to_dict())


@project_bp.route("/<int:project_id>", methods=["PATCH"])
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR))
def update_project(project_id: int):
    """Update the name of the project provided"""
    payload = request.get_json(silent=True) or {}

    name = (payload.get("name") or "").strip()
    if not name:
        raise ApiError(
            "Prosjektnavn er påkrevd",
            code="MISSING_FIELD",
            suggestion="Oppgi et navn for prosjektet",
        )
    session = g.db
    project = session.get(Project, project_id)
    if not project:
        raise ApiError("Prosjektet ble ikke funnet", code="NOT_FOUND", status=404)
    project.name = name

    with db_commit(session, "Kunne ikke oppdatere prosjektet", "SAVE_FAILED"):
        pass
    session.refresh(project)
    return jsonify(project.to_dict())


@project_bp.route("/<int:project_id>", methods=["DELETE"])
@require_auth
@require_project_role((ProjectRole.OWNER,))
def delete_project(project_id: int):
    """Delete a project and its project-owned data."""
    session = g.db
    project = session.get(Project, project_id)
    if not project:
        raise ApiError("Prosjektet ble ikke funnet.", code="NOT_FOUND", status=404)

    # Invoices/reports have no DB-level CASCADE — they can be shared across projects.
    # Compute which ones become orphaned before we delete anything.
    def _orphan_source_ids(link_model, source_col):
        this_ids = {
            id
            for (id,) in session.query(source_col)
            .filter(link_model.project_id == project_id, source_col.isnot(None))
            .distinct()
            .all()
        }
        if not this_ids:
            return []
        shared_ids = {
            id
            for (id,) in session.query(source_col)
            .filter(source_col.in_(this_ids), link_model.project_id != project_id)
            .distinct()
            .all()
        }
        return list(this_ids - shared_ids)

    orphan_material_ids = _orphan_source_ids(ProjectMaterial, ProjectMaterial.source_id)
    orphan_transport_ids = _orphan_source_ids(
        ProjectTransport, ProjectTransport.source_id
    )
    orphan_waste_ids = _orphan_source_ids(ProjectWasteItem, ProjectWasteItem.source_id)

    for model_cls in (
        ProjectMaterial,
        ProjectTransport,
        ProjectWasteItem,
        Transport,
        Energy,
        GeneratedInvoice,
    ):
        session.query(model_cls).filter(model_cls.project_id == project_id).delete(
            synchronize_session=False
        )

    if orphan_material_ids:
        session.query(MaterialInvoice).filter(
            MaterialInvoice.id.in_(orphan_material_ids)
        ).delete(synchronize_session=False)
    if orphan_transport_ids:
        session.query(TransportReport).filter(
            TransportReport.id.in_(orphan_transport_ids)
        ).delete(synchronize_session=False)
    if orphan_waste_ids:
        session.query(WasteInvoice).filter(
            WasteInvoice.id.in_(orphan_waste_ids)
        ).delete(synchronize_session=False)

    session.delete(project)

    with db_commit(session, "Kunne ikke slette prosjektet.", "DELETE_FAILED"):
        pass

    return jsonify({"status": "deleted"})


# ---------------------------------------------------------------------------
# Project calculation settings
# ---------------------------------------------------------------------------


@project_bp.route("/<int:project_id>/settings", methods=["GET"])
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR, ProjectRole.VIEWER))
def get_project_settings(project_id: int):
    """Return fully resolved calculation settings for the project."""
    session = g.db
    project = session.get(Project, project_id)
    if not project:
        raise ApiError("Prosjektet ble ikke funnet.", code="NOT_FOUND", status=404)

    return jsonify({"settings": resolve_settings_with_sources(session, project_id)})


@project_bp.route("/<int:project_id>/settings", methods=["PATCH"])
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR))
def update_project_settings(project_id: int):
    """Update calculation settings for the project (partial merge)."""
    payload = request.get_json(silent=True) or {}
    if not payload:
        raise ApiError("Ingen innstillinger oppgitt.", code="MISSING_FIELD")

    validated = validate_settings(payload)

    session = g.db
    project = session.get(Project, project_id)
    if not project:
        raise ApiError("Prosjektet ble ikke funnet.", code="NOT_FOUND", status=404)

    merged = {**(project.settings or {}), **validated}
    inherited = resolve_org_settings(session, project.organization_id)
    project.settings = clean_overrides(merged, inherited)

    recalculate_project(session, project_id, changed_keys=set(validated.keys()))

    with db_commit(session, "Kunne ikke oppdatere innstillingene.", "SAVE_FAILED"):
        pass

    session.refresh(project)
    return jsonify({"settings": resolve_settings_with_sources(session, project_id)})


@project_bp.route("/<int:project_id>/settings", methods=["DELETE"])
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR))
def reset_project_settings(project_id: int):
    """Clear all project-level overrides (revert to inherited values)."""
    session = g.db
    project = session.get(Project, project_id)
    if not project:
        raise ApiError("Prosjektet ble ikke funnet.", code="NOT_FOUND", status=404)

    old_keys = set(project.settings.keys()) if project.settings else set()
    project.settings = None

    if old_keys:
        recalculate_project(session, project_id, changed_keys=old_keys)

    with db_commit(session, "Kunne ikke tilbakestille innstillingene.", "SAVE_FAILED"):
        pass

    session.refresh(project)
    return jsonify({"settings": resolve_settings_with_sources(session, project_id)})


@project_bp.route("/<int:project_id>/settings/<string:key>", methods=["DELETE"])
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR))
def delete_project_setting(project_id: int, key: str):
    """Remove a single project-level override (reverts to inherited value)."""
    session = g.db
    project = session.get(Project, project_id)
    if not project:
        raise ApiError("Prosjektet ble ikke funnet.", code="NOT_FOUND", status=404)

    if not project.settings or key not in project.settings:
        raise ApiError(
            f"Innstillingen '{key}' er ikke overstyrt på prosjektnivå.",
            code="NOT_FOUND",
            status=404,
        )

    updated = {k: v for k, v in project.settings.items() if k != key}
    project.settings = updated or None

    recalculate_project(session, project_id, changed_keys={key})

    with db_commit(session, "Kunne ikke fjerne innstillingen.", "SAVE_FAILED"):
        pass

    session.refresh(project)
    return jsonify({"settings": resolve_settings_with_sources(session, project_id)})
