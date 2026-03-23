"""Transport report upload and parsing routes."""

import logging
import xml.etree.ElementTree as ET

from flask import Blueprint, g, jsonify, request

from app.database import SessionLocal
from app.models.project_transport import ProjectTransport
from app.models.transport_report import TransportReport
from app.services.transport_service import process_transport_report

logger = logging.getLogger(__name__)

transport_bp = Blueprint("transport", __name__, url_prefix="/transport")


@transport_bp.route("/parse", methods=["POST"])
def parse_transport_route():
    """Parse, enrich, and persist an Abax Turrapport XML for a project.

    Requires 'project_id' form field and 'file' upload (XML).
    Looks up/creates vehicles, calculates CO₂, and persists all records.
    """
    project_id = request.form.get("project_id")
    if not project_id:
        return jsonify(error="project_id is required."), 400

    try:
        project_id = int(project_id)
    except (ValueError, TypeError):
        return jsonify(error="project_id must be an integer."), 400

    if "file" not in request.files:
        return jsonify(error="No file provided. Use 'file' form field."), 400

    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith(".xml"):
        return jsonify(error="File must be an XML file."), 400

    xml_content = file.read()
    if not xml_content:
        return jsonify(error="Uploaded file is empty."), 400

    session = SessionLocal()
    try:
        result = process_transport_report(
            session, project_id, xml_content, file_name=file.filename
        )
        session.commit()
        return jsonify(result), 201
    except ET.ParseError as e:
        session.rollback()
        return jsonify(error=f"Invalid XML: {e}"), 422
    except Exception as e:
        session.rollback()
        logger.exception("Transport processing failed")
        return jsonify(error=f"Processing failed: {e}"), 500
    finally:
        session.close()


@transport_bp.route("/project/<int:project_id>", methods=["GET"])
def list_project_transports(project_id: int):
    """Return all transport trips for a project, grouped by source report."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    session = g.db
    transports = (
        session.query(ProjectTransport)
        .filter(ProjectTransport.project_id == project_id)
        .order_by(ProjectTransport.created_at.desc())
        .all()
    )

    # Group by source report
    reports_map: dict[int | None, dict] = {}
    for pt in transports:
        sid = pt.source_id
        if sid not in reports_map:
            rpt = pt.source_report
            reports_map[sid] = {
                "report_id": sid,
                "file_name": rpt.file_name if rpt else None,
                "report_period_start": (
                    rpt.report_period_start.isoformat()
                    if rpt and rpt.report_period_start
                    else None
                ),
                "report_period_end": (
                    rpt.report_period_end.isoformat()
                    if rpt and rpt.report_period_end
                    else None
                ),
                "uploaded_at": (
                    rpt.uploaded_at.isoformat() if rpt and rpt.uploaded_at else None
                ),
                "trips": [],
            }
        vehicle = pt.vehicle
        reports_map[sid]["trips"].append(
            {
                "id": pt.id,
                "driver_name": pt.driver_name,
                "trip_date": pt.trip_date.isoformat() if pt.trip_date else None,
                "start_address": pt.start_address,
                "end_address": pt.end_address,
                "distance_km": float(pt.distance_km) if pt.distance_km else None,
                "total_co2_kg": float(pt.total_co2_kg) if pt.total_co2_kg else None,
                "confidence_score": pt.confidence_score,
                "flagged": pt.flagged,
                "vehicle": (
                    {
                        "registration_number": vehicle.registration_number,
                        "make": vehicle.make,
                        "model": vehicle.model,
                        "fuel_type": vehicle.fuel_type,
                    }
                    if vehicle
                    else None
                ),
            }
        )

    return jsonify(list(reports_map.values()))


@transport_bp.route("/report/<int:report_id>", methods=["DELETE"])
def delete_transport_report(report_id: int):
    """Delete a transport report and all its associated trips."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    session = g.db
    count = (
        session.query(ProjectTransport)
        .filter(ProjectTransport.source_id == report_id)
        .delete()
    )
    rpt = session.query(TransportReport).filter(TransportReport.id == report_id).first()
    if rpt:
        session.delete(rpt)

    try:
        session.commit()
    except Exception as e:
        session.rollback()
        logger.exception("Failed to delete transport report")
        return jsonify(error=f"Failed to delete: {e}"), 500

    return jsonify(message="Deleted", trips_removed=count), 200
