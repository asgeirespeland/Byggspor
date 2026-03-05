from dotenv import load_dotenv
from flask import Flask, g, jsonify, request
from flask_cors import CORS

from app.database import SessionLocal

load_dotenv()

app = Flask(__name__)
CORS(app)


@app.before_request
def open_session():
    """Create a single request-scoped DB session available as g.db."""
    g.db = SessionLocal()


@app.before_request
def authenticate_request():
    """Stub: extract user identity from Authorization header.

    TODO: integrate Clerk JWT verification (decode + validate signature).
    For now this is a placeholder so that endpoints are testable once a
    real auth layer is wired up.
    """
    g.current_user_id = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        _token = auth_header[7:]
        # TODO: decode and verify Clerk JWT, then set g.current_user_id
        # from the token claims. For now endpoints will still return 401.


@app.teardown_request
def close_session(exc):
    """Close the request-scoped DB session."""
    db = getattr(g, "db", None)
    if db is not None:
        if exc:
            db.rollback()
        db.close()


@app.route("/health")
def health_check():
    return jsonify(status="ok")


from app.routes.invoice import invoice_bp  # noqa: E402
from app.routes.nobb import nobb_bp  # noqa: E402
from app.routes.organization import organization_bp  # noqa: E402
from app.routes.user import user_bp  # noqa: E402

app.register_blueprint(nobb_bp)
app.register_blueprint(invoice_bp)
app.register_blueprint(user_bp)
app.register_blueprint(organization_bp)
