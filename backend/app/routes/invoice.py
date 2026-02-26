import xml.etree.ElementTree as ET

from flask import Blueprint, jsonify, request

from app.services.ehf_parser import parse_invoice
from app.services.invoice_enrichment import enrich_invoice

invoice_bp = Blueprint("invoice", __name__, url_prefix="/invoice")


@invoice_bp.route("/parse", methods=["POST"])
def parse_invoice_route():
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
