from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from typing import Any

from flask import g, jsonify

from app.database import SessionLocal
from app.models.organization_member import OrganizationMember, OrgRole
from app.models.project_member import ProjectMember, ProjectRole
from app.models.user import User


def _has_org_role(
    user: User,
    organization_id: int,
    allowed_roles: tuple[OrgRole, ...],
) -> bool:
    """Check whether a user has one of the allowed roles in an organization."""
    if user.is_system_admin:
        # App-level admins bypass organization role checks.
        return True

    session = SessionLocal()
    try:
        membership = (
            session.query(OrganizationMember)
            .filter(
                OrganizationMember.user_id == user.id,
                OrganizationMember.organization_id == organization_id,
            )
            .one_or_none()
        )
        return bool(membership and membership.role in allowed_roles)
    finally:
        session.close()


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

            session = SessionLocal()
            try:
                user = session.get(User, g.current_user_id)
                if not user:
                    return jsonify(error="Unauthorized"), 401
            finally:
                session.close()

            if not _has_org_role(user, int(org_id), allowed_roles):
                return jsonify(error="Forbidden"), 403

            return fn(*args, **kwargs)

        return wrapper

    return decorator


def _has_project_role(
    user: User,
    project_id: int,
    allowed_roles: tuple[ProjectRole, ...],
) -> bool:
    """Check whether a user has one of the allowed roles in a project."""
    if user.is_system_admin:
        # App-level admins bypass project role checks.
        return True

    session = SessionLocal()
    try:
        membership = (
            session.query(ProjectMember)
            .filter(
                ProjectMember.user_id == user.id,
                ProjectMember.project_id == project_id,
            )
            .one_or_none()
        )
        return bool(membership and membership.role in allowed_roles)
    finally:
        session.close()


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

            session = SessionLocal()
            try:
                user = session.get(User, g.current_user_id)
                if not user:
                    return jsonify(error="Unauthorized"), 401
            finally:
                session.close()

            if not _has_project_role(user, int(project_id), allowed_roles):
                return jsonify(error="Forbidden"), 403

            return fn(*args, **kwargs)

        return wrapper

    return decorator


def ensure_project_role(project_id: int, allowed_roles: tuple[ProjectRole, ...]):
    """Inline project-role guard for handlers where project_id comes from body/form."""
    if not getattr(g, "current_user_id", None):
        return jsonify(error="Unauthorized"), 401

    session = SessionLocal()
    try:
        user = session.get(User, g.current_user_id)
        if not user:
            return jsonify(error="Unauthorized"), 401
    finally:
        session.close()

    if not _has_project_role(user, project_id, allowed_roles):
        return jsonify(error="Forbidden"), 403

    return None
