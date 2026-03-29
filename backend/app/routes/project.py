from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from app.errors import ApiError
from app.middleware.auth import require_auth
from app.models.organization import Organization, OrgType
from app.models.organization_member import OrganizationMember
from app.models.project import Project, ProjectStatus
from app.utils.db import db_commit

project_bp = Blueprint("projects", __name__, url_prefix="/projects")


def _serialize_project(project: Project) -> dict:
    """Convert ORM project object to a JSON-friendly API shape."""
    return {
        "id": project.id,
        "name": project.name,
        "project_number": project.project_number,
        "status": project.status.value,
        "organization_id": project.organization_id,
        "created_by_user_id": project.created_by_user_id,
        "customer_id": project.customer_id,
        "customer_name": project.customer.name if project.customer else None,
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
        "completed_at": project.completed_at.isoformat()
        if project.completed_at
        else None,
    }


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
    return jsonify(_serialize_project(project)), 201


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

    return jsonify([_serialize_project(p) for p in projects])


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

    return jsonify(_serialize_project(project))
