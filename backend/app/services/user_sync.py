from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.user import User


def _claim_email(claims: dict) -> str | None:
    """Extract the user's email from Clerk claims and normalize it to lowercase.
    Returns None if no supported email claim is present.
    """
    if claims.get("email"):
        email = claims["email"]
        if isinstance(email, str):
            return email.strip().lower()

    emails = claims.get("email_addresses")
    if isinstance(emails, list):
        for item in emails:
            if isinstance(item, dict) and item.get("email_address"):
                return item["email_address"].strip().lower()
            if isinstance(item, str):
                return item.strip().lower()

    return None


def _claim_name(claims: dict) -> str:
    """Extract the user's display name from Clerk claims with simple fallbacks.
    Prefers a full name, then builds one from given and family name.
    """
    if claims.get("name"):
        return str(claims["name"]).strip()

    given = str(claims.get("given_name", "")).strip()
    family = str(claims.get("family_name", "")).strip()
    full = f"{given} {family}".strip()

    return full or "Unknown user"


def upsert_user_from_clerk(session: Session, claims: dict) -> User:
    """Create or update a local user record from the authenticated Clerk identity.
    Uses Clerk's subject claim as the primary identity and only links legacy users
    by email if they are not already linked.
    """
    clerk_id = claims.get("sub")
    if not clerk_id:
        raise ValueError("Token missing sub claim")

    email = _claim_email(claims)
    if not email:
        raise ValueError("Token missing email claim")

    name = _claim_name(claims)

    user = session.query(User).filter(User.clerk_id == clerk_id).one_or_none()

    if not user:
        # Link a legacy user by emailif not already been connected to Clerk.
        user = (
            session.query(User)
            .filter(User.email == email, User.clerk_id.is_(None))
            .one_or_none()
        )

    clerk_username = claims.get("username") or None
    if isinstance(clerk_username, str):
        clerk_username = clerk_username.strip() or None

    if user:
        # Keep identity fields synchronized with Clerk, but preserve the local
        # profile name after the account has been created or linked.
        if user.clerk_id != clerk_id:
            user.clerk_id = clerk_id
        if user.email != email:
            user.email = email
        if clerk_username and not user.username:
            user.username = clerk_username
        return user

    # Seed the initial local profile name from Clerk for new users.
    user = User(
        clerk_id=clerk_id,
        email=email,
        name=name,
        username=clerk_username,
        phone=None,
        is_system_admin=False,
    )
    session.add(user)
    session.flush()
    return user
