from __future__ import annotations

import os
from functools import lru_cache

import jwt
from flask import current_app, g, jsonify, request
from jwt import ExpiredSignatureError, InvalidTokenError, PyJWKClient

from app.services.user_sync import upsert_user_from_clerk

PUBLIC_PATHS = {"/health"}
PROTECTED_PREFIXES = (
    "/users",
    "/invoice",
    "/transport",
    "/organization",
    "/nobb",
)


def _extract_bearer_token(auth_header: str) -> str | None:
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:].strip()
    return token or None


def _clerk_issuer() -> str:
    issuer = os.getenv("CLERK_ISSUER", "").strip()
    if not issuer:
        raise RuntimeError("Missing CLERK_ISSUER")
    return issuer.rstrip("/")


def _clerk_audience() -> str | None:
    audience = os.getenv("CLERK_JWT_AUDIENCE", "").strip()
    return audience or None


def _jwks_url() -> str:
    override = os.getenv("CLERK_JWKS_URL", "").strip()
    if override:
        return override
    return f"{_clerk_issuer()}/.well-known/jwks.json"


@lru_cache(maxsize=1)
def _jwks_client(url: str) -> PyJWKClient:
    return PyJWKClient(url)


def _verify_clerk_jwt(token: str) -> dict:
    issuer = _clerk_issuer()
    audience = _clerk_audience()
    jwks_url = _jwks_url()

    signing_key = _jwks_client(jwks_url).get_signing_key_from_jwt(token).key

    claims = jwt.decode(
        token,
        signing_key,
        algorithms=["RS256"],
        issuer=issuer,
        audience=audience if audience else None,
        options={"verify_aud": bool(audience)},
    )

    if "sub" not in claims:
        raise InvalidTokenError("Missing subject claim")

    return claims


def authenticate_request():
    """Authenticate protected API routes using Clerk JWT and sync the local user."""
    g.current_user_id = None
    g.current_user = None
    g.clerk_claims = None

    if request.method == "OPTIONS":
        return None

    if request.path in PUBLIC_PATHS:
        return None

    if not request.path.startswith(PROTECTED_PREFIXES):
        return None

    token = _extract_bearer_token(request.headers.get("Authorization", ""))
    if not token:
        return jsonify(error="Unauthorized"), 401

    try:
        claims = _verify_clerk_jwt(token)
        current_app.logger.debug(f"Authenticated request for user {claims.get('sub')}")
    except ExpiredSignatureError:
        return jsonify(error="Token expired"), 401
    except InvalidTokenError as e:
        current_app.logger.debug("Invalid token: %s", e)
        return jsonify(error="Invalid token"), 401
    except RuntimeError as exc:
        return jsonify(error=str(exc)), 500
    except Exception:
        current_app.logger.exception("Unexpected authentication failure")
        return jsonify(error="Authentication failed"), 500

    session = getattr(g, "db", None)
    if session is None:
        return jsonify(error="Database session unavailable"), 500

    try:
        user = upsert_user_from_clerk(session, claims)
        current_app.logger.debug("User synced: %s", user.id)
        session.commit()
        g.current_user_id = user.id
        g.current_user = user
        g.clerk_claims = claims
    except Exception:
        session.rollback()
        current_app.logger.exception("Failed to sync authenticated user")
        return jsonify(error="Failed to sync authenticated user"), 500

    return None
