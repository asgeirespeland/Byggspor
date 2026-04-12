"""Waste report XML parser.

Parses byggspor waste report XML documents. The format mirrors EHF/UBL
structure but is stripped to waste-relevant fields: receiver party, and
line items with product identifiers (GTIN, NOBB) or NS 9431 fraction codes.

Each line item is identified in one of three ways (checked in order):
  1. GTIN from StandardItemIdentification (schemeID="GTIN" or "0160")
  2. NOBB number from AdditionalItemProperty
  3. NS 9431 waste fraction code from WasteFraction

Items with GTIN/NOBB will be enriched via the NOBB API (C3/C4 GWP stages).
Items with only a fraction code fall back to generic emission factors.
Items with no identifier at all are flagged for manual review.

This parser is stateless — no enrichment, no DB writes. It returns a plain
dict that can be passed to waste_enrichment.enrich_waste_report().
"""

import logging
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)

NS = {
    "wr": "urn:byggspor:waste:report:1.0",
    "cbc": "urn:byggspor:waste:CommonBasic:1.0",
    "cac": "urn:byggspor:waste:CommonAggregate:1.0",
}

GTIN_SCHEME_IDS = {"GTIN", "0160"}


def _text(element, xpath):
    """Get text content of a child element, or None if not found."""
    el = element.find(xpath, NS)
    return el.text.strip() if el is not None and el.text else None


def _parse_receiver_party(element):
    """Extract waste receiver party info."""
    party = element.find("cac:Party", NS)
    if party is None:
        return None

    name = _text(party, "cac:PartyName/cbc:Name")
    return {"name": name}


def _parse_quantity(line_el):
    """Extract quantity and unit from a WasteLine element."""
    qty_el = line_el.find("cbc:Quantity", NS)
    if qty_el is None:
        return None, None

    quantity = None
    unit = qty_el.get("unitCode")
    if qty_el.text:
        try:
            quantity = float(qty_el.text)
        except (ValueError, TypeError):
            pass

    return quantity, unit


def _normalize_quantity_to_tons(quantity, unit):
    """Convert quantity to tonnes for consistent storage."""
    if quantity is None:
        return None

    unit_upper = (unit or "").upper()
    if unit_upper == "TON":
        return quantity
    if unit_upper == "KG":
        return round(quantity / 1000.0, 6)
    # Unknown unit — return as-is, flag for review
    return quantity


def _parse_waste_line(line_el):
    """Extract data from a single WasteLine element."""
    line_id = _text(line_el, "cbc:ID")

    quantity, unit = _parse_quantity(line_el)
    quantity_tons = _normalize_quantity_to_tons(quantity, unit)

    item_el = line_el.find("cac:Item", NS)
    name = _text(item_el, "cbc:Name") if item_el is not None else None

    gtin = None
    nobb_number = None
    fraction_code = None

    if item_el is not None:
        # 1. Check for GTIN
        std_id_el = item_el.find("cac:StandardItemIdentification/cbc:ID", NS)
        if std_id_el is not None:
            scheme_id = std_id_el.get("schemeID", "")
            if scheme_id in GTIN_SCHEME_IDS:
                gtin = std_id_el.text.strip() if std_id_el.text else None

        # 2. Check for NOBB number
        for prop in item_el.findall("cac:AdditionalItemProperty", NS):
            prop_name = _text(prop, "cbc:Name")
            if prop_name and "nobb" in prop_name.lower():
                nobb_number = _text(prop, "cbc:Value")
                break

        # 3. Check for NS 9431 waste fraction code
        fraction_el = item_el.find("cac:WasteFraction/cbc:ID", NS)
        if fraction_el is not None:
            fraction_code = fraction_el.text.strip() if fraction_el.text else None

    has_product_id = bool(gtin or nobb_number)
    flagged = not has_product_id and not fraction_code

    return {
        "line_number": line_id,
        "name": name,
        "gtin": gtin,
        "nobb_number": nobb_number,
        "fraction_code": fraction_code,
        "quantity": quantity,
        "unit": unit,
        "quantity_tons": quantity_tons,
        "flagged": flagged,
    }


def validate_waste_report_root(root: ET.Element) -> None:
    """Check that the XML root looks like a WasteReport.

    Raises:
        ValueError: If the document is not a recognized waste report.
    """
    tag = root.tag
    if "WasteReport" not in tag:
        raise ValueError(
            f"Forventet avfallsrapport (WasteReport), "
            f"men fant rotelementet «{tag.split('}')[-1]}»."
        )


def parse_waste_report(xml_content: str | bytes) -> dict:
    """Parse a waste report XML and return structured data.

    Args:
        xml_content: Raw XML as string or bytes.

    Returns:
        Dict with report metadata, receiver, and line_items.

    Raises:
        ET.ParseError: If the XML is malformed.
        ValueError: If the XML is not a recognized waste report.
    """
    root = ET.fromstring(xml_content)
    validate_waste_report_root(root)

    report_id = _text(root, "cbc:ID")
    issue_date = _text(root, "cbc:IssueDate")

    receiver_el = root.find("cac:WasteReceiverParty", NS)
    receiver = _parse_receiver_party(receiver_el) if receiver_el is not None else None

    line_items = []
    for line_el in root.findall("cac:WasteLine", NS):
        line_items.append(_parse_waste_line(line_el))

    return {
        "report_id": report_id,
        "issue_date": issue_date,
        "receiver": receiver,
        "line_items": line_items,
    }
