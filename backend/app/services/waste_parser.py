from __future__ import annotations

import csv
import io

from app.config.project_defaults import WASTE_MANUAL_EMISSION_FACTORS
from app.errors import ApiError
from app.utils.confidence import waste_confidence

WASTE_EMISSION_FACTORS = WASTE_MANUAL_EMISSION_FACTORS


def normalize_waste_type(
    value: str | None, emission_factors: dict[str, float] | None = None
) -> str:
    """Normalize and validate supported waste types."""
    factors = emission_factors or WASTE_EMISSION_FACTORS
    if not value:
        raise ApiError(
            "waste_type er påkrevd.",
            code="MISSING_FIELD",
            suggestion="Velg en avfallstype: metall, treverk eller betong.",
        )

    normalized = value.strip().lower()
    if normalized not in factors:
        valid = ", ".join(factors.keys())
        raise ApiError(
            f"Ugyldig avfallstype: {value}.",
            code="INVALID_FIELD",
            suggestion=f"Gyldige avfallstyper er: {valid}.",
        )

    return normalized


def parse_quantity(value: object) -> float:
    """Parse quantity and ensure it is non-negative."""
    if value is None or value == "":
        raise ApiError(
            "quantity er påkrevd.",
            code="MISSING_FIELD",
            suggestion="Oppgi mengde, for eksempel 1.5.",
        )

    try:
        quantity = float(value)
    except (TypeError, ValueError):
        raise ApiError(
            "quantity må være et tall.",
            code="INVALID_FIELD",
            suggestion="Oppgi mengde som tall, for eksempel 1.5.",
        )

    if quantity < 0:
        raise ApiError(
            "quantity kan ikke være negativt.",
            code="INVALID_FIELD",
            suggestion="Oppgi en positiv mengde.",
        )

    return quantity


def calculate_waste_co2(
    waste_type: str,
    quantity: float,
    emission_factors: dict[str, float] | None = None,
) -> float:
    """Calculate CO2 in kg from waste type and quantity in tons."""
    factors = emission_factors or WASTE_EMISSION_FACTORS
    normalized_type = normalize_waste_type(waste_type, factors)
    factor = factors[normalized_type]
    return round(quantity * factor, 4)


def build_waste_item_data(
    waste_type: str,
    quantity: float,
    *,
    notes: str | None = None,
    emission_factors: dict[str, float] | None = None,
) -> dict:
    """Build normalized waste item payload for persistence."""
    factors = emission_factors or WASTE_EMISSION_FACTORS
    normalized_type = normalize_waste_type(waste_type, factors)
    parsed_quantity = parse_quantity(quantity)
    has_factor = normalized_type in factors
    calculated_co2_kg = calculate_waste_co2(normalized_type, parsed_quantity, factors)

    return {
        "waste_type": normalized_type,
        "quantity": parsed_quantity,
        "unit": "TON",
        "co2_from_report_kg": None,
        "calculated_co2_kg": calculated_co2_kg,
        "total_co2_kg": calculated_co2_kg,
        "confidence_score": waste_confidence(has_emission_factor=has_factor),
        "notes": notes,
    }


def parse_waste_csv(
    file_content: str | bytes,
    emission_factors: dict[str, float] | None = None,
) -> list[dict]:
    """Parse waste CSV with columns: waste_type, quantity."""
    if isinstance(file_content, bytes):
        text = file_content.decode("utf-8-sig")
    else:
        text = file_content

    reader = csv.DictReader(io.StringIO(text))
    required_columns = {"waste_type", "quantity"}

    if not reader.fieldnames:
        raise ApiError(
            "CSV-filen er tom eller mangler kolonneoverskrifter.",
            code="INVALID_FILE_FORMAT",
            suggestion="Bruk CSV med kolonnene waste_type og quantity.",
        )

    actual_columns = {name.strip() for name in reader.fieldnames if name}
    if not required_columns.issubset(actual_columns):
        raise ApiError(
            "CSV-filen mangler nødvendige kolonner.",
            code="INVALID_FILE_FORMAT",
            suggestion="Bruk kolonnene waste_type og quantity.",
        )

    items: list[dict] = []
    for index, row in enumerate(reader, start=2):
        try:
            item = build_waste_item_data(
                waste_type=row.get("waste_type"),
                quantity=row.get("quantity"),
                emission_factors=emission_factors,
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
            suggestion="Legg inn minst én rad med waste_type og quantity.",
        )

    return items
