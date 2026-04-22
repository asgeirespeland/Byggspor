"""Unit tests for the EHF/UBL 2.0 XML generator.

No database or Flask context required — the generator is a pure function.
"""

import xml.etree.ElementTree as ET
from datetime import date

import pytest

from app.services.ehf_generator import generate_ehf

# UBL namespace shortcuts for assertion helpers
_CAC = "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
_CBC = "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
_INV = "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"


def _parse(xml_bytes: bytes) -> ET.Element:
    return ET.fromstring(xml_bytes)


def _text(root: ET.Element, *path: str) -> str | None:
    """Walk tag path and return .text of the last element, or None."""
    el = root
    for tag in path:
        el = el.find(f"{{{_CBC}}}{tag}") or el.find(f"{{{_CAC}}}{tag}")
        if el is None:
            return None
    return el.text


def _find(root: ET.Element, *path: str) -> ET.Element | None:
    el = root
    for tag in path:
        el = el.find(f"{{{_CBC}}}{tag}") or el.find(f"{{{_CAC}}}{tag}")
        if el is None:
            return None
    return el


# ── Minimal invoice / line dicts (dicts work the same as ORM objects) ─────────

INVOICE = {
    "invoice_number": "INV-TEST-001",
    "generated_at": date(2026, 4, 15),
    "due_date": date(2026, 5, 15),
    "our_reference": "Prosjekt-42",
    "their_reference": "PO-9900",
    "bank_account": "12345678901",
    "customer_name": "Byggkunde AS",
    "customer_org_number": "987654321",
    "customer_address": "Testveien 1, 0001 Oslo",
    "customer_email": "kunde@example.com",
}

LINE_MATERIAL = {
    "category": type("Cat", (), {"value": "material"})(),
    "description": "Betongblokk 20x20x40",
    "quantity": 100.0,
    "unit": "STK",
    "unit_price_kr": 25.0,
    "vat_rate": 0.25,
    "line_total_kr": 2500.0,
    "total_co2_kg": 350.0,
    "confidence_score": 85,
    "epd_id": "EPD-NOR-12345",
}

LINE_ENERGY = {
    "category": type("Cat", (), {"value": "energy"})(),
    "description": "Energiforbruk NO3",
    "quantity": 500.0,
    "unit": "KWH",
    "unit_price_kr": 1.2,
    "vat_rate": 0.25,
    "line_total_kr": 600.0,
    "total_co2_kg": 5.95,
    "confidence_score": 90,
    "epd_id": None,
}

LINE_MATERIAL_NO_CO2 = {
    **LINE_MATERIAL,
    "total_co2_kg": None,
    "confidence_score": None,
    "epd_id": None,
}


# ── Tests ─────────────────────────────────────────────────────────────────────


class TestGenerateEhfStructure:
    def test_returns_bytes(self):
        xml_bytes = generate_ehf(INVOICE, [LINE_MATERIAL])
        assert isinstance(xml_bytes, bytes)

    def test_is_valid_xml(self):
        xml_bytes = generate_ehf(INVOICE, [LINE_MATERIAL])
        root = _parse(xml_bytes)  # raises if invalid
        assert root is not None

    def test_root_element_is_invoice(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        assert root.tag == f"{{{_INV}}}Invoice"

    def test_customization_id_present(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        el = root.find(f"{{{_CBC}}}CustomizationID")
        assert el is not None
        assert "peppol" in el.text

    def test_invoice_number_in_id_element(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        el = root.find(f"{{{_CBC}}}ID")
        assert el.text == "INV-TEST-001"

    def test_draft_fallback_when_no_invoice_number(self):
        inv = {**INVOICE, "invoice_number": None}
        root = _parse(generate_ehf(inv, [LINE_MATERIAL]))
        assert root.find(f"{{{_CBC}}}ID").text == "DRAFT"

    def test_issue_date_from_generated_at(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        el = root.find(f"{{{_CBC}}}IssueDate")
        assert el.text == "2026-04-15"

    def test_due_date_element_present(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        el = root.find(f"{{{_CBC}}}DueDate")
        assert el.text == "2026-05-15"

    def test_currency_is_nok(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        el = root.find(f"{{{_CBC}}}DocumentCurrencyCode")
        assert el.text == "NOK"

    def test_invoice_type_code_is_380(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        el = root.find(f"{{{_CBC}}}InvoiceTypeCode")
        assert el.text == "380"


class TestGenerateEhfParties:
    def test_supplier_party_present(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        el = root.find(f"{{{_CAC}}}AccountingSupplierParty")
        assert el is not None

    def test_customer_party_present(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        el = root.find(f"{{{_CAC}}}AccountingCustomerParty")
        assert el is not None

    def test_customer_name_in_xml(self):
        xml_bytes = generate_ehf(INVOICE, [LINE_MATERIAL])
        assert b"Byggkunde AS" in xml_bytes

    def test_customer_org_number_in_xml(self):
        xml_bytes = generate_ehf(INVOICE, [LINE_MATERIAL])
        assert b"987654321" in xml_bytes

    def test_custom_supplier_name_used(self):
        xml_bytes = generate_ehf(
            INVOICE,
            [LINE_MATERIAL],
            supplier_info={"name": "Mitt Firma AS", "org_number": "111222333"},
        )
        assert b"Mitt Firma AS" in xml_bytes

    def test_payment_means_present_when_bank_account_set(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        pm = root.find(f"{{{_CAC}}}PaymentMeans")
        assert pm is not None
        account = pm.find(f"{{{_CAC}}}PayeeFinancialAccount")
        assert account is not None
        assert account.find(f"{{{_CBC}}}ID").text == "12345678901"


class TestGenerateEhfTotals:
    def test_vat_total_is_25_percent_of_subtotal(self):
        # LINE_MATERIAL line_total_kr = 2500 → VAT = 625
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        tax_total = root.find(f"{{{_CAC}}}TaxTotal")
        tax_amt = tax_total.find(f"{{{_CBC}}}TaxAmount")
        assert float(tax_amt.text) == pytest.approx(625.0)

    def test_grand_total_includes_vat(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        lmt = root.find(f"{{{_CAC}}}LegalMonetaryTotal")
        payable = lmt.find(f"{{{_CBC}}}PayableAmount")
        assert float(payable.text) == pytest.approx(3125.0)

    def test_multiple_lines_summed_correctly(self):
        # 2500 + 600 = 3100 subtotal → VAT 775 → grand 3875
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL, LINE_ENERGY]))
        lmt = root.find(f"{{{_CAC}}}LegalMonetaryTotal")
        payable = lmt.find(f"{{{_CBC}}}PayableAmount")
        assert float(payable.text) == pytest.approx(3875.0)

    def test_empty_lines_produces_zero_totals(self):
        root = _parse(generate_ehf(INVOICE, []))
        lmt = root.find(f"{{{_CAC}}}LegalMonetaryTotal")
        payable = lmt.find(f"{{{_CBC}}}PayableAmount")
        assert float(payable.text) == pytest.approx(0.0)


class TestGenerateEhfInvoiceLines:
    def test_one_invoice_line_per_input(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL, LINE_ENERGY]))
        lines = root.findall(f"{{{_CAC}}}InvoiceLine")
        assert len(lines) == 2

    def test_line_description_in_xml(self):
        xml_bytes = generate_ehf(INVOICE, [LINE_MATERIAL])
        assert b"Betongblokk 20x20x40" in xml_bytes

    def test_line_quantity_and_unit(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        line = root.find(f"{{{_CAC}}}InvoiceLine")
        qty = line.find(f"{{{_CBC}}}InvoicedQuantity")
        assert float(qty.text) == pytest.approx(100.0)
        assert qty.get("unitCode") == "STK"

    def test_line_extension_amount(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        line = root.find(f"{{{_CAC}}}InvoiceLine")
        ext = line.find(f"{{{_CBC}}}LineExtensionAmount")
        assert float(ext.text) == pytest.approx(2500.0)


class TestBeastCo2Extensions:
    def test_co2_equivalent_property_present(self):
        xml_bytes = generate_ehf(INVOICE, [LINE_MATERIAL])
        assert b"Byggspor_TotalCO2" in xml_bytes

    def test_co2_equivalent_value(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        line = root.find(f"{{{_CAC}}}InvoiceLine")
        item = line.find(f"{{{_CAC}}}Item")
        props = item.findall(f"{{{_CAC}}}AdditionalItemProperty")
        prop_map = {
            p.find(f"{{{_CBC}}}Name").text: p.find(f"{{{_CBC}}}Value").text
            for p in props
        }
        assert float(prop_map["Byggspor_TotalCO2"]) == pytest.approx(350.0)

    def test_gwp_per_unit_property(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        line = root.find(f"{{{_CAC}}}InvoiceLine")
        item = line.find(f"{{{_CAC}}}Item")
        props = item.findall(f"{{{_CAC}}}AdditionalItemProperty")
        prop_map = {
            p.find(f"{{{_CBC}}}Name").text: p.find(f"{{{_CBC}}}Value").text
            for p in props
        }
        # GWP per declared unit = total_co2_kg / quantity = 350.0 / 100.0
        assert float(prop_map["GWP-GHG_A1-3_vA1"]) == pytest.approx(3.5)

    def test_co2_confidence_score_property(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        line = root.find(f"{{{_CAC}}}InvoiceLine")
        item = line.find(f"{{{_CAC}}}Item")
        props = item.findall(f"{{{_CAC}}}AdditionalItemProperty")
        prop_map = {
            p.find(f"{{{_CBC}}}Name").text: p.find(f"{{{_CBC}}}Value").text
            for p in props
        }
        assert prop_map["Byggspor_ConfidenceScore"] == "85"

    def test_epd_id_property_present_when_set(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL]))
        line = root.find(f"{{{_CAC}}}InvoiceLine")
        item = line.find(f"{{{_CAC}}}Item")
        props = item.findall(f"{{{_CAC}}}AdditionalItemProperty")
        prop_map = {
            p.find(f"{{{_CBC}}}Name").text: p.find(f"{{{_CBC}}}Value").text
            for p in props
        }
        assert prop_map["EPDNumber"] == "EPD-NOR-12345"

    def test_epd_id_property_absent_when_none(self):
        root = _parse(generate_ehf(INVOICE, [LINE_ENERGY]))
        line = root.find(f"{{{_CAC}}}InvoiceLine")
        item = line.find(f"{{{_CAC}}}Item")
        props = item.findall(f"{{{_CAC}}}AdditionalItemProperty")
        names = {p.find(f"{{{_CBC}}}Name").text for p in props}
        assert "EPDNumber" not in names

    def test_no_co2_properties_when_co2_is_none(self):
        root = _parse(generate_ehf(INVOICE, [LINE_MATERIAL_NO_CO2]))
        invoice_line = root.find(f"{{{_CAC}}}InvoiceLine")
        item = invoice_line.find(f"{{{_CAC}}}Item")
        props = item.findall(f"{{{_CAC}}}AdditionalItemProperty")
        names = {p.find(f"{{{_CBC}}}Name").text for p in props}
        assert "Byggspor_TotalCO2" not in names
        assert "Byggspor_ConfidenceScore" not in names
