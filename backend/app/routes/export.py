"""Export routes — EHF invoice generation and download.

POST /export/project/<project_id>/generate
    Accepts customer info + format options in JSON body.
    Creates GeneratedInvoice + InvoiceLine records, generates EHF XML,
    stores the file, and returns the invoice record.

GET /export/<invoice_id>/ehf
    Downloads the generated EHF XML file for the given invoice.

NOTE: The detailed CO2 report service (MH13) is still under development.
      This route builds InvoiceLines from the project's raw entries directly.
      Once the report service is available, `_collect_lines` should be replaced
      with a call to that service.
"""

from __future__ import annotations

import logging
import os
from datetime import UTC, date, datetime

from flask import Blueprint, g, jsonify, request, send_file

from app.errors import ApiError
from app.middleware.auth import require_auth
from app.middleware.roles import require_project_role
from app.models.energy import Energy
from app.models.generated_invoice import GeneratedInvoice, InvoiceFormatType
from app.models.invoice_line import (
    InvoiceLine,
    InvoiceLineCategory,
    InvoiceLineSourceType,
)
from app.models.project import Project
from app.models.project_material import ProjectMaterial
from app.models.project_member import ProjectRole
from app.models.project_transport import ProjectTransport
from app.models.project_waste_item import ProjectWasteItem
from app.services.ehf_generator import generate_ehf
from app.utils.db import db_commit

logger = logging.getLogger(__name__)

export_bp = Blueprint("export", __name__, url_prefix="/export")

# Storage directory for generated EHF XML files.
# Override with INVOICE_STORAGE_PATH env var in production.
_DEFAULT_STORAGE = os.path.join(
    os.path.dirname(__file__), "..", "..", "storage", "invoices"
)
INVOICE_STORAGE_PATH = os.environ.get("INVOICE_STORAGE_PATH", _DEFAULT_STORAGE)


def _ensure_storage_dir() -> str:
    path = os.path.abspath(INVOICE_STORAGE_PATH)
    os.makedirs(path, exist_ok=True)
    return path


def _collect_lines(
    session,
    project_id: int,
    format_type: InvoiceFormatType,
) -> list[InvoiceLine]:
    """Build InvoiceLine objects from project entries.

    This is a stub implementation that reads directly from the project's raw
    data tables. Replace the body of this function with a call to the
    detailed CO2 report service (MH13) once it is available.

    For AGGREGATED format: one line per category with summed totals.
    For DETAILED format: one line per individual entry.
    """
    lines: list[InvoiceLine] = []

    if format_type == InvoiceFormatType.DETAILED:
        lines.extend(_lines_from_materials(session, project_id))
        lines.extend(_lines_from_transports(session, project_id))
        lines.extend(_lines_from_waste(session, project_id))
        lines.extend(_lines_from_energy(session, project_id))
    else:
        lines.extend(_aggregated_lines(session, project_id))

    return lines


def _lines_from_materials(session, project_id: int) -> list[InvoiceLine]:
    materials = (
        session.query(ProjectMaterial)
        .filter(ProjectMaterial.project_id == project_id)
        .all()
    )
    lines = []
    for pm in materials:
        name = pm.material.product_name if pm.material else pm.notes or "Material"
        qty = float(pm.quantity or 1)
        unit_price = float(pm.price_per_unit or 0)
        line_total = float(pm.total_price or unit_price * qty)
        lines.append(
            InvoiceLine(
                category=InvoiceLineCategory.MATERIAL,
                description=name,
                quantity=qty,
                unit=pm.unit or "STK",
                unit_price_kr=unit_price,
                vat_rate=0.25,
                line_total_kr=line_total,
                total_co2_kg=float(pm.total_co2_kg) if pm.total_co2_kg else None,
                confidence_score=pm.confidence_score,
                epd_id=pm.material.epd_id if pm.material else None,
                source_type=InvoiceLineSourceType.PROJECT_MATERIAL,
                source_id=pm.id,
            )
        )
    return lines


def _lines_from_transports(session, project_id: int) -> list[InvoiceLine]:
    transports = (
        session.query(ProjectTransport)
        .filter(ProjectTransport.project_id == project_id)
        .all()
    )
    lines = []
    for t in transports:
        vehicle_label = "kjøretøy"
        if t.vehicle and t.vehicle.make:
            vehicle_label = t.vehicle.make
        desc = f"Transport — {vehicle_label}"
        if t.start_address and t.end_address:
            desc += f": {t.start_address} → {t.end_address}"
        km = float(t.distance_km or 0)
        cost_per_km = float(t.cost_per_km or 0)
        line_total = round(km * cost_per_km, 2)
        lines.append(
            InvoiceLine(
                category=InvoiceLineCategory.TRANSPORT,
                description=desc,
                quantity=km,
                unit="KMT",
                unit_price_kr=cost_per_km,
                vat_rate=0.25,
                line_total_kr=line_total,
                total_co2_kg=float(t.total_co2_kg) if t.total_co2_kg else None,
                confidence_score=t.confidence_score,
                source_type=InvoiceLineSourceType.TRANSPORT,
                source_id=t.id,
            )
        )
    return lines


def _lines_from_waste(session, project_id: int) -> list[InvoiceLine]:
    waste_items = (
        session.query(ProjectWasteItem)
        .filter(ProjectWasteItem.project_id == project_id)
        .all()
    )
    lines = []
    for w in waste_items:
        desc = f"Avfall — {w.waste_type or 'ukjent type'}"
        qty = float(w.quantity_tons or 0)
        cost_per_ton = float(getattr(w, "cost_per_ton", None) or 0)
        line_total = round(qty * cost_per_ton, 2)
        lines.append(
            InvoiceLine(
                category=InvoiceLineCategory.WASTE,
                description=desc,
                quantity=qty,
                unit="TNE",
                unit_price_kr=cost_per_ton,
                vat_rate=0.25,
                line_total_kr=line_total,
                total_co2_kg=float(w.total_co2_kg) if w.total_co2_kg else None,
                confidence_score=w.confidence_score,
                source_type=InvoiceLineSourceType.WASTE_ITEM,
                source_id=w.id,
            )
        )
    return lines


def _lines_from_energy(session, project_id: int) -> list[InvoiceLine]:
    energies = session.query(Energy).filter(Energy.project_id == project_id).all()
    lines = []
    for e in energies:
        desc = f"Energi — {e.price_zone.value if e.price_zone else 'ukjent sone'}"
        kwh = float(e.kwh_used or 0)
        cost_per_kwh = float(getattr(e, "cost_per_kwh", None) or 0)
        line_total = round(kwh * cost_per_kwh, 2)
        lines.append(
            InvoiceLine(
                category=InvoiceLineCategory.ENERGY,
                description=desc,
                quantity=kwh,
                unit="KWH",
                unit_price_kr=cost_per_kwh,
                vat_rate=0.25,
                line_total_kr=line_total,
                total_co2_kg=float(e.total_co2_kg) if e.total_co2_kg else None,
                confidence_score=e.confidence_score,
                source_type=InvoiceLineSourceType.ENERGY,
                source_id=e.id,
            )
        )
    return lines


def _aggregated_lines(session, project_id: int) -> list[InvoiceLine]:
    """One summary line per category."""
    detailed = _collect_lines(session, project_id, InvoiceFormatType.DETAILED)
    buckets: dict[InvoiceLineCategory, list[InvoiceLine]] = {}
    for line in detailed:
        buckets.setdefault(line.category, []).append(line)

    agg_lines = []
    category_labels = {
        InvoiceLineCategory.MATERIAL: "Materialer",
        InvoiceLineCategory.TRANSPORT: "Transport",
        InvoiceLineCategory.WASTE: "Avfallshåndtering",
        InvoiceLineCategory.ENERGY: "Energiforbruk",
    }
    for cat, cat_lines in buckets.items():
        total_kr = sum(float(ln.line_total_kr or 0) for ln in cat_lines)
        total_co2 = sum(float(ln.total_co2_kg or 0) for ln in cat_lines)
        agg_lines.append(
            InvoiceLine(
                category=cat,
                description=category_labels.get(cat, cat.value),
                quantity=1,
                unit="EA",
                unit_price_kr=total_kr,
                vat_rate=0.25,
                line_total_kr=total_kr,
                total_co2_kg=total_co2 if total_co2 > 0 else None,
            )
        )
    return agg_lines


def _lines_from_client(raw: list[dict]) -> list[InvoiceLine]:
    """Build InvoiceLine objects from user-edited line items sent by the client."""
    lines = []
    for item in raw:
        qty = float(item.get("quantity") or 1)
        unit_price = float(item.get("unit_price_kr") or 0)
        discount = float(item.get("discount_percent") or 0)
        line_total = round(qty * unit_price * (1 - discount / 100), 2)
        lines.append(
            InvoiceLine(
                category=InvoiceLineCategory.MATERIAL,
                description=item.get("description") or "",
                quantity=qty,
                unit=item.get("unit") or "STK",
                unit_price_kr=unit_price,
                vat_rate=0.25,
                line_total_kr=line_total,
                source_type=InvoiceLineSourceType.MANUAL,
            )
        )
    return lines


def _invoice_to_dict(inv: GeneratedInvoice) -> dict:
    return {
        "id": inv.id,
        "project_id": inv.project_id,
        "format_type": inv.format_type.value,
        "invoice_number": inv.invoice_number,
        "due_date": inv.due_date.isoformat() if inv.due_date else None,
        "our_reference": inv.our_reference,
        "their_reference": inv.their_reference,
        "bank_account": inv.bank_account,
        "customer_name": inv.customer_name,
        "customer_org_number": inv.customer_org_number,
        "customer_address": inv.customer_address,
        "customer_email": inv.customer_email,
        "total_amount_kr": float(inv.total_amount_kr) if inv.total_amount_kr else None,
        "vat_total_kr": float(inv.vat_total_kr) if inv.vat_total_kr else None,
        "grand_total_kr": float(inv.grand_total_kr) if inv.grand_total_kr else None,
        "total_co2_kg": float(inv.total_co2_kg) if inv.total_co2_kg else None,
        "total_materials_co2_kg": float(inv.total_materials_co2_kg)
        if inv.total_materials_co2_kg
        else None,
        "total_transport_co2_kg": float(inv.total_transport_co2_kg)
        if inv.total_transport_co2_kg
        else None,
        "total_waste_co2_kg": float(inv.total_waste_co2_kg)
        if inv.total_waste_co2_kg
        else None,
        "total_energy_co2_kg": float(inv.total_energy_co2_kg)
        if inv.total_energy_co2_kg
        else None,
        "overall_confidence_score": inv.overall_confidence_score,
        "ehf_xml_path": inv.ehf_xml_path,
        "generated_at": inv.generated_at.isoformat() if inv.generated_at else None,
    }


# ── Routes ─────────────────────────────────────────────────────────────────────


@export_bp.route("/project/<int:project_id>/generate", methods=["POST"])
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR))
def generate_invoice(project_id: int):
    """Generate an EHF invoice for a project.

    Request body (JSON):
        format_type: "aggregated" | "detailed"  (default: "aggregated")
        invoice_number: str (optional)
        due_date: "YYYY-MM-DD" (optional)
        our_reference: str (optional)
        their_reference: str (optional)
        bank_account: str (optional)
        customer_name: str (optional)
        customer_org_number: str (optional)
        customer_address: str (optional)
        customer_email: str (optional)
        supplier: { name, org_number, address, email }  (optional)

    Returns the created GeneratedInvoice record.
    """
    session = g.db

    project = session.get(Project, project_id)
    if not project:
        raise ApiError("Prosjektet ble ikke funnet.", code="NOT_FOUND", status=404)

    body = request.get_json(silent=True) or {}

    # Format type
    raw_format = body.get("format_type", "aggregated")
    try:
        format_type = InvoiceFormatType(raw_format)
    except ValueError:
        raise ApiError(
            f"Ugyldig format_type: '{raw_format}'. Bruk 'aggregated' eller 'detailed'.",
            code="INVALID_FORMAT_TYPE",
        )

    # Due date
    due_date: date | None = None
    raw_due = body.get("due_date")
    if raw_due:
        try:
            due_date = date.fromisoformat(raw_due)
        except ValueError:
            raise ApiError(
                "Ugyldig due_date. Bruk ISO-format: YYYY-MM-DD.",
                code="INVALID_DUE_DATE",
            )

    # Use client-provided line items if present, otherwise derive from project data
    raw_lines = body.get("line_items")
    if raw_lines and isinstance(raw_lines, list):
        lines = _lines_from_client(raw_lines)
    else:
        lines = _collect_lines(session, project_id, format_type)

    # Compute financial totals
    subtotal = sum(float(ln.line_total_kr or 0) for ln in lines)
    vat_total = round(subtotal * 0.25, 2)
    grand_total = round(subtotal + vat_total, 2)

    # CO2 totals per category
    def _co2_sum(cat: InvoiceLineCategory) -> float | None:
        vals = [
            float(ln.total_co2_kg)
            for ln in lines
            if ln.category == cat and ln.total_co2_kg
        ]
        return sum(vals) if vals else None

    total_co2 = sum(float(ln.total_co2_kg or 0) for ln in lines) or None

    # Build invoice record
    invoice = GeneratedInvoice(
        project_id=project_id,
        format_type=format_type,
        invoice_number=body.get("invoice_number"),
        due_date=due_date,
        our_reference=body.get("our_reference"),
        their_reference=body.get("their_reference"),
        bank_account=body.get("bank_account"),
        customer_name=body.get("customer_name"),
        customer_org_number=body.get("customer_org_number"),
        customer_address=body.get("customer_address"),
        customer_email=body.get("customer_email"),
        total_amount_kr=subtotal,
        vat_total_kr=vat_total,
        grand_total_kr=grand_total,
        total_co2_kg=total_co2,
        total_materials_co2_kg=_co2_sum(InvoiceLineCategory.MATERIAL),
        total_transport_co2_kg=_co2_sum(InvoiceLineCategory.TRANSPORT),
        total_waste_co2_kg=_co2_sum(InvoiceLineCategory.WASTE),
        total_energy_co2_kg=_co2_sum(InvoiceLineCategory.ENERGY),
    )

    with db_commit(session, "Kunne ikke opprette fakturaen.", "SAVE_FAILED"):
        session.add(invoice)
        session.flush()

        for line in lines:
            line.generated_invoice_id = invoice.id
            session.add(line)

    # Generate EHF XML
    supplier_info = body.get("supplier") or {}
    try:
        xml_bytes = generate_ehf(invoice, lines, supplier_info or None)
    except Exception:
        logger.exception("EHF generation failed for invoice %s", invoice.id)
        raise ApiError(
            "Kunne ikke generere EHF-XML.",
            code="EHF_GENERATION_FAILED",
            status=500,
            suggestion="Sjekk at alle påkrevde felter er fylt ut og prøv igjen.",
        )

    # Persist XML file
    storage_dir = _ensure_storage_dir()
    filename = f"invoice_{invoice.id}_{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}.xml"
    file_path = os.path.join(storage_dir, filename)
    with open(file_path, "wb") as fh:
        fh.write(xml_bytes)

    with db_commit(session, "Kunne ikke lagre filbanen.", "SAVE_FAILED"):
        invoice.ehf_xml_path = file_path

    return jsonify(_invoice_to_dict(invoice)), 201


@export_bp.route("/<int:invoice_id>/ehf", methods=["GET"])
@require_auth
def download_ehf(invoice_id: int):
    """Download the generated EHF XML file for the given invoice.

    Returns the XML file as an attachment.
    """
    session = g.db
    invoice = session.get(GeneratedInvoice, invoice_id)
    if not invoice:
        raise ApiError("Fakturaen ble ikke funnet.", code="NOT_FOUND", status=404)

    if not invoice.ehf_xml_path or not os.path.isfile(invoice.ehf_xml_path):
        raise ApiError(
            "EHF-filen er ikke tilgjengelig.",
            code="FILE_NOT_FOUND",
            status=404,
            suggestion="Generer fakturaen på nytt.",
        )

    inv_num = invoice.invoice_number or str(invoice.id)
    download_name = f"faktura_{inv_num}.xml"

    return send_file(
        invoice.ehf_xml_path,
        mimetype="application/xml",
        as_attachment=True,
        download_name=download_name,
    )
