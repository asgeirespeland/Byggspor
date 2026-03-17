"""Shared pytest fixtures for the backend test suite.

Provides:
- An in-memory SQLite database that is created once per session
- A transactional db_session that rolls back after every test (isolation)
- A Flask test client with auth middleware bypassed
- Sample EHF XML strings
- Mock NOBB API response data
"""

# ── Set required env vars BEFORE any app code is imported ────────────────────
# The app reads these at import time, so they must exist first.
import os

os.environ.setdefault("NOBB_API_USERNAME", "test_user")
os.environ.setdefault("NOBB_API_PASSWORD", "test_pass")
os.environ.setdefault("SECRET_KEY", "test-secret")

# ── Standard imports ──────────────────────────────────────────────────────────
from unittest.mock import patch

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base

# ── Database fixtures ─────────────────────────────────────────────────────────


@pytest.fixture(scope="session")
def engine():
    """Create a single in-memory SQLite engine for the whole test session.

    scope="session" means this is created once and shared across all tests.
    SQLite's :memory: means it is completely separate from the dev PostgreSQL DB.
    """
    e = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(e)  # Create all tables from SQLAlchemy models
    yield e
    Base.metadata.drop_all(e)


@pytest.fixture
def db_session(engine):
    """Provide a transactional test session.

    Pattern: wrap each test in a transaction, then roll it back.
    This means every test starts with a clean database — no leftover rows.

    Why not just truncate tables? Rollback is faster and simpler.
    """
    connection = engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()

    yield session

    session.close()
    transaction.rollback()  # ← Undo everything the test wrote
    connection.close()


# ── Flask test client fixture ─────────────────────────────────────────────────


@pytest.fixture
def app(db_session):
    """Flask app configured for testing with auth and DB patched.

    Two patches are required:
    1. authenticate_request → return None (None means "no early response",
       i.e. the request proceeds as if authenticated).
    2. SessionLocal in app.main → return the test db_session so that g.db
       points to our isolated SQLite session, not production PostgreSQL.
    """
    from app.main import app as flask_app

    flask_app.config["TESTING"] = True

    with (
        patch("app.main.authenticate_request", return_value=None),
        patch("app.main.SessionLocal", return_value=db_session),
    ):
        yield flask_app


@pytest.fixture
def client(app, db_session):
    """Flask test client.

    Also patches SessionLocal in the invoice routes, because those routes
    create their own sessions directly (not via g.db).
    """
    with patch("app.routes.invoice.SessionLocal", return_value=db_session):
        with app.test_client() as c:
            yield c


# ── EHF XML sample data ───────────────────────────────────────────────────────
# Defined as module-level constants so they can also be imported directly
# (useful in test classes that define their own XML inline).

MINIMAL_EHF_XML = """\
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:ID>INV-001</cbc:ID>
  <cbc:IssueDate>2024-01-15</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>NOK</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Leverandør AS</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>Kunde AS</cbc:Name></cac:PartyName>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="STK">10.0</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount>1000.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Betongblokk 20x20x40</cbc:Name>
      <cac:StandardItemIdentification>
        <cbc:ID schemeID="GTIN">07090001234567</cbc:ID>
      </cac:StandardItemIdentification>
    </cac:Item>
    <cac:Price><cbc:PriceAmount>100.00</cbc:PriceAmount></cac:Price>
  </cac:InvoiceLine>
</Invoice>"""

EHF_XML_WITH_NOBB = """\
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:ID>INV-002</cbc:ID>
  <cbc:IssueDate>2024-01-16</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>NOK</cbc:DocumentCurrencyCode>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="M2">5.0</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount>500.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Isolasjon Rockwool</cbc:Name>
      <cac:AdditionalItemProperty>
        <cbc:Name>NOBB-nummer</cbc:Name>
        <cbc:Value>12345678</cbc:Value>
      </cac:AdditionalItemProperty>
    </cac:Item>
  </cac:InvoiceLine>
</Invoice>"""

EHF_XML_NO_IDENTIFIERS = """\
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">
  <cbc:ID>INV-003</cbc:ID>
  <cbc:IssueDate>2024-01-17</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>NOK</cbc:DocumentCurrencyCode>
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="STK">3.0</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount>300.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Produkt uten identifikator</cbc:Name>
    </cac:Item>
  </cac:InvoiceLine>
</Invoice>"""


@pytest.fixture
def minimal_ehf_xml():
    return MINIMAL_EHF_XML


@pytest.fixture
def ehf_xml_with_nobb():
    return EHF_XML_WITH_NOBB


@pytest.fixture
def ehf_xml_no_identifiers():
    return EHF_XML_NO_IDENTIFIERS


# ── NOBB mock data ────────────────────────────────────────────────────────────

MOCK_NOBB_SEARCH_RESPONSE = [{"nobbNo": 12345678}]

ruff_bypass = "Conversion factor to mass (kg) per declared or functional unit"

MOCK_NOBB_ITEM_DETAILED_EPD = {
    "nobbNumber": 12345678,
    "primaryText": "Betongblokk 20x20x40",
    "secondaryText": "Leca",
    "description": "Lettklinkerblokk",
    "productGroupName": "Muring og pussing",
    "productGroupNumber": "1234",
    "environmentLabels": [],
    "properties": {
        "epd": [
            {"propertyName": "EPD registration number", "value": "EPD-NOR-12345"},
            {"propertyName": "Declared unit", "value": "1 stk"},
            {
                "propertyName": "{ruff_bypass}",
                "value": "15.0",
            },
            {"propertyName": "Calcuation factor to NOBB price unit", "value": "1.0"},
            # Detailed format: separate Total / Fossil / Biogenic
            {
                "propertyName": "Tot A1 To A3 GWP Total - global warming potential",
                "value": "10.5",
            },
            {
                "propertyName": "Tot A1 To A3 Fossil - global warming potential",
                "value": "10.0",
            },
            {
                "propertyName": "Tot A1 To A3 Biogenic - global warming potential",
                "value": "0.5",
            },
            {
                "propertyName": "A4 GWP Total - global warming potential",
                "value": "0.2",
            },
        ]
    },
}

MOCK_NOBB_ITEM_SIMPLE_EPD = {
    "nobbNumber": 99999999,
    "primaryText": "Enkel Isolasjon",
    "properties": {
        "epd": [
            {"propertyName": "EPD registration number", "value": "EPD-NOR-99999"},
            {"propertyName": "Declared unit", "value": "1 m2"},
            # Simple format: single combined value per stage
            {"propertyName": "A1-A3 - global warming potential", "value": "5.2"},
            {"propertyName": "A4 - global warming potential", "value": "0.1"},
        ]
    },
}


@pytest.fixture
def mock_nobb_item():
    return MOCK_NOBB_ITEM_DETAILED_EPD


@pytest.fixture
def mock_nobb_search_response():
    return MOCK_NOBB_SEARCH_RESPONSE
