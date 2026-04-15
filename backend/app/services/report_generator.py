"""Generates a detailed CO₂ report for a project.

Returns a neutral intermediate format that can be consumed by
the frontend ReportTab (#25) and future PDF/EHF generation (#26).
"""

from __future__ import annotations

from sqlalchemy.orm import Session, joinedload

from app.config.settings_snapshot import get_active_settings
from app.models.energy import Energy
from app.models.material import Material
from app.models.material_invoice import MaterialInvoice
from app.models.project_material import ProjectMaterial
from app.models.project_transport import ProjectTransport
from app.models.project_waste_item import ProjectWasteItem
from app.models.transport_report import TransportReport
from app.models.vehicle import Vehicle
from app.models.waste_invoice import WasteInvoice


def _float(val) -> float | None:
    return float(val) if val is not None else None


def _material_items(session: Session, project_id: int) -> list[dict]:
    rows = (
        session.query(ProjectMaterial)
        .options(
            joinedload(ProjectMaterial.material),
            joinedload(ProjectMaterial.source_invoice),
        )
        .filter(ProjectMaterial.project_id == project_id)
        .order_by(ProjectMaterial.id)
        .all()
    )

    items = []
    for pm in rows:
        mat: Material | None = pm.material
        inv: MaterialInvoice | None = pm.source_invoice
        items.append(
            {
                "id": pm.id,
                "product_name": mat.product_name if mat else None,
                "nobb_number": mat.nobb_number if mat else None,
                "gtin": mat.gtin if mat else None,
                "quantity": _float(pm.quantity),
                "unit": pm.unit,
                "gwp_per_unit": _float(mat.gwp_per_unit) if mat else None,
                "total_co2_kg": _float(pm.total_co2_kg),
                "confidence_score": pm.confidence_score,
                "has_epd": mat.has_epd if mat else False,
                "epd_id": mat.epd_id if mat else None,
                "source_type": pm.source_type.value if pm.source_type else None,
                "supplier_name": inv.supplier_name if inv else None,
                "invoice_number": inv.invoice_number if inv else None,
                "source_id": pm.source_id,
            }
        )
    return items


def _transport_items(session: Session, project_id: int) -> list[dict]:
    rows = (
        session.query(ProjectTransport)
        .options(
            joinedload(ProjectTransport.vehicle),
            joinedload(ProjectTransport.source_report),
        )
        .filter(ProjectTransport.project_id == project_id)
        .order_by(ProjectTransport.id)
        .all()
    )

    items = []
    for pt in rows:
        v: Vehicle | None = pt.vehicle
        report: TransportReport | None = pt.source_report
        items.append(
            {
                "id": pt.id,
                "trip_date": pt.trip_date.isoformat() if pt.trip_date else None,
                "start_address": pt.start_address,
                "end_address": pt.end_address,
                "distance_km": _float(pt.distance_km),
                "total_co2_kg": _float(pt.total_co2_kg),
                "confidence_score": pt.confidence_score,
                "source_type": pt.source_type.value if pt.source_type else None,
                "source_name": report.file_name if report else None,
                "vehicle": {
                    "registration_number": v.registration_number,
                    "make": v.make,
                    "model": v.model,
                    "fuel_type": v.fuel_type,
                }
                if v
                else None,
                "source_id": pt.source_id,
            }
        )
    return items


def _waste_items(session: Session, project_id: int) -> list[dict]:
    rows = (
        session.query(ProjectWasteItem)
        .options(joinedload(ProjectWasteItem.source_invoice))
        .filter(ProjectWasteItem.project_id == project_id)
        .order_by(ProjectWasteItem.id)
        .all()
    )

    items = []
    for pw in rows:
        inv: WasteInvoice | None = pw.source_invoice
        items.append(
            {
                "id": pw.id,
                "waste_type": pw.waste_type,
                "quantity_tons": _float(pw.quantity_tons),
                "total_co2_kg": _float(pw.total_co2_kg),
                "confidence_score": pw.confidence_score,
                "source_type": pw.source_type.value if pw.source_type else None,
                "source_name": inv.file_path if inv else None,
                "supplier_name": inv.supplier_name if inv else None,
                "source_id": pw.source_id,
            }
        )
    return items


def _energy_items(session: Session, project_id: int) -> list[dict]:
    rows = (
        session.query(Energy)
        .filter(Energy.project_id == project_id)
        .order_by(Energy.id)
        .all()
    )

    items = []
    for e in rows:
        items.append(
            {
                "id": e.id,
                "kwh_used": _float(e.kwh_used),
                "price_zone": e.price_zone.value if e.price_zone else None,
                "grid_emission_factor": _float(e.grid_emission_factor),
                "total_co2_kg": _float(e.total_co2_kg),
                "confidence_score": e.confidence_score,
                "recorded_date": (
                    e.recorded_date.isoformat() if e.recorded_date else None
                ),
                "source": e.source.value if e.source else None,
            }
        )
    return items


def _category_summary(items: list[dict]) -> dict:
    total_co2 = sum(i.get("total_co2_kg") or 0 for i in items)
    scores = [
        i["confidence_score"] for i in items if i.get("confidence_score") is not None
    ]
    avg_confidence = round(sum(scores) / len(scores), 1) if scores else None
    return {
        "total_co2_kg": round(total_co2, 4),
        "entry_count": len(items),
        "avg_confidence": avg_confidence,
    }


def get_detailed_report(session: Session, project_id: int) -> dict:
    """Build a full line-item breakdown for all four CO₂ categories."""

    materials = _material_items(session, project_id)
    transport = _transport_items(session, project_id)
    waste = _waste_items(session, project_id)
    energy = _energy_items(session, project_id)

    categories = {
        "materials": {**_category_summary(materials), "items": materials},
        "transport": {**_category_summary(transport), "items": transport},
        "waste": {**_category_summary(waste), "items": waste},
        "energy": {**_category_summary(energy), "items": energy},
    }

    grand_total = sum(c["total_co2_kg"] for c in categories.values())

    # Data source breakdown across all entries
    all_items = materials + transport + waste + energy
    source_counts: dict[str, int] = {}
    for item in all_items:
        src = item.get("source_type") or item.get("source") or "unknown"
        source_counts[src] = source_counts.get(src, 0) + 1

    return {
        "project_id": project_id,
        "total_co2_kg": round(grand_total, 4),
        "categories": categories,
        "settings": get_active_settings(),
        "data_sources": source_counts,
    }
