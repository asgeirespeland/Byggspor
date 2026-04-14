"""Transport report upload and parsing routes."""

import logging
import xml.etree.ElementTree as ET
from datetime import date

from flask import Blueprint, g, jsonify, request

from app.errors import DEFAULT_RETRY_SUGGESTION, ApiError
from app.middleware.auth import require_auth
from app.middleware.roles import require_project_role
from app.models.project_member import ProjectRole
from app.models.project_transport import ProjectTransport, TransportSourceType
from app.models.transport_report import TransportReport
from app.models.vehicle import Vehicle
from app.services.transport_service import (
    preview_transport_report,
    save_transport_report,
)
from app.services.vehicle_lookup import lookup_vehicle
from app.utils.confidence import transport_confidence
from app.utils.db import db_commit
from app.utils.file_upload import validate_xml_upload
from app.utils.parsing import optional_date, parse_float, require_int
from app.utils.serialization import group_by_source

logger = logging.getLogger(__name__)

transport_bp = Blueprint("transport", __name__, url_prefix="/transport")

ABAX_XML_SUGGESTION = (
    "Last opp en Abax Turrapport i XML-format (.xml). "
    "Denne eksporteres fra Abax Fleet Management under «Rapporter» → «Turrapport»."
)


@transport_bp.route("/parse", methods=["POST"])
@require_auth
def parse_transport_route():
    """Parse and enrich an Abax Turrapport XML (preview only — nothing persisted).

    Requires 'file' upload (XML). Returns enriched trip data with vehicle info
    and CO₂ calculations for user review before confirmation.
    """
    xml_content = validate_xml_upload(ABAX_XML_SUGGESTION)
    file = request.files["file"]

    session = g.db
    try:
        result = preview_transport_report(session, xml_content)
        result["file_name"] = file.filename
        return jsonify(result), 200
    except ET.ParseError:
        session.rollback()
        raise ApiError(
            "Filen er ikke gyldig XML.",
            code="INVALID_XML",
            status=422,
            suggestion=ABAX_XML_SUGGESTION,
        )
    except ValueError as e:
        session.rollback()
        raise ApiError(
            str(e),
            code="INVALID_FILE_FORMAT",
            status=422,
            suggestion=ABAX_XML_SUGGESTION,
        )
    except Exception:
        session.rollback()
        logger.exception("Transport parsing failed")
        raise ApiError(
            "Kunne ikke analysere transportrapporten.",
            code="PROCESSING_FAILED",
            status=500,
            suggestion=DEFAULT_RETRY_SUGGESTION,
        )


@transport_bp.route("/confirm", methods=["POST"])
@require_auth
def confirm_trips():
    """Persist user-confirmed trips to the database.

    Expects JSON: { project_id, file_name?, trips: [...enriched trip objects] }
    Only the trips included in the request body are saved.
    """
    body = request.get_json(silent=True) or {}
    project_id = require_int(body, "project_id")

    trips = body.get("trips")
    if not isinstance(trips, list) or len(trips) == 0:
        raise ApiError(
            "Ingen turer å bekrefte.",
            code="MISSING_FIELD",
            suggestion="Velg minst én tur før du bekrefter.",
        )

    file_name = body.get("file_name")

    session = g.db
    with db_commit(session, "Kunne ikke lagre turene.", "SAVE_FAILED"):
        result = save_transport_report(session, project_id, trips, file_name)
    return jsonify(result), 201


@transport_bp.route("/project/<int:project_id>", methods=["GET"])
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR, ProjectRole.VIEWER))
def list_project_transports(project_id: int):
    """Return all transport trips for a project, grouped by source report."""

    session = g.db
    transports = (
        session.query(ProjectTransport)
        .filter(ProjectTransport.project_id == project_id)
        .order_by(ProjectTransport.created_at.desc())
        .all()
    )

    def _report_group(pt):
        rpt = pt.source_report
        return {
            "report_id": pt.source_id,
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
        }

    def _trip_item(pt):
        vehicle = pt.vehicle
        return {
            "id": pt.id,
            "driver_name": pt.driver_name,
            "trip_date": pt.trip_date.isoformat() if pt.trip_date else None,
            "start_address": pt.start_address,
            "end_address": pt.end_address,
            "distance_km": float(pt.distance_km) if pt.distance_km else None,
            "total_co2_kg": float(pt.total_co2_kg) if pt.total_co2_kg else None,
            "confidence_score": pt.confidence_score,
            "flagged": pt.flagged,
            "cost_per_km": float(pt.cost_per_km) if pt.cost_per_km else None,
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

    grouped = group_by_source(
        transports,
        key_fn=lambda pt: pt.source_id,
        group_fn=_report_group,
        item_fn=_trip_item,
        collection_key="trips",
    )
    return jsonify(grouped)


@transport_bp.route("/trips", methods=["POST"])
@require_auth
def create_manual_trip():
    """Create a single manual transport trip for a project."""

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
        raise ApiError(
            f"Manglende felt: {', '.join(missing)}",
            code="MISSING_FIELD",
            suggestion=(
                "Fyll ut alle påkrevde felt: prosjekt, sjåfør,"
                " registreringsnummer, distanse og dato."
            ),
        )

    try:
        project_id = int(body["project_id"])
        distance_km = float(body["distance_km"])
        trip_date = date.fromisoformat(body["trip_date"])
    except (ValueError, TypeError) as e:
        raise ApiError(
            f"Ugyldig feltverdi: {e}",
            code="INVALID_FIELD",
            suggestion="Sjekk at distanse er et tall og dato er i formatet YYYY-MM-DD.",
        )

    session = g.db
    vehicle = lookup_vehicle(session, body["registration_number"])

    co2_per_km = float(vehicle.co2_per_km) if vehicle and vehicle.co2_per_km else None
    has_co2 = co2_per_km is not None
    total_co2 = distance_km * co2_per_km if has_co2 else None
    confidence = transport_confidence(has_co2_per_km=has_co2, has_distance=True)
    flagged = not has_co2

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
        cost_per_km=body.get("cost_per_km"),
    )
    with db_commit(session, "Kunne ikke opprette turen.", "CREATE_FAILED"):
        session.add(pt)

    return jsonify(
        id=pt.id,
        total_co2_kg=float(pt.total_co2_kg) if pt.total_co2_kg else None,
        confidence_score=pt.confidence_score,
        flagged=pt.flagged,
    ), 201


@transport_bp.route("/trips/<int:trip_id>", methods=["PATCH"])
@require_auth
def update_trip(trip_id: int):
    """Update a transport trip's driver, date, addresses, or distance."""

    session = g.db
    trip = session.get(ProjectTransport, trip_id)
    if not trip:
        raise ApiError("Turen ble ikke funnet.", code="NOT_FOUND", status=404)

    body = request.get_json(silent=True) or {}

    for field in ("driver_name", "start_address", "end_address"):
        if field in body:
            setattr(trip, field, body[field])

    if "trip_date" in body:
        trip.trip_date = optional_date(body, "trip_date")

    if "cost_per_km" in body:
        cost = parse_float(
            body,
            "cost_per_km",
            allow_missing=False,
            allow_negative=False,
            suggestion="Kostnad pr. km må være et tall (f.eks. 2.5).",
        )
        trip.cost_per_km = cost

    if "distance_km" in body:
        distance_km = parse_float(
            body,
            "distance_km",
            suggestion="Distanse m\u00e5 v\u00e6re et tall (f.eks. 42.5).",
        )
        trip.distance_km = distance_km
        if trip.vehicle and trip.vehicle.co2_per_km:
            trip.total_co2_kg = distance_km * float(trip.vehicle.co2_per_km)
            trip.confidence_score = transport_confidence(
                has_co2_per_km=True,
                has_distance=True,
            )
            trip.flagged = False

    with db_commit(session, "Kunne ikke oppdatere turen.", "UPDATE_FAILED"):
        pass

    return jsonify(
        id=trip.id,
        total_co2_kg=float(trip.total_co2_kg) if trip.total_co2_kg else None,
        confidence_score=trip.confidence_score,
        flagged=trip.flagged,
    ), 200


@transport_bp.route("/report/<int:report_id>", methods=["DELETE"])
@require_auth
def delete_transport_report(report_id: int):
    """Delete a transport report and all its associated trips."""

    session = g.db
    count = (
        session.query(ProjectTransport)
        .filter(ProjectTransport.source_id == report_id)
        .delete()
    )
    rpt = session.get(TransportReport, report_id)
    if rpt:
        session.delete(rpt)

    with db_commit(session, "Kunne ikke slette rapporten.", "DELETE_FAILED"):
        pass

    return jsonify(message="Deleted", trips_removed=count), 200


@transport_bp.route("/trips/<int:trip_id>", methods=["DELETE"])
@require_auth
def delete_trip(trip_id: int):
    """Delete a single transport trip."""
    session = g.db
    trip = session.get(ProjectTransport, trip_id)
    if not trip:
        raise ApiError("Turen ble ikke funnet.", code="NOT_FOUND", status=404)
    with db_commit(session, "Kunne ikke slette turen.", "DELETE_FAILED"):
        session.delete(trip)
    return jsonify(message="Deleted"), 200


@transport_bp.route("/vehicles/<int:vehicle_id>", methods=["PATCH"])
@require_auth
def update_vehicle(vehicle_id: int):
    """Update vehicle details (make, model, fuel_type)."""
    session = g.db
    vehicle = session.get(Vehicle, vehicle_id)
    if not vehicle:
        raise ApiError("Kjøretøyet ble ikke funnet.", code="NOT_FOUND", status=404)

    body = request.get_json(silent=True) or {}
    for field in ("make", "model", "fuel_type"):
        if field in body:
            setattr(vehicle, field, body[field])

    with db_commit(session, "Kunne ikke oppdatere kjøretøyet.", "UPDATE_FAILED"):
        pass
    return jsonify(message="Updated"), 200
