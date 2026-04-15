import logging
import xml.etree.ElementTree as ET

from flask import Blueprint, g, jsonify, request

from app.errors import ApiError
from app.middleware.auth import require_auth
from app.middleware.roles import require_project_role
from app.models.material_invoice import MaterialInvoice
from app.models.project_material import MaterialSourceType, ProjectMaterial
from app.models.project_member import ProjectRole
from app.services.ehf_parser import parse_invoice
from app.services.invoice_enrichment import enrich_invoice
from app.services.material_service import upsert_catalog_entry
from app.utils.confidence import material_confidence
from app.utils.db import db_commit
from app.utils.file_upload import validate_xml_upload
from app.utils.parsing import parse_float, require_int
from app.utils.serialization import group_by_source

logger = logging.getLogger(__name__)

invoice_bp = Blueprint("invoice", __name__, url_prefix="/invoice")

EHF_XML_SUGGESTION = (
    "Last opp en EHF-faktura i XML-format (.xml). "
    "Disse eksporteres vanligvis fra regnskapssystemet ditt (f.eks. Tripletex, Visma)."
)


@invoice_bp.route("/parse", methods=["POST"])
@require_auth
def parse_invoice_route():
    """Parse and enrich an EHF invoice.

    Uses the material catalog DB as a cache — checks catalog first,
    falls back to NOBB API, then upserts results back into the catalog.
    """
    xml_content = validate_xml_upload(EHF_XML_SUGGESTION)

    try:
        parsed = parse_invoice(xml_content)
    except ET.ParseError:
        raise ApiError(
            "Filen er ikke gyldig XML.",
            code="INVALID_XML",
            status=422,
            suggestion=EHF_XML_SUGGESTION,
        )
    except ValueError as e:
        raise ApiError(
            str(e),
            code="INVALID_FILE_FORMAT",
            status=422,
            suggestion=EHF_XML_SUGGESTION,
        )

    session = g.db
    try:
        enriched = enrich_invoice(parsed, session=session)
    except Exception:
        session.rollback()
        logger.exception("Enrichment/caching failed")
        raise ApiError(
            "Kunne ikke berike fakturadata.",
            code="ENRICHMENT_FAILED",
            status=502,
            suggestion=(
                "Prøv igjen. Hvis problemet vedvarer,"
                " kan det skyldes at NOBB-tjenesten er utilgjengelig."
            ),
        )

    with db_commit(session, "Kunne ikke cache fakturadata.", "SAVE_FAILED"):
        for item in enriched.get("line_items", []):
            if item.get("nobb_data") and not item["nobb_data"].get("_from_catalog"):
                upsert_catalog_entry(session, item)

    return jsonify(enriched)


@invoice_bp.route("/confirm", methods=["POST"])
@require_auth
def confirm_invoice():
    """Persist user-reviewed invoice line items to the database.

    Expects JSON with project_id, invoice (with line_items),
    and optional overrides mapping line index to CO₂ value.
    """
    body = request.get_json(silent=True) or {}
    project_id = require_int(body, "project_id")

    invoice_data = body.get("invoice")
    if not invoice_data or not isinstance(invoice_data.get("line_items"), list):
        raise ApiError(
            "Ingen linjer å bekrefte.",
            code="MISSING_FIELD",
            suggestion="Fakturaen må inneholde minst én linje.",
        )

    overrides = body.get("overrides") or {}

    session = g.db
    created = []
    invoice_record = None

    with db_commit(session, "Kunne ikke lagre fakturaen.", "SAVE_FAILED"):
        # Create source invoice record
        supplier = invoice_data.get("supplier") or {}
        invoice_record = MaterialInvoice(
            supplier_name=supplier.get("name"),
            invoice_number=invoice_data.get("invoice_number"),
            invoice_date=invoice_data.get("issue_date"),
        )
        session.add(invoice_record)
        session.flush()

        for idx, item in enumerate(invoice_data["line_items"]):
            catalog_entry = upsert_catalog_entry(session, item)

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

            # Check for user CO₂ override
            override = overrides.get(str(idx))
            has_gwp = False
            is_override = False
            if override and override.get("total_co2_kg") is not None:
                try:
                    pm.total_co2_kg = float(override["total_co2_kg"])
                    pm.manual_override = True
                    pm.flagged = False
                    is_override = True
                except (ValueError, TypeError):
                    pass
            elif catalog_entry and catalog_entry.gwp_per_unit and pm.quantity:
                pm.total_co2_kg = float(catalog_entry.gwp_per_unit) * float(pm.quantity)
                has_gwp = True

            pm.confidence_score = material_confidence(
                has_gwp=has_gwp,
                flagged=pm.flagged,
                is_manual_override=is_override,
            )

            session.add(pm)
            created.append(pm)

    return jsonify(
        material_invoice_id=invoice_record.id,
        project_materials_count=len(created),
    ), 201


@invoice_bp.route("/upload", methods=["POST"])
@require_auth
def upload_invoice_route():
    """Parse, enrich, and persist an EHF invoice for a project.

    Requires 'project_id' form field and 'file' upload.
    Upserts materials to catalog, creates project_materials with source provenance.
    """
    project_id = require_int(dict(request.form), "project_id")
    xml_content = validate_xml_upload(EHF_XML_SUGGESTION)

    from app.config.settings_resolver import resolve_settings
    from app.services.material_service import process_invoice_for_project

    session = g.db
    settings = resolve_settings(session, project_id)
    try:
        result = process_invoice_for_project(
            session,
            project_id,
            xml_content,
            gwp_stages=settings["material_gwp_stages"],
            include_a4=settings["material_include_a4"],
            include_biogenic=settings["material_include_biogenic"],
        )
    except ET.ParseError:
        session.rollback()
        raise ApiError(
            "Filen er ikke gyldig XML.",
            code="INVALID_XML",
            status=422,
            suggestion=EHF_XML_SUGGESTION,
        )
    except ValueError as e:
        session.rollback()
        raise ApiError(
            str(e),
            code="INVALID_FILE_FORMAT",
            status=422,
            suggestion=EHF_XML_SUGGESTION,
        )

    with db_commit(session, "Kunne ikke behandle fakturaen.", "PROCESSING_FAILED"):
        pass

    return jsonify(result), 201


@invoice_bp.route("/project/<int:project_id>", methods=["GET"])
@require_auth
@require_project_role((ProjectRole.OWNER, ProjectRole.EDITOR, ProjectRole.VIEWER))
def list_project_materials(project_id: int):
    """Return all materials for a project, grouped by source invoice."""

    session = g.db
    materials = (
        session.query(ProjectMaterial)
        .filter(ProjectMaterial.project_id == project_id)
        .order_by(ProjectMaterial.created_at.desc())
        .all()
    )

    def _invoice_group(pm):
        inv = pm.source_invoice
        return {
            "invoice_id": pm.source_id,
            "supplier_name": inv.supplier_name if inv else None,
            "invoice_number": inv.invoice_number if inv else None,
            "invoice_date": (
                inv.invoice_date.isoformat() if inv and inv.invoice_date else None
            ),
            "uploaded_at": (
                inv.uploaded_at.isoformat() if inv and inv.uploaded_at else None
            ),
        }

    def _material_item(pm):
        return {
            "id": pm.id,
            "material_name": pm.material.product_name if pm.material else pm.notes,
            "gtin": pm.material.gtin if pm.material else None,
            "nobb_number": pm.material.nobb_number if pm.material else None,
            "quantity": float(pm.quantity) if pm.quantity else None,
            "unit": pm.unit,
            "total_price": float(pm.total_price) if pm.total_price else None,
            "total_co2_kg": float(pm.total_co2_kg) if pm.total_co2_kg else None,
            "confidence_score": pm.confidence_score,
            "flagged": pm.flagged,
            "manual_override": pm.manual_override,
            "has_epd": pm.material.has_epd if pm.material else False,
        }

    grouped = group_by_source(
        materials,
        key_fn=lambda pm: pm.source_id,
        group_fn=_invoice_group,
        item_fn=_material_item,
    )
    return jsonify(grouped)


@invoice_bp.route("/materials/<int:material_id>", methods=["PATCH"])
@require_auth
def update_material(material_id: int):
    """Update a project material's CO₂ value manually.

    Accepts JSON: { total_co2_kg: number }
    Sets manual_override=True, confidence_score=90, flagged=False.
    """

    body = request.get_json(silent=True) or {}

    if "total_co2_kg" not in body:
        raise ApiError(
            "total_co2_kg er påkrevd.",
            code="MISSING_FIELD",
            suggestion="Oppgi CO₂-verdi i kg for denne materialposten.",
        )

    total_co2_kg = parse_float(
        body,
        "total_co2_kg",
        suggestion="Oppgi CO\u2082-verdi som et tall (f.eks. 12.5 eller -271).",
    )

    session = g.db
    pm = session.get(ProjectMaterial, material_id)
    if not pm:
        raise ApiError(
            "Materialposten ble ikke funnet.",
            code="NOT_FOUND",
            status=404,
        )

    pm.total_co2_kg = total_co2_kg
    pm.manual_override = True
    pm.confidence_score = material_confidence(
        has_gwp=False,
        flagged=False,
        is_manual_override=True,
    )
    pm.flagged = False

    with db_commit(session, "Kunne ikke oppdatere materialposten.", "UPDATE_FAILED"):
        pass

    return jsonify(
        id=pm.id,
        total_co2_kg=float(pm.total_co2_kg) if pm.total_co2_kg else None,
        confidence_score=pm.confidence_score,
        flagged=pm.flagged,
        manual_override=pm.manual_override,
    ), 200


@invoice_bp.route("/source/<int:invoice_id>", methods=["DELETE"])
@require_auth
def delete_invoice(invoice_id: int):
    """Delete an invoice and all its associated project materials."""

    session = g.db
    count = (
        session.query(ProjectMaterial)
        .filter(ProjectMaterial.source_id == invoice_id)
        .delete()
    )
    inv = session.get(MaterialInvoice, invoice_id)
    if inv:
        session.delete(inv)

    with db_commit(session, "Kunne ikke slette fakturaen.", "DELETE_FAILED"):
        pass

    return jsonify(message="Deleted", items_removed=count), 200


@invoice_bp.route("/materials/<int:material_id>", methods=["DELETE"])
@require_auth
def delete_material(material_id: int):
    """Delete a single project material."""

    session = g.db
    pm = session.get(ProjectMaterial, material_id)
    if not pm:
        raise ApiError(
            "Materialposten ble ikke funnet.",
            code="NOT_FOUND",
            status=404,
        )
    with db_commit(session, "Kunne ikke slette materialposten.", "DELETE_FAILED"):
        session.delete(pm)
    return jsonify(message="Deleted"), 200
