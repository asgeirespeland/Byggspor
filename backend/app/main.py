from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)
CORS(app)


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
