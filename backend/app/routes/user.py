from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from app.database import SessionLocal
from app.models.user import User

user_bp = Blueprint("users", __name__, url_prefix="/users")


def _serialize_user(user: User) -> dict:
    """Convert ORM user object to a JSON-friendly API shape."""
    return {
        "id": user.id,
        "clerk_id": user.clerk_id,
        "email": user.email,
        "name": user.name,
        "phone": user.phone,
        "is_system_admin": user.is_system_admin,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "updated_at": user.updated_at.isoformat() if user.updated_at else None,
    }


@user_bp.route("/me", methods=["GET"])
def get_me():
    """Return the currently authenticated user profile."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    session = SessionLocal()
    try:
        user = session.get(User, current_user_id)
        if not user:
            return jsonify(error="User not found"), 404
        return jsonify(_serialize_user(user))
    finally:
        session.close()


@user_bp.route("/<int:user_id>", methods=["PATCH"])
def update_user(user_id: int):
    """Update user fields with self-service + system-admin override rules."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    payload = request.get_json(silent=True) or {}
    allowed_self_fields = {"name", "phone", "email"}
    allowed_admin_fields = {"is_system_admin"}

    session = SessionLocal()
    try:
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

        disallowed_keys = set(payload.keys()) - (
            allowed_self_fields | allowed_admin_fields
        )
        if disallowed_keys:
            return jsonify(error=f"Unsupported fields: {sorted(disallowed_keys)}"), 400

        for field in allowed_self_fields:
            if field in payload:
                setattr(target_user, field, payload[field])

        if "is_system_admin" in payload:
            # Escalating/revoking app-wide admin rights is restricted to admins.
            if not is_admin:
                return (
                    jsonify(error="Only system admins can update is_system_admin"),
                    403,
                )
            target_user.is_system_admin = bool(payload["is_system_admin"])

        session.commit()
        session.refresh(target_user)
        return jsonify(_serialize_user(target_user))
    finally:
        session.close()
