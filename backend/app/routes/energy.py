"""Energy input and CO₂ calculation routes.

Emission factor source: NVE klimadeklarasjon 2024 — 11.9 g CO₂eq/kWh
(national average for physically delivered electricity in Norway).
https://www.nve.no/energi/energisystem/energibruk/stroemdeklarasjoner/

NOTE: NVE only publishes a national average. Per-zone (NO1–NO5) factors
are not officially available. The price_zone field is stored for future
use when regional emission data becomes available.
"""

from __future__ import annotations

from flask import Blueprint, g, jsonify, request

from app.config.settings_resolver import resolve_settings
from app.errors import ApiError
from app.middleware.auth import require_auth
from app.middleware.roles import require_project_role
from app.models.energy import Energy, EnergySource, PriceZone
from app.models.project_member import ProjectRole
from app.utils.confidence import ENERGY_CONFIDENCE
from app.utils.db import db_commit
from app.utils.parsing import (
    optional_date,
    parse_enum,
    parse_float,
    require_float,
    require_int,
)

energy_bp = Blueprint("energy", __name__, url_prefix="/energy")

PRICE_ZONE_LABELS = {
    "NO1": "Østlandet (Oslo, Akershus, Østfold, Buskerud, Innlandet)",
    "NO2": "Sørlandet (Agder, Rogaland, Vestfold, Telemark)",
    "NO3": "Midt-Norge (Trøndelag, Møre og Romsdal)",
    "NO4": "Nord-Norge (Nordland, Troms)",
    "NO5": "Vestlandet (Vestland)",
}


@energy_bp.route("/calculate", methods=["POST"])
@require_auth
def calculate_energy():
    """Calculate CO₂ from manual kWh input and persist to database.

    Expects JSON: { project_id, kwh_used, price_zone?, recorded_date? }
    """

    payload = request.get_json(silent=True) or {}
    project_id = require_int(payload, "project_id")
    kwh_used = require_float(
        payload,
        "kwh_used",
        allow_negative=False,
        suggestion="Oppgi str\u00f8mforbruk som et tall (f.eks. 1500.5).",
    )

    price_zone_str = payload.get("price_zone")
    price_zone = parse_enum(price_zone_str, PriceZone)
    if price_zone_str and not price_zone:
        valid = [z.value for z in PriceZone]
        raise ApiError(
            f"Ugyldig prissone. Gyldige verdier: {valid}",
            code="INVALID_FIELD",
            suggestion="Velg en prissone fra NO1 til NO5.",
        )

    period_start = optional_date(payload, "period_start")
    recorded_date = optional_date(payload, "recorded_date")
    cost_per_kwh = (
        parse_float(
            payload,
            "cost_per_kwh",
            suggestion="Oppgi kostnad pr. kWh som et tall (f.eks. 0.95).",
        )
        if "cost_per_kwh" in payload
        else None
    )

    settings = resolve_settings(g.db, project_id)
    emission_factor = settings["energy_grid_emission_factor"]
    total_co2_kg = round(kwh_used * emission_factor, 4)

    session = g.db
    energy = Energy(
        project_id=project_id,
        source=EnergySource.MANUAL,
        price_zone=price_zone,
        kwh_used=kwh_used,
        grid_emission_factor=emission_factor,
        total_co2_kg=total_co2_kg,
        period_start=period_start,
        recorded_date=recorded_date,
        cost_per_kwh=cost_per_kwh,
        confidence_score=ENERGY_CONFIDENCE,
    )
    with db_commit(session, "Kunne ikke lagre energiposten.", "SAVE_FAILED"):
        session.add(energy)

    session.refresh(energy)
    return jsonify(energy.to_dict()), 201


@energy_bp.route("/entry/<int:energy_id>", methods=["PATCH"])
@require_auth
def update_energy(energy_id: int):
    """Update an existing energy entry.

    Accepts JSON with any of: { kwh_used, price_zone, recorded_date }
    Recalculates CO₂ if kwh_used changes.
    """

    session = g.db
    energy = session.get(Energy, energy_id)
    if not energy:
        raise ApiError("Energiposten ble ikke funnet.", code="NOT_FOUND", status=404)

    payload = request.get_json(silent=True) or {}

    if "kwh_used" in payload:
        kwh = parse_float(
            payload,
            "kwh_used",
            suggestion="Oppgi str\u00f8mforbruk som et tall (f.eks. 1500.5).",
        )
        if kwh < 0:
            raise ApiError(
                "kwh_used kan ikke v\u00e6re negativt.",
                code="INVALID_FIELD",
                suggestion="Oppgi en positiv verdi for str\u00f8mforbruk.",
            )
        energy.kwh_used = kwh
        settings = resolve_settings(g.db, energy.project_id)
        energy.total_co2_kg = round(kwh * settings["energy_grid_emission_factor"], 4)

    if "price_zone" in payload:
        pz = parse_enum(payload["price_zone"], PriceZone)
        if payload["price_zone"] and not pz:
            valid = [z.value for z in PriceZone]
            raise ApiError(
                f"Ugyldig prissone. Gyldige verdier: {valid}",
                code="INVALID_FIELD",
                suggestion="Velg en prissone fra NO1 til NO5.",
            )
        energy.price_zone = pz

    if "period_start" in payload:
        energy.period_start = optional_date(payload, "period_start")

    if "recorded_date" in payload:
        energy.recorded_date = optional_date(payload, "recorded_date")

    if "cost_per_kwh" in payload:
        energy.cost_per_kwh = parse_float(
            payload,
            "cost_per_kwh",
            suggestion="Oppgi kostnad pr. kWh som et tall (f.eks. 0.95).",
        )

    with db_commit(session, "Kunne ikke oppdatere energiposten.", "UPDATE_FAILED"):
        pass

    session.refresh(energy)
    return jsonify(energy.to_dict()), 200


@energy_bp.route("/<int:project_id>", methods=["GET"])
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR, ProjectRole.VIEWER))
def list_energies(project_id: int):
    """List all energy entries for a project."""

    session = g.db
    entries = (
        session.query(Energy)
        .filter(Energy.project_id == project_id)
        .order_by(Energy.recorded_date.desc().nulls_last(), Energy.created_at.desc())
        .all()
    )

    return jsonify([e.to_dict() for e in entries])


@energy_bp.route("/entry/<int:energy_id>", methods=["DELETE"])
@require_auth
def delete_energy(energy_id: int):
    """Delete a single energy entry."""

    session = g.db
    energy = session.get(Energy, energy_id)
    if not energy:
        raise ApiError("Energiposten ble ikke funnet.", code="NOT_FOUND", status=404)

    with db_commit(session, "Kunne ikke slette energiposten.", "DELETE_FAILED"):
        session.delete(energy)

    return jsonify(message="Deleted"), 200


@energy_bp.route("/zones", methods=["GET"])
def list_zones():
    """Return available price zones with labels."""
    zones = [{"value": z.value, "label": PRICE_ZONE_LABELS[z.value]} for z in PriceZone]
    return jsonify(zones)
