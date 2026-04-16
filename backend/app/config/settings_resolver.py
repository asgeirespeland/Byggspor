"""Settings resolution: project → organization → hardcoded defaults.

Provides a single function to resolve calculation settings for a given
project, merging overrides from the project and its organization on top
of the hardcoded defaults in project_defaults.py.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.config.project_defaults import (
    CONFIDENCE_THRESHOLDS,
    CONFIDENCE_WEIGHTING,
    ENERGY_GRID_EMISSION_FACTOR,
    ENERGY_GRID_MIX_TYPE,
    ENERGY_GRID_SOURCE,
    ENERGY_GRID_SOURCE_URL,
    MATERIAL_GWP_STAGES,
    MATERIAL_INCLUDE_A4,
    MATERIAL_INCLUDE_BIOGENIC,
    NS9431_EMISSION_FACTOR_ENTRIES,
    NS9431_FACTORS_SOURCE,
    TRANSPORT_CO2_SOURCE,
    WASTE_EPD_STAGES,
    WASTE_MANUAL_EMISSION_FACTORS,
    WASTE_MANUAL_FACTORS_NOTE,
)
from app.errors import ApiError

# ---------------------------------------------------------------------------
# Canonical defaults (flat keys)
# ---------------------------------------------------------------------------

SETTINGS_DEFAULTS: dict[str, Any] = {
    "energy_grid_emission_factor": ENERGY_GRID_EMISSION_FACTOR,
    "energy_grid_mix_type": ENERGY_GRID_MIX_TYPE,
    "material_gwp_stages": MATERIAL_GWP_STAGES,
    "material_include_a4": MATERIAL_INCLUDE_A4,
    "material_include_biogenic": MATERIAL_INCLUDE_BIOGENIC,
    "waste_epd_stages": WASTE_EPD_STAGES,
    "waste_manual_emission_factors": WASTE_MANUAL_EMISSION_FACTORS,
    "confidence_weighting": CONFIDENCE_WEIGHTING,
    "confidence_thresholds": CONFIDENCE_THRESHOLDS,
}

# Validation schema: key → expected type (and optional constraints)
_SCHEMA: dict[str, dict[str, Any]] = {
    "energy_grid_emission_factor": {"type": (int, float), "min": 0},
    "energy_grid_mix_type": {
        "type": str,
        "choices": ["physical", "residual"],
    },
    "material_gwp_stages": {"type": list},
    "material_include_a4": {"type": bool},
    "material_include_biogenic": {"type": bool},
    "waste_epd_stages": {"type": list},
    "waste_manual_emission_factors": {"type": dict},
    "confidence_weighting": {
        "type": str,
        "choices": ["average", "co2_weighted"],
    },
    "confidence_thresholds": {"type": dict},
}


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def validate_settings(partial: dict) -> dict:
    """Validate a partial settings dict. Returns cleaned copy or raises ApiError."""
    cleaned: dict[str, Any] = {}

    for key, value in partial.items():
        schema = _SCHEMA.get(key)
        if schema is None:
            raise ApiError(
                f"Ukjent innstilling: {key}",
                code="INVALID_FIELD",
            )

        expected_type = schema["type"]
        if not isinstance(value, expected_type):
            type_name = (
                expected_type.__name__
                if isinstance(expected_type, type)
                else "/".join(t.__name__ for t in expected_type)
            )
            raise ApiError(
                f"Ugyldig type for {key}: forventet {type_name}.",
                code="INVALID_FIELD",
            )

        if "min" in schema and value < schema["min"]:
            raise ApiError(
                f"{key} kan ikke være lavere enn {schema['min']}.",
                code="INVALID_FIELD",
            )

        if "choices" in schema and value not in schema["choices"]:
            raise ApiError(
                f"Ugyldig verdi for {key}. Gyldige verdier: {schema['choices']}",
                code="INVALID_FIELD",
            )

        cleaned[key] = value

    return cleaned


def clean_overrides(overrides: dict, inherited: dict) -> dict | None:
    """Remove overrides that match inherited values. Returns None if empty."""
    cleaned = {
        k: v for k, v in overrides.items() if k not in inherited or v != inherited[k]
    }
    return cleaned or None


# ---------------------------------------------------------------------------
# Resolution
# ---------------------------------------------------------------------------


def resolve_settings(session: Session, project_id: int) -> dict[str, Any]:
    """Resolve settings: project → org → defaults. Returns flat dict."""
    from app.models.organization import Organization
    from app.models.project import Project

    resolved = {**SETTINGS_DEFAULTS}

    project = session.get(Project, project_id)
    if project is None:
        return resolved

    org = session.get(Organization, project.organization_id)
    if org and org.settings:
        resolved.update(org.settings)

    if project.settings:
        resolved.update(project.settings)

    return resolved


def resolve_org_settings(session: Session, org_id: int) -> dict[str, Any]:
    """Resolve settings for an org (no project layer). Returns flat dict."""
    from app.models.organization import Organization

    resolved = {**SETTINGS_DEFAULTS}

    org = session.get(Organization, org_id)
    if org and org.settings:
        resolved.update(org.settings)

    return resolved


def resolve_settings_with_sources(
    session: Session,
    project_id: int,
) -> dict[str, dict[str, Any]]:
    """Resolve settings with source annotation for each key.

    Returns: { "key": { "value": ..., "source": "default"|"organization"|"project" } }
    """
    from app.models.organization import Organization
    from app.models.project import Project

    result: dict[str, dict[str, Any]] = {
        k: {"value": v, "source": "default"} for k, v in SETTINGS_DEFAULTS.items()
    }

    project = session.get(Project, project_id)
    if project is None:
        return result

    org = session.get(Organization, project.organization_id)
    if org and org.settings:
        for k, v in org.settings.items():
            if k in SETTINGS_DEFAULTS:
                result[k] = {"value": v, "source": "organization"}

    if project.settings:
        for k, v in project.settings.items():
            if k in SETTINGS_DEFAULTS:
                result[k] = {"value": v, "source": "project"}

    return result


def resolve_org_settings_with_sources(
    session: Session,
    org_id: int,
) -> dict[str, dict[str, Any]]:
    """Resolve settings with source annotation for an org (no project layer)."""
    from app.models.organization import Organization

    result: dict[str, dict[str, Any]] = {
        k: {"value": v, "source": "default"} for k, v in SETTINGS_DEFAULTS.items()
    }

    org = session.get(Organization, org_id)
    if org and org.settings:
        for k, v in org.settings.items():
            if k in SETTINGS_DEFAULTS:
                result[k] = {"value": v, "source": "organization"}

    return result


# ---------------------------------------------------------------------------
# Snapshot (nested format for report output / frontend methodology tab)
# ---------------------------------------------------------------------------


def resolve_for_snapshot(session: Session, project_id: int) -> dict:
    """Return settings in the nested shape expected by the report frontend."""
    flat = resolve_settings(session, project_id)
    return _to_snapshot(flat)


def _to_snapshot(flat: dict[str, Any]) -> dict:
    """Convert flat settings dict to grouped snapshot format."""
    return {
        "energy": {
            "grid_emission_factor": flat["energy_grid_emission_factor"],
            "grid_mix_type": flat["energy_grid_mix_type"],
            "source": ENERGY_GRID_SOURCE,
            "source_url": ENERGY_GRID_SOURCE_URL,
        },
        "materials": {
            "gwp_stages": flat["material_gwp_stages"],
            "include_a4": flat["material_include_a4"],
            "include_biogenic": flat["material_include_biogenic"],
        },
        "transport": {
            "co2_source": TRANSPORT_CO2_SOURCE,
        },
        "waste": {
            "epd_stages": flat["waste_epd_stages"],
            "manual_factors": flat["waste_manual_emission_factors"],
            "manual_factors_note": WASTE_MANUAL_FACTORS_NOTE,
            "ns9431_factors": [
                {"code": code, "label": label, "factor": factor}
                for code, factor, label in NS9431_EMISSION_FACTOR_ENTRIES
            ],
            "ns9431_source": NS9431_FACTORS_SOURCE,
        },
        "confidence": {
            "weighting": flat["confidence_weighting"],
            "thresholds": flat["confidence_thresholds"],
        },
    }
