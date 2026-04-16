from __future__ import annotations

import xml.etree.ElementTree as ET

from flask import Blueprint, g, jsonify, request

from app.config.settings_resolver import resolve_settings
from app.errors import ApiError
from app.middleware.auth import require_auth
from app.middleware.roles import require_project_role
from app.models.project_member import ProjectRole
from app.models.project_waste_item import ProjectWasteItem, WasteSourceType
from app.models.waste_invoice import WasteInvoice
from app.services.material_service import upsert_catalog_entry
from app.services.waste_enrichment import enrich_waste_report
from app.services.waste_parser import build_waste_item_data
from app.services.waste_report_parser import parse_waste_report
from app.utils.db import db_commit
from app.utils.file_upload import validate_xml_upload
from app.utils.parsing import parse_float, require_int
from app.utils.serialization import group_by_source

waste_bp = Blueprint("waste", __name__, url_prefix="/waste")


# ---------------------------------------------------------------------------
# Serialization
# ---------------------------------------------------------------------------


def _serialize_waste_item(item: ProjectWasteItem) -> dict:
    """Serialize a single waste item to a JSON-safe dict."""
    return {
        "id": item.id,
        "project_id": item.project_id,
        "source_id": item.source_id,
        "source_type": item.source_type.value if item.source_type else None,
        "waste_type": item.waste_type,
        "quantity": (float(item.quantity) if item.quantity is not None else None),
        "unit": item.unit,
        "co2_from_report_kg": (
            float(item.co2_from_report_kg)
            if item.co2_from_report_kg is not None
            else None
        ),
        "calculated_co2_kg": (
            float(item.calculated_co2_kg)
            if item.calculated_co2_kg is not None
            else None
        ),
        "total_co2_kg": (
            float(item.total_co2_kg) if item.total_co2_kg is not None else None
        ),
        "confidence_score": item.confidence_score,
        "cost_per_ton": (
            float(item.cost_per_ton) if item.cost_per_ton is not None else None
        ),
        "notes": item.notes,
        "created_at": item.created_at.isoformat() if item.created_at else None,
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@waste_bp.route("/manual", methods=["POST"])
@require_auth
def create_manual_waste():
    """Create a single manual waste entry for a project."""

    payload = request.get_json(silent=True) or {}

    project_id = require_int(payload, "project_id")
    waste_type = payload.get("waste_type")
    quantity = payload.get("quantity")
    notes = payload.get("notes")

    settings = resolve_settings(g.db, project_id)
    item_data = build_waste_item_data(
        waste_type=waste_type,
        quantity=quantity,
        notes=notes,
        emission_factors=settings["waste_manual_emission_factors"],
    )

    session = g.db
    waste_item = ProjectWasteItem(
        project_id=project_id,
        source_id=None,
        source_type=WasteSourceType.MANUAL,
        waste_type=item_data["waste_type"],
        quantity=item_data["quantity"],
        unit=item_data.get("unit", "TON"),
        co2_from_report_kg=item_data["co2_from_report_kg"],
        calculated_co2_kg=item_data["calculated_co2_kg"],
        total_co2_kg=item_data["total_co2_kg"],
        confidence_score=item_data["confidence_score"],
        cost_per_ton=(
            parse_float(
                payload,
                "cost_per_ton",
                suggestion="Oppgi kostnad pr. tonn som et tall.",
            )
            if "cost_per_ton" in payload
            else None
        ),
        notes=item_data["notes"],
    )

    with db_commit(session, "Kunne ikke lagre avfallsposten.", "SAVE_FAILED"):
        session.add(waste_item)

    session.refresh(waste_item)

    return jsonify(_serialize_waste_item(waste_item)), 201


@waste_bp.route("/parse", methods=["POST"])
@require_auth
def parse_waste():
    """Parse uploaded waste report XML, enrich with NOBB C3/C4 data."""

    xml_content = validate_xml_upload(
        suggestion="Last opp en avfallsrapport i XML-format."
    )

    try:
        parsed = parse_waste_report(xml_content)
    except ET.ParseError:
        raise ApiError(
            "Kunne ikke lese XML-filen.",
            code="INVALID_XML",
            suggestion="Sjekk at filen er gyldig XML.",
        )
    except ValueError as exc:
        raise ApiError(str(exc), code="INVALID_FILE_FORMAT")

    session = g.db
    enriched = enrich_waste_report(parsed, session=session)

    # Cache NOBB lookups to material catalog (same as invoice parse)
    with db_commit(session, "Kunne ikke cache materialdata.", "SAVE_FAILED"):
        for item in enriched.get("line_items", []):
            if item.get("nobb_data") and not item["nobb_data"].get("_from_catalog"):
                upsert_catalog_entry(session, item)

    return jsonify(enriched)


@waste_bp.route("/confirm", methods=["POST"])
@require_auth
def confirm_waste():
    """Persist user-confirmed waste items to the database.

    Expects JSON: { project_id, file_name?, supplier_name?, items: [...] }
    """
    body = request.get_json(silent=True) or {}
    project_id = require_int(body, "project_id")

    items = body.get("items")
    if not isinstance(items, list) or len(items) == 0:
        raise ApiError(
            "Ingen avfallsposter å bekrefte.",
            code="MISSING_FIELD",
            suggestion="Velg minst én avfallspost før du bekrefter.",
        )

    file_name = body.get("file_name")
    supplier_name = body.get("supplier_name")
    session = g.db

    created_items: list[ProjectWasteItem] = []

    with db_commit(session, "Kunne ikke lagre avfallsrapport.", "SAVE_FAILED"):
        source = WasteInvoice(
            file_path=file_name,
            supplier_name=supplier_name,
        )
        session.add(source)
        session.flush()

        for item_data in items:
            co2_kg = item_data.get("co2_kg")
            waste_item = ProjectWasteItem(
                project_id=project_id,
                source_id=source.id,
                source_type=WasteSourceType.WASTE_REPORT,
                waste_type=item_data.get("name") or item_data.get("waste_type"),
                quantity=item_data.get("quantity"),
                unit=item_data.get("unit"),
                co2_from_report_kg=None,
                calculated_co2_kg=co2_kg,
                total_co2_kg=co2_kg,
                confidence_score=item_data.get("confidence"),
                cost_per_ton=item_data.get("cost_per_ton"),
                notes=item_data.get("co2_source"),
            )
            session.add(waste_item)
            created_items.append(waste_item)

    for item in created_items:
        session.refresh(item)

    return (
        jsonify(
            {
                "waste_invoice_id": source.id,
                "project_waste_count": len(created_items),
            }
        ),
        201,
    )


@waste_bp.route("/project/<int:project_id>", methods=["GET"])
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR, ProjectRole.VIEWER))
def list_project_waste(project_id: int):
    """List all waste entries for a project, grouped by source."""

    session = g.db
    items = (
        session.query(ProjectWasteItem)
        .filter(ProjectWasteItem.project_id == project_id)
        .order_by(ProjectWasteItem.created_at.desc())
        .all()
    )

    def _waste_group(item: ProjectWasteItem) -> dict:
        inv = item.source_invoice
        return {
            "source_id": item.source_id,
            "source_type": item.source_type.value if item.source_type else None,
            "file_name": inv.file_path if inv else None,
            "uploaded_at": (
                inv.uploaded_at.isoformat() if inv and inv.uploaded_at else None
            ),
        }

    return jsonify(
        group_by_source(
            items,
            key_fn=lambda i: i.source_id,
            group_fn=_waste_group,
            item_fn=_serialize_waste_item,
        )
    )


@waste_bp.route("/items/<int:item_id>", methods=["PATCH"])
@require_auth
def update_waste_item(item_id: int):
    """Update a single waste item's quantity and/or CO₂ value."""

    session = g.db
    item = session.get(ProjectWasteItem, item_id)
    if not item:
        raise ApiError(
            "Avfallsposten ble ikke funnet.",
            code="NOT_FOUND",
            status=404,
        )

    body = request.get_json(silent=True) or {}

    if "waste_type" in body:
        item.waste_type = body["waste_type"] or None

    if "quantity" in body:
        item.quantity = parse_float(
            body,
            "quantity",
            suggestion="Oppgi mengde som et tall.",
        )

    if "unit" in body:
        item.unit = body["unit"] or None

    if "total_co2_kg" in body:
        item.total_co2_kg = parse_float(
            body,
            "total_co2_kg",
            suggestion="Oppgi CO₂-verdi som et tall.",
        )

    if "cost_per_ton" in body:
        item.cost_per_ton = parse_float(
            body,
            "cost_per_ton",
            suggestion="Oppgi kostnad pr. tonn som et tall.",
        )

    with db_commit(session, "Kunne ikke oppdatere avfallsposten.", "UPDATE_FAILED"):
        pass

    return jsonify(_serialize_waste_item(item)), 200


@waste_bp.route("/items/<int:item_id>", methods=["DELETE"])
@require_auth
def delete_waste_item(item_id: int):
    """Delete a single waste item."""

    session = g.db
    item = session.get(ProjectWasteItem, item_id)
    if not item:
        raise ApiError(
            "Avfallsposten ble ikke funnet.",
            code="NOT_FOUND",
            status=404,
        )
    with db_commit(session, "Kunne ikke slette avfallsposten.", "DELETE_FAILED"):
        session.delete(item)
    return jsonify(message="Deleted"), 200


@waste_bp.route("/source/<int:waste_invoice_id>", methods=["DELETE"])
@require_auth
def delete_waste_report(waste_invoice_id: int):
    """Delete a waste report and all its associated waste items."""

    session = g.db
    count = (
        session.query(ProjectWasteItem)
        .filter(ProjectWasteItem.source_id == waste_invoice_id)
        .delete()
    )
    inv = session.get(WasteInvoice, waste_invoice_id)
    if inv:
        session.delete(inv)

    with db_commit(session, "Kunne ikke slette avfallsrapporten.", "DELETE_FAILED"):
        pass

    return jsonify(message="Deleted", items_removed=count), 200
