import os

from dotenv import load_dotenv
from flask import Flask, g, jsonify
from flask_cors import CORS

from app.database import SessionLocal
from app.errors import register_error_handlers
from app.middleware.auth import authenticate_request

# Load backend/.env first, then project root .env (won't overwrite existing keys)
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

app = Flask(__name__)
CORS(app)
register_error_handlers(app)


@app.before_request
def open_session():
    """Create a single request-scoped DB session available as g.db."""
    g.db = SessionLocal()


@app.before_request
def run_authentication():
    """Authenticate request and populate g.current_user / g.current_user_id."""
    return authenticate_request()


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


from app.routes.energy import energy_bp  # noqa: E402
from app.routes.invoice import invoice_bp  # noqa: E402
from app.routes.nobb import nobb_bp  # noqa: E402
from app.routes.organization import organization_bp  # noqa: E402
from app.routes.project import project_bp  # noqa: E402
from app.routes.report import report_bp  # noqa: E402
from app.routes.transport import transport_bp  # noqa: E402
from app.routes.user import user_bp  # noqa: E402
from app.routes.waste import waste_bp  # noqa: E402

app.register_blueprint(energy_bp)
app.register_blueprint(nobb_bp)
app.register_blueprint(invoice_bp)
app.register_blueprint(report_bp)
app.register_blueprint(transport_bp)
app.register_blueprint(user_bp)
app.register_blueprint(organization_bp)
app.register_blueprint(project_bp)
app.register_blueprint(waste_bp)
