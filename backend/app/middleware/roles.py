from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import Any

from flask import g, jsonify

from app.models.organization_member import OrganizationMember, OrgRole
from app.models.project_member import ProjectMember, ProjectRole
from app.models.user import User


def _has_org_role(
    user: User,
    organization_id: int,
) -> OrgRole | None:
    """Return the user's role in an organization, or None."""
    if user.is_system_admin:
        return OrgRole.OWNER  # System admins bypass org role checks.

    session = g.db
    membership = (
        session.query(OrganizationMember)
        .filter(
            OrganizationMember.user_id == user.id,
            OrganizationMember.organization_id == organization_id,
        )
        .one_or_none()
    )
    return membership.role if membership else None


def require_org_role(
    allowed_roles: tuple[OrgRole, ...],
    org_id_arg: str = "organization_id",
) -> Callable:
    """Decorator for endpoints with organization_id in route params."""

    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any):
            org_id = kwargs.get(org_id_arg)
            if org_id is None:
                return jsonify(error=f"Missing route parameter: {org_id_arg}"), 400

            if not getattr(g, "current_user_id", None):
                return jsonify(error="Unauthorized"), 401

            session = g.db
            user = session.get(User, g.current_user_id)
            if not user:
                return jsonify(error="Unauthorized"), 401

            role = _has_org_role(user, org_id)
            if role not in allowed_roles:
                return jsonify(error="Forbidden"), 403

            return fn(*args, **kwargs)

        return wrapper

    return decorator


def _has_project_role(
    user: User,
    project_id: int,
) -> ProjectRole | None:
    """Return the user's role in a project, or None."""
    if user.is_system_admin:
        return ProjectRole.OWNER  # System admins bypass project role checks.

    session = g.db
    membership = (
        session.query(ProjectMember)
        .filter(
            ProjectMember.user_id == user.id,
            ProjectMember.project_id == project_id,
        )
        .one_or_none()
    )
    return membership.role if membership else None


def require_project_role(
    allowed_roles: tuple[ProjectRole, ...],
    project_id_arg: str = "project_id",
) -> Callable:
    """Decorator for endpoints with project_id in route params."""

    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any):
            project_id = kwargs.get(project_id_arg)
            if project_id is None:
                return jsonify(error=f"Missing route parameter: {project_id_arg}"), 400

            if not getattr(g, "current_user_id", None):
                return jsonify(error="Unauthorized"), 401

            session = g.db
            user = session.get(User, g.current_user_id)
            if not user:
                return jsonify(error="Unauthorized"), 401

            role = _has_project_role(user, project_id)
            if role not in allowed_roles:
                return jsonify(error="Forbidden"), 403

            return fn(*args, **kwargs)

        return wrapper

    return decorator
