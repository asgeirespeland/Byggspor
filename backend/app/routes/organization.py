from __future__ import annotations

from flask import Blueprint, g, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.middleware.roles import require_org_role
from app.models.organization import Organization, OrgType
from app.models.organization_member import OrganizationMember, OrgRole
from app.models.user import User

organization_bp = Blueprint("organizations", __name__, url_prefix="/organizations")


def _parse_org_type(value: str | None) -> OrgType | None:
    """Accept both enum names (COMPANY) and enum values (company)."""
    if not value:
        return None

    normalized = value.strip().upper()
    if normalized in OrgType.__members__:
        return OrgType[normalized]

    lowered = value.strip().lower()
    for org_type in OrgType:
        if org_type.value == lowered:
            return org_type

    return None


def _parse_org_role(value: str | None) -> OrgRole | None:
    """Accept both enum names (OWNER) and enum values (owner)."""
    if not value:
        return None

    normalized = value.strip().upper()
    if normalized in OrgRole.__members__:
        return OrgRole[normalized]

    lowered = value.strip().lower()
    for role in OrgRole:
        if role.value == lowered:
            return role

    return None


def _serialize_org(org: Organization) -> dict:
    """Serialize organization object for API responses."""
    return {
        "id": org.id,
        "name": org.name,
        "org_number": org.org_number,
        "address": org.address,
        "phone": org.phone,
        "email": org.email,
        "org_type": org.org_type.name if org.org_type else None,
        "created_at": org.created_at.isoformat() if org.created_at else None,
        "updated_at": org.updated_at.isoformat() if org.updated_at else None,
    }


def _serialize_member(member: OrganizationMember, user: User) -> dict:
    """Serialize member row together with basic user info."""
    return {
        "id": member.id,
        "organization_id": member.organization_id,
        "user_id": member.user_id,
        "role": member.role.name,
        "joined_at": member.joined_at.isoformat() if member.joined_at else None,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "phone": user.phone,
        },
    }


@organization_bp.route("", methods=["POST"])
def create_organization():
    """Create organization and auto-assign creator as OWNER."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    payload = request.get_json(silent=True) or {}
    name = (payload.get("name") or "").strip()
    org_type = _parse_org_type(payload.get("org_type"))

    if not name:
        return jsonify(error="name is required"), 400

    if not org_type:
        return jsonify(error="org_type must be one of COMPANY or CUSTOMER"), 400

    session = g.db
    user = session.get(User, current_user_id)
    if not user:
        return jsonify(error="Unauthorized"), 401

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

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        return jsonify(error="Conflict: duplicate or invalid data"), 409

    session.refresh(org)
    return jsonify(_serialize_org(org)), 201


@organization_bp.route("/<int:organization_id>", methods=["GET"])
@require_org_role((OrgRole.OWNER, OrgRole.ADMIN, OrgRole.MEMBER, OrgRole.VIEWER))
def get_organization(organization_id: int):
    """Read organization details for any organization member role."""
    session = g.db
    org = session.get(Organization, organization_id)
    if not org:
        return jsonify(error="Organization not found"), 404
    return jsonify(_serialize_org(org))


@organization_bp.route("/<int:organization_id>", methods=["PATCH"])
@require_org_role((OrgRole.OWNER, OrgRole.ADMIN))
def update_organization(organization_id: int):
    """Update organization metadata (restricted to OWNER/ADMIN)."""
    payload = request.get_json(silent=True) or {}

    session = g.db
    org = session.get(Organization, organization_id)
    if not org:
        return jsonify(error="Organization not found"), 404

    if "name" in payload:
        new_name = (payload.get("name") or "").strip()
        if not new_name:
            return jsonify(error="name cannot be empty"), 400
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
        parsed_org_type = _parse_org_type(payload.get("org_type"))
        if not parsed_org_type:
            return jsonify(error="org_type must be one of COMPANY or CUSTOMER"), 400
        org.org_type = parsed_org_type

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        return jsonify(error="Conflict: duplicate or invalid data"), 409

    session.refresh(org)
    return jsonify(_serialize_org(org))


@organization_bp.route("/<int:organization_id>/members", methods=["GET"])
@require_org_role((OrgRole.OWNER, OrgRole.ADMIN))
def get_organization_members(organization_id: int):
    """List organization members for admin-level roles."""
    session = g.db
    org = session.get(Organization, organization_id)
    if not org:
        return jsonify(error="Organization not found"), 404

    members = (
        session.query(OrganizationMember, User)
        .join(User, User.id == OrganizationMember.user_id)
        .filter(OrganizationMember.organization_id == organization_id)
        .all()
    )

    return jsonify([_serialize_member(member, user) for member, user in members])


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
        return jsonify(error="user_id is required"), 400

    role = _parse_org_role(payload.get("role"))
    if not role:
        return jsonify(error="role must be one of OWNER, ADMIN, MEMBER, VIEWER"), 400

    session = g.db
    org = session.get(Organization, organization_id)
    if not org:
        return jsonify(error="Organization not found"), 404

    user = session.get(User, user_id)
    if not user:
        return jsonify(error="User not found"), 404

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
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            return jsonify(error="Conflict: duplicate or invalid data"), 409
        session.refresh(existing)
        return jsonify(_serialize_member(existing, user))

    member = OrganizationMember(
        organization_id=organization_id,
        user_id=user.id,
        role=role,
    )
    session.add(member)

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        return jsonify(error="Conflict: duplicate or invalid data"), 409

    session.refresh(member)
    return jsonify(_serialize_member(member, user)), 201


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
        return jsonify(error="Membership not found"), 404

    session.delete(membership)
    session.commit()
    return "", 204
