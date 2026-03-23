"""Energy input and CO₂ calculation routes.

Emission factor source: NVE klimadeklarasjon 2024 — 11.9 g CO₂eq/kWh
(national average for physically delivered electricity in Norway).
https://www.nve.no/energi/energisystem/energibruk/stroemdeklarasjoner/

NOTE: NVE only publishes a national average. Per-zone (NO1–NO5) factors
are not officially available. The price_zone field is stored for future
use when regional emission data becomes available.
"""

from __future__ import annotations

import logging
from datetime import date

from flask import Blueprint, g, jsonify, request

from app.models.energy import Energy, EnergySource, PriceZone

logger = logging.getLogger(__name__)

energy_bp = Blueprint("energy", __name__, url_prefix="/energy")

# NVE klimadeklarasjon 2024 — national average (kg CO₂eq per kWh)
NVE_NATIONAL_EMISSION_FACTOR = 0.0119

PRICE_ZONE_LABELS = {
    "NO1": "Østlandet (Oslo, Akershus, Østfold, Buskerud, Innlandet)",
    "NO2": "Sørlandet (Agder, Rogaland, Vestfold, Telemark)",
    "NO3": "Midt-Norge (Trøndelag, Møre og Romsdal)",
    "NO4": "Nord-Norge (Nordland, Troms)",
    "NO5": "Vestlandet (Vestland)",
}


def _parse_price_zone(value: str | None) -> PriceZone | None:
    if not value:
        return None
    try:
        return PriceZone(value)
    except ValueError:
        return None


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


def _serialize_energy(energy: Energy) -> dict:
    return {
        "id": energy.id,
        "project_id": energy.project_id,
        "source": energy.source.value if energy.source else None,
        "price_zone": energy.price_zone.value if energy.price_zone else None,
        "kwh_used": float(energy.kwh_used) if energy.kwh_used is not None else None,
        "grid_emission_factor": (
            float(energy.grid_emission_factor)
            if energy.grid_emission_factor is not None
            else None
        ),
        "total_co2_kg": (
            float(energy.total_co2_kg) if energy.total_co2_kg is not None else None
        ),
        "confidence_score": energy.confidence_score,
        "recorded_date": (
            energy.recorded_date.isoformat() if energy.recorded_date else None
        ),
        "created_at": (energy.created_at.isoformat() if energy.created_at else None),
    }


@energy_bp.route("/calculate", methods=["POST"])
def calculate_energy():
    """Calculate CO₂ from manual kWh input and persist to database.

    Expects JSON: { project_id, kwh_used, price_zone?, recorded_date? }
    """
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    payload = request.get_json(silent=True) or {}

    project_id = payload.get("project_id")
    if not project_id:
        return jsonify(error="project_id is required"), 400
    try:
        project_id = int(project_id)
    except (ValueError, TypeError):
        return jsonify(error="project_id must be an integer"), 400

    kwh_used = payload.get("kwh_used")
    if kwh_used is None:
        return jsonify(error="kwh_used is required"), 400
    try:
        kwh_used = float(kwh_used)
        if kwh_used < 0:
            return jsonify(error="kwh_used must be non-negative"), 400
    except (ValueError, TypeError):
        return jsonify(error="kwh_used must be a number"), 400

    price_zone_str = payload.get("price_zone")
    price_zone = _parse_price_zone(price_zone_str)
    if price_zone_str and not price_zone:
        valid = [z.value for z in PriceZone]
        return jsonify(error=f"Invalid price_zone. Valid: {valid}"), 400

    try:
        recorded_date = _parse_date(payload.get("recorded_date"))
    except ValueError:
        return jsonify(error="recorded_date must be ISO format (YYYY-MM-DD)"), 400

    emission_factor = NVE_NATIONAL_EMISSION_FACTOR
    total_co2_kg = round(kwh_used * emission_factor, 4)

    session = g.db
    energy = Energy(
        project_id=project_id,
        source=EnergySource.MANUAL,
        price_zone=price_zone,
        kwh_used=kwh_used,
        grid_emission_factor=emission_factor,
        total_co2_kg=total_co2_kg,
        recorded_date=recorded_date,
        confidence_score=100,
    )
    session.add(energy)

    try:
        session.commit()
        session.refresh(energy)
    except Exception as e:
        session.rollback()
        logger.exception("Failed to save energy entry")
        return jsonify(error=f"Failed to save: {e}"), 500

    return jsonify(_serialize_energy(energy)), 201


@energy_bp.route("/entry/<int:energy_id>", methods=["PATCH"])
def update_energy(energy_id: int):
    """Update an existing energy entry.

    Accepts JSON with any of: { kwh_used, price_zone, recorded_date }
    Recalculates CO₂ if kwh_used changes.
    """
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    session = g.db
    energy = session.query(Energy).filter(Energy.id == energy_id).first()
    if not energy:
        return jsonify(error="Energy entry not found"), 404

    payload = request.get_json(silent=True) or {}

    if "kwh_used" in payload:
        try:
            kwh = float(payload["kwh_used"])
            if kwh < 0:
                return jsonify(error="kwh_used must be non-negative"), 400
            energy.kwh_used = kwh
            energy.total_co2_kg = round(kwh * NVE_NATIONAL_EMISSION_FACTOR, 4)
        except (ValueError, TypeError):
            return jsonify(error="kwh_used must be a number"), 400

    if "price_zone" in payload:
        pz = _parse_price_zone(payload["price_zone"])
        if payload["price_zone"] and not pz:
            valid = [z.value for z in PriceZone]
            return jsonify(error=f"Invalid price_zone. Valid: {valid}"), 400
        energy.price_zone = pz

    if "recorded_date" in payload:
        try:
            energy.recorded_date = _parse_date(payload["recorded_date"])
        except ValueError:
            return jsonify(error="recorded_date must be ISO format (YYYY-MM-DD)"), 400

    try:
        session.commit()
        session.refresh(energy)
    except Exception as e:
        session.rollback()
        logger.exception("Failed to update energy entry")
        return jsonify(error=f"Failed to update: {e}"), 500

    return jsonify(_serialize_energy(energy)), 200


@energy_bp.route("/<int:project_id>", methods=["GET"])
def list_energies(project_id: int):
    """List all energy entries for a project."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    session = g.db
    entries = (
        session.query(Energy)
        .filter(Energy.project_id == project_id)
        .order_by(Energy.recorded_date.desc().nulls_last(), Energy.created_at.desc())
        .all()
    )

    return jsonify([_serialize_energy(e) for e in entries])


@energy_bp.route("/entry/<int:energy_id>", methods=["DELETE"])
def delete_energy(energy_id: int):
    """Delete a single energy entry."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    session = g.db
    energy = session.query(Energy).filter(Energy.id == energy_id).first()
    if not energy:
        return jsonify(error="Energy entry not found"), 404

    session.delete(energy)

    try:
        session.commit()
    except Exception as e:
        session.rollback()
        logger.exception("Failed to delete energy entry")
        return jsonify(error=f"Failed to delete: {e}"), 500

    return jsonify(message="Deleted"), 200


@energy_bp.route("/zones", methods=["GET"])
def list_zones():
    """Return available price zones with labels."""
    zones = [{"value": z.value, "label": PRICE_ZONE_LABELS[z.value]} for z in PriceZone]
    return jsonify(zones)
