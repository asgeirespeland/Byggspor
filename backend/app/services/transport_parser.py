"""Abax Turrapport XML parser.

Parses Abax driving log exports (Turrapport) and extracts individual trips
with driver info, vehicle registration, addresses, distances, and expenses.

The XML uses encoded tag names (e.g. _x0020_ for space, _x0028_ for '(').
The child element tag name under <DocumentElement> varies by report period,
so we iterate all children rather than matching a specific tag.

This parser is stateless and does no enrichment or DB writes. It returns
a plain dict that can be passed to transport_service for processing.
"""

import logging
import xml.etree.ElementTree as ET
from datetime import datetime

logger = logging.getLogger(__name__)

# Mapping from encoded XML tag suffixes to dict keys
_FIELD_MAP = {
    "Navn": "driver_name",
    "Reg.nr": "registration_number",
    "Startadresse": "start_address",
    "Stoppadresse": "end_address",
    "Avdeling": "department",
    "Formål": "purpose",
    "Kommentar": "comment",
}

# Numeric fields — tag substring → dict key
_NUMERIC_FIELDS = {
    "Distanse": "distance_km",
    "Varighet": "duration_minutes",
    "Bompenger": "toll_kr",
    "Ferge": "ferry_kr",
    "Parkering": "parking_kr",
}

# Date fields
_DATE_FIELDS = {
    "Fra_": "from_date",
    "Til_": "to_date",
}


def _decode_tag(tag: str) -> str:
    """Decode Abax XML-encoded tag names for matching purposes."""
    return (
        tag.replace("_x0020_", " ")
        .replace("_x0028_", "(")
        .replace("_x0029_", ")")
        .replace("_x002C_", ",")
    )


def _parse_float(text: str | None) -> float | None:
    if not text:
        return None
    try:
        return float(text.replace(",", "."))
    except (ValueError, TypeError):
        return None


def _parse_date(text: str | None) -> str | None:
    """Parse ISO datetime string and return date as YYYY-MM-DD."""
    if not text:
        return None
    try:
        dt = datetime.fromisoformat(text)
        return dt.strftime("%Y-%m-%d")
    except (ValueError, TypeError):
        return None


def _parse_trip(element: ET.Element) -> dict:
    """Extract trip data from a single Turrapport entry element."""
    trip: dict = {}

    for child in element:
        tag = child.tag
        text = child.text.strip() if child.text else None
        decoded = _decode_tag(tag)

        # Check exact tag matches first
        if tag in _FIELD_MAP:
            trip[_FIELD_MAP[tag]] = text
            continue

        # Check date fields by prefix
        matched = False
        for prefix, key in _DATE_FIELDS.items():
            if tag.startswith(prefix) and key not in trip:
                trip[key] = _parse_date(text)
                matched = True
                break
        if matched:
            continue

        # Check numeric fields by decoded substring
        for substr, key in _NUMERIC_FIELDS.items():
            if substr in decoded and key not in trip:
                trip[key] = _parse_float(text)
                break

    # Use from_date as the canonical trip date
    trip["trip_date"] = trip.pop("from_date", None)
    trip.pop("to_date", None)

    return trip


def parse_turrapport(xml_content: str | bytes) -> dict:
    """Parse an Abax Turrapport XML and return structured trip data.

    Args:
        xml_content: Raw XML as string or bytes.

    Returns:
        Dict with a "trips" list, each containing driver, vehicle,
        route, distance, duration, and expense fields.

    Raises:
        ET.ParseError: If the XML is malformed.
    """
    root = ET.fromstring(xml_content)

    trips = []
    for entry in root:
        trip = _parse_trip(entry)
        if trip.get("registration_number"):
            trips.append(trip)
        else:
            logger.warning("Skipping trip entry with no registration number")

    logger.info("Parsed %d trips from Turrapport XML", len(trips))
    return {"trips": trips}
