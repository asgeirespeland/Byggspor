"""Tests for the settings resolver module."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config.settings_resolver import (
    SETTINGS_DEFAULTS,
    resolve_for_snapshot,
    resolve_org_settings,
    resolve_org_settings_with_sources,
    resolve_settings,
    resolve_settings_with_sources,
    validate_settings,
)
from app.database import Base
from app.errors import ApiError
from app.models.organization import Organization, OrgType
from app.models.project import Project, ProjectStatus
from app.models.user import User


@pytest.fixture(scope="module")
def engine():
    e = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(e)
    yield e
    Base.metadata.drop_all(e)


@pytest.fixture
def session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    sess = Session()
    yield sess
    sess.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def org(session):
    user = User(name="Test", email="test@test.com", clerk_id="clerk_test")
    session.add(user)
    session.flush()

    org = Organization(name="TestOrg", org_type=OrgType.COMPANY)
    session.add(org)
    session.flush()
    return org


@pytest.fixture
def project(session, org):
    user = session.query(User).first()
    proj = Project(
        name="TestProject",
        organization_id=org.id,
        created_by_user_id=user.id,
        status=ProjectStatus.ACTIVE,
    )
    session.add(proj)
    session.flush()
    return proj


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


class TestValidateSettings:
    def test_valid_settings(self):
        result = validate_settings(
            {"energy_grid_emission_factor": 0.025, "energy_grid_mix_type": "residual"}
        )
        assert result["energy_grid_emission_factor"] == 0.025
        assert result["energy_grid_mix_type"] == "residual"

    def test_unknown_key_rejected(self):
        with pytest.raises(ApiError, match="Ukjent innstilling"):
            validate_settings({"nonexistent_key": 42})

    def test_wrong_type_rejected(self):
        with pytest.raises(ApiError, match="Ugyldig type"):
            validate_settings({"energy_grid_emission_factor": "not a number"})

    def test_negative_emission_factor_rejected(self):
        with pytest.raises(ApiError, match="kan ikke være lavere"):
            validate_settings({"energy_grid_emission_factor": -1.0})

    def test_invalid_choice_rejected(self):
        with pytest.raises(ApiError, match="Ugyldig verdi"):
            validate_settings({"energy_grid_mix_type": "invalid"})

    def test_bool_setting(self):
        result = validate_settings({"material_include_a4": True})
        assert result["material_include_a4"] is True

    def test_list_setting(self):
        result = validate_settings({"material_gwp_stages": ["a1_a3", "a4"]})
        assert result["material_gwp_stages"] == ["a1_a3", "a4"]

    def test_dict_setting(self):
        result = validate_settings({"waste_manual_emission_factors": {"metall": 60.0}})
        assert result["waste_manual_emission_factors"]["metall"] == 60.0


# ---------------------------------------------------------------------------
# Resolution
# ---------------------------------------------------------------------------


class TestResolveSettings:
    def test_defaults_when_no_overrides(self, session, project):
        result = resolve_settings(session, project.id)
        assert result == SETTINGS_DEFAULTS

    def test_org_override(self, session, org, project):
        org.settings = {"energy_grid_emission_factor": 0.5}
        session.flush()

        result = resolve_settings(session, project.id)
        assert result["energy_grid_emission_factor"] == 0.5
        # Other keys untouched
        assert result["energy_grid_mix_type"] == "physical"

    def test_project_override_beats_org(self, session, org, project):
        org.settings = {"energy_grid_emission_factor": 0.5}
        project.settings = {"energy_grid_emission_factor": 0.9}
        session.flush()

        result = resolve_settings(session, project.id)
        assert result["energy_grid_emission_factor"] == 0.9

    def test_project_override_without_org_override(self, session, project):
        project.settings = {"confidence_weighting": "co2_weighted"}
        session.flush()

        result = resolve_settings(session, project.id)
        assert result["confidence_weighting"] == "co2_weighted"
        assert (
            result["energy_grid_emission_factor"]
            == SETTINGS_DEFAULTS["energy_grid_emission_factor"]
        )

    def test_nonexistent_project_returns_defaults(self, session):
        result = resolve_settings(session, 99999)
        assert result == SETTINGS_DEFAULTS


class TestResolveOrgSettings:
    def test_defaults(self, session, org):
        result = resolve_org_settings(session, org.id)
        assert result == SETTINGS_DEFAULTS

    def test_with_override(self, session, org):
        org.settings = {"energy_grid_mix_type": "residual"}
        session.flush()

        result = resolve_org_settings(session, org.id)
        assert result["energy_grid_mix_type"] == "residual"


# ---------------------------------------------------------------------------
# Source tracking
# ---------------------------------------------------------------------------


class TestResolveWithSources:
    def test_all_defaults(self, session, project):
        result = resolve_settings_with_sources(session, project.id)
        for key in SETTINGS_DEFAULTS:
            assert result[key]["source"] == "default"
            assert result[key]["value"] == SETTINGS_DEFAULTS[key]

    def test_org_source(self, session, org, project):
        org.settings = {"energy_grid_emission_factor": 0.5}
        session.flush()

        result = resolve_settings_with_sources(session, project.id)
        assert result["energy_grid_emission_factor"]["source"] == "organization"
        assert result["energy_grid_emission_factor"]["value"] == 0.5
        assert result["energy_grid_mix_type"]["source"] == "default"

    def test_project_source(self, session, org, project):
        org.settings = {"energy_grid_emission_factor": 0.5}
        project.settings = {"energy_grid_emission_factor": 0.9}
        session.flush()

        result = resolve_settings_with_sources(session, project.id)
        assert result["energy_grid_emission_factor"]["source"] == "project"
        assert result["energy_grid_emission_factor"]["value"] == 0.9

    def test_unknown_db_keys_ignored(self, session, org, project):
        org.settings = {"unknown_future_key": "whatever"}
        session.flush()

        result = resolve_settings_with_sources(session, project.id)
        assert "unknown_future_key" not in result


class TestResolveOrgWithSources:
    def test_all_defaults(self, session, org):
        result = resolve_org_settings_with_sources(session, org.id)
        for key in SETTINGS_DEFAULTS:
            assert result[key]["source"] == "default"

    def test_override_source(self, session, org):
        org.settings = {"confidence_weighting": "co2_weighted"}
        session.flush()

        result = resolve_org_settings_with_sources(session, org.id)
        assert result["confidence_weighting"]["source"] == "organization"
        assert result["confidence_weighting"]["value"] == "co2_weighted"


# ---------------------------------------------------------------------------
# Snapshot
# ---------------------------------------------------------------------------


class TestResolveForSnapshot:
    def test_snapshot_shape(self, session, project):
        snap = resolve_for_snapshot(session, project.id)
        assert "energy" in snap
        assert "materials" in snap
        assert "transport" in snap
        assert "waste" in snap
        assert "confidence" in snap
        assert snap["energy"]["grid_emission_factor"] == 0.0119

    def test_snapshot_reflects_override(self, session, org, project):
        org.settings = {"energy_grid_emission_factor": 0.3}
        session.flush()

        snap = resolve_for_snapshot(session, project.id)
        assert snap["energy"]["grid_emission_factor"] == 0.3
