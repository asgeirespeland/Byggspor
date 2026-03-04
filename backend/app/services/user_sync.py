from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.user import User


def _claim_email(claims: dict) -> str | None:
    """Extract email from common Clerk token claim shapes."""
    if claims.get("email"):
        return claims["email"]

    emails = claims.get("email_addresses")
    if isinstance(emails, list) and emails:
        first = emails[0]
        if isinstance(first, dict):
            return first.get("email_address")
        if isinstance(first, str):
            return first
    return None


def _claim_name(claims: dict) -> str:
    """Prefer full name claim, then compose from given/family name."""
    if claims.get("name"):
        return claims["name"]

    given = claims.get("given_name", "")
    family = claims.get("family_name", "")
    full = f"{given} {family}".strip()
    return full or "Unknown user"


def upsert_user_from_clerk(session: Session, claims: dict) -> User:
    """Create or update a local user record from Clerk JWT claims."""
    clerk_id = claims.get("sub")
    if not clerk_id:
        raise ValueError("Token mangler sub-claim")

    email = _claim_email(claims) or f"{clerk_id}@clerk.local"
    name = _claim_name(claims)

    user = session.query(User).filter(User.clerk_id == clerk_id).one_or_none()
    if not user:
        # Fallback for migrated data where clerk_id may not have been stored yet.
        user = session.query(User).filter(User.email == email).one_or_none()

    if user:
        # Keep local profile fields in sync with Clerk on each authenticated request.
        if user.clerk_id != clerk_id:
            user.clerk_id = clerk_id
        if user.email != email:
            user.email = email
        if user.name != name:
            user.name = name
        return user

    user = User(
        clerk_id=clerk_id,
        email=email,
        name=name,
        phone=None,
        is_system_admin=False,
    )
    session.add(user)
    session.flush()
    return user
