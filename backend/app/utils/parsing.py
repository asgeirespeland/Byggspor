"""Field parsing and validation utilities for route handlers."""

from __future__ import annotations

from datetime import date
from typing import TypeVar

from app.errors import ApiError

E = TypeVar("E")


def parse_enum(value: str | None, enum_cls: type[E]) -> E | None:
    """Look up an enum member by name (case-insensitive) or by value.

    Returns None if *value* is empty or does not match any member.
    """
    if not value:
        return None
    normalized = value.strip().upper()
    if normalized in enum_cls.__members__:
        return enum_cls[normalized]
    lowered = value.strip().lower()
    for member in enum_cls:
        if member.value == lowered:
            return member
    return None


def require_int(data: dict, field: str) -> int:
    """Extract and validate an integer field from *data*.

    Raises ApiError if the field is missing or not a valid integer.
    """
    value = data.get(field)
    if not value and value != 0:
        raise ApiError(f"{field} er p\u00e5krevd.", code="MISSING_FIELD")
    try:
        return int(value)
    except (ValueError, TypeError):
        raise ApiError(f"{field} m\u00e5 v\u00e6re et heltall.", code="INVALID_FIELD")


def require_float(
    data: dict,
    field: str,
    *,
    allow_negative: bool = True,
    suggestion: str | None = None,
) -> float:
    """Extract and validate a float field from *data*.

    Raises ApiError if the field is missing, not numeric, or negative
    (when *allow_negative* is False).
    """
    value = data.get(field)
    if value is None:
        raise ApiError(
            f"{field} er p\u00e5krevd.",
            code="MISSING_FIELD",
            suggestion=suggestion,
        )
    try:
        result = float(value)
    except (ValueError, TypeError):
        raise ApiError(
            f"{field} m\u00e5 v\u00e6re et tall.",
            code="INVALID_FIELD",
            suggestion=suggestion,
        )
    if not allow_negative and result < 0:
        raise ApiError(
            f"{field} kan ikke v\u00e6re negativt.",
            code="INVALID_FIELD",
            suggestion=suggestion,
        )
    return result


def parse_float(
    data: dict,
    field: str,
    *,
    suggestion: str | None = None,
) -> float:
    """Parse an existing field value as float (for PATCH operations).

    Unlike require_float, caller is responsible for checking field presence.
    Raises ApiError if the value is not numeric.
    """
    try:
        return float(data[field])
    except (ValueError, TypeError):
        raise ApiError(
            f"{field} m\u00e5 v\u00e6re et tall.",
            code="INVALID_FIELD",
            suggestion=suggestion,
        )


def optional_date(data: dict, field: str) -> date | None:
    """Parse an optional ISO date field from *data*.

    Returns None if the field is missing or empty.
    Raises ApiError on invalid format.
    """
    value = data.get(field)
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (ValueError, TypeError):
        raise ApiError(
            "Ugyldig datoformat.",
            code="INVALID_FIELD",
            suggestion="Bruk formatet YYYY-MM-DD (f.eks. 2026-03-24).",
        )
