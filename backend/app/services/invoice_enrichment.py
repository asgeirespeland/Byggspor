import logging

from app.services.nobb_client import lookup

logger = logging.getLogger(__name__)


def enrich_invoice(parsed_invoice: dict) -> dict:
    """Enrich parsed invoice line items with NOBB product data and EPD.

    For each line item with a GTIN or NOBB number, calls the NOBB API
    to fetch product details. Items without identifiers or without
    matches are flagged.

    Args:
        parsed_invoice: Output from ehf_parser.parse_invoice().

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
            item["flagged"] = False
            item["nobb_data"] = result

    return parsed_invoice
