import logging
import xml.etree.ElementTree as ET

from flask import Blueprint, g, jsonify, request

from app.database import SessionLocal
from app.models.material_invoice import MaterialInvoice
from app.models.project_material import ProjectMaterial
from app.services.ehf_parser import parse_invoice
from app.services.invoice_enrichment import enrich_invoice
from app.services.material_service import upsert_catalog_entry

logger = logging.getLogger(__name__)

invoice_bp = Blueprint("invoice", __name__, url_prefix="/invoice")


@invoice_bp.route("/parse", methods=["POST"])
def parse_invoice_route():
    """Parse and enrich an EHF invoice.

    Uses the material catalog DB as a cache — checks catalog first,
    falls back to NOBB API, then upserts results back into the catalog.
    """
    if "file" not in request.files:
        return jsonify(error="No file provided. Use 'file' form field."), 400

    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith(".xml"):
        return jsonify(error="File must be an XML file."), 400

    xml_content = file.read()
    if not xml_content:
        return jsonify(error="Uploaded file is empty."), 400

    try:
        parsed = parse_invoice(xml_content)
    except ET.ParseError as e:
        return jsonify(error=f"Invalid XML: {e}"), 422

    session = SessionLocal()
    try:
        enriched = enrich_invoice(parsed, session=session)

        # Upsert enriched items into the material catalog (cache for next time)
        for item in enriched.get("line_items", []):
            if item.get("nobb_data") and not item["nobb_data"].get("_from_catalog"):
                upsert_catalog_entry(session, item)

        session.commit()
    except Exception as e:
        session.rollback()
        logger.exception("Enrichment/caching failed")
        return jsonify(error=f"Enrichment failed: {e}"), 502
    finally:
        session.close()

    return jsonify(enriched)


@invoice_bp.route("/upload", methods=["POST"])
def upload_invoice_route():
    """Parse, enrich, and persist an EHF invoice for a project.

    Requires 'project_id' form field and 'file' upload.
    Upserts materials to catalog, creates project_materials with source provenance.
    """
    project_id = request.form.get("project_id")
    if not project_id:
        return jsonify(error="project_id is required."), 400

    try:
        project_id = int(project_id)
    except (ValueError, TypeError):
        return jsonify(error="project_id must be an integer."), 400

    if "file" not in request.files:
        return jsonify(error="No file provided. Use 'file' form field."), 400

    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith(".xml"):
        return jsonify(error="File must be an XML file."), 400

    xml_content = file.read()
    if not xml_content:
        return jsonify(error="Uploaded file is empty."), 400

    from app.database import SessionLocal
    from app.services.material_service import process_invoice_for_project

    session = SessionLocal()
    try:
        result = process_invoice_for_project(session, project_id, xml_content)
        session.commit()
        return jsonify(result), 201
    except ET.ParseError as e:
        session.rollback()
        return jsonify(error=f"Invalid XML: {e}"), 422
    except Exception as e:
        session.rollback()
        return jsonify(error=f"Processing failed: {e}"), 500
    finally:
        session.close()


@invoice_bp.route("/project/<int:project_id>", methods=["GET"])
def list_project_materials(project_id: int):
    """Return all materials for a project, grouped by source invoice."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    session = g.db
    materials = (
        session.query(ProjectMaterial)
        .filter(ProjectMaterial.project_id == project_id)
        .order_by(ProjectMaterial.created_at.desc())
        .all()
    )

    # Group by source invoice
    invoices_map: dict[int | None, dict] = {}
    for pm in materials:
        sid = pm.source_id
        if sid not in invoices_map:
            inv = pm.source_invoice
            invoices_map[sid] = {
                "invoice_id": sid,
                "supplier_name": inv.supplier_name if inv else None,
                "invoice_number": inv.invoice_number if inv else None,
                "invoice_date": (
                    inv.invoice_date.isoformat() if inv and inv.invoice_date else None
                ),
                "uploaded_at": (
                    inv.uploaded_at.isoformat() if inv and inv.uploaded_at else None
                ),
                "items": [],
            }
        invoices_map[sid]["items"].append(
            {
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
                "has_epd": pm.material.has_epd if pm.material else False,
            }
        )

    return jsonify(list(invoices_map.values()))


@invoice_bp.route("/source/<int:invoice_id>", methods=["DELETE"])
def delete_invoice(invoice_id: int):
    """Delete an invoice and all its associated project materials."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        return jsonify(error="Unauthorized"), 401

    session = g.db
    count = (
        session.query(ProjectMaterial)
        .filter(ProjectMaterial.source_id == invoice_id)
        .delete()
    )
    inv = (
        session.query(MaterialInvoice).filter(MaterialInvoice.id == invoice_id).first()
    )
    if inv:
        session.delete(inv)

    try:
        session.commit()
    except Exception as e:
        session.rollback()
        logger.exception("Failed to delete invoice")
        return jsonify(error=f"Failed to delete: {e}"), 500

    return jsonify(message="Deleted", items_removed=count), 200
