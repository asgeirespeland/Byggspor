from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from app.errors import ApiError
from app.middleware.auth import require_auth
from app.middleware.roles import require_project_role
from app.models.project_member import ProjectRole
from app.models.project_waste_item import ProjectWasteItem, WasteSourceType
from app.services.waste_parser import build_waste_item_data, parse_waste_csv
from app.utils.db import db_commit
from app.utils.parsing import require_int

waste_bp = Blueprint("waste", __name__, url_prefix="/waste")


@waste_bp.route("/manual", methods=["POST"])
@require_auth
def create_manual_waste():
    """Create a single manual waste entry for a project."""

    payload = request.get_json(silent=True) or {}

    project_id = require_int(payload, "project_id")
    waste_type = payload.get("waste_type")
    quantity_tons = payload.get("quantity_tons")
    notes = payload.get("notes")

    item_data = build_waste_item_data(
        waste_type=waste_type,
        quantity_tons=quantity_tons,
        notes=notes,
    )

    session = g.db
    waste_item = ProjectWasteItem(
        project_id=project_id,
        source_id=None,
        source_type=WasteSourceType.MANUAL,
        waste_type=item_data["waste_type"],
        quantity_tons=item_data["quantity_tons"],
        co2_from_report_kg=item_data["co2_from_report_kg"],
        calculated_co2_kg=item_data["calculated_co2_kg"],
        total_co2_kg=item_data["total_co2_kg"],
        confidence_score=item_data["confidence_score"],
        notes=item_data["notes"],
    )

    with db_commit(session, "Kunne ikke lagre avfallsposten.", "SAVE_FAILED"):
        session.add(waste_item)

    session.refresh(waste_item)

    return (
        jsonify(
            {
                "id": waste_item.id,
                "project_id": waste_item.project_id,
                "source_id": waste_item.source_id,
                "source_type": (
                    waste_item.source_type.value if waste_item.source_type else None
                ),
                "waste_type": waste_item.waste_type,
                "quantity_tons": (
                    float(waste_item.quantity_tons)
                    if waste_item.quantity_tons is not None
                    else None
                ),
                "co2_from_report_kg": (
                    float(waste_item.co2_from_report_kg)
                    if waste_item.co2_from_report_kg is not None
                    else None
                ),
                "calculated_co2_kg": (
                    float(waste_item.calculated_co2_kg)
                    if waste_item.calculated_co2_kg is not None
                    else None
                ),
                "total_co2_kg": (
                    float(waste_item.total_co2_kg)
                    if waste_item.total_co2_kg is not None
                    else None
                ),
                "confidence_score": waste_item.confidence_score,
                "notes": waste_item.notes,
                "created_at": (
                    waste_item.created_at.isoformat()
                    if waste_item.created_at
                    else None
                ),
            }
        ),
        201,
    )


@waste_bp.route("/parse", methods=["POST"])
@require_auth
def parse_waste_report():
    """Parse uploaded waste CSV and save items for a project."""

    session = g.db

    project_id = require_int(request.form, "project_id")
    uploaded_file = request.files.get("file")

    if uploaded_file is None:
        raise ApiError(
            "Fil mangler.",
            code="MISSING_FILE",
            suggestion="Last opp en CSV-fil med waste_type og quantity_tons.",
        )

    file_content = uploaded_file.read()
    items_data = parse_waste_csv(file_content)

    created_items = []

    with db_commit(session, "Kunne ikke lagre avfallsrapport.", "SAVE_FAILED"):
        for item_data in items_data:
            waste_item = ProjectWasteItem(
                project_id=project_id,
                source_id=None,
                source_type=WasteSourceType.WASTE_REPORT,
                waste_type=item_data["waste_type"],
                quantity_tons=item_data["quantity_tons"],
                co2_from_report_kg=item_data["co2_from_report_kg"],
                calculated_co2_kg=item_data["calculated_co2_kg"],
                total_co2_kg=item_data["total_co2_kg"],
                confidence_score=item_data["confidence_score"],
                notes=item_data["notes"],
            )
            session.add(waste_item)
            created_items.append(waste_item)

    for item in created_items:
        session.refresh(item)

    return (
        jsonify(
            [
                {
                    "id": item.id,
                    "project_id": item.project_id,
                    "source_id": item.source_id,
                    "source_type": item.source_type.value if item.source_type else None,
                    "waste_type": item.waste_type,
                    "quantity_tons": (
                        float(item.quantity_tons)
                        if item.quantity_tons is not None
                        else None
                    ),
                    "co2_from_report_kg": (
                        float(item.co2_from_report_kg)
                        if item.co2_from_report_kg is not None
                        else None
                    ),
                    "calculated_co2_kg": (
                        float(item.calculated_co2_kg)
                        if item.calculated_co2_kg is not None
                        else None
                    ),
                    "total_co2_kg": (
                        float(item.total_co2_kg)
                        if item.total_co2_kg is not None
                        else None
                    ),
                    "confidence_score": item.confidence_score,
                    "notes": item.notes,
                    "created_at": item.created_at.isoformat() if item.created_at else None,
                }
                for item in created_items
            ]
        ),
        201,
    )


@waste_bp.route("/project/<int:project_id>", methods=["GET"])
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR, ProjectRole.VIEWER))
def list_project_waste(project_id: int):
    """List all waste entries for a project."""

    session = g.db
    items = (
        session.query(ProjectWasteItem)
        .filter(ProjectWasteItem.project_id == project_id)
        .order_by(ProjectWasteItem.created_at.desc())
        .all()
    )

    return jsonify(
        [
            {
                "id": item.id,
                "project_id": item.project_id,
                "source_id": item.source_id,
                "source_type": item.source_type.value if item.source_type else None,
                "waste_type": item.waste_type,
                "quantity_tons": (
                    float(item.quantity_tons) if item.quantity_tons is not None else None
                ),
                "co2_from_report_kg": (
                    float(item.co2_from_report_kg)
                    if item.co2_from_report_kg is not None
                    else None
                ),
                "calculated_co2_kg": (
                    float(item.calculated_co2_kg)
                    if item.calculated_co2_kg is not None
                    else None
                ),
                "total_co2_kg": (
                    float(item.total_co2_kg) if item.total_co2_kg is not None else None
                ),
                "confidence_score": item.confidence_score,
                "notes": item.notes,
                "created_at": item.created_at.isoformat() if item.created_at else None,
            }
            for item in items
        ]
    )