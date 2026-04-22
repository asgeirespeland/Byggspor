"""EHF (Electronic Handelsfaktura) XML generator.

Produces UBL 2.0 Invoice XML compliant with PEPPOL BIS Billing 3.0,
with BEAst Supply 4.0 AdditionalItemProperty extensions for CO2 data.

Usage::

    xml_bytes = generate_ehf(invoice, lines, supplier_info)

The detailed CO2 report service (MH13) is still under development.
This module is designed to consume InvoiceLine ORM objects or plain dicts
that match the same field names, so the caller can pass either real DB
records or stub data during development.
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from datetime import date, datetime
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models.generated_invoice import GeneratedInvoice
    from app.models.invoice_line import InvoiceLine

# ── UBL 2.0 namespaces ────────────────────────────────────────────────────────
_NS = {
    "": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
    "cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
    "cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
}
_INV = _NS[""]
_CAC = _NS["cac"]
_CBC = _NS["cbc"]

CUSTOMIZATION_ID = (
    "urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0"
)
PROFILE_ID = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0"

# Norwegian standard VAT rate
VAT_RATE = 0.25

# BEAst Supply 4.0 / IPNC standardised property names (invoice level: Name + Value only)
_IPNC_EPD_NUMBER        = "EPDNumber"           # IPNC: EPD registration number
_IPNC_GWP_A1            = "GWP-GHG_A1-3_vA1"   # IPNC: combined A1-A3 GWP per declared unit (kg CO₂e)

# Byggspor extensions — Byggspor_ prefix avoids future IPNC collisions
_BS_TOTAL_CO2           = "Byggspor_TotalCO2"       # Line total CO2 (kg CO₂e, all units)
_BS_TRANSPORT_CO2       = "Byggspor_TransportCO2"   # Transport line total CO2
_BS_WASTE_CO2           = "Byggspor_WasteCO2"       # Waste line total CO2
_BS_ENERGY_CO2          = "Byggspor_EnergyCO2"      # Energy line total CO2
_BS_CONFIDENCE          = "Byggspor_ConfidenceScore" # Data quality score (0–100)


# ── Internal helpers ───────────────────────────────────────────────────────────


def _sub(parent: ET.Element, tag: str, text: str | None = None) -> ET.Element:
    el = ET.SubElement(parent, tag)
    if text is not None:
        el.text = str(text)
    return el


def _fmt_date(d: date | datetime | str | None) -> str:
    if d is None:
        return date.today().isoformat()
    if isinstance(d, datetime):
        return d.date().isoformat()
    if isinstance(d, date):
        return d.isoformat()
    return str(d)


def _get(obj: Any, attr: str, default: Any = None) -> Any:
    """Attribute or dict-key access, whichever applies."""
    if isinstance(obj, dict):
        return obj.get(attr, default)
    return getattr(obj, attr, default)


def _amt(value: Any, currency: str = "NOK") -> ET.Element:
    """Create an amount element (caller must attach to parent)."""
    el = ET.Element("Amount")
    el.set("currencyID", currency)
    el.text = f"{float(value or 0):.2f}"
    return el


# ── Supplier info ──────────────────────────────────────────────────────────────


def _build_party(
    parent: ET.Element,
    tag: str,
    name: str | None,
    org_number: str | None,
    address: str | None,
    email: str | None = None,
) -> None:
    party_wrap = _sub(parent, f"{{{_CAC}}}{tag}")
    party = _sub(party_wrap, f"{{{_CAC}}}Party")

    if org_number:
        party_id = _sub(party, f"{{{_CAC}}}PartyIdentification")
        _sub(party_id, f"{{{_CBC}}}ID", org_number)

    if name:
        party_name = _sub(party, f"{{{_CAC}}}PartyName")
        _sub(party_name, f"{{{_CBC}}}Name", name)

    if address:
        postal = _sub(party, f"{{{_CAC}}}PostalAddress")
        _sub(postal, f"{{{_CBC}}}StreetName", address)
        _sub(postal, f"{{{_CBC}}}CountrySubentity", "NO")
        country = _sub(postal, f"{{{_CAC}}}Country")
        _sub(country, f"{{{_CBC}}}IdentificationCode", "NO")

    if org_number:
        tax_scheme = _sub(party, f"{{{_CAC}}}PartyTaxScheme")
        _sub(tax_scheme, f"{{{_CBC}}}CompanyID", f"NO{org_number}MVA")
        scheme = _sub(tax_scheme, f"{{{_CAC}}}TaxScheme")
        _sub(scheme, f"{{{_CBC}}}ID", "VAT")

    legal = _sub(party, f"{{{_CAC}}}PartyLegalEntity")
    _sub(legal, f"{{{_CBC}}}RegistrationName", name or "")
    if org_number:
        _sub(legal, f"{{{_CBC}}}CompanyID", org_number)

    if email:
        contact = _sub(party, f"{{{_CAC}}}Contact")
        _sub(contact, f"{{{_CBC}}}ElectronicMail", email)


# ── BEAst CO2 AdditionalItemProperty elements ─────────────────────────────────


def _beast_property(item_el: ET.Element, name: str, value: str) -> None:
    prop = _sub(item_el, f"{{{_CAC}}}AdditionalItemProperty")
    _sub(prop, f"{{{_CBC}}}Name", name)
    _sub(prop, f"{{{_CBC}}}Value", value)


def _attach_co2_properties(item_el: ET.Element, line: Any) -> None:
    """Attach BEAst Supply 4.0 AdditionalItemProperty elements.

    Materials use IPNC-standardised codes (EPDNumber, GWP-GHG_A1-3_vA1).
    Transport, waste, and energy use Byggspor_ prefixed extensions because
    BEAst Supply 4.0 does not define invoice-level fields for those categories.
    """
    category = _get(line, "category")
    cat_val = (category.value if hasattr(category, "value") else str(category or "")).lower()
    co2_kg = _get(line, "total_co2_kg")
    confidence = _get(line, "confidence_score")

    if cat_val == "material":
        epd_id = _get(line, "epd_id")
        if epd_id:
            _beast_property(item_el, _IPNC_EPD_NUMBER, str(epd_id))

        if co2_kg is not None:
            qty = float(_get(line, "quantity") or 1) or 1
            gwp_per_unit = float(co2_kg) / qty
            _beast_property(item_el, _IPNC_GWP_A1, f"{gwp_per_unit:.6f}")
            _beast_property(item_el, _BS_TOTAL_CO2, f"{float(co2_kg):.4f}")

    elif cat_val == "transport":
        if co2_kg is not None:
            _beast_property(item_el, _BS_TRANSPORT_CO2, f"{float(co2_kg):.4f}")

    elif cat_val == "waste":
        if co2_kg is not None:
            _beast_property(item_el, _BS_WASTE_CO2, f"{float(co2_kg):.4f}")

    elif cat_val == "energy":
        if co2_kg is not None:
            _beast_property(item_el, _BS_ENERGY_CO2, f"{float(co2_kg):.4f}")

    if confidence is not None:
        _beast_property(item_el, _BS_CONFIDENCE, str(confidence))


# ── Main generator ─────────────────────────────────────────────────────────────


def generate_ehf(
    invoice: GeneratedInvoice | dict,
    lines: list[InvoiceLine | dict],
    supplier_info: dict | None = None,
) -> bytes:
    """Generate a UBL 2.0 EHF invoice XML document.

    Args:
        invoice: A GeneratedInvoice ORM object or dict with the same fields.
        lines: List of InvoiceLine ORM objects or dicts.
        supplier_info: Optional dict with keys: name, org_number, address, email.
                       If omitted, placeholders are used (fill from org settings later).

    Returns:
        UTF-8 encoded XML bytes.
    """
    # Register namespaces so ET uses the short prefixes in output
    for prefix, uri in _NS.items():
        ET.register_namespace(prefix, uri)

    root = ET.Element(f"{{{_INV}}}Invoice")

    # ── Header ────────────────────────────────────────────────────────────────
    _sub(root, f"{{{_CBC}}}CustomizationID", CUSTOMIZATION_ID)
    _sub(root, f"{{{_CBC}}}ProfileID", PROFILE_ID)
    _sub(root, f"{{{_CBC}}}ID", _get(invoice, "invoice_number") or "DRAFT")
    _sub(root, f"{{{_CBC}}}IssueDate", _fmt_date(_get(invoice, "generated_at")))
    _sub(root, f"{{{_CBC}}}DueDate", _fmt_date(_get(invoice, "due_date")))
    _sub(root, f"{{{_CBC}}}InvoiceTypeCode", "380")  # 380 = Commercial invoice
    _sub(root, f"{{{_CBC}}}DocumentCurrencyCode", "NOK")

    our_ref = _get(invoice, "our_reference")
    if our_ref:
        _sub(root, f"{{{_CBC}}}BuyerReference", our_ref)

    their_ref = _get(invoice, "their_reference")
    if their_ref:
        order_ref = _sub(root, f"{{{_CAC}}}OrderReference")
        _sub(order_ref, f"{{{_CBC}}}ID", their_ref)

    # ── Supplier (AccountingSupplierParty) ────────────────────────────────────
    sup = supplier_info or {}
    _build_party(
        root,
        "AccountingSupplierParty",
        name=sup.get("name", "[Supplier Name]"),
        org_number=sup.get("org_number"),
        address=sup.get("address"),
        email=sup.get("email"),
    )

    # ── Customer (AccountingCustomerParty) ────────────────────────────────────
    _build_party(
        root,
        "AccountingCustomerParty",
        name=_get(invoice, "customer_name"),
        org_number=_get(invoice, "customer_org_number"),
        address=_get(invoice, "customer_address"),
        email=_get(invoice, "customer_email"),
    )

    # ── Payment means (bank transfer) ─────────────────────────────────────────
    bank_account = _get(invoice, "bank_account")
    if bank_account:
        pm = _sub(root, f"{{{_CAC}}}PaymentMeans")
        _sub(pm, f"{{{_CBC}}}PaymentMeansCode", "30")  # 30 = Credit transfer
        _sub(pm, f"{{{_CBC}}}PaymentDueDate", _fmt_date(_get(invoice, "due_date")))
        payee = _sub(pm, f"{{{_CAC}}}PayeeFinancialAccount")
        _sub(payee, f"{{{_CBC}}}ID", bank_account)

    # ── Compute line totals ───────────────────────────────────────────────────
    subtotal = sum(float(_get(ln, "line_total_kr") or 0) for ln in lines)
    vat_amount = round(subtotal * VAT_RATE, 2)
    grand_total = round(subtotal + vat_amount, 2)

    # ── Tax total (MVA 25%) ───────────────────────────────────────────────────
    tax_total = _sub(root, f"{{{_CAC}}}TaxTotal")
    tax_amt = _sub(tax_total, f"{{{_CBC}}}TaxAmount")
    tax_amt.set("currencyID", "NOK")
    tax_amt.text = f"{vat_amount:.2f}"

    tax_subtotal = _sub(tax_total, f"{{{_CAC}}}TaxSubtotal")
    taxable_amt = _sub(tax_subtotal, f"{{{_CBC}}}TaxableAmount")
    taxable_amt.set("currencyID", "NOK")
    taxable_amt.text = f"{subtotal:.2f}"
    subtotal_tax_amt = _sub(tax_subtotal, f"{{{_CBC}}}TaxAmount")
    subtotal_tax_amt.set("currencyID", "NOK")
    subtotal_tax_amt.text = f"{vat_amount:.2f}"
    tax_cat = _sub(tax_subtotal, f"{{{_CAC}}}TaxCategory")
    _sub(tax_cat, f"{{{_CBC}}}ID", "S")
    _sub(tax_cat, f"{{{_CBC}}}Percent", "25")
    tax_scheme = _sub(tax_cat, f"{{{_CAC}}}TaxScheme")
    _sub(tax_scheme, f"{{{_CBC}}}ID", "VAT")

    # ── Legal monetary total ──────────────────────────────────────────────────
    lmt = _sub(root, f"{{{_CAC}}}LegalMonetaryTotal")
    for tag, val in [
        ("LineExtensionAmount", subtotal),
        ("TaxExclusiveAmount", subtotal),
        ("TaxInclusiveAmount", grand_total),
        ("PayableAmount", grand_total),
    ]:
        el = _sub(lmt, f"{{{_CBC}}}{tag}")
        el.set("currencyID", "NOK")
        el.text = f"{val:.2f}"

    # ── Invoice lines ─────────────────────────────────────────────────────────
    for idx, line in enumerate(lines, start=1):
        line_el = _sub(root, f"{{{_CAC}}}InvoiceLine")
        _sub(line_el, f"{{{_CBC}}}ID", str(idx))

        qty = _get(line, "quantity") or 1
        unit = _get(line, "unit") or "EA"
        qty_el = _sub(line_el, f"{{{_CBC}}}InvoicedQuantity", str(qty))
        qty_el.set("unitCode", unit)

        line_total = _get(line, "line_total_kr") or 0
        ext_amt = _sub(line_el, f"{{{_CBC}}}LineExtensionAmount")
        ext_amt.set("currencyID", "NOK")
        ext_amt.text = f"{float(line_total):.2f}"

        # Line-level tax (reference to summary category)
        line_tax = _sub(line_el, f"{{{_CAC}}}TaxTotal")
        vat_rate_val = float(_get(line, "vat_rate") or VAT_RATE)
        line_vat = round(float(line_total) * vat_rate_val, 2)
        line_tax_amt = _sub(line_tax, f"{{{_CBC}}}TaxAmount")
        line_tax_amt.set("currencyID", "NOK")
        line_tax_amt.text = f"{line_vat:.2f}"

        # Price
        price_el = _sub(line_el, f"{{{_CAC}}}Price")
        unit_price = _get(line, "unit_price_kr") or 0
        price_amt = _sub(price_el, f"{{{_CBC}}}PriceAmount")
        price_amt.set("currencyID", "NOK")
        price_amt.text = f"{float(unit_price):.2f}"

        # Item
        item_el = _sub(line_el, f"{{{_CAC}}}Item")
        description = _get(line, "description") or ""
        _sub(item_el, f"{{{_CBC}}}Description", description)
        _sub(item_el, f"{{{_CBC}}}Name", description[:100])

        # BEAst Supply 4.0 CO2 extensions
        _attach_co2_properties(item_el, line)

        # Item tax category (required by EN16931)
        classified = _sub(item_el, f"{{{_CAC}}}ClassifiedTaxCategory")
        _sub(classified, f"{{{_CBC}}}ID", "S")
        _sub(classified, f"{{{_CBC}}}Percent", str(int(vat_rate_val * 100)))
        item_tax_scheme = _sub(classified, f"{{{_CAC}}}TaxScheme")
        _sub(item_tax_scheme, f"{{{_CBC}}}ID", "VAT")

    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ")
    import io

    buf = io.BytesIO()
    tree.write(buf, xml_declaration=True, encoding="UTF-8")
    return buf.getvalue()
