"""XML file upload validation utility."""

from flask import request

from app.errors import ApiError


def validate_xml_upload(suggestion: str) -> bytes:
    """Validate and return XML content from request.files['file'].

    Checks: file present, .xml extension, non-empty content.
    Raises ApiError on any validation failure.

    Args:
        suggestion: User-facing hint shown when validation fails
            (e.g. what file format is expected).

    Returns:
        Raw XML bytes from the uploaded file.
    """
    if "file" not in request.files:
        raise ApiError(
            "Ingen fil ble sendt.",
            code="NO_FILE",
            suggestion=suggestion,
        )

    file = request.files["file"]
    if not file.filename or not file.filename.lower().endswith(".xml"):
        raise ApiError(
            "Filen m\u00e5 v\u00e6re i XML-format.",
            code="INVALID_FILE_TYPE",
            suggestion=suggestion,
        )

    xml_content = file.read()
    if not xml_content:
        raise ApiError(
            "Den opplastede filen er tom.",
            code="EMPTY_FILE",
            suggestion="Sjekk at filen inneholder data og pr\u00f8v igjen.",
        )

    return xml_content
