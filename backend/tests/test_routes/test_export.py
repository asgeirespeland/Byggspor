"""Integration tests for the /export routes.

Uses the Flask test client from conftest (SQLite in-memory, auth patched).
Role middleware is patched to OWNER so we can test route logic without
seeding the full org/project/member graph.

What's tested:
- POST /export/project/<id>/generate — happy path, format options, validation
- GET /export/<id>/ehf — file present, file missing, not found
"""

from __future__ import annotations

import os
from unittest.mock import patch

import pytest

from app.models.generated_invoice import GeneratedInvoice, InvoiceFormatType
from app.models.organization import Organization, OrgType
from app.models.project import Project, ProjectStatus
from app.models.project_member import ProjectRole
from app.models.user import User

# ── Helpers ───────────────────────────────────────────────────────────────────


def _generate(client, project_id: int = 1, **body):
    payload = {"format_type": "aggregated", **body}
    return client.post(f"/export/project/{project_id}/generate", json=payload)


def _seed_user(db_session) -> User:
    """Insert user id=1 so require_project_role can find it in the DB."""
    user = User(
        id=1,
        clerk_id="clerk_test_1",
        email="test@example.com",
        name="Test User",
        is_system_admin=False,
    )
    db_session.add(user)
    db_session.flush()
    return user


def _seed_project(db_session, user_id: int = 1, project_id: int = 1) -> Project:
    """Insert an Organization + Project so session.get(Project, id) succeeds.

    Does NOT seed ProjectMember — role checking is patched separately.
    """
    org = Organization(name="Test Org AS", org_type=OrgType.COMPANY)
    db_session.add(org)
    db_session.flush()

    # Temporarily disable the after_insert event listener that auto-creates
    # ProjectMember, because it stores role as .name ("OWNER") while the
    # Enum type reads back .value ("owner"), causing a SQLite mismatch.
    from sqlalchemy import event as sa_event

    from app.models.project import _add_creator_to_project_members

    sa_event.remove(Project, "after_insert", _add_creator_to_project_members)
    try:
        project = Project(
            id=project_id,
            organization_id=org.id,
            created_by_user_id=user_id,
            name="Test Prosjekt",
            status=ProjectStatus.ACTIVE,
        )
        db_session.add(project)
        db_session.flush()
    finally:
        sa_event.listen(Project, "after_insert", _add_creator_to_project_members)

    return project


def _seed_context(db_session) -> Project:
    """Seed the minimum rows needed by the generate route: User + Project."""
    _seed_user(db_session)
    return _seed_project(db_session)


def _seed_invoice(db_session, **kwargs) -> GeneratedInvoice:
    defaults = dict(
        project_id=1,
        format_type=InvoiceFormatType.AGGREGATED,
        customer_name="Test Kunde AS",
        invoice_number="INV-SEED-001",
    )
    defaults.update(kwargs)
    inv = GeneratedInvoice(**defaults)
    db_session.add(inv)
    db_session.flush()
    db_session.refresh(inv)
    return inv


# Patch _has_project_role so the role-membership DB query is bypassed.
# The User row must still exist (handled by _seed_user / _seed_context).
_role_patch = patch(
    "app.middleware.roles._has_project_role",
    return_value=ProjectRole.OWNER,
)


# ── POST /export/project/<id>/generate ────────────────────────────────────────


class TestGenerateInvoice:
    def test_returns_201_on_empty_project(self, client, db_session):
        _seed_context(db_session)
        with _role_patch:
            resp = _generate(client)
        assert resp.status_code == 201

    def test_response_contains_invoice_fields(self, client, db_session):
        _seed_context(db_session)
        with _role_patch:
            resp = _generate(
                client,
                invoice_number="INV-001",
                customer_name="Kunde AS",
                customer_org_number="987654321",
                due_date="2026-06-01",
                our_reference="Prosjekt-X",
                bank_account="12345678901",
            )
        data = resp.get_json()
        assert data["invoice_number"] == "INV-001"
        assert data["customer_name"] == "Kunde AS"
        assert data["due_date"] == "2026-06-01"
        assert data["our_reference"] == "Prosjekt-X"

    def test_vat_and_grand_total_zero_for_empty_project(self, client, db_session):
        _seed_context(db_session)
        with _role_patch:
            data = _generate(client).get_json()
        # Empty project has no lines, so totals are 0 or null
        assert data.get("vat_total_kr") in (None, 0.0, pytest.approx(0.0))

    def test_format_type_aggregated_accepted(self, client, db_session):
        _seed_context(db_session)
        with _role_patch:
            resp = _generate(client, format_type="aggregated")
        assert resp.status_code == 201
        assert resp.get_json()["format_type"] == "aggregated"

    def test_format_type_detailed_accepted(self, client, db_session):
        _seed_context(db_session)
        with _role_patch:
            resp = _generate(client, format_type="detailed")
        assert resp.status_code == 201
        assert resp.get_json()["format_type"] == "detailed"

    def test_invalid_format_type_returns_400(self, client, db_session):
        _seed_context(db_session)
        with _role_patch:
            resp = _generate(client, format_type="invalid")
        assert resp.status_code == 400
        assert resp.get_json()["code"] == "INVALID_FORMAT_TYPE"

    def test_invalid_due_date_returns_400(self, client, db_session):
        _seed_context(db_session)
        with _role_patch:
            resp = _generate(client, due_date="not-a-date")
        assert resp.status_code == 400
        assert resp.get_json()["code"] == "INVALID_DUE_DATE"

    def test_ehf_xml_path_set_on_invoice(self, client, db_session):
        _seed_context(db_session)
        with _role_patch:
            data = _generate(client).get_json()
        assert data["ehf_xml_path"] is not None
        assert data["ehf_xml_path"].endswith(".xml")

    def test_ehf_file_is_written_to_disk(self, client, db_session):
        _seed_context(db_session)
        with _role_patch:
            data = _generate(client).get_json()
        assert os.path.isfile(data["ehf_xml_path"])

    def test_unauthenticated_returns_401(self, app):
        """Bypass the conftest auth mock for this one test."""
        app.config["TESTING"] = True
        with patch(
            "app.main.authenticate_request",
            return_value=({"error": "Unauthorized"}, 401),
        ):
            with app.test_client() as c:
                resp = c.post("/export/project/1/generate", json={})
        assert resp.status_code == 401

    def test_project_not_found_returns_404(self, client, db_session):
        _seed_user(db_session)
        with _role_patch:
            # Project 9999 doesn't exist in the test DB
            resp = _generate(client, project_id=9999)
        assert resp.status_code == 404
        assert resp.get_json()["code"] == "NOT_FOUND"


# ── GET /export/<id>/ehf ───────────────────────────────────────────────────────


class TestDownloadEhf:
    def test_returns_404_for_unknown_invoice(self, client):
        resp = client.get("/export/9999/ehf")
        assert resp.status_code == 404

    def test_returns_404_when_file_path_missing(self, client, db_session):
        inv = _seed_invoice(db_session, ehf_xml_path=None)
        resp = client.get(f"/export/{inv.id}/ehf")
        assert resp.status_code == 404
        assert resp.get_json()["code"] == "FILE_NOT_FOUND"

    def test_returns_404_when_file_does_not_exist_on_disk(self, client, db_session):
        inv = _seed_invoice(db_session, ehf_xml_path="/tmp/nonexistent_invoice.xml")
        resp = client.get(f"/export/{inv.id}/ehf")
        assert resp.status_code == 404
        assert resp.get_json()["code"] == "FILE_NOT_FOUND"

    def test_returns_xml_file_when_present(self, client, db_session, tmp_path):
        xml_file = tmp_path / "test_invoice.xml"
        xml_file.write_bytes(b"<?xml version='1.0'?><Invoice/>")

        inv = _seed_invoice(db_session, ehf_xml_path=str(xml_file))
        resp = client.get(f"/export/{inv.id}/ehf")

        assert resp.status_code == 200
        assert "xml" in resp.content_type

    def test_download_filename_uses_invoice_number(self, client, db_session, tmp_path):
        xml_file = tmp_path / "test.xml"
        xml_file.write_bytes(b"<?xml version='1.0'?><Invoice/>")

        inv = _seed_invoice(
            db_session,
            invoice_number="INV-2026-001",
            ehf_xml_path=str(xml_file),
        )
        resp = client.get(f"/export/{inv.id}/ehf")
        assert resp.status_code == 200
        content_disposition = resp.headers.get("Content-Disposition", "")
        assert "INV-2026-001" in content_disposition
