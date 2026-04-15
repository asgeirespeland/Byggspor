"""Orchestration service for transport report processing.

Two-phase flow:
  1. preview_transport_report  — parse XML + vehicle lookup + CO₂ calc.
     Returns enriched data for the user to review. Nothing is persisted
     except vehicle catalog entries (idempotent cache).
  2. save_transport_report     — called after user confirms. Persists
     TransportReport + ProjectTransport records for the confirmed trips.
"""

import logging
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.project_transport import ProjectTransport, TransportSourceType
from app.models.transport_report import TransportReport
from app.services.transport_parser import parse_turrapport
from app.services.vehicle_lookup import lookup_vehicle
from app.utils.confidence import transport_confidence

logger = logging.getLogger(__name__)


def _enrich_trip(session: Session, trip: dict) -> dict:
    """Look up vehicle and calculate CO₂ for a single parsed trip."""
    reg_nr = trip.get("registration_number", "")
    vehicle = lookup_vehicle(session, reg_nr) if reg_nr else None

    distance_km = trip.get("distance_km")
    co2_per_km = float(vehicle.co2_per_km) if vehicle and vehicle.co2_per_km else None
    total_co2 = None
    flagged = False

    has_distance = bool(distance_km)
    has_co2 = bool(co2_per_km)
    if has_distance and has_co2:
        total_co2 = distance_km * co2_per_km
    elif has_distance and not has_co2:
        flagged = True
    confidence = transport_confidence(has_co2_per_km=has_co2, has_distance=has_distance)

    vehicle_data = None
    if vehicle:
        vehicle_data = {
            "id": vehicle.id,
            "registration_number": vehicle.registration_number,
            "vehicle_type": vehicle.vehicle_type,
            "make": vehicle.make,
            "model": vehicle.model,
            "fuel_type": vehicle.fuel_type,
            "co2_per_km": (float(vehicle.co2_per_km) if vehicle.co2_per_km else None),
        }

    return {
        **trip,
        "vehicle_id": vehicle.id if vehicle else None,
        "total_co2_kg": total_co2,
        "confidence_score": confidence,
        "flagged": flagged,
        "vehicle": vehicle_data,
    }


def preview_transport_report(session: Session, xml_content: bytes) -> dict:
    """Parse Turrapport XML, look up vehicles, calculate CO₂.

    Returns enriched trip data for user review. Only vehicle catalog
    entries are persisted (idempotent). No transport records are created.
    """
    parsed = parse_turrapport(xml_content)
    trips = parsed["trips"]

    enriched_trips = []
    flagged_count = 0
    vehicle_ids: set[int] = set()

    for idx, trip in enumerate(trips):
        enriched = _enrich_trip(session, trip)
        enriched["trip_index"] = idx
        enriched_trips.append(enriched)

        if enriched["flagged"]:
            flagged_count += 1
        if enriched.get("vehicle_id"):
            vehicle_ids.add(enriched["vehicle_id"])

    # Flush vehicle upserts so IDs are available before the caller commits
    session.flush()

    return {
        "project_transports_count": len(enriched_trips),
        "vehicles_count": len(vehicle_ids),
        "flagged_count": flagged_count,
        "trips": enriched_trips,
    }


def save_transport_report(
    session: Session,
    project_id: int,
    trips: list[dict],
    file_name: str | None = None,
) -> dict:
    """Persist confirmed trips as TransportReport + ProjectTransport records.

    Args:
        session: DB session.
        project_id: The project to attach trips to.
        trips: Enriched trip dicts (as returned by preview_transport_report).
        file_name: Original upload file name.

    Returns:
        Summary with real DB IDs.
    """
    report = TransportReport(
        file_name=file_name,
        processed_at=datetime.now(),
    )
    session.add(report)
    session.flush()

    created = []
    for trip in trips:
        pt = ProjectTransport(
            project_id=project_id,
            vehicle_id=trip.get("vehicle_id"),
            source_id=report.id,
            source_type=TransportSourceType.ABAX_XML,
            driver_name=trip.get("driver_name"),
            department=trip.get("department"),
            trip_date=trip.get("trip_date"),
            start_address=trip.get("start_address"),
            end_address=trip.get("end_address"),
            distance_km=trip.get("distance_km"),
            duration_minutes=trip.get("duration_minutes"),
            toll_kr=trip.get("toll_kr"),
            ferry_kr=trip.get("ferry_kr"),
            parking_kr=trip.get("parking_kr"),
            total_co2_kg=trip.get("total_co2_kg"),
            confidence_score=trip.get("confidence_score", 50),
            flagged=trip.get("flagged", False),
            cost_per_km=trip.get("cost_per_km"),
        )
        session.add(pt)
        created.append(pt)

    session.flush()

    return {
        "transport_report_id": report.id,
        "confirmed_count": len(created),
    }
