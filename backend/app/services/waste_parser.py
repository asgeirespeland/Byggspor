from __future__ import annotations

import csv
import io

from app.errors import ApiError
from app.utils.confidence import waste_confidence

# Placeholder factors in kg CO2e per ton.
# TODO: replace when the team agrees on final emission factors.
WASTE_EMISSION_FACTORS = {
    "metall": 50.0,
    "treverk": 30.0,
    "betong": 10.0,
}


def normalize_waste_type(value: str | None) -> str:
    """Normalize and validate supported waste types."""
    if not value:
        raise ApiError(
            "waste_type er påkrevd.",
            code="MISSING_FIELD",
            suggestion="Velg en avfallstype: metall, treverk eller betong.",
        )

    normalized = value.strip().lower()
    if normalized not in WASTE_EMISSION_FACTORS:
        valid = ", ".join(WASTE_EMISSION_FACTORS.keys())
        raise ApiError(
            f"Ugyldig avfallstype: {value}.",
            code="INVALID_FIELD",
            suggestion=f"Gyldige avfallstyper er: {valid}.",
        )

    return normalized


def parse_quantity_tons(value: object) -> float:
    """Parse quantity in tons and ensure it is non-negative."""
    if value is None or value == "":
        raise ApiError(
            "quantity_tons er påkrevd.",
            code="MISSING_FIELD",
            suggestion="Oppgi mengde i tonn, for eksempel 1.5.",
        )

    try:
        quantity = float(value)
    except (TypeError, ValueError):
        raise ApiError(
            "quantity_tons må være et tall.",
            code="INVALID_FIELD",
            suggestion="Oppgi mengde i tonn som tall, for eksempel 1.5.",
        )

    if quantity < 0:
        raise ApiError(
            "quantity_tons kan ikke være negativt.",
            code="INVALID_FIELD",
            suggestion="Oppgi en positiv mengde i tonn.",
        )

    return quantity


def calculate_waste_co2(waste_type: str, quantity_tons: float) -> float:
    """Calculate CO2 in kg from waste type and quantity in tons."""
    normalized_type = normalize_waste_type(waste_type)
    factor = WASTE_EMISSION_FACTORS[normalized_type]
    return round(quantity_tons * factor, 4)


def build_waste_item_data(
    waste_type: str,
    quantity_tons: float,
    *,
    notes: str | None = None,
) -> dict:
    """Build normalized waste item payload for persistence."""
    normalized_type = normalize_waste_type(waste_type)
    parsed_quantity = parse_quantity_tons(quantity_tons)
    has_factor = normalized_type in WASTE_EMISSION_FACTORS
    calculated_co2_kg = calculate_waste_co2(normalized_type, parsed_quantity)

    return {
        "waste_type": normalized_type,
        "quantity_tons": parsed_quantity,
        "co2_from_report_kg": None,
        "calculated_co2_kg": calculated_co2_kg,
        "total_co2_kg": calculated_co2_kg,
        "confidence_score": waste_confidence(has_emission_factor=has_factor),
        "notes": notes,
    }


def parse_waste_csv(file_content: str | bytes) -> list[dict]:
    """Parse waste CSV with columns: waste_type, quantity_tons."""
    if isinstance(file_content, bytes):
        text = file_content.decode("utf-8-sig")
    else:
        text = file_content

    reader = csv.DictReader(io.StringIO(text))
    required_columns = {"waste_type", "quantity_tons"}

    if not reader.fieldnames:
        raise ApiError(
            "CSV-filen er tom eller mangler kolonneoverskrifter.",
            code="INVALID_FILE_FORMAT",
            suggestion="Bruk CSV med kolonnene waste_type og quantity_tons.",
        )

    actual_columns = {name.strip() for name in reader.fieldnames if name}
    if not required_columns.issubset(actual_columns):
        raise ApiError(
            "CSV-filen mangler nødvendige kolonner.",
            code="INVALID_FILE_FORMAT",
            suggestion="Bruk kolonnene waste_type og quantity_tons.",
        )

    items: list[dict] = []
    for index, row in enumerate(reader, start=2):
        try:
            item = build_waste_item_data(
                waste_type=row.get("waste_type"),
                quantity_tons=row.get("quantity_tons"),
            )
            items.append(item)
        except ApiError as exc:
            raise ApiError(
                f"Feil i CSV på rad {index}: {exc.message}",
                code=exc.code,
                suggestion=exc.suggestion,
            ) from exc

    if not items:
        raise ApiError(
            "CSV-filen inneholder ingen avfallsrader.",
            code="INVALID_FILE_FORMAT",
            suggestion="Legg inn minst én rad med waste_type og quantity_tons.",
        )

    return items
