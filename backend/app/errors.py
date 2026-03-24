"""Standardized API error handling.

Provides ApiError exception class and Flask error handlers that ensure
every error response follows a consistent JSON shape:

    {
        "error": "Short error message",
        "code": "ERROR_CODE",
        "suggestion": "What the user can do to fix it"  // optional
    }
"""

from flask import jsonify


class ApiError(Exception):
    """Raise from any route to return a structured error response.

    Args:
        message: Human-readable error description.
        code: Machine-readable error code (e.g. "INVALID_FILE_FORMAT").
        status: HTTP status code.
        suggestion: Optional guidance for the user.
    """

    def __init__(
        self,
        message: str,
        *,
        code: str = "ERROR",
        status: int = 400,
        suggestion: str | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status = status
        self.suggestion = suggestion

    def to_response(self):
        body = {"error": self.message, "code": self.code}
        if self.suggestion:
            body["suggestion"] = self.suggestion
        return jsonify(body), self.status


def register_error_handlers(app):
    """Register global Flask error handlers for consistent error formatting."""

    @app.errorhandler(ApiError)
    def handle_api_error(exc: ApiError):
        return exc.to_response()

    @app.errorhandler(404)
    def handle_404(_exc):
        return jsonify(error="Not found", code="NOT_FOUND"), 404

    @app.errorhandler(405)
    def handle_405(_exc):
        return jsonify(error="Method not allowed", code="METHOD_NOT_ALLOWED"), 405

    @app.errorhandler(500)
    def handle_500(_exc):
        return (
            jsonify(
                error="An internal error occurred",
                code="INTERNAL_ERROR",
                suggestion="Prøv igjen. Kontakt support hvis problemet vedvarer.",
            ),
            500,
        )
