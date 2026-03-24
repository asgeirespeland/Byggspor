"""Database helpers to reduce boilerplate in route handlers."""

from __future__ import annotations

import logging
from contextlib import contextmanager

from app.errors import DEFAULT_RETRY_SUGGESTION, ApiError

logger = logging.getLogger(__name__)


@contextmanager
def db_commit(session, error_msg: str, error_code: str):
    """Wrap a database mutation in commit/rollback with standard error handling.

    Usage::

        with db_commit(session, "Kunne ikke lagre energiposten.", "SAVE_FAILED"):
            session.add(energy)
    """
    try:
        yield
        session.commit()
    except Exception:
        session.rollback()
        logger.exception(error_msg)
        raise ApiError(
            error_msg,
            code=error_code,
            status=500,
            suggestion=DEFAULT_RETRY_SUGGESTION,
        )
