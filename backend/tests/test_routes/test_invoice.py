"""Integration tests for the /invoice routes.

Uses the Flask test client from conftest.
External dependencies (NOBB API, DB enrichment) are mocked at the service level.
The goal is to test route validation logic and HTTP response shapes,
not the internal parsing or enrichment logic (those have their own unit tests).
"""

from io import BytesIO
from unittest.mock import patch

# ── Sample data ───────────────────────────────────────────────────────────────

VALID_EHF_XML = b"""\
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:ID>INV-ROUTE-TEST</cbc:ID>
  <cbc:IssueDate>2024-01-15</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>NOK</cbc:DocumentCurrencyCode>
</Invoice>"""

MOCK_ENRICHED = {
    "invoice_number": "INV-ROUTE-TEST",
    "issue_date": "2024-01-15",
    "currency": "NOK",
    "supplier": None,
    "buyer": None,
    "line_items": [],
}


# ── Health check ──────────────────────────────────────────────────────────────


class TestHealthCheck:
    def test_returns_200_with_status_ok(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.get_json() == {"status": "ok"}


# ── POST /invoice/parse ───────────────────────────────────────────────────────


class TestParseInvoiceRoute:
    def _post_xml(self, client, xml_bytes, filename="invoice.xml"):
        """Helper: post an XML file to /invoice/parse."""
        return client.post(
            "/invoice/parse",
            data={"file": (BytesIO(xml_bytes), filename)},
            content_type="multipart/form-data",
        )

    def test_returns_200_with_valid_xml(self, client):
        with (
            patch("app.routes.invoice.enrich_invoice", return_value=MOCK_ENRICHED),
            patch("app.routes.invoice.upsert_catalog_entry"),
        ):
            resp = self._post_xml(client, VALID_EHF_XML)

        assert resp.status_code == 200
        data = resp.get_json()
        assert data["invoice_number"] == "INV-ROUTE-TEST"

    def test_returns_400_when_no_file_field(self, client):
        resp = client.post(
            "/invoice/parse",
            data={},
            content_type="multipart/form-data",
        )
        assert resp.status_code == 400
        assert "No file provided" in resp.get_json()["error"]

    def test_returns_400_for_non_xml_extension(self, client):
        resp = self._post_xml(client, b"irrelevant content", filename="invoice.pdf")
        assert resp.status_code == 400
        assert "XML" in resp.get_json()["error"]

    def test_returns_400_for_empty_file(self, client):
        resp = self._post_xml(client, b"")
        assert resp.status_code == 400
        assert "empty" in resp.get_json()["error"]

    def test_returns_422_for_malformed_xml(self, client):
        resp = self._post_xml(client, b"<not><valid xml")
        assert resp.status_code == 422
        assert "Invalid XML" in resp.get_json()["error"]

    def test_response_contains_line_items_key(self, client):
        with (
            patch("app.routes.invoice.enrich_invoice", return_value=MOCK_ENRICHED),
            patch("app.routes.invoice.upsert_catalog_entry"),
        ):
            resp = self._post_xml(client, VALID_EHF_XML)

        assert "line_items" in resp.get_json()
