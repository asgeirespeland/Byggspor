"""Orchestration service for transport report processing.

Handles the full pipeline: parse Abax Turrapport XML → look up vehicles →
calculate CO₂ → persist to database (vehicle catalog + project_transports
+ source report).
"""

import logging
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.project_transport import ProjectTransport, TransportSourceType
from app.models.transport_report import TransportReport
from app.models.vehicle import Vehicle
from app.services.transport_parser import parse_turrapport
from app.services.vehicle_lookup import lookup_vehicle

logger = logging.getLogger(__name__)


def process_transport_report(
    session: Session, project_id: int, xml_content: bytes, file_name: str | None = None
) -> dict:
    """Full pipeline: parse Turrapport XML, look up vehicles, and persist.

    Flow:
    1. Parse XML (stateless)
    2. Create transport_report source record
    3. For each trip: look up/create vehicle, calculate CO₂, create
       project_transport record

    Returns a summary dict with parsed trips, DB IDs, and stats.
    """
    # 1. Parse XML
    parsed = parse_turrapport(xml_content)
    trips = parsed["trips"]

    # 2. Create source report record
    report = TransportReport(
        file_name=file_name,
        processed_at=datetime.now(),
    )
    session.add(report)
    session.flush()

    # 3. Process each trip
    project_transports_created = []
    flagged_count = 0

    for trip in trips:
        # Look up or create vehicle
        reg_nr = trip.get("registration_number", "")
        vehicle = lookup_vehicle(session, reg_nr) if reg_nr else None

        # Calculate CO₂ if emission data is available
        distance_km = trip.get("distance_km")
        co2_per_km = (
            float(vehicle.co2_per_km) if vehicle and vehicle.co2_per_km else None
        )
        total_co2 = None
        flagged = False

        if distance_km and co2_per_km:
            total_co2 = distance_km * co2_per_km
            confidence = 80
        elif distance_km and not co2_per_km:
            # Vehicle has no emission data — flag for user input
            flagged = True
            confidence = 20
        else:
            confidence = 50

        if flagged:
            flagged_count += 1

        pt = ProjectTransport(
            project_id=project_id,
            vehicle_id=vehicle.id if vehicle else None,
            source_id=report.id,
            source_type=TransportSourceType.ABAX_XML,
            driver_name=trip.get("driver_name"),
            department=trip.get("department"),
            trip_date=trip.get("trip_date"),
            start_address=trip.get("start_address"),
            end_address=trip.get("end_address"),
            distance_km=distance_km,
            duration_minutes=trip.get("duration_minutes"),
            toll_kr=trip.get("toll_kr"),
            ferry_kr=trip.get("ferry_kr"),
            parking_kr=trip.get("parking_kr"),
            total_co2_kg=total_co2,
            confidence_score=confidence,
            flagged=flagged,
        )
        session.add(pt)
        project_transports_created.append(pt)

    session.flush()

    # Build response with trip details and vehicle info
    # Cache vehicles by id to avoid redundant lookups
    vehicle_cache: dict[int, Vehicle] = {}
    response_trips = []
    for pt, trip in zip(project_transports_created, trips):
        vehicle = None
        if pt.vehicle_id:
            if pt.vehicle_id not in vehicle_cache:
                vehicle_cache[pt.vehicle_id] = session.get(Vehicle, pt.vehicle_id)
            vehicle = vehicle_cache[pt.vehicle_id]

        response_trips.append(
            {
                **trip,
                "project_transport_id": pt.id,
                "total_co2_kg": float(pt.total_co2_kg) if pt.total_co2_kg else None,
                "confidence_score": pt.confidence_score,
                "flagged": pt.flagged,
                "vehicle": {
                    "id": vehicle.id,
                    "registration_number": vehicle.registration_number,
                    "vehicle_type": vehicle.vehicle_type,
                    "make": vehicle.make,
                    "model": vehicle.model,
                    "fuel_type": vehicle.fuel_type,
                    "co2_per_km": (
                        float(vehicle.co2_per_km) if vehicle.co2_per_km else None
                    ),
                }
                if vehicle
                else None,
            }
        )

    unique_vehicles = {
        pt.vehicle_id for pt in project_transports_created if pt.vehicle_id
    }

    return {
        "transport_report_id": report.id,
        "project_transports_count": len(project_transports_created),
        "vehicles_count": len(unique_vehicles),
        "flagged_count": flagged_count,
        "trips": response_trips,
    }
