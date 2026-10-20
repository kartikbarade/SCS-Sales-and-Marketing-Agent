from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings


JWT_ALGORITHM = "HS256"

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_owner(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please log in as Owner.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
        )

        email = payload.get("sub")
        role = payload.get("role")
        expires_at = payload.get("exp")

        if not email or not role or not expires_at:
            raise unauthorized

        if email.lower() != settings.OWNER_EMAIL.lower():
            raise unauthorized

        if role != "owner":
            raise unauthorized

        if datetime.fromtimestamp(
            float(expires_at), tz=timezone.utc
        ) <= datetime.now(timezone.utc):
            raise unauthorized

    except (JWTError, ValueError, TypeError):
        raise unauthorized

    return {"email": email, "role": role}
