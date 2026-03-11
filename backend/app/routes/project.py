from __future__ import annotations

from flask import Blueprint, g, jsonify, request
from sqlalchemy.exc import IntegrityError

from app.models.organization_member import OrganizationMember
from app.models.project import Project, ProjectStatus

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
def create_project():
    """Create a new project linked to the authenticated user's organization."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    payload = request.get_json(silent=True) or {}

    name = payload.get("name", "").strip()
    if not name:
        return jsonify(error="name is required"), 400

    session = g.db

    organization_id = _get_user_org_id(session, current_user_id)
    if not organization_id:
        return jsonify(error="User is not a member of any organization"), 400

    project = Project(
        name=name,
        organization_id=organization_id,
        created_by_user_id=current_user_id,
        project_number=payload.get("project_number") or None,
        customer_id=payload.get("customer_id") or None,
        status=ProjectStatus.ACTIVE,
    )

    session.add(project)

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        return jsonify(error="Conflict: duplicate or invalid data"), 409

    session.refresh(project)
    return jsonify(_serialize_project(project)), 201


@project_bp.route("", methods=["GET"])
def list_projects():
    """Return all projects belonging to the authenticated user's organization."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    session = g.db

    organization_id = _get_user_org_id(session, current_user_id)
    if not organization_id:
        return jsonify(error="User is not a member of any organization"), 400

    projects = (
        session.query(Project)
        .filter(Project.organization_id == organization_id)
        .order_by(Project.created_at.desc())
        .all()
    )

    return jsonify([_serialize_project(p) for p in projects])


@project_bp.route("/<int:project_id>", methods=["GET"])
def get_project(project_id: int):
    """Return a single project by ID, scoped to the user's organization."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    session = g.db

    organization_id = _get_user_org_id(session, current_user_id)
    if not organization_id:
        return jsonify(error="User is not a member of any organization"), 400

    project = (
        session.query(Project)
        .filter(
            Project.id == project_id,
            Project.organization_id == organization_id,
        )
        .first()
    )

    if not project:
        return jsonify(error="Project not found"), 404

    return jsonify(_serialize_project(project))
