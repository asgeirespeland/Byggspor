"""Orchestration service for material invoice processing.

Handles the full pipeline: parse EHF XML → enrich via catalog/NOBB →
persist to database (material catalog + project_materials + source invoice).
"""

import logging
from datetime import datetime

from sqlalchemy.orm import Session

from app.config.project_defaults import MATERIAL_GWP_STAGES
from app.models.material import Material
from app.models.material_invoice import MaterialInvoice
from app.models.project_material import MaterialSourceType, ProjectMaterial
from app.services.ehf_parser import parse_invoice
from app.services.invoice_enrichment import enrich_invoice
from app.utils.confidence import material_confidence

logger = logging.getLogger(__name__)


def upsert_catalog_entry(
    session: Session,
    item: dict,
    gwp_stages: list[str] | None = None,
    *,
    include_a4: bool = False,
    include_biogenic: bool = False,
) -> Material | None:
    """Find or create a Material catalog entry by GTIN or NOBB number.

    If NOBB enrichment data is available, updates the catalog entry.
    Returns the Material instance, or None if no identifier is available.
    """
    gtin = item.get("gtin")
    nobb_number = item.get("nobb_number")

    if not gtin and not nobb_number:
        return None

    # Look up existing catalog entry
    material = None
    if gtin:
        material = session.query(Material).filter(Material.gtin == gtin).first()
    if material is None and nobb_number:
        material = (
            session.query(Material)
            .filter(Material.nobb_number == str(nobb_number))
            .first()
        )

    nobb_data = item.get("nobb_data")

    if material is None:
        # Create new catalog entry
        material = Material(
            gtin=gtin,
            nobb_number=str(nobb_number) if nobb_number else None,
            product_name=item.get("name"),
        )
        if nobb_data:
            _apply_nobb_data(
                material,
                nobb_data,
                gwp_stages,
                include_a4=include_a4,
                include_biogenic=include_biogenic,
            )
        session.add(material)
        session.flush()
    elif nobb_data:
        # Update existing entry with fresh NOBB data
        _apply_nobb_data(
            material,
            nobb_data,
            gwp_stages,
            include_a4=include_a4,
            include_biogenic=include_biogenic,
        )
        material.updated_at = datetime.now()

    return material


def _apply_nobb_data(
    material: Material,
    nobb_data: dict,
    gwp_stages: list[str] | None = None,
    *,
    include_a4: bool = False,
    include_biogenic: bool = False,
) -> None:
    """Apply NOBB API data to a Material catalog entry."""
    material.product_name = nobb_data.get("name") or material.product_name
    material.nobb_number = (
        str(nobb_data["nobb_number"])
        if nobb_data.get("nobb_number")
        else material.nobb_number
    )
    material.product_group = nobb_data.get("product_group")

    epd = nobb_data.get("epd")
    if epd:
        material.has_epd = True
        material.epd_id = epd.get("epd_number")
        gwp_stages_data = epd.get("gwp_stages", {})
        if isinstance(gwp_stages_data, dict) and gwp_stages_data:
            material.epd_gwp = gwp_stages_data
        material.gwp_per_unit = compute_gwp_from_stages(
            material.epd_gwp,
            gwp_stages,
            include_a4=include_a4,
            include_biogenic=include_biogenic,
        )
    else:
        material.has_epd = nobb_data.get("has_epd", False)


def compute_gwp_from_stages(
    epd_gwp: dict | None,
    gwp_stages: list[str] | None = None,
    *,
    include_a4: bool = False,
    include_biogenic: bool = False,
) -> float | None:
    """Sum GWP across configured stages from stored EPD data.

    EPD data is a dict like:
        {"a1_a3": {"total": 1.5, "fossil": 1.2, "biogenic": 0.3}, "a4": ...}

    When include_biogenic is False, uses the ``fossil`` component instead of
    ``total`` (since total = fossil + biogenic).  Falls back to ``total`` if
    the fossil breakdown isn't available.

    When include_a4 is True, the "a4" stage is added to the sum even if it's
    not in gwp_stages.
    """
    if not epd_gwp or not isinstance(epd_gwp, dict):
        return None

    stages = list(gwp_stages or MATERIAL_GWP_STAGES)
    if include_a4 and "a4" not in stages:
        stages.append("a4")
    elif not include_a4 and "a4" in stages:
        stages = [s for s in stages if s != "a4"]

    total = 0.0
    found_any = False

    for stage_key in stages:
        stage_data = epd_gwp.get(stage_key) or epd_gwp.get(stage_key.upper())
        if not isinstance(stage_data, dict):
            continue

        if not include_biogenic and stage_data.get("fossil") is not None:
            value = stage_data["fossil"]
        elif stage_data.get("total") is not None:
            value = stage_data["total"]
        else:
            continue

        try:
            total += float(value)
            found_any = True
        except (ValueError, TypeError):
            pass

    return round(total, 6) if found_any else None


def process_invoice_for_project(
    session: Session,
    project_id: int,
    xml_content: bytes,
    gwp_stages: list[str] | None = None,
    *,
    include_a4: bool = False,
    include_biogenic: bool = False,
) -> dict:
    """Full pipeline: parse EHF XML, enrich, and persist to database.

    Flow:
    1. Parse XML (stateless)
    2. Enrich — checks material catalog DB first, then NOBB API for misses
    3. Persist: MaterialInvoice (source), Material catalog (upsert),
       ProjectMaterial (usage)

    Returns a summary dict with the enriched invoice data and DB IDs.
    """
    # 1. Parse XML
    parsed = parse_invoice(xml_content)

    # 2. Enrich — catalog check happens inside enrich_invoice when session is provided
    enriched = enrich_invoice(parsed, session=session)

    # 3. Create source invoice record
    supplier = enriched.get("supplier") or {}
    invoice_record = MaterialInvoice(
        supplier_name=supplier.get("name"),
        invoice_number=enriched.get("invoice_number"),
        invoice_date=enriched.get("issue_date"),
        processed_at=datetime.now(),
    )
    session.add(invoice_record)
    session.flush()

    # 4. Process each line item
    project_materials_created = []
    for item in enriched.get("line_items", []):
        # Upsert to material catalog
        catalog_entry = upsert_catalog_entry(
            session,
            item,
            gwp_stages,
            include_a4=include_a4,
            include_biogenic=include_biogenic,
        )

        # Create project_material
        pm = ProjectMaterial(
            project_id=project_id,
            material_id=catalog_entry.id if catalog_entry else None,
            source_id=invoice_record.id,
            source_type=MaterialSourceType.EHF_INVOICE,
            line_number=item.get("line_number"),
            quantity=item.get("quantity"),
            unit=item.get("unit"),
            price_per_unit=item.get("price_per_unit"),
            total_price=item.get("line_total"),
            flagged=item.get("flagged", False),
            notes=item.get("name"),
        )

        # Calculate CO2 if we have GWP data
        has_gwp = bool(catalog_entry and catalog_entry.gwp_per_unit and pm.quantity)
        if has_gwp:
            pm.total_co2_kg = float(catalog_entry.gwp_per_unit) * float(pm.quantity)
        pm.confidence_score = material_confidence(
            has_gwp=has_gwp,
            flagged=pm.flagged,
            is_manual_override=False,
        )

        session.add(pm)
        project_materials_created.append(pm)

    session.flush()

    return {
        **enriched,
        "material_invoice_id": invoice_record.id,
        "project_materials_count": len(project_materials_created),
        "catalog_entries_count": len(
            {pm.material_id for pm in project_materials_created if pm.material_id}
        ),
    }
