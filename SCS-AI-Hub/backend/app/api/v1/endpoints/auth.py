
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from pwdlib import PasswordHash
from jose import jwt

from app.core.config import settings


router = APIRouter()

password_hash = PasswordHash.recommended()

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


@router.post("/login", response_model=LoginResponse)
def owner_login(data: LoginRequest):
    # Accept only the configured Owner email.
    if data.email.lower() != settings.OWNER_EMAIL.lower():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Verify the submitted password against the stored hash.
    try:
        valid_password = password_hash.verify(
            data.password,
            settings.OWNER_PASSWORD_HASH,
        )
    except Exception:
        valid_password = False

    if not valid_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    token = jwt.encode(
        {
            "sub": settings.OWNER_EMAIL,
            "role": "owner",
            "exp": expires_at,
        },
        settings.SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        role="owner",
    )
