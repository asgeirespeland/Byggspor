"""Centralized confidence score assignment for CO2 calculations.

Single source of truth for all confidence thresholds:
  - 100: deterministic calculation (e.g. energy from kWh * emission factor)
  -  90: user-provided manual override
  -  80: calculated from catalog/vehicle data
  -  50: no data available, not flagged
  -  20: no data available, flagged for review
"""


def material_confidence(
    *, has_gwp: bool, flagged: bool, is_manual_override: bool
) -> int:
    """Return confidence score for a project material entry."""
    if is_manual_override:
        return 90
    if has_gwp:
        return 80
    return 20 if flagged else 50


def transport_confidence(*, has_co2_per_km: bool, has_distance: bool) -> int:
    """Return confidence score for a transport trip."""
    if has_distance and has_co2_per_km:
        return 80
    if has_distance and not has_co2_per_km:
        return 20
    return 50


ENERGY_CONFIDENCE = 100
