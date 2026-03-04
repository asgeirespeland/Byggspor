"""Transport report upload and parsing routes."""

import logging
import xml.etree.ElementTree as ET

from flask import Blueprint, jsonify, request

from app.database import SessionLocal
from app.services.transport_service import process_transport_report

logger = logging.getLogger(__name__)

transport_bp = Blueprint("transport", __name__, url_prefix="/transport")


@transport_bp.route("/parse", methods=["POST"])
def parse_transport_route():
    """Parse, enrich, and persist an Abax Turrapport XML for a project.

    Requires 'project_id' form field and 'file' upload (XML).
    Looks up/creates vehicles, calculates CO₂, and persists all records.
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

    session = SessionLocal()
    try:
        result = process_transport_report(
            session, project_id, xml_content, file_name=file.filename
        )
        session.commit()
        return jsonify(result), 201
    except ET.ParseError as e:
        session.rollback()
        return jsonify(error=f"Invalid XML: {e}"), 422
    except Exception as e:
        session.rollback()
        logger.exception("Transport processing failed")
        return jsonify(error=f"Processing failed: {e}"), 500
    finally:
        session.close()
