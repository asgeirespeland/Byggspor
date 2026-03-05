"""Vehicle lookup service.

Checks the vehicles catalog DB first. If no record exists, creates a stub
entry that can be enriched later (manually or via Statens vegvesen API).
"""

import logging

from sqlalchemy.orm import Session

from app.models.vehicle import Vehicle

logger = logging.getLogger(__name__)


def lookup_vehicle(session: Session, registration_number: str) -> Vehicle:
    """Find or create a Vehicle catalog entry by registration number.

    Returns the existing Vehicle if found, otherwise creates a new stub
    record with only the registration number populated.
    """
    reg = registration_number.upper().strip()

    vehicle = session.query(Vehicle).filter(Vehicle.registration_number == reg).first()

    if vehicle is not None:
        return vehicle

    # Create stub entry — emission data unknown until looked up
    # TODO: Integrate Statens vegvesen API to auto-populate vehicle details
    # See follow-up GitHub issue for full API integration
    vehicle = Vehicle(registration_number=reg)
    session.add(vehicle)
    session.flush()

    logger.info("Created new vehicle catalog entry for %s", reg)
    return vehicle
