from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from app.errors import ApiError
from app.middleware.auth import require_auth
from app.middleware.roles import require_org_role
from app.models.organization import Organization, OrgType
from app.models.organization_member import OrganizationMember, OrgRole
from app.models.user import User
from app.utils.db import db_commit
from app.utils.parsing import parse_enum

organization_bp = Blueprint("organizations", __name__, url_prefix="/organizations")


@organization_bp.route("", methods=["POST"])
@require_auth
def create_organization():
    """Create organization and auto-assign creator as OWNER."""
    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    org_type = parse_enum(payload.get("org_type"), OrgType)

    if not name:
        raise ApiError("Organisasjonsnavn er påkrevd.", code="MISSING_FIELD")

    if not org_type:
        raise ApiError(
            "org_type må være COMPANY eller CUSTOMER.",
            code="INVALID_FIELD",
        )

    session = g.db
    user = session.get(User, g.current_user_id)
    if not user:
        raise ApiError("Ikke autentisert.", code="UNAUTHORIZED", status=401)

    org = Organization(
        name=name,
        org_number=payload.get("org_number"),
        address=payload.get("address"),
        phone=payload.get("phone"),
        email=payload.get("email"),
        org_type=org_type,
    )
    session.add(org)
    session.flush()

    # The creator immediately gets OWNER role in this organization.
    owner_membership = OrganizationMember(
        user_id=user.id,
        organization_id=org.id,
        role=OrgRole.OWNER,
    )
    session.add(owner_membership)

    with db_commit(
        session,
        "Kunne ikke opprette organisasjonen.",
        "SAVE_FAILED",
        integrity_msg="Duplikat eller ugyldig organisasjonsdata.",
    ):
        pass

    session.refresh(org)
    return jsonify(org.to_dict()), 201


@organization_bp.route("/<int:organization_id>", methods=["GET"])
@require_org_role((OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER, OrgRole.VIEWER))
def get_organization(organization_id: int):
    """Read organization details for any organization member role."""
    session = g.db
    org = session.get(Organization, organization_id)
    if not org:
        raise ApiError("Organisasjonen ble ikke funnet.", code="NOT_FOUND", status=404)
    return jsonify(org.to_dict())


@organization_bp.route("/<int:organization_id>", methods=["PATCH"])
@require_org_role((OrgRole.OWNER, OrgRole.ADMIN))
def update_organization(organization_id: int):
    """Update organization metadata (restricted to OWNER/ADMIN)."""
    payload = request.get_json(silent=True) or {}

    session = g.db
    org = session.get(Organization, organization_id)
    if not org:
        raise ApiError("Organisasjonen ble ikke funnet.", code="NOT_FOUND", status=404)

    if "name" in payload:
        new_name = (payload.get("name") or "").strip()
        if not new_name:
            raise ApiError(
                "Organisasjonsnavn kan ikke være tomt.",
                code="INVALID_FIELD",
            )
        org.name = new_name
    if "org_number" in payload:
        org.org_number = payload.get("org_number")
    if "address" in payload:
        org.address = payload.get("address")
    if "phone" in payload:
        org.phone = payload.get("phone")
    if "email" in payload:
        org.email = payload.get("email")

    if "org_type" in payload:
        parsed_org_type = parse_enum(payload.get("org_type"), OrgType)
        if not parsed_org_type:
            raise ApiError(
                "org_type må være COMPANY eller CUSTOMER.",
                code="INVALID_FIELD",
            )
        org.org_type = parsed_org_type

    with db_commit(
        session,
        "Kunne ikke oppdatere organisasjonen.",
        "SAVE_FAILED",
        integrity_msg="Duplikat eller ugyldig organisasjonsdata.",
    ):
        pass

    session.refresh(org)
    return jsonify(org.to_dict())


@organization_bp.route("/<int:organization_id>/members", methods=["GET"])
@require_org_role((OrgRole.OWNER, OrgRole.ADMIN))
def get_organization_members(organization_id: int):
    """List organization members for admin-level roles."""
    session = g.db
    org = session.get(Organization, organization_id)
    if not org:
        raise ApiError("Organisasjonen ble ikke funnet.", code="NOT_FOUND", status=404)

    members = (
        session.query(OrganizationMember)
        .filter(OrganizationMember.organization_id == organization_id)
        .all()
    )

    return jsonify([m.to_dict() for m in members])


@organization_bp.route("/<int:organization_id>/members", methods=["POST"])
@require_org_role((OrgRole.OWNER, OrgRole.ADMIN))
def add_organization_member(organization_id: int):
    """Add or update an organization member role (upsert behavior).

    ADMINs are intentionally allowed to assign any role, including OWNER.
    This is by design: org admins act as trusted delegates for business owners
    and need the ability to manage the full role hierarchy.
    """
    payload = request.get_json(silent=True) or {}

    user_id = payload.get("user_id")
    if user_id is None:
        raise ApiError("user_id er påkrevd.", code="MISSING_FIELD")

    role = parse_enum(payload.get("role"), OrgRole)
    if not role:
        raise ApiError(
            "role må være en av OWNER, ADMIN, MEMBER, VIEWER.",
            code="INVALID_FIELD",
        )

    session = g.db
    org = session.get(Organization, organization_id)
    if not org:
        raise ApiError("Organisasjonen ble ikke funnet.", code="NOT_FOUND", status=404)

    user = session.get(User, user_id)
    if not user:
        raise ApiError("Brukeren ble ikke funnet.", code="NOT_FOUND", status=404)

    existing = (
        session.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user.id,
        )
        .one_or_none()
    )

    # If the user is already a member, treat this as a role update.
    if existing:
        existing.role = role
        with db_commit(
            session,
            "Kunne ikke oppdatere medlemskapet.",
            "SAVE_FAILED",
            integrity_msg="Duplikat eller ugyldig data.",
        ):
            pass
        session.refresh(existing)
        return jsonify(existing.to_dict())

    member = OrganizationMember(
        organization_id=organization_id,
        user_id=user.id,
        role=role,
    )
    session.add(member)

    with db_commit(
        session,
        "Kunne ikke legge til medlem.",
        "SAVE_FAILED",
        integrity_msg="Duplikat eller ugyldig data.",
    ):
        pass

    session.refresh(member)
    return jsonify(member.to_dict()), 201


@organization_bp.route(
    "/<int:organization_id>/members/<int:user_id>", methods=["DELETE"]
)
@require_org_role((OrgRole.OWNER, OrgRole.ADMIN))
def remove_organization_member(organization_id: int, user_id: int):
    """Remove a member from an organization."""
    session = g.db

    membership = (
        session.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == user_id,
        )
        .one_or_none()
    )

    if not membership:
        raise ApiError("Medlemskapet ble ikke funnet.", code="NOT_FOUND", status=404)

    with db_commit(session, "Kunne ikke fjerne medlemskapet.", "DELETE_FAILED"):
        session.delete(membership)
    return "", 204
