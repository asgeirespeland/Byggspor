"""Waste report enrichment service.

Takes a parsed waste report (from waste_report_parser) and enriches each
line item with CO₂ data from one of two sources:

  1. **Product-level (GTIN/NOBB)** — looks up the product in the NOBB API
     and extracts C3 (waste processing) + C4 (disposal) GWP stages from
     the EPD. This gives per-product end-of-life CO₂ data.

  2. **Fraction-level (NS 9431)** — falls back to generic emission factors
     per waste fraction code when no product identifier is available.

When a DB session is provided, the material catalog is checked first to
avoid redundant NOBB API calls (same caching as invoice enrichment).

Each line item gets these fields added:
  - enriched (bool): whether CO₂ data was found
  - flagged (bool): whether the item needs manual review
  - co2_kg (float|None): total end-of-life CO₂ in kg
  - co2_source (str): "epd_c3c4", "fraction_factor", or None
  - confidence (int): confidence score for the CO₂ value
  - nobb_data (dict|None): product data if looked up via NOBB
"""

import logging

from sqlalchemy.orm import Session

from app.services.nobb_client import lookup
from app.utils.confidence import waste_confidence

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# NS 9431 fraction emission factors (kg CO₂e per tonne)
#
# Sources: SSB avfallsregnskap, DEFRA 2023 emission factors for waste,
# and Asplan Viak / Byggemiljø guidance documents.
# These are representative estimates — replace with authoritative values
# when available from Miljødirektoratet or sector agreements.
# ---------------------------------------------------------------------------
NS9431_EMISSION_FACTORS: dict[str, float] = {
    # Trevirke (wood)
    "1141": 43.0,  # Rent trevirke (clean wood)
    "1142": 43.0,  # Behandlet trevirke (treated wood)
    "1149": 43.0,  # Blandet bearbeidet trevirke
    # Papir/papp
    "1222": 21.0,  # Ren papp
    "1299": 21.0,  # Papir, papp og kartong
    # Glass
    "1331": 8.0,  # Vindusglass, ikke laminert
    "1341": 8.0,  # Laminert glass
    # Metall
    "1447": 12.0,  # Rent magnetisk metall
    "1450": 12.0,  # Klipp jern
    "1451": 12.0,  # Rent umagnetisk metall
    "1452": 12.0,  # Metall, blandet
    # EE-avfall
    "1500": 50.0,  # EE-avfall
    "1599": 50.0,  # Blandet EE-avfall
    # Betong/tegl/mineraler
    "1601": 3.0,  # Rene masser
    "1611": 3.0,  # Betong uten armeringsjern
    "1612": 5.0,  # Betong med armeringsjern
    "1613": 3.0,  # Tegl og takstein
    "1615": 8.0,  # Gipsbaserte materialer
    "1617": 15.0,  # Mineralull
    "1618": 3.0,  # Keramikk og porselen
    "1619": 5.0,  # Asfalt
    # Plast
    "1711": 65.0,  # Folieplast, emballasje
    "1712": 65.0,  # Folieplast, annen
    "1721": 65.0,  # Hardplast, emballasje
    "1722": 65.0,  # Hardplast, annen
    "1723": 80.0,  # PVC
    "1731": 75.0,  # Ekspandert/ekstrudert plast (EPS/XPS)
    "1799": 65.0,  # Blandet plast
    # Takbelegg
    "1621": 30.0,  # Takpapp
}


def _extract_c3c4_co2(epd: dict | None, quantity_tons: float) -> float | None:
    """Calculate end-of-life CO₂ from EPD C3 + C4 GWP stages.

    Returns total CO₂ in kg, or None if stages are missing.
    """
    if epd is None:
        return None

    stages = epd.get("gwp_stages", {})
    c3 = stages.get("c3", {})
    c4 = stages.get("c4", {})

    c3_total = c3.get("total") if isinstance(c3, dict) else None
    c4_total = c4.get("total") if isinstance(c4, dict) else None

    if c3_total is None and c4_total is None:
        return None

    # GWP values in EPD are per declared unit. We need the conversion factor
    # to get per-kg, then multiply by quantity.
    conversion_factor = epd.get("conversion_factor_kg")

    gwp_per_unit = (c3_total or 0.0) + (c4_total or 0.0)

    if conversion_factor and conversion_factor > 0:
        gwp_per_kg = gwp_per_unit / conversion_factor
    else:
        # Assume declared unit is already per kg if no conversion factor
        gwp_per_kg = gwp_per_unit

    quantity_kg = quantity_tons * 1000.0
    return round(gwp_per_kg * quantity_kg, 4)


def _check_catalog(
    session: Session, gtin: str | None, nobb_number: str | None
) -> dict | None:
    """Check the material catalog for a cached product entry."""
    from app.models.material import Material

    material = None
    if gtin:
        material = session.query(Material).filter(Material.gtin == gtin).first()
    if material is None and nobb_number:
        material = (
            session.query(Material)
            .filter(Material.nobb_number == str(nobb_number))
            .first()
        )

    if material is None:
        return None

    logger.info(
        "Catalog hit for gtin=%s nobb=%s (material_id=%s)",
        gtin,
        nobb_number,
        material.id,
    )

    epd = None
    if material.has_epd:
        gwp_stages = {}
        if material.gwp_per_unit is not None:
            gwp_stages["a1_a3"] = {
                "total": float(material.gwp_per_unit),
                "fossil": None,
                "biogenic": None,
            }
        epd = {"epd_number": material.epd_id, "gwp_stages": gwp_stages}

    return {
        "nobb_number": material.nobb_number,
        "name": material.product_name,
        "product_group": material.product_group,
        "has_epd": material.has_epd,
        "epd": epd,
        "_from_catalog": True,
    }


def _enrich_product_item(item: dict, session: Session | None) -> None:
    """Enrich a line item that has GTIN or NOBB via NOBB API / catalog."""
    gtin = item.get("gtin")
    nobb_number = item.get("nobb_number")
    quantity_tons = item.get("quantity_tons") or 0.0

    # Check catalog first
    if session is not None:
        catalog_result = _check_catalog(session, gtin, nobb_number)
        if catalog_result is not None:
            epd = catalog_result.get("epd")
            co2_kg = _extract_c3c4_co2(epd, quantity_tons)
            item["enriched"] = True
            item["nobb_data"] = catalog_result
            item["co2_kg"] = co2_kg
            item["co2_source"] = "epd_c3c4" if co2_kg is not None else None
            item["flagged"] = co2_kg is None
            item["confidence"] = waste_confidence(
                has_emission_factor=co2_kg is not None
            )
            return

    # Fall through to NOBB API
    nobb_int = None
    if nobb_number:
        try:
            nobb_int = int(nobb_number)
        except (ValueError, TypeError):
            logger.warning("Invalid NOBB number '%s', skipping", nobb_number)

    try:
        result = lookup(gtin=gtin, nobb_number=nobb_int)
    except Exception:
        logger.warning(
            "NOBB API error for line %s (gtin=%s, nobb=%s)",
            item.get("line_number"),
            gtin,
            nobb_number,
            exc_info=True,
        )
        item["enriched"] = False
        item["flagged"] = True
        item["co2_kg"] = None
        item["co2_source"] = None
        item["confidence"] = waste_confidence(has_emission_factor=False)
        item["nobb_data"] = None
        return

    if result is None:
        item["enriched"] = False
        item["flagged"] = True
        item["co2_kg"] = None
        item["co2_source"] = None
        item["confidence"] = waste_confidence(has_emission_factor=False)
        item["nobb_data"] = None
    else:
        epd = result.get("epd")
        co2_kg = _extract_c3c4_co2(epd, quantity_tons)
        item["enriched"] = True
        item["nobb_data"] = result
        item["co2_kg"] = co2_kg
        item["co2_source"] = "epd_c3c4" if co2_kg is not None else None
        item["flagged"] = co2_kg is None
        item["confidence"] = waste_confidence(has_emission_factor=co2_kg is not None)


def _enrich_fraction_item(item: dict) -> None:
    """Enrich a line item using NS 9431 fraction code + generic factors."""
    fraction_code = item.get("fraction_code")
    quantity_tons = item.get("quantity_tons") or 0.0

    factor = NS9431_EMISSION_FACTORS.get(fraction_code) if fraction_code else None

    if factor is not None:
        co2_kg = round(quantity_tons * factor, 4)
        item["enriched"] = True
        item["co2_kg"] = co2_kg
        item["co2_source"] = "fraction_factor"
        item["flagged"] = False
        item["confidence"] = waste_confidence(has_emission_factor=True)
    else:
        item["enriched"] = False
        item["co2_kg"] = None
        item["co2_source"] = None
        item["flagged"] = True
        item["confidence"] = waste_confidence(has_emission_factor=False)

    item["nobb_data"] = None


def enrich_waste_report(parsed_report: dict, session: Session | None = None) -> dict:
    """Enrich parsed waste report line items with CO₂ data.

    Product-level items (GTIN/NOBB) are enriched via the NOBB API using
    C3/C4 GWP stages. Fraction-level items (NS 9431) use generic factors.

    Args:
        parsed_report: Output from waste_report_parser.parse_waste_report().
        session: Optional SQLAlchemy session for material catalog lookups.

    Returns:
        The same report dict with enrichment fields added to each line item.
    """
    for item in parsed_report.get("line_items", []):
        has_product_id = bool(item.get("gtin") or item.get("nobb_number"))

        if has_product_id:
            _enrich_product_item(item, session)
        else:
            _enrich_fraction_item(item)

    return parsed_report
