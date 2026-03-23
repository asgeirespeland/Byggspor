"""Transport report upload and parsing routes."""

import logging
import xml.etree.ElementTree as ET
from datetime import date

from flask import Blueprint, g, jsonify, request

from app.database import SessionLocal
from app.models.project_transport import ProjectTransport, TransportSourceType
from app.models.transport_report import TransportReport
from app.models.vehicle import Vehicle
from app.services.transport_service import process_transport_report
from app.services.vehicle_lookup import lookup_vehicle

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


@transport_bp.route("/confirm", methods=["POST"])
def confirm_trips():
    """Mark parsed trips as confirmed (trips are already persisted on parse)."""
    body = request.get_json(silent=True) or {}
    trip_ids = body.get("trip_ids", [])
    if not isinstance(trip_ids, list):
        return jsonify(error="trip_ids must be a list"), 400
    return jsonify(confirmed=len(trip_ids)), 200


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


@transport_bp.route("/trips", methods=["POST"])
def create_manual_trip():
    """Create a single manual transport trip for a project."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    body = request.get_json(silent=True) or {}

    required = (
        "project_id",
        "driver_name",
        "registration_number",
        "distance_km",
        "trip_date",
    )
    missing = [f for f in required if not body.get(f)]
    if missing:
        return jsonify(error=f"Missing required fields: {', '.join(missing)}"), 400

    try:
        project_id = int(body["project_id"])
        distance_km = float(body["distance_km"])
        trip_date = date.fromisoformat(body["trip_date"])
    except (ValueError, TypeError) as e:
        return jsonify(error=f"Invalid field value: {e}"), 400

    session = g.db
    vehicle = lookup_vehicle(session, body["registration_number"])

    co2_per_km = float(vehicle.co2_per_km) if vehicle and vehicle.co2_per_km else None
    if co2_per_km:
        total_co2 = distance_km * co2_per_km
        confidence = 80
        flagged = False
    else:
        total_co2 = None
        confidence = 20
        flagged = True

    pt = ProjectTransport(
        project_id=project_id,
        vehicle_id=vehicle.id if vehicle else None,
        source_type=TransportSourceType.MANUAL,
        driver_name=body.get("driver_name"),
        trip_date=trip_date,
        start_address=body.get("start_address"),
        end_address=body.get("end_address"),
        distance_km=distance_km,
        total_co2_kg=total_co2,
        confidence_score=confidence,
        flagged=flagged,
    )
    session.add(pt)
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        logger.exception("Failed to create manual trip")
        return jsonify(error=f"Failed to create trip: {e}"), 500

    return jsonify(
        id=pt.id,
        total_co2_kg=float(pt.total_co2_kg) if pt.total_co2_kg else None,
        confidence_score=pt.confidence_score,
        flagged=pt.flagged,
    ), 201


@transport_bp.route("/trips/<int:trip_id>", methods=["PATCH"])
def update_trip(trip_id: int):
    """Update a transport trip's driver, date, addresses, or distance."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    session = g.db
    trip = session.query(ProjectTransport).get(trip_id)
    if not trip:
        return jsonify(error="Trip not found"), 404

    body = request.get_json(silent=True) or {}

    for field in ("driver_name", "start_address", "end_address"):
        if field in body:
            setattr(trip, field, body[field])

    if "trip_date" in body:
        try:
            trip.trip_date = date.fromisoformat(body["trip_date"])
        except (ValueError, TypeError):
            return jsonify(error="Invalid trip_date format"), 400

    if "distance_km" in body:
        try:
            distance_km = float(body["distance_km"])
            trip.distance_km = distance_km
            if trip.vehicle and trip.vehicle.co2_per_km:
                trip.total_co2_kg = distance_km * float(trip.vehicle.co2_per_km)
                trip.confidence_score = 80
                trip.flagged = False
        except (ValueError, TypeError):
            return jsonify(error="Invalid distance_km"), 400

    try:
        session.commit()
    except Exception as e:
        session.rollback()
        logger.exception("Failed to update trip")
        return jsonify(error=f"Failed to update: {e}"), 500

    return jsonify(
        id=trip.id,
        total_co2_kg=float(trip.total_co2_kg) if trip.total_co2_kg else None,
        confidence_score=trip.confidence_score,
        flagged=trip.flagged,
    ), 200


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


@transport_bp.route("/trips/<int:trip_id>", methods=["DELETE"])
def delete_trip(trip_id: int):
    """Delete a single transport trip."""
    session = g.db
    trip = session.query(ProjectTransport).get(trip_id)
    if not trip:
        return jsonify(error="Trip not found"), 404
    session.delete(trip)
    try:
        session.commit()
    except Exception as e:
        session.rollback()
        logger.exception("Failed to delete trip")
        return jsonify(error=f"Failed to delete: {e}"), 500
    return jsonify(message="Deleted"), 200


@transport_bp.route("/vehicles/<int:vehicle_id>", methods=["PATCH"])
def update_vehicle(vehicle_id: int):
    """Update vehicle details (make, model, fuel_type)."""
    session = g.db
    vehicle = session.query(Vehicle).get(vehicle_id)
    if not vehicle:
        return jsonify(error="Vehicle not found"), 404

    body = request.get_json(silent=True) or {}
    for field in ("make", "model", "fuel_type"):
        if field in body:
            setattr(vehicle, field, body[field])

    try:
        session.commit()
    except Exception as e:
        session.rollback()
        logger.exception("Failed to update vehicle")
        return jsonify(error=f"Failed to update: {e}"), 500
    return jsonify(message="Updated"), 200
