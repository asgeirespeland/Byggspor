"""EHF invoice XML parser.

Parses EHF (Elektronisk Handelsformat) invoices following the UBL 2.0 /
PEPPOL BIS standard. Extracts invoice metadata (number, date, currency),
supplier and buyer party info, and individual line items with product
identifiers (GTIN from StandardItemIdentification, NOBB number from
AdditionalItemProperty).

Supports both standard EHF schemeID="GTIN" and BEAst Supply 4.0
schemeID="0160" for GTIN identification.

This parser is stateless and does no enrichment or DB writes. It returns
a plain dict that can be passed to invoice_enrichment.enrich_invoice().
"""

import logging
import xml.etree.ElementTree as ET

logger = logging.getLogger(__name__)

NS = {
    "inv": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
    "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
}

GTIN_SCHEME_IDS = {"GTIN", "0160"}


def _text(element, xpath):
    """Get text content of a child element, or None if not found."""
    el = element.find(xpath, NS)
    return el.text.strip() if el is not None and el.text else None


def _parse_party(element):
    """Extract party info (supplier or buyer) from an AccountingParty element."""
    party = element.find("cac:Party", NS)
    if party is None:
        return None

    name = _text(party, "cac:PartyName/cbc:Name")
    legal_name = _text(party, "cac:PartyLegalEntity/cbc:RegistrationName")
    org_number = None

    company_id_el = party.find("cac:PartyLegalEntity/cbc:CompanyID", NS)
    if company_id_el is not None:
        scheme = company_id_el.get("schemeID", "") or company_id_el.get(
            "schemeAgencyID", ""
        )
        if "ORGNR" in scheme.upper():
            org_number = company_id_el.text

    address = party.find("cac:PostalAddress", NS)
    address_info = None
    if address is not None:
        address_info = {
            "street": _text(address, "cbc:StreetName"),
            "city": _text(address, "cbc:CityName"),
            "postal_zone": _text(address, "cbc:PostalZone"),
            "country": _text(address, "cac:Country/cbc:IdentificationCode"),
        }

    return {
        "name": name or legal_name,
        "legal_name": legal_name,
        "org_number": org_number,
        "address": address_info,
    }


def _parse_line_item(line_el):
    """Extract data from a single InvoiceLine element."""
    line_id = _text(line_el, "cbc:ID")

    quantity_el = line_el.find("cbc:InvoicedQuantity", NS)
    quantity = None
    unit = None
    if quantity_el is not None:
        try:
            quantity = float(quantity_el.text)
        except (ValueError, TypeError):
            pass
        unit = quantity_el.get("unitCode")

    line_total = _text(line_el, "cbc:LineExtensionAmount")
    if line_total is not None:
        try:
            line_total = float(line_total)
        except (ValueError, TypeError):
            pass

    item_el = line_el.find("cac:Item", NS)
    name = _text(item_el, "cbc:Name") if item_el is not None else None

    seller_id = None
    gtin = None
    nobb_number = None

    if item_el is not None:
        seller_id = _text(item_el, "cac:SellersItemIdentification/cbc:ID")

        std_id_el = item_el.find("cac:StandardItemIdentification/cbc:ID", NS)
        if std_id_el is not None:
            scheme_id = std_id_el.get("schemeID", "")
            if scheme_id in GTIN_SCHEME_IDS:
                gtin = std_id_el.text.strip() if std_id_el.text else None

        for prop in item_el.findall("cac:AdditionalItemProperty", NS):
            prop_name = _text(prop, "cbc:Name")
            if prop_name and "nobb" in prop_name.lower():
                nobb_number = _text(prop, "cbc:Value")
                break

    price = _text(line_el, "cac:Price/cbc:PriceAmount")
    if price is not None:
        try:
            price = float(price)
        except (ValueError, TypeError):
            pass

    flagged = not gtin and not nobb_number

    return {
        "line_number": line_id,
        "name": name,
        "seller_item_id": seller_id,
        "gtin": gtin,
        "nobb_number": nobb_number,
        "quantity": quantity,
        "unit": unit,
        "price_per_unit": price,
        "line_total": line_total,
        "flagged": flagged,
    }


def validate_ehf_root(root: ET.Element) -> None:
    """Check that the XML root looks like a UBL Invoice.

    Raises:
        ValueError: If the document is not a recognized EHF/UBL invoice.
    """
    tag = root.tag
    # Accept UBL Invoice namespace or plain <Invoice> tag
    if "Invoice" not in tag:
        raise ValueError(
            f"Forventet EHF-faktura (UBL Invoice), "
            f"men fant rotelementet «{tag.split('}')[-1]}»."
        )


def parse_invoice(xml_content: str | bytes) -> dict:
    """Parse an EHF/UBL 2.0 invoice XML and return structured data.

    Args:
        xml_content: Raw XML as string or bytes.

    Returns:
        Dict with invoice metadata, supplier, buyer, and line_items.

    Raises:
        ET.ParseError: If the XML is malformed.
        ValueError: If the XML is not a recognized EHF invoice.
    """
    root = ET.fromstring(xml_content)
    validate_ehf_root(root)

    invoice_number = _text(root, "cbc:ID")
    issue_date = _text(root, "cbc:IssueDate")
    currency = _text(root, "cbc:DocumentCurrencyCode")

    supplier_el = root.find("cac:AccountingSupplierParty", NS)
    supplier = _parse_party(supplier_el) if supplier_el is not None else None

    buyer_el = root.find("cac:AccountingCustomerParty", NS)
    buyer = _parse_party(buyer_el) if buyer_el is not None else None

    line_items = []
    for line_el in root.findall("cac:InvoiceLine", NS):
        line_items.append(_parse_line_item(line_el))

    return {
        "invoice_number": invoice_number,
        "issue_date": issue_date,
        "currency": currency,
        "supplier": supplier,
        "buyer": buyer,
        "line_items": line_items,
    }
