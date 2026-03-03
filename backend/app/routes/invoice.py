import xml.etree.ElementTree as ET

from flask import Blueprint, jsonify, request

from app.services.ehf_parser import parse_invoice
from app.services.invoice_enrichment import enrich_invoice

invoice_bp = Blueprint("invoice", __name__, url_prefix="/invoice")


@invoice_bp.route("/parse", methods=["POST"])
def parse_invoice_route():
    """Parse and enrich an EHF invoice — stateless, no DB writes."""
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

    try:
        enriched = enrich_invoice(parsed)
    except Exception as e:
        return jsonify(error=f"Enrichment failed: {e}"), 502

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
