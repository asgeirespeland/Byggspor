import logging
import xml.etree.ElementTree as ET

from flask import Blueprint, g, jsonify, request

from app.database import SessionLocal
from app.errors import ApiError
from app.models.material_invoice import MaterialInvoice
from app.models.project_material import MaterialSourceType, ProjectMaterial
from app.services.ehf_parser import parse_invoice
from app.services.invoice_enrichment import enrich_invoice
from app.services.material_service import upsert_catalog_entry

logger = logging.getLogger(__name__)

invoice_bp = Blueprint("invoice", __name__, url_prefix="/invoice")

EHF_XML_SUGGESTION = (
    "Last opp en EHF-faktura i XML-format (.xml). "
    "Disse eksporteres vanligvis fra regnskapssystemet ditt (f.eks. Tripletex, Visma)."
)


@invoice_bp.route("/parse", methods=["POST"])
def parse_invoice_route():
    """Parse and enrich an EHF invoice.

    Uses the material catalog DB as a cache — checks catalog first,
    falls back to NOBB API, then upserts results back into the catalog.
    """
    if "file" not in request.files:
        raise ApiError(
            "Ingen fil ble sendt.",
            code="NO_FILE",
            suggestion=EHF_XML_SUGGESTION,
        )

    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith(".xml"):
        raise ApiError(
            "Filen må være i XML-format.",
            code="INVALID_FILE_TYPE",
            suggestion=EHF_XML_SUGGESTION,
        )

    xml_content = file.read()
    if not xml_content:
        raise ApiError(
            "Den opplastede filen er tom.",
            code="EMPTY_FILE",
            suggestion="Sjekk at filen inneholder data og prøv igjen.",
        )

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

    session = SessionLocal()
    try:
        enriched = enrich_invoice(parsed, session=session)

        # Upsert enriched items into the material catalog (cache for next time)
        for item in enriched.get("line_items", []):
            if item.get("nobb_data") and not item["nobb_data"].get("_from_catalog"):
                upsert_catalog_entry(session, item)

        session.commit()
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
    finally:
        session.close()

    return jsonify(enriched)


@invoice_bp.route("/confirm", methods=["POST"])
def confirm_invoice():
    """Persist user-reviewed invoice line items to the database.

    Expects JSON with project_id, invoice (with line_items),
    and optional overrides mapping line index to CO₂ value.
    """
    body = request.get_json(silent=True) or {}

    project_id = body.get("project_id")
    if not project_id:
        raise ApiError("project_id er påkrevd.", code="MISSING_FIELD")
    try:
        project_id = int(project_id)
    except (ValueError, TypeError):
        raise ApiError("project_id må være et heltall.", code="INVALID_FIELD")

    invoice_data = body.get("invoice")
    if not invoice_data or not isinstance(invoice_data.get("line_items"), list):
        raise ApiError(
            "Ingen linjer å bekrefte.",
            code="MISSING_FIELD",
            suggestion="Fakturaen må inneholde minst én linje.",
        )

    overrides = body.get("overrides") or {}

    session = SessionLocal()
    try:
        # Create source invoice record
        supplier = invoice_data.get("supplier") or {}
        invoice_record = MaterialInvoice(
            supplier_name=supplier.get("name"),
            invoice_number=invoice_data.get("invoice_number"),
            invoice_date=invoice_data.get("issue_date"),
        )
        session.add(invoice_record)
        session.flush()

        created = []
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
            if override and override.get("total_co2_kg") is not None:
                try:
                    pm.total_co2_kg = float(override["total_co2_kg"])
                    pm.manual_override = True
                    pm.confidence_score = 90
                    pm.flagged = False
                except (ValueError, TypeError):
                    pass
            elif catalog_entry and catalog_entry.gwp_per_unit and pm.quantity:
                pm.total_co2_kg = float(catalog_entry.gwp_per_unit) * float(pm.quantity)
                pm.confidence_score = 80
            else:
                pm.confidence_score = 20 if pm.flagged else 50

            session.add(pm)
            created.append(pm)

        session.commit()

        return jsonify(
            material_invoice_id=invoice_record.id,
            project_materials_count=len(created),
        ), 201
    except ApiError:
        session.rollback()
        raise
    except Exception:
        session.rollback()
        logger.exception("Invoice confirm failed")
        raise ApiError(
            "Kunne ikke lagre fakturaen.",
            code="SAVE_FAILED",
            status=500,
            suggestion="Prøv igjen. Kontakt support hvis problemet vedvarer.",
        )
    finally:
        session.close()


@invoice_bp.route("/upload", methods=["POST"])
def upload_invoice_route():
    """Parse, enrich, and persist an EHF invoice for a project.

    Requires 'project_id' form field and 'file' upload.
    Upserts materials to catalog, creates project_materials with source provenance.
    """
    project_id = request.form.get("project_id")
    if not project_id:
        raise ApiError(
            "project_id er påkrevd.",
            code="MISSING_FIELD",
        )

    try:
        project_id = int(project_id)
    except (ValueError, TypeError):
        raise ApiError(
            "project_id må være et heltall.",
            code="INVALID_FIELD",
        )

    if "file" not in request.files:
        raise ApiError(
            "Ingen fil ble sendt.",
            code="NO_FILE",
            suggestion=EHF_XML_SUGGESTION,
        )

    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith(".xml"):
        raise ApiError(
            "Filen må være i XML-format.",
            code="INVALID_FILE_TYPE",
            suggestion=EHF_XML_SUGGESTION,
        )

    xml_content = file.read()
    if not xml_content:
        raise ApiError(
            "Den opplastede filen er tom.",
            code="EMPTY_FILE",
            suggestion="Sjekk at filen inneholder data og prøv igjen.",
        )

    from app.services.material_service import process_invoice_for_project

    session = SessionLocal()
    try:
        result = process_invoice_for_project(session, project_id, xml_content)
        session.commit()
        return jsonify(result), 201
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
    except Exception:
        session.rollback()
        logger.exception("Invoice processing failed")
        raise ApiError(
            "Kunne ikke behandle fakturaen.",
            code="PROCESSING_FAILED",
            status=500,
            suggestion="Prøv igjen. Kontakt support hvis problemet vedvarer.",
        )
    finally:
        session.close()


@invoice_bp.route("/project/<int:project_id>", methods=["GET"])
def list_project_materials(project_id: int):
    """Return all materials for a project, grouped by source invoice."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        raise ApiError("Ikke autentisert.", code="UNAUTHORIZED", status=401)

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
                "manual_override": pm.manual_override,
                "has_epd": pm.material.has_epd if pm.material else False,
            }
        )

    return jsonify(list(invoices_map.values()))


@invoice_bp.route("/materials/<int:material_id>", methods=["PATCH"])
def update_material(material_id: int):
    """Update a project material's CO₂ value manually.

    Accepts JSON: { total_co2_kg: number }
    Sets manual_override=True, confidence_score=90, flagged=False.
    """
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        raise ApiError("Ikke autentisert.", code="UNAUTHORIZED", status=401)

    body = request.get_json(silent=True) or {}

    if "total_co2_kg" not in body:
        raise ApiError(
            "total_co2_kg er påkrevd.",
            code="MISSING_FIELD",
            suggestion="Oppgi CO₂-verdi i kg for denne materialposten.",
        )

    try:
        total_co2_kg = float(body["total_co2_kg"])
    except (ValueError, TypeError):
        raise ApiError(
            "total_co2_kg må være et tall.",
            code="INVALID_FIELD",
            suggestion="Oppgi CO₂-verdi som et tall (f.eks. 12.5 eller -271).",
        )

    session = g.db
    pm = session.query(ProjectMaterial).get(material_id)
    if not pm:
        raise ApiError(
            "Materialposten ble ikke funnet.",
            code="NOT_FOUND",
            status=404,
        )

    pm.total_co2_kg = total_co2_kg
    pm.manual_override = True
    pm.confidence_score = 90
    pm.flagged = False

    try:
        session.commit()
    except Exception:
        session.rollback()
        logger.exception("Failed to update material")
        raise ApiError(
            "Kunne ikke oppdatere materialposten.",
            code="UPDATE_FAILED",
            status=500,
            suggestion="Prøv igjen. Kontakt support hvis problemet vedvarer.",
        )

    return jsonify(
        id=pm.id,
        total_co2_kg=float(pm.total_co2_kg) if pm.total_co2_kg else None,
        confidence_score=pm.confidence_score,
        flagged=pm.flagged,
        manual_override=pm.manual_override,
    ), 200


@invoice_bp.route("/source/<int:invoice_id>", methods=["DELETE"])
def delete_invoice(invoice_id: int):
    """Delete an invoice and all its associated project materials."""
    current_user_id = getattr(g, "current_user_id", None)
    if not current_user_id:
        raise ApiError("Ikke autentisert.", code="UNAUTHORIZED", status=401)

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
    except Exception:
        session.rollback()
        logger.exception("Failed to delete invoice")
        raise ApiError(
            "Kunne ikke slette fakturaen.",
            code="DELETE_FAILED",
            status=500,
            suggestion="Prøv igjen. Kontakt support hvis problemet vedvarer.",
        )

    return jsonify(message="Deleted", items_removed=count), 200
