"""Invoice enrichment service.

Takes a parsed EHF invoice (from ehf_parser) and enriches each line item
with product data from the NOBB API. For each item that has a GTIN or NOBB
number, the service looks up the product to get name, product group, EPD
status, and GWP data.

When a DB session is provided, the material catalog table is checked first
to avoid redundant API calls. Items already in the catalog are served from
the DB; only cache misses hit the NOBB API.

Each line item gets three fields added:
  - enriched (bool): whether product data was found
  - flagged (bool): whether the item needs attention (missing ID or no match)
  - nobb_data (dict|None): the product data including EPD/GWP if available
"""

import logging

from sqlalchemy.orm import Session

from app.services.nobb_client import lookup

logger = logging.getLogger(__name__)


def _check_catalog(
    session: Session, gtin: str | None, nobb_number: str | None
) -> dict | None:
    """Check the material catalog for a cached product entry.

    Returns a dict mimicking NOBB API response format, or None if not found.
    """
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

    # Reconstruct EPD response from stored fields
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
        "_catalog_material_id": material.id,
    }


def enrich_invoice(parsed_invoice: dict, session: Session | None = None) -> dict:
    """Enrich parsed invoice line items with NOBB product data and EPD.

    When a session is provided, checks the material catalog DB first.
    Only calls the NOBB API for items not found in the catalog.

    Args:
        parsed_invoice: Output from ehf_parser.parse_invoice().
        session: Optional SQLAlchemy session for catalog lookups.

    Returns:
        The same invoice dict with enrichment fields added to each line item.
    """
    for item in parsed_invoice.get("line_items", []):
        gtin = item.get("gtin")
        nobb_number = item.get("nobb_number")

        if not gtin and not nobb_number:
            item["enriched"] = False
            item["flagged"] = True
            item["nobb_data"] = None
            continue

        # Check catalog first if session is available
        if session is not None:
            catalog_result = _check_catalog(session, gtin, nobb_number)
            if catalog_result is not None:
                item["enriched"] = True
                # Flag if catalog entry lacks GWP data
                has_gwp = False
                epd = catalog_result.get("epd")
                if epd:
                    stages = epd.get("gwp_stages", {})
                    a1a3 = stages.get("a1_a3") or stages.get("A1-A3")
                    has_gwp = isinstance(a1a3, dict) and a1a3.get("total") is not None
                item["flagged"] = not has_gwp
                item["nobb_data"] = catalog_result
                continue

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
            item["nobb_data"] = None
            continue

        if result is None:
            item["enriched"] = False
            item["flagged"] = True
            item["nobb_data"] = None
        else:
            item["enriched"] = True
            # Flag items missing EPD — we can't compute CO₂ without GWP data
            has_gwp = False
            epd = result.get("epd")
            if epd:
                stages = epd.get("gwp_stages", {})
                a1a3 = stages.get("a1_a3") or stages.get("A1-A3")
                has_gwp = isinstance(a1a3, dict) and a1a3.get("total") is not None
            item["flagged"] = not has_gwp
            item["nobb_data"] = result

    return parsed_invoice
