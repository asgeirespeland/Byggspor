from __future__ import annotations

import re

from flask import Blueprint, g, jsonify, request

from app.errors import ApiError
from app.middleware.auth import require_auth
from app.models.organization_member import OrganizationMember
from app.models.user import User
from app.utils.db import db_commit

_USERNAME_RE = re.compile(r"^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$")

user_bp = Blueprint("users", __name__, url_prefix="/users")


def _user_response(user: User, session) -> dict:
    """Build user API response, merging org membership into the user dict."""
    membership = (
        session.query(OrganizationMember)
        .filter(OrganizationMember.user_id == user.id)
        .first()
    )
    return {
        **user.to_dict(),
        "organization_id": membership.organization_id if membership else None,
        "org_role": membership.role.value if membership else None,
    }


@user_bp.route("/me", methods=["GET"])
@require_auth
def get_me():
    """Return the currently authenticated user profile."""
    session = g.db
    user = session.get(User, g.current_user_id)
    if not user:
        raise ApiError("Brukeren ble ikke funnet.", code="NOT_FOUND", status=404)
    return jsonify(_user_response(user, session))


@user_bp.route("/<int:user_id>", methods=["PATCH"])
@require_auth
def update_user(user_id: int):
    """Update user fields with self-service + system-admin override rules."""
    payload = request.get_json(silent=True) or {}
    allowed_self_fields = {"name", "phone", "username"}
    allowed_admin_fields = {"is_system_admin"}

    session = g.db
    current_user = session.get(User, g.current_user_id)
    if not current_user:
        raise ApiError("Ikke autentisert.", code="UNAUTHORIZED", status=401)

    target_user = session.get(User, user_id)
    if not target_user:
        raise ApiError("Brukeren ble ikke funnet.", code="NOT_FOUND", status=404)

    is_self = current_user.id == target_user.id
    is_admin = current_user.is_system_admin

    # Normal users can only update themselves.
    # System admins can update any user.
    if not is_self and not is_admin:
        raise ApiError("Ingen tilgang.", code="FORBIDDEN", status=403)

    disallowed_keys = set(payload.keys()) - (allowed_self_fields | allowed_admin_fields)
    if disallowed_keys:
        raise ApiError(
            f"Ikke-støttede felt: {sorted(disallowed_keys)}",
            code="INVALID_FIELD",
        )

    # Check admin-only fields before applying any mutations.
    if "is_system_admin" in payload:
        if not is_admin:
            raise ApiError(
                "Bare systemadministratorer kan endre is_system_admin.",
                code="FORBIDDEN",
                status=403,
            )

    if "username" in payload:
        raw = payload["username"]
        if raw is None:
            target_user.username = None
        else:
            uname = str(raw).strip()
            if not _USERNAME_RE.match(uname):
                raise ApiError(
                    "Ugyldig brukernavn (1–39 tegn, bokstaver, tall og bindestreker).",
                    code="INVALID_FIELD",
                )
            existing = (
                session.query(User)
                .filter(User.username == uname, User.id != target_user.id)
                .one_or_none()
            )
            if existing:
                raise ApiError(
                    "Brukernavnet er allerede i bruk.",
                    code="CONFLICT",
                    status=409,
                )
            target_user.username = uname

    # All permission checks passed — now apply mutations.
    for field in allowed_self_fields - {"username"}:
        if field in payload:
            setattr(target_user, field, payload[field])

    if "is_system_admin" in payload:
        target_user.is_system_admin = bool(payload["is_system_admin"])

    with db_commit(
        session,
        "Kunne ikke oppdatere brukeren.",
        "SAVE_FAILED",
        integrity_msg="Duplikat eller ugyldig data.",
    ):
        pass

    session.refresh(target_user)
    return jsonify(_user_response(target_user, session))
