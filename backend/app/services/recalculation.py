"""Recalculate stored CO₂ values for a project based on current settings.

Called after settings are updated so that existing records reflect the
new emission factors, GWP stages, etc.  Only recalculates the categories
whose settings actually changed.
"""

from __future__ import annotations

import logging

from sqlalchemy.orm import Session

from app.config.settings_resolver import resolve_settings
from app.models.energy import Energy
from app.models.project_material import ProjectMaterial
from app.models.project_waste_item import ProjectWasteItem, WasteSourceType
from app.services.material_service import compute_gwp_from_stages

logger = logging.getLogger(__name__)

# Maps setting keys to the recalculation category they affect
_SETTING_TO_CATEGORY: dict[str, str] = {
    "energy_grid_emission_factor": "energy",
    "energy_grid_mix_type": "energy",
    "material_gwp_stages": "materials",
    "material_include_a4": "materials",
    "material_include_biogenic": "materials",
    "waste_manual_emission_factors": "waste",
    "waste_epd_stages": "waste",
}


def recalculate_project(
    session: Session,
    project_id: int,
    changed_keys: set[str] | None = None,
) -> dict:
    """Recalculate CO₂ values for a project, scoped to changed settings.

    If changed_keys is None, recalculates everything.
    Returns a summary of how many records were updated per category.
    """
    categories = set()
    if changed_keys is None:
        categories = {"energy", "waste", "materials"}
    else:
        for key in changed_keys:
            cat = _SETTING_TO_CATEGORY.get(key)
            if cat:
                categories.add(cat)

    if not categories:
        return {}

    settings = resolve_settings(session, project_id)
    result = {}

    if "energy" in categories:
        result["energy_updated"] = _recalc_energy(session, project_id, settings)
    if "waste" in categories:
        result["waste_updated"] = _recalc_waste(session, project_id, settings)
    if "materials" in categories:
        result["materials_updated"] = _recalc_materials(session, project_id, settings)

    return result


def _recalc_energy(session: Session, project_id: int, settings: dict) -> int:
    """Recalculate energy CO₂: total_co2_kg = kwh_used * emission_factor."""
    emission_factor = settings["energy_grid_emission_factor"]

    entries = session.query(Energy).filter(Energy.project_id == project_id).all()

    count = 0
    for entry in entries:
        if entry.kwh_used is not None:
            new_co2 = round(float(entry.kwh_used) * emission_factor, 4)
            entry.total_co2_kg = new_co2
            entry.grid_emission_factor = emission_factor
            count += 1

    return count


def _recalc_waste(session: Session, project_id: int, settings: dict) -> int:
    """Recalculate manual waste CO₂ using current emission factors."""
    emission_factors = settings["waste_manual_emission_factors"]

    items = (
        session.query(ProjectWasteItem)
        .filter(
            ProjectWasteItem.project_id == project_id,
            ProjectWasteItem.source_type == WasteSourceType.MANUAL,
        )
        .all()
    )

    count = 0
    for item in items:
        if item.waste_type and item.quantity is not None:
            normalized = item.waste_type.strip().lower()
            factor = emission_factors.get(normalized)
            if factor is not None:
                new_co2 = round(float(item.quantity) * factor, 4)
                item.calculated_co2_kg = new_co2
                item.total_co2_kg = new_co2
                count += 1

    return count


def _recalc_materials(session: Session, project_id: int, settings: dict) -> int:
    """Recalculate material CO₂ by re-summing EPD stages."""
    gwp_stages = settings["material_gwp_stages"]

    items = (
        session.query(ProjectMaterial)
        .filter(
            ProjectMaterial.project_id == project_id,
            ProjectMaterial.manual_override == False,  # noqa: E712
        )
        .all()
    )

    include_a4 = settings.get("material_include_a4", False)
    include_biogenic = settings.get("material_include_biogenic", False)

    count = 0
    for pm in items:
        if pm.material and pm.material.epd_gwp and pm.quantity:
            new_gwp = compute_gwp_from_stages(
                pm.material.epd_gwp,
                gwp_stages,
                include_a4=include_a4,
                include_biogenic=include_biogenic,
            )
            if new_gwp is not None:
                pm.total_co2_kg = round(new_gwp * float(pm.quantity), 4)
                count += 1

    return count
