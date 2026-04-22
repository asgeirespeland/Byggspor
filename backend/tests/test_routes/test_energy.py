"""Integration tests for the /energy routes.

Mirrors the style of test_invoice.py — uses the Flask test client from conftest,
hits real SQLite, and only mocks at the boundary (role middleware for the one
route that checks project membership).

Key things being pinned:
- CO₂ calculation: kwh * 0.0119, rounded to 4 decimal places (NVE 2024 factor)
- PATCH recalculates CO₂ only when kwh_used changes
- Input validation error codes and status codes
- 404 behaviour for missing entries
"""

from unittest.mock import patch

import pytest

from app.models.energy import Energy, EnergySource
from app.models.organization import Organization, OrgType
from app.models.project import Project, ProjectStatus
from app.models.project_member import ProjectRole
from app.models.user import User

# ── Helpers ───────────────────────────────────────────────────────────────────


def _post_calculate(client, payload):
    return client.post("/energy/calculate", json=payload)


def _seed_user(db_session, user_id: int = 1) -> User:
    """Insert a minimal User row matching g.current_user_id so
    role middleware can find it."""
    user = User(
        id=user_id,
        clerk_id=f"clerk_{user_id}",
        email=f"test{user_id}@example.com",
        name="Test User",
        is_system_admin=False,
    )
    db_session.add(user)
    db_session.flush()
    return user


def _seed_project(db_session, user_id: int = 1, project_id: int = 1) -> Project:
    """Insert an Organization + Project to satisfy FK constraints on project_id."""
    from sqlalchemy import event as sa_event

    from app.models.project import _add_creator_to_project_members

    org = Organization(name="Test Org AS", org_type=OrgType.COMPANY)
    db_session.add(org)
    db_session.flush()

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
    """Seed user id=1 + org + project id=1."""
    _seed_user(db_session)
    return _seed_project(db_session)


def _seed_energy(db_session, **kwargs) -> Energy:
    """Insert an Energy row directly and return it."""
    defaults = dict(
        project_id=1,
        source=EnergySource.MANUAL,
        kwh_used=1000.0,
        grid_emission_factor=0.0119,
        total_co2_kg=round(1000.0 * 0.0119, 4),
        confidence_score=0.9,
    )
    defaults.update(kwargs)
    energy = Energy(**defaults)
    db_session.add(energy)
    db_session.flush()
    db_session.refresh(energy)
    return energy


# ── POST /energy/calculate ────────────────────────────────────────────────────


class TestCalculateEnergy:
    @pytest.fixture(autouse=True)
    def _project(self, db_session):
        _seed_context(db_session)

    def test_returns_201_with_valid_payload(self, client):
        resp = _post_calculate(client, {"project_id": 1, "kwh_used": 1000.0})
        assert resp.status_code == 201

    def test_co2_is_kwh_times_emission_factor(self, client):
        resp = _post_calculate(client, {"project_id": 1, "kwh_used": 1000.0})
        data = resp.get_json()
        assert data["total_co2_kg"] == pytest.approx(round(1000.0 * 0.0119, 4))

    def test_co2_precision_rounded_to_4_decimal_places(self, client):
        resp = _post_calculate(client, {"project_id": 1, "kwh_used": 333.3})
        data = resp.get_json()
        assert data["total_co2_kg"] == round(333.3 * 0.0119, 4)

    def test_response_contains_expected_fields(self, client):
        resp = _post_calculate(client, {"project_id": 1, "kwh_used": 500.0})
        data = resp.get_json()
        for field in ("id", "project_id", "kwh_used", "total_co2_kg", "source"):
            assert field in data, f"Missing field: {field}"

    def test_source_is_manual(self, client):
        resp = _post_calculate(client, {"project_id": 1, "kwh_used": 500.0})
        assert resp.get_json()["source"] == "manual"

    def test_accepts_valid_price_zone(self, client):
        resp = _post_calculate(
            client, {"project_id": 1, "kwh_used": 500.0, "price_zone": "NO3"}
        )
        assert resp.status_code == 201
        assert resp.get_json()["price_zone"] == "NO3"

    def test_accepts_recorded_date(self, client):
        resp = _post_calculate(
            client,
            {"project_id": 1, "kwh_used": 500.0, "recorded_date": "2024-06-01"},
        )
        assert resp.status_code == 201
        assert resp.get_json()["recorded_date"] == "2024-06-01"

    def test_returns_400_when_kwh_missing(self, client):
        resp = _post_calculate(client, {"project_id": 1})
        assert resp.status_code == 400

    def test_returns_400_when_project_id_missing(self, client):
        resp = _post_calculate(client, {"kwh_used": 500.0})
        assert resp.status_code == 400

    def test_returns_400_for_negative_kwh(self, client):
        resp = _post_calculate(client, {"project_id": 1, "kwh_used": -100.0})
        assert resp.status_code == 400

    def test_returns_400_for_invalid_price_zone(self, client):
        resp = _post_calculate(
            client, {"project_id": 1, "kwh_used": 500.0, "price_zone": "NO9"}
        )
        assert resp.status_code == 400
        assert resp.get_json()["code"] == "INVALID_FIELD"

    def test_error_response_contains_suggestion(self, client):
        resp = _post_calculate(client, {"project_id": 1, "kwh_used": -1})
        data = resp.get_json()
        assert "suggestion" in data
        assert len(data["suggestion"]) > 0


# ── PATCH /energy/entry/<id> ──────────────────────────────────────────────────


class TestUpdateEnergy:
    @pytest.fixture(autouse=True)
    def _project(self, db_session):
        _seed_context(db_session)

    def test_returns_200_on_valid_update(self, client, db_session):
        entry = _seed_energy(db_session)
        resp = client.patch(f"/energy/entry/{entry.id}", json={"kwh_used": 2000.0})
        assert resp.status_code == 200

    def test_kwh_update_recalculates_co2(self, client, db_session):
        entry = _seed_energy(db_session, kwh_used=1000.0)
        resp = client.patch(f"/energy/entry/{entry.id}", json={"kwh_used": 2000.0})
        data = resp.get_json()
        assert data["kwh_used"] == 2000.0
        assert data["total_co2_kg"] == pytest.approx(round(2000.0 * 0.0119, 4))

    def test_price_zone_update_does_not_change_co2(self, client, db_session):
        entry = _seed_energy(db_session, kwh_used=1000.0)
        original_co2 = float(entry.total_co2_kg)
        resp = client.patch(f"/energy/entry/{entry.id}", json={"price_zone": "NO2"})
        assert resp.get_json()["total_co2_kg"] == original_co2

    def test_returns_404_for_nonexistent_entry(self, client):
        resp = client.patch("/energy/entry/999999", json={"kwh_used": 500.0})
        assert resp.status_code == 404
        assert resp.get_json()["code"] == "NOT_FOUND"

    def test_returns_400_for_negative_kwh(self, client, db_session):
        entry = _seed_energy(db_session)
        resp = client.patch(f"/energy/entry/{entry.id}", json={"kwh_used": -50.0})
        assert resp.status_code == 400

    def test_returns_400_for_invalid_price_zone(self, client, db_session):
        entry = _seed_energy(db_session)
        resp = client.patch(f"/energy/entry/{entry.id}", json={"price_zone": "EU1"})
        assert resp.status_code == 400
        assert resp.get_json()["code"] == "INVALID_FIELD"


# ── GET /energy/<project_id> ──────────────────────────────────────────────────


class TestListEnergies:
    def test_returns_200_with_project_role(self, client, db_session):
        _seed_user(db_session)
        _seed_project(db_session)
        _seed_energy(db_session, project_id=1)
        with patch(
            "app.middleware.roles._has_project_role",
            return_value=ProjectRole.VIEWER,
        ):
            resp = client.get("/energy/1")
        assert resp.status_code == 200

    def test_returns_list_of_entries(self, client, db_session):
        _seed_user(db_session)
        _seed_project(db_session)
        _seed_energy(db_session, project_id=1, kwh_used=100.0)
        _seed_energy(db_session, project_id=1, kwh_used=200.0)
        with patch(
            "app.middleware.roles._has_project_role",
            return_value=ProjectRole.VIEWER,
        ):
            resp = client.get("/energy/1")
        assert isinstance(resp.get_json(), list)
        assert len(resp.get_json()) == 2

    def test_returns_empty_list_for_project_with_no_entries(self, client, db_session):
        _seed_user(db_session)
        with patch(
            "app.middleware.roles._has_project_role",
            return_value=ProjectRole.VIEWER,
        ):
            resp = client.get("/energy/9999")
        assert resp.status_code == 200
        assert resp.get_json() == []

    def test_returns_403_without_project_role(self, client, db_session):
        _seed_user(db_session)
        with patch(
            "app.middleware.roles._has_project_role",
            return_value=None,
        ):
            resp = client.get("/energy/1")
        assert resp.status_code == 403


# ── DELETE /energy/entry/<id> ─────────────────────────────────────────────────


class TestDeleteEnergy:
    @pytest.fixture(autouse=True)
    def _project(self, db_session):
        _seed_context(db_session)

    def test_returns_200_on_success(self, client, db_session):
        entry = _seed_energy(db_session)
        resp = client.delete(f"/energy/entry/{entry.id}")
        assert resp.status_code == 200

    def test_entry_is_gone_after_delete(self, client, db_session):
        entry = _seed_energy(db_session)
        client.delete(f"/energy/entry/{entry.id}")
        assert db_session.get(Energy, entry.id) is None

    def test_returns_404_for_nonexistent_entry(self, client):
        resp = client.delete("/energy/entry/999999")
        assert resp.status_code == 404
        assert resp.get_json()["code"] == "NOT_FOUND"


# ── GET /energy/zones ─────────────────────────────────────────────────────────


class TestListZones:
    def test_returns_200(self, client):
        resp = client.get("/energy/zones")
        assert resp.status_code == 200

    def test_returns_all_five_zones(self, client):
        zones = client.get("/energy/zones").get_json()
        values = {z["value"] for z in zones}
        assert values == {"NO1", "NO2", "NO3", "NO4", "NO5"}

    def test_each_zone_has_value_and_label(self, client):
        for zone in client.get("/energy/zones").get_json():
            assert "value" in zone
            assert "label" in zone
            assert len(zone["label"]) > 0
