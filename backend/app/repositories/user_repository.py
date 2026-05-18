from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import AuthUser

AUTH_INSTANCE_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")


@dataclass(frozen=True)
class CredentialsRow:
    id: uuid.UUID
    email: str
    encrypted_password: str | None
    email_confirmed_at: datetime | None
    raw_user_meta_data: dict[str, Any] | None


class UserRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_id_by_email(self, email: str) -> uuid.UUID | None:
        normalized = email.strip().lower()
        stmt = (
            select(AuthUser.id)
            .where(
                func.lower(AuthUser.email) == normalized,
                AuthUser.deleted_at.is_(None),
            )
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_credentials_row(self, email: str) -> CredentialsRow | None:
        normalized = email.strip().lower()
        stmt = (
            select(
                AuthUser.id,
                AuthUser.email,
                AuthUser.encrypted_password,
                AuthUser.email_confirmed_at,
                AuthUser.raw_user_meta_data,
            )
            .where(
                func.lower(AuthUser.email) == normalized,
                AuthUser.deleted_at.is_(None),
            )
            .limit(1)
        )
        result = await self._session.execute(stmt)
        row = result.one_or_none()
        if row is None:
            return None
        return CredentialsRow(
            id=row.id,
            email=str(row.email or normalized),
            encrypted_password=row.encrypted_password,
            email_confirmed_at=row.email_confirmed_at,
            raw_user_meta_data=row.raw_user_meta_data,
        )

    async def get_user_profile(self, user_id: uuid.UUID) -> AuthUser | None:
        stmt = select(AuthUser).where(
            AuthUser.id == user_id,
            AuthUser.deleted_at.is_(None),
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def insert_email_password_user(
        self,
        *,
        email: str,
        password_hash: str,
        full_name: str,
    ) -> uuid.UUID:
        user_id = uuid.uuid4()
        now = datetime.now(UTC)
        raw_user_meta = {
            "email": email,
            "name": full_name,
            "full_name": full_name,
            "email_verified": False,
            "phone_verified": False,
        }
        raw_app_meta = {
            "provider": "credentials",
            "providers": ["credentials"],
        }
        user = AuthUser(
            instance_id=AUTH_INSTANCE_ID,
            id=user_id,
            aud="authenticated",
            role="authenticated",
            email=email,
            encrypted_password=password_hash,
            email_confirmed_at=None,
            confirmed_at=None,
            last_sign_in_at=None,
            raw_app_meta_data=raw_app_meta,
            raw_user_meta_data=raw_user_meta,
            created_at=now,
            updated_at=now,
            is_sso_user=False,
            is_anonymous=False,
        )
        self._session.add(user)
        await self._session.flush()
        return user_id

    async def update_password_hash(self, email: str, password_hash: str) -> bool:
        normalized = email.strip().lower()
        stmt = (
            update(AuthUser)
            .where(
                func.lower(AuthUser.email) == normalized,
                AuthUser.deleted_at.is_(None),
            )
            .values(encrypted_password=password_hash, updated_at=datetime.now(UTC))
            .returning(AuthUser.id)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none() is not None

    async def insert_google_auth_user(
        self,
        *,
        email: str,
        profile: dict[str, Any],
    ) -> uuid.UUID:
        user_id = uuid.uuid4()
        now = datetime.now(UTC)

        full_name = str(profile.get("name") or "").strip()
        if not full_name:
            full_name = email.split("@")[0] or "User"

        email_verified = profile.get("email_verified")
        if not isinstance(email_verified, bool):
            email_verified = True

        raw_user_meta = {
            "iss": "https://accounts.google.com",
            "sub": str(profile.get("sub") or ""),
            "name": profile.get("name") or full_name,
            "email": email,
            "picture": profile.get("picture"),
            "full_name": full_name,
            "avatar_url": profile.get("picture"),
            "provider_id": str(profile.get("sub") or ""),
            "email_verified": email_verified,
            "phone_verified": False,
        }
        raw_app_meta = {
            "provider": "google",
            "providers": ["google"],
        }

        user = AuthUser(
            instance_id=AUTH_INSTANCE_ID,
            id=user_id,
            aud="authenticated",
            role="authenticated",
            email=email,
            encrypted_password=None,
            email_confirmed_at=now,
            confirmed_at=now,
            last_sign_in_at=now,
            raw_app_meta_data=raw_app_meta,
            raw_user_meta_data=raw_user_meta,
            created_at=now,
            updated_at=now,
            is_sso_user=False,
            is_anonymous=False,
        )
        self._session.add(user)
        await self._session.flush()
        return user_id

    async def confirm_email(self, email: str) -> bool:
        normalized = email.strip().lower()
        stmt = text(
            """
            update auth.users
            set
              email_confirmed_at = coalesce(email_confirmed_at, now()),
              confirmed_at = coalesce(confirmed_at, now()),
              raw_user_meta_data = jsonb_set(
                coalesce(raw_user_meta_data, '{}'::jsonb),
                '{email_verified}',
                'true'::jsonb
              ),
              updated_at = now()
            where lower(email) = :email
              and deleted_at is null
            returning id
            """
        )
        result = await self._session.execute(stmt, {"email": normalized})
        return result.scalar_one_or_none() is not None
