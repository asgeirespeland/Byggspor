"""Default project settings — single source of truth for calculation parameters.

All CO₂ calculation logic should read from these defaults rather than
defining inline constants. When per-project settings are implemented
(stored in a project_settings JSON column), those values override
these defaults at runtime.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Energy
# ---------------------------------------------------------------------------

ENERGY_GRID_EMISSION_FACTOR = 0.0119  # kg CO₂eq per kWh
ENERGY_GRID_MIX_TYPE = "physical"  # "physical" (NVE) or "residual" (AIB)
ENERGY_GRID_SOURCE = "NVE klimadeklarasjon 2024"
ENERGY_GRID_SOURCE_URL = (
    "https://www.nve.no/energi/energisystem/energibruk/stroemdeklarasjoner/"
)

# ---------------------------------------------------------------------------
# Materials — lifecycle scope
# ---------------------------------------------------------------------------

# Which GWP stages to include in material CO₂ calculations.
# A1-A3 = raw material supply + transport + manufacturing (cradle-to-gate).
MATERIAL_GWP_STAGES = ["a1_a3"]

# Whether to add A4 (transport to site) from EPD data on top of A1-A3.
# Off by default — Abax covers actual transport separately.
MATERIAL_INCLUDE_A4 = False

# Whether negative (biogenic) GWP values are included in totals.
# True = wood products can show negative CO₂ (carbon sequestration).
MATERIAL_INCLUDE_BIOGENIC = True

# ---------------------------------------------------------------------------
# Transport
# ---------------------------------------------------------------------------

# No hardcoded default — CO₂/km comes from Statens vegvesen per vehicle.
# This placeholder is used only when vehicle data is unavailable.
TRANSPORT_DEFAULT_CO2_PER_KM = None  # kg CO₂ per km
TRANSPORT_CO2_SOURCE = "Statens vegvesen kjøretøyregisteret (WLTP/NEDC)"

# ---------------------------------------------------------------------------
# Waste — manual entry placeholder factors (kg CO₂e per tonne)
# ---------------------------------------------------------------------------

WASTE_MANUAL_EMISSION_FACTORS: dict[str, float] = {
    "metall": 50.0,
    "treverk": 30.0,
    "betong": 10.0,
}
WASTE_MANUAL_FACTORS_NOTE = (
    "Placeholder factors — replace when the team agrees on final values."
)

# ---------------------------------------------------------------------------
# Waste — NS 9431 fraction-level factors (kg CO₂e per tonne)
#
# Sources: SSB avfallsregnskap, DEFRA 2023 emission factors for waste,
# and Asplan Viak / Byggemiljø guidance documents.
# Representative estimates — replace with authoritative values when
# available from Miljødirektoratet or sector agreements.
# ---------------------------------------------------------------------------

# Each entry: code → (factor, label)
_NS9431_ENTRIES: list[tuple[str, float, str]] = [
    # Trevirke
    ("1141", 43.0, "Rent trevirke"),
    ("1142", 43.0, "Behandlet trevirke"),
    ("1149", 43.0, "Blandet bearbeidet trevirke"),
    # Papir/papp
    ("1222", 21.0, "Ren papp"),
    ("1299", 21.0, "Papir, papp og kartong"),
    # Glass
    ("1331", 8.0, "Vindusglass, ikke laminert"),
    ("1341", 8.0, "Laminert glass"),
    # Metall
    ("1447", 12.0, "Rent magnetisk metall"),
    ("1450", 12.0, "Klipp jern"),
    ("1451", 12.0, "Rent umagnetisk metall"),
    ("1452", 12.0, "Metall, blandet"),
    # EE-avfall
    ("1500", 50.0, "EE-avfall"),
    ("1599", 50.0, "Blandet EE-avfall"),
    # Betong/tegl/mineraler
    ("1601", 3.0, "Rene masser"),
    ("1611", 3.0, "Betong uten armeringsjern"),
    ("1612", 5.0, "Betong med armeringsjern"),
    ("1613", 3.0, "Tegl og takstein"),
    ("1615", 8.0, "Gipsbaserte materialer"),
    ("1617", 15.0, "Mineralull"),
    ("1618", 3.0, "Keramikk og porselen"),
    ("1619", 5.0, "Asfalt"),
    # Plast
    ("1711", 65.0, "Folieplast, emballasje"),
    ("1712", 65.0, "Folieplast, annen"),
    ("1721", 65.0, "Hardplast, emballasje"),
    ("1722", 65.0, "Hardplast, annen"),
    ("1723", 80.0, "PVC"),
    ("1731", 75.0, "Ekspandert/ekstrudert plast (EPS/XPS)"),
    ("1799", 65.0, "Blandet plast"),
    # Takbelegg
    ("1621", 30.0, "Takpapp"),
]

# Flat lookup used by calculation code (code → factor)
NS9431_EMISSION_FACTORS: dict[str, float] = {
    code: factor for code, factor, _ in _NS9431_ENTRIES
}

# Full entries with labels, used by the settings snapshot / report UI
NS9431_EMISSION_FACTOR_ENTRIES: list[tuple[str, float, str]] = _NS9431_ENTRIES
NS9431_FACTORS_SOURCE = "SSB avfallsregnskap, DEFRA 2023, Asplan Viak/Byggemiljø"

# ---------------------------------------------------------------------------
# Waste — EPD end-of-life scope
# ---------------------------------------------------------------------------

# Which EPD stages to use for product-level waste CO₂.
WASTE_EPD_STAGES = ["c3", "c4"]

# ---------------------------------------------------------------------------
# Confidence scoring thresholds
# ---------------------------------------------------------------------------

CONFIDENCE_THRESHOLDS = {
    "energy": 100,  # deterministic: kWh × emission factor
    "material_manual_override": 90,
    "material_with_gwp": 80,
    "material_flagged": 20,
    "material_default": 50,
    "transport_full_data": 80,  # distance + co2_per_km
    "transport_no_co2": 20,  # distance only, flagged
    "transport_default": 50,
    "waste_with_factor": 80,
    "waste_default": 50,
}

# Weighting strategy for the overall project confidence score.
# "average" = simple mean across entries, "co2_weighted" = weighted by CO₂ contribution.
CONFIDENCE_WEIGHTING = "co2_weighted"
