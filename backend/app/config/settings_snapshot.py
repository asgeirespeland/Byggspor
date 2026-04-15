"""Serialize active calculation settings for report output.

Returns a snapshot of the settings that were in effect when a report
was generated. When per-project/org settings exist (#63, #64), this
will resolve the full inheritance chain before serializing.
"""

from __future__ import annotations

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


def get_active_settings() -> dict:
    """Return the calculation settings currently in effect."""
    return {
        "energy": {
            "grid_emission_factor": ENERGY_GRID_EMISSION_FACTOR,
            "grid_mix_type": ENERGY_GRID_MIX_TYPE,
            "source": ENERGY_GRID_SOURCE,
            "source_url": ENERGY_GRID_SOURCE_URL,
        },
        "materials": {
            "gwp_stages": MATERIAL_GWP_STAGES,
            "include_a4": MATERIAL_INCLUDE_A4,
            "include_biogenic": MATERIAL_INCLUDE_BIOGENIC,
        },
        "transport": {
            "co2_source": TRANSPORT_CO2_SOURCE,
        },
        "waste": {
            "epd_stages": WASTE_EPD_STAGES,
            "manual_factors": WASTE_MANUAL_EMISSION_FACTORS,
            "manual_factors_note": WASTE_MANUAL_FACTORS_NOTE,
            "ns9431_factors": [
                {"code": code, "label": label, "factor": factor}
                for code, factor, label in NS9431_EMISSION_FACTOR_ENTRIES
            ],
            "ns9431_source": NS9431_FACTORS_SOURCE,
        },
        "confidence": {
            "weighting": CONFIDENCE_WEIGHTING,
            "thresholds": CONFIDENCE_THRESHOLDS,
        },
    }
