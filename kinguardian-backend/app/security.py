import uuid
import jwt
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.db import get_session
from app.models import Profile

bearer = HTTPBearer(auto_error=False)


async def current_profile(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    session: AsyncSession = Depends(get_session),
) -> Profile:
    """Resolve an IAM identity. Development header support is intentionally disabled outside development."""
    if credentials:
        try:
            if not settings.iam_jwks_url:
                raise ValueError("JWKS URL is not configured")
            key = jwt.PyJWKClient(settings.iam_jwks_url).get_signing_key_from_jwt(credentials.credentials)
            claims = jwt.decode(credentials.credentials, key.key, algorithms=["RS256"], audience=settings.iam_audience, issuer=settings.iam_issuer)
        except Exception as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid bearer token") from exc
        subject = claims.get("sub")
        if not subject:
            raise HTTPException(status_code=401, detail="Token subject is required")
        email, name, timezone = claims.get("email"), claims.get("name"), claims.get("zoneinfo", "UTC")
    elif settings.environment == "development" and (subject := request.headers.get("x-actor-subject")):
        email = request.headers.get("x-actor-email")
        name, timezone = request.headers.get("x-actor-name", subject), request.headers.get("x-actor-timezone", "UTC")
    else:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    result = await session.execute(select(Profile).where(Profile.identity_subject == subject))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = Profile(identity_subject=subject, email=email, display_name=name, timezone=timezone)
        session.add(profile)
        await session.flush()
    return profile


async def require_membership(session: AsyncSession, family_id: uuid.UUID, actor_id: uuid.UUID, roles: set[str] | None = None):
    from app.models import Membership
    result = await session.execute(select(Membership).where(Membership.family_id == family_id, Membership.profile_id == actor_id, Membership.status == "active"))
    membership = result.scalar_one_or_none()
    if not membership or (roles and membership.role not in roles):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Family authorization denied")
    return membership
