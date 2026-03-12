from __future__ import annotations

from flask import Blueprint, g, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.models.organization_member import OrganizationMember
from app.models.user import User

user_bp = Blueprint("users", __name__, url_prefix="/users")


def _serialize_user(user: User, session) -> dict:
    """Convert ORM user object to a JSON-friendly API shape."""

    membership = (
        session.query(OrganizationMember)
        .filter(OrganizationMember.user_id == user.id)
        .first()
    )

    return {
        "id": user.id,
        "clerk_id": user.clerk_id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "is_system_admin": user.is_system_admin,
        "organization_id": membership.organization_id if membership else None,
        "org_role": membership.role.value if membership else None,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


@user_bp.route("/me", methods=["GET"])
def get_me():
    """Return the currently authenticated user profile."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    session = g.db
    user = session.get(User, current_user_id)
    if not user:
        return jsonify(error="User not found"), 404
    return jsonify(_serialize_user(user, session))


@user_bp.route("/<int:user_id>", methods=["PATCH"])
def update_user(user_id: int):
    """Update user fields with self-service + system-admin override rules."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    payload = request.get_json(silent=True) or {}
    allowed_self_fields = {"name", "phone"}
    allowed_admin_fields = {"is_system_admin"}

    session = g.db
    current_user = session.get(User, current_user_id)
    if not current_user:
        return jsonify(error="Unauthorized"), 401

    target_user = session.get(User, user_id)
    if not target_user:
        return jsonify(error="User not found"), 404

    is_self = current_user.id == target_user.id
    is_admin = current_user.is_system_admin

    # Normal users can only update themselves.
    # System admins can update any user.
    if not is_self and not is_admin:
        return jsonify(error="Forbidden"), 403

    disallowed_keys = set(payload.keys()) - (allowed_self_fields | allowed_admin_fields)
    if disallowed_keys:
        return jsonify(error=f"Unsupported fields: {sorted(disallowed_keys)}"), 400

    # Check admin-only fields before applying any mutations.
    if "is_system_admin" in payload:
        if not is_admin:
            return (
                jsonify(error="Only system admins can update is_system_admin"),
                403,
            )

    # All permission checks passed — now apply mutations.
    for field in allowed_self_fields:
        if field in payload:
            setattr(target_user, field, payload[field])

    if "is_system_admin" in payload:
        target_user.is_system_admin = bool(payload["is_system_admin"])

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        return jsonify(error="Conflict: duplicate or invalid data"), 409

    session.refresh(target_user)
    return jsonify(_serialize_user(target_user, session))
