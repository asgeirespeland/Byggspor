from flask import Blueprint, jsonify, request

from app.errors import ApiError
from app.services.nobb_client import lookup

nobb_bp = Blueprint("nobb", __name__, url_prefix="/nobb")


@nobb_bp.route("/lookup", methods=["GET"])
def nobb_lookup():
    gtin = request.args.get("gtin")
    nobb_number = request.args.get("nobb_number", type=int)

    if not gtin and not nobb_number:
        raise ApiError(
            "Oppgi 'gtin' eller 'nobb_number' som søkeparameter.",
            code="MISSING_FIELD",
        )

    try:
        result = lookup(gtin=gtin, nobb_number=nobb_number)
    except RuntimeError as e:
        raise ApiError(str(e), code="NOBB_ERROR", status=500)
    except Exception:
        raise ApiError(
            "NOBB-tjenesten er utilgjengelig.",
            code="NOBB_UNAVAILABLE",
            status=502,
            suggestion="Prøv igjen senere.",
        )

    if result is None:
        raise ApiError("Ingen vare funnet.", code="NOT_FOUND", status=404)

    return jsonify(result)
