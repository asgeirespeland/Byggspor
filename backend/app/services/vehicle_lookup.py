"""Vehicle lookup service.

Checks the vehicles catalog DB first. If no record exists, attempts to fetch
vehicle data from the Statens vegvesen API, falling back to a stub entry if
the API is unavailable or returns no data.
"""

import logging

from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle, VehicleSource

logger = logging.getLogger(__name__)


def lookup_vehicle(session: Session, registration_number: str) -> Vehicle:
    """Find or create a Vehicle catalog entry by registration number.

    Returns the existing Vehicle if found. Otherwise tries the Statens
    vegvesen API to auto-populate vehicle details, falling back to a
    stub record if the API call fails.
    """
    reg = registration_number.upper().strip()

    vehicle = session.query(Vehicle).filter(Vehicle.registration_number == reg).first()

    if vehicle is not None:
        # If we have a stub without data, try enriching it
        if vehicle.source is None and vehicle.make is None:
            _enrich_from_api(vehicle, reg)
        return vehicle

    vehicle = Vehicle(registration_number=reg)
    _enrich_from_api(vehicle, reg)
    session.add(vehicle)
    session.flush()

    logger.info("Created vehicle catalog entry for %s (source=%s)", reg, vehicle.source)
    return vehicle


def _enrich_from_api(vehicle: Vehicle, reg: str) -> None:
    """Try to populate vehicle fields from the Statens vegvesen API."""
    try:
        from app.services.vegvesen_client import lookup_registration

        data = lookup_registration(reg)
    except Exception:
        logger.warning("SVV API call failed for %s", reg, exc_info=True)
        return

    if data is None:
        logger.info("No SVV data returned for %s", reg)
        return

    vehicle.vehicle_type = data["vehicle_type"]
    vehicle.make = data["make"]
    vehicle.model = data["model"]
    vehicle.fuel_type = data["fuel_type"]
    vehicle.co2_per_km = data["co2_per_km"]
    vehicle.source = VehicleSource.VEGVESEN_API
