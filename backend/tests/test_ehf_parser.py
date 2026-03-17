"""Unit tests for app.services.ehf_parser.

Tests the stateless parse_invoice() function in isolation.
No database or network calls are made.
"""

import xml.etree.ElementTree as ET

import pytest

from app.services.ehf_parser import parse_invoice


class TestInvoiceMetadata:
    def test_extracts_invoice_number(self, minimal_ehf_xml):
        result = parse_invoice(minimal_ehf_xml)
        assert result["invoice_number"] == "INV-001"

    def test_extracts_issue_date(self, minimal_ehf_xml):
        result = parse_invoice(minimal_ehf_xml)
        assert result["issue_date"] == "2024-01-15"

    def test_extracts_currency_node(self, minimal_ehf_xml):
        result = parse_invoice(minimal_ehf_xml)
        assert result["currency"] == "NOK"

    def test_extracts_supplier_name(self, minimal_ehf_xml):
        result = parse_invoice(minimal_ehf_xml)
        assert result["supplier"]["name"] == "Leverandør AS"

    def test_extracts_buyer_name(self, minimal_ehf_xml):
        result = parse_invoice(minimal_ehf_xml)
        assert result["buyer"]["name"] == "Kunde AS"

    def returns_none_supplier_when_absent(self, ehf_xml_with_nobb):
        result = parse_invoice(ehf_xml_with_nobb)
        assert result["supplier"] is None


# --- Line item: GTIN identification ---


class TestLineItemGTIN:
    def test_extracts_gtin_from_standard_scheme(self, minimal_ehf_xml):
        item = parse_invoice(minimal_ehf_xml)["line_items"][0]
        assert item["gtin"] == "07090001234567"

    def test_item_with_gtin_is_not_flagged(self, minimal_ehf_xml):
        item = parse_invoice(minimal_ehf_xml)["line_items"][0]
        assert item["flagged"] is False

    def test_extracts_gtin_from_beast_scheme_0160(self):
        xml = """\
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:ID>INV-BEAST</cbc:ID>
  <cbc:IssueDate>2024-01-20</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>NOK</cbc:DocumentCurrencyCode>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="STK">1.0</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount>100.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>BEAst produkt</cbc:Name>
      <cac:StandardItemIdentification>
        <cbc:ID schemeID="0160">07090009999999</cbc:ID>
      </cac:StandardItemIdentification>
    </cac:Item>
  </cac:InvoiceLine>
</Invoice>"""
        item = parse_invoice(xml)["line_items"][0]
        assert item["gtin"] == "07090009999999"
        assert item["flagged"] is False

    def test_unknown_scheme_id_does_not_set_gtin(self):
        xml = """\
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:ID>INV-X</cbc:ID>
  <cbc:IssueDate>2024-01-20</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>NOK</cbc:DocumentCurrencyCode>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="STK">1.0</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount>50.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Produkt med ukjent scheme</cbc:Name>
      <cac:StandardItemIdentification>
        <cbc:ID schemeID="UNKNOWN">12345</cbc:ID>
      </cac:StandardItemIdentification>
    </cac:Item>
  </cac:InvoiceLine>
</Invoice>"""
        item = parse_invoice(xml)["line_items"][0]
        assert item["gtin"] is None
        assert item["flagged"] is True


# --- Line item: NOBB identification ---


class TestLineItemNobb:
    def test_extracts_nobb_from_additional_property(self, ehf_xml_with_nobb):
        item = parse_invoice(ehf_xml_with_nobb)["line_items"][0]
        assert item["nobb"] == "12345678"

    def test_item_with_nobb_is_not_flagged(self, ehf_xml_with_nobb):
        item = parse_invoice(ehf_xml_with_nobb)["line_items"][0]
        assert item["flagged"] is False

    def test_nobb_detection_is_case_insensitive(self):
        """Property name 'Nobb-Nummer' (mixed case) should still be detected."""
        xml = """\
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:ID>INV-CASE</cbc:ID>
  <cbc:IssueDate>2024-01-20</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>NOK</cbc:DocumentCurrencyCode>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="STK">1.0</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount>50.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Test</cbc:Name>
      <cac:AdditionalItemProperty>
        <cbc:Name>Nobb-Nummer</cbc:Name>
        <cbc:Value>87654321</cbc:Value>
      </cac:AdditionalItemProperty>
    </cac:Item>
  </cac:InvoiceLine>
</Invoice>"""
        item = parse_invoice(xml)["line_items"][0]
        assert item["nobb_number"] == "87654321"


# --- Line item: Flagging ---


class TestLineItemFlagging:
    def test_item_without_gtin_or_nobb_is_flagged(self, ehf_xml_no_identifiers):
        item = parse_invoice(ehf_xml_no_identifiers)["line_items"][0]
        assert item["gtin"] is None
        assert item["nobb_number"] is None
        assert item["flagged"] is True


# --- Line Item: numeric fields ---
class TestLineItemNumericFields:
    def test_quantity_parsed_as_float(self, minimal_ehf_xml):
        item = parse_invoice(minimal_ehf_xml)["line_items"][0]
        assert item["quantity"] == 10.0
        assert isinstance(item["quantity"], float)

    def test_unit_code_extracted(self, minimal_ehf_xml):
        item = parse_invoice(minimal_ehf_xml)["line_items"][0]
        assert item["unit"] == "STK"

    def test_line_total_parsed_as_float(self, minimal_ehf_xml):
        item = parse_invoice(minimal_ehf_xml)["line_items"][0]
        assert item["line_total"] == 1000.0

    def test_price_per_unit_parsed_as_float(self, minimal_ehf_xml):
        item = parse_invoice(minimal_ehf_xml)["line_items"][0]
        assert item["price_per_unit"] == 100.0

    def test_item_name_extracted(self, minimal_ehf_xml):
        item = parse_invoice(minimal_ehf_xml)["line_items"][0]
        assert item["name"] == "Betongblokk 20x20x40"


# --- Error Handling ---
class TestParseErrors:
    def test_malformed_xml_raises_parse_error(self):
        with pytest.raises(ET.ParseError):
            parse_invoice("<Invoice><unclosed>")

    def test_empty_string_raises_parse_error(self):
        with pytest.raises(ET.ParseError):
            parse_invoice("")

    def test_accepts_bytes_input(self, minimal_ehf_xml):
        """parse_invoice() accepts both str and bytes (for file uploads)."""
        result = parse_invoice(minimal_ehf_xml.encode("utf-8"))
        assert result["invoice_number"] == "INV-001"


def test_returns_empty_line_items_list_when_no_lines(self):
    xml = """\
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:ID>INV-EMPTY</cbc:ID>
  <cbc:IssueDate>2024-01-01</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>NOK</cbc:DocumentCurrencyCode>
</Invoice>"""
    result = parse_invoice(xml)
    assert result["line_items"] == []
