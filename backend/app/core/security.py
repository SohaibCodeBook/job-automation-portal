from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import settings

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_SECONDS = 60 * 60 * 24 * 30  # 30 days

PASSWORD_RESET_PURPOSE = "password-reset"
EMAIL_VERIFY_PURPOSE = "email-verification"

_bearer = HTTPBearer(auto_error=False)


def _encode(payload: dict[str, Any], *, expires_delta: timedelta) -> str:
    now = datetime.now(UTC)
    expire_at = now + expires_delta
    to_encode = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int(expire_at.timestamp()),
    }
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=ALGORITHM)


def create_access_token(*, user_id: uuid.UUID, email: str) -> str:
    return _encode(
        {"sub": str(user_id), "email": email.strip().lower(), "type": "access"},
        expires_delta=timedelta(seconds=ACCESS_TOKEN_EXPIRE_SECONDS),
    )


def decode_access_token(token: str) -> dict[str, Any]:
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    if payload.get("type") != "access":
        raise JWTError("Not an access token.")
    sub = payload.get("sub")
    if not isinstance(sub, str) or not sub:
        raise JWTError("Missing subject.")
    return payload


def sign_password_reset_token(email: str, *, expires_in_seconds: int = 3600) -> str:
    normalized = email.strip().lower()
    return _encode(
        {"purpose": PASSWORD_RESET_PURPOSE, "email": normalized},
        expires_delta=timedelta(seconds=expires_in_seconds),
    )


def verify_password_reset_token(token: str) -> str:
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    if payload.get("purpose") != PASSWORD_RESET_PURPOSE:
        raise JWTError("Invalid reset token purpose.")
    email = payload.get("email")
    if not isinstance(email, str) or not email.strip():
        raise JWTError("Invalid reset token email.")
    return email.strip().lower()


def sign_email_verification_token(
    email: str, *, expires_in_seconds: int = 60 * 60 * 24
) -> str:
    normalized = email.strip().lower()
    return _encode(
        {"purpose": EMAIL_VERIFY_PURPOSE, "email": normalized},
        expires_delta=timedelta(seconds=expires_in_seconds),
    )


def verify_email_verification_token(token: str) -> str:
    payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[ALGORITHM])
    if payload.get("purpose") != EMAIL_VERIFY_PURPOSE:
        raise JWTError("Invalid verification token purpose.")
    email = payload.get("email")
    if not isinstance(email, str) or not email.strip():
        raise JWTError("Invalid verification token email.")
    return email.strip().lower()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> uuid.UUID:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(credentials.credentials)
        return uuid.UUID(str(payload["sub"]))
    except (JWTError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
