from flask import Blueprint, jsonify, request

from app.services.nobb_client import lookup

nobb_bp = Blueprint("nobb", __name__, url_prefix="/nobb")


@nobb_bp.route("/lookup", methods=["GET"])
def nobb_lookup():
    gtin = request.args.get("gtin")
    nobb_number = request.args.get("nobb_number", type=int)

    if not gtin and not nobb_number:
        return jsonify(error="Provide 'gtin' or 'nobb_number' query parameter"), 400

    try:
        result = lookup(gtin=gtin, nobb_number=nobb_number)
    except RuntimeError as e:
        return jsonify(error=str(e)), 500
    except Exception as e:
        return jsonify(error=f"NOBB API error: {e}"), 502

    if result is None:
        return jsonify(error="No item found"), 404

    return jsonify(result)
