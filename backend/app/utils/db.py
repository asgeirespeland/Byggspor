"""Database helpers to reduce boilerplate in route handlers."""

from __future__ import annotations

import logging
from contextlib import contextmanager

from sqlalchemy.exc import IntegrityError

from app.errors import DEFAULT_RETRY_SUGGESTION, ApiError

logger = logging.getLogger(__name__)


@contextmanager
def db_commit(
    session,
    error_msg: str,
    error_code: str,
    *,
    integrity_msg: str | None = None,
    integrity_code: str | None = None,
):
    """Wrap a database mutation in commit/rollback with standard error handling.

    Usage::

        with db_commit(session, "Kunne ikke lagre energiposten.", "SAVE_FAILED"):
            session.add(energy)

    Pass integrity_msg/integrity_code to return a 409 on unique constraint violations
    instead of the default 500.
    """
    try:
        yield
        session.commit()
    except IntegrityError:
        session.rollback()
        raise ApiError(
            integrity_msg or error_msg,
            code=integrity_code or "CONFLICT",
            status=409,
        )
    except Exception:
        session.rollback()
        logger.exception(error_msg)
        raise ApiError(
            error_msg,
            code=error_code,
            status=500,
            suggestion=DEFAULT_RETRY_SUGGESTION,
        )
