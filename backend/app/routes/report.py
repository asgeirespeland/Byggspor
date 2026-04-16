from flask import Blueprint, g, jsonify
from sqlalchemy import func

from app.middleware.auth import require_auth
from app.middleware.roles import require_project_role
from app.models.energy import Energy
from app.models.project_material import ProjectMaterial
from app.models.project_member import ProjectRole
from app.models.project_transport import ProjectTransport
from app.models.project_waste_item import ProjectWasteItem
from app.services.report_generator import get_detailed_report

report_bp = Blueprint("report", __name__, url_prefix="/report")


def _category_stats(session, model, project_id):
    row = (
        session.query(
            func.coalesce(func.sum(model.total_co2_kg), 0),
            func.count(model.id),
            func.avg(model.confidence_score),
        )
        .filter(model.project_id == project_id)
        .one()
    )
    return {
        "total_co2_kg": float(row[0]),
        "entry_count": row[1],
        "avg_confidence": round(float(row[2]), 1) if row[2] is not None else None,
    }


@report_bp.route("/project/<int:project_id>/co2-summary")
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR, ProjectRole.VIEWER))
def co2_summary(project_id):
    session = g.db

    materials = _category_stats(session, ProjectMaterial, project_id)
    transport = _category_stats(session, ProjectTransport, project_id)
    energy = _category_stats(session, Energy, project_id)
    waste = _category_stats(session, ProjectWasteItem, project_id)

    total = (
        materials["total_co2_kg"]
        + transport["total_co2_kg"]
        + energy["total_co2_kg"]
        + waste["total_co2_kg"]
    )

    # Weighted average confidence across categories that have data
    weighted_scores = [
        (cat["total_co2_kg"], cat["avg_confidence"])
        for cat in [materials, transport, energy, waste]
        if cat["avg_confidence"] is not None and cat["entry_count"] > 0
    ]
    if weighted_scores:
        weight_sum = sum(abs(w) for w, _ in weighted_scores) or 1
        overall_confidence = round(
            sum(abs(w) * s for w, s in weighted_scores) / weight_sum, 1
        )
    else:
        overall_confidence = None

    return jsonify(
        {
            "project_id": project_id,
            "total_co2_kg": round(total, 2),
            "overall_confidence": overall_confidence,
            "categories": {
                "materials": materials,
                "transport": transport,
                "energy": energy,
                "waste": waste,
            },
        }
    )


@report_bp.route("/project/<int:project_id>/detailed")
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR, ProjectRole.VIEWER))
def detailed_report(project_id):
    report = get_detailed_report(g.db, project_id)
    return jsonify(report)
