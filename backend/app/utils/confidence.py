"""Centralized confidence score assignment for CO2 calculations.

Single source of truth for all confidence thresholds:
  - 100: deterministic calculation (e.g. energy from kWh * emission factor)
  -  90: user-provided manual override
  -  80: calculated from catalog/vehicle data
  -  50: no data available, not flagged
  -  20: no data available, flagged for review
"""


def material_confidence(
    *, has_gwp: bool, has_epd: bool = False, flagged: bool, is_manual_override: bool
) -> int:
    """Return confidence score for a project material entry."""
    if is_manual_override:
        return 90
    if has_gwp and has_epd:
        return 100  # GWP sourced from a verified EPD — deterministic
    if has_gwp:
        return 80  # GWP from generic catalog data, no EPD verification
    return 20 if flagged else 50


def transport_confidence(*, has_co2_per_km: bool, has_distance: bool) -> int:
    """Return confidence score for a transport trip."""
    if has_distance and has_co2_per_km:
        return 80
    if has_distance and not has_co2_per_km:
        return 20
    return 50


def waste_confidence(*, has_emission_factor: bool) -> int:
    """Return confidence score for a waste entry."""
    if has_emission_factor:
        return 80
    return 50


ENERGY_CONFIDENCE = 100


def aggregate_confidence(
    entries: list[tuple[float | None, int | None]],
    weighting: str = "average",
) -> float | None:
    """Compute aggregate confidence from (co2, score) pairs.

    weighting="average"      → simple mean of scores
    weighting="co2_weighted" → weighted by abs(co2) contribution
    """
    scored = [(co2, score) for co2, score in entries if score is not None]
    if not scored:
        return None

    if weighting == "co2_weighted":
        weight_sum = sum(abs(co2 or 0) for co2, _ in scored)
        if weight_sum:
            return round(
                sum(abs(co2 or 0) * score for co2, score in scored) / weight_sum,
                1,
            )

    # Fallback: simple average
    return round(sum(s for _, s in scored) / len(scored), 1)
