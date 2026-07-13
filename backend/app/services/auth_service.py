from __future__ import annotations

import uuid
from typing import Any

import bcrypt
from jose import JWTError
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    AuthError,
    GoogleOnlyAccountError,
    InvalidCredentialsError,
    UnverifiedEmailError,
)
from app.core.security import (
    create_access_token,
    verify_email_verification_token,
    verify_password_reset_token,
)
from app.repositories.user_repository import UserRepository
from app.repositories.job_application_repository import JobApplicationRepository
from app.repositories.job_listing_applied_repository import JobListingAppliedRepository
from app.repositories.job_listing_favorite_repository import JobListingFavoriteRepository
from app.repositories.job_listing_note_repository import JobListingNoteRepository
from app.services.email_service import (
    SmtpConfigurationError,
    send_email_verification_message,
    send_password_reset_email,
)
from app.services.resume_storage import delete_user_resume_tree

BCRYPT_ROUNDS = 12


def _display_name(meta: dict[str, Any] | None, fallback_email: str) -> str:
    if not meta:
        return fallback_email.split("@")[0] or "User"
    full = str(meta.get("full_name") or "").strip()
    name = str(meta.get("name") or "").strip()
    picked = full or name
    return picked or fallback_email.split("@")[0] or "User"


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(rounds=BCRYPT_ROUNDS),
    ).decode("utf-8")


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"),
            stored_hash.encode("utf-8"),
        )
    except ValueError:
        return False


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self._users = UserRepository(session)
        self._applications = JobApplicationRepository(session)
        self._favorites = JobListingFavoriteRepository(session)
        self._applied = JobListingAppliedRepository(session)
        self._notes = JobListingNoteRepository(session)
        self._session = session

    async def register(
        self, *, name: str, email: str, password: str
    ) -> None:
        normalized_email = email.strip().lower()
        full_name = name.strip()
        if not full_name:
            raise AuthError("Invalid registration data.", code="validation_error")

        existing = await self._users.get_credentials_row(normalized_email)
        if existing is not None:
            raise AuthError(
                "An account with this email already exists. Try signing in with Google or email.",
                code="duplicate_email",
            )

        password_hash = _hash_password(password)
        try:
            await self._users.insert_email_password_user(
                email=normalized_email,
                password_hash=password_hash,
                full_name=full_name,
            )
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise AuthError(
                "An account with this email already exists. Try signing in with Google or email.",
                code="duplicate_email",
            ) from exc

        try:
            await send_email_verification_message(normalized_email)
        except SmtpConfigurationError as exc:
            raise AuthError(str(exc), code="email_send_failed") from exc
        except Exception as exc:
            raise AuthError(str(exc), code="email_send_failed") from exc

    async def login(self, *, email: str, password: str) -> dict[str, Any]:
        normalized = email.strip().lower()
        if not normalized or not password:
            raise InvalidCredentialsError()

        row = await self._users.get_credentials_row(normalized)
        if row is None:
            raise InvalidCredentialsError()

        stored = row.encrypted_password
        if stored is None or stored == "":
            raise GoogleOnlyAccountError()

        if row.email_confirmed_at is None:
            raise UnverifiedEmailError()

        if not _verify_password(password, stored):
            raise InvalidCredentialsError()

        token = create_access_token(user_id=row.id, email=row.email)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(row.id),
                "email": row.email,
                "name": _display_name(row.raw_user_meta_data, row.email),
            },
        }

    async def forgot_password(self, email: str) -> None:
        normalized = email.strip().lower()
        user_id = await self._users.find_id_by_email(normalized)
        if user_id is None:
            return
        await send_password_reset_email(normalized)

    async def reset_password(self, *, token: str, password: str) -> None:
        try:
            email = verify_password_reset_token(token)
        except JWTError as exc:
            raise AuthError(
                "Invalid or expired reset link.",
                code="invalid_token",
            ) from exc

        password_hash = _hash_password(password)
        updated = await self._users.update_password_hash(email, password_hash)
        if not updated:
            raise AuthError(
                "This reset link is no longer valid.",
                code="invalid_token",
            )
        await self._session.commit()

    async def confirm_email(self, token: str) -> None:
        try:
            email = verify_email_verification_token(token)
        except JWTError as exc:
            raise AuthError(
                "Invalid or expired verification link.",
                code="invalid_token",
            ) from exc

        ok = await self._users.confirm_email(email)
        if not ok:
            raise AuthError(
                "No account found for this verification link.",
                code="not_found",
            )
        await self._session.commit()

    async def sync_google_user(
        self, *, intent: str, profile: dict[str, Any]
    ) -> dict[str, Any]:
        email_raw = profile.get("email")
        email = str(email_raw).strip().lower() if email_raw else ""
        if not email:
            raise AuthError("Google profile missing email.", code="oauth_email")

        existing_id = await self._users.find_id_by_email(email)

        if intent == "signup":
            if existing_id is not None:
                raise AuthError(
                    "This Google account is already registered.",
                    code="account_exists",
                )
            try:
                user_id = await self._users.insert_google_auth_user(
                    email=email,
                    profile=profile,
                )
                await self._session.commit()
            except IntegrityError as exc:
                await self._session.rollback()
                raise AuthError(
                    "Could not create the account.",
                    code="oauth_create_failed",
                ) from exc

            name = _display_name(
                {
                    "name": profile.get("name"),
                    "full_name": profile.get("name"),
                },
                email,
            )
            return {
                "user_id": str(user_id),
                "email": email,
                "name": name,
                "created": True,
                "access_token": create_access_token(user_id=user_id, email=email),
            }

        if intent == "signin":
            if existing_id is None:
                raise AuthError(
                    "No account for this Google user.",
                    code="no_account",
                )
            row = await self._users.get_user_profile(existing_id)
            meta = row.raw_user_meta_data if row else None
            name = _display_name(meta, email)
            return {
                "user_id": str(existing_id),
                "email": email,
                "name": name,
                "created": False,
                "access_token": create_access_token(
                    user_id=existing_id, email=email
                ),
            }

        raise AuthError("Invalid Google OAuth intent.", code="validation_error")

    async def get_me(self, user_id: uuid.UUID) -> dict[str, Any]:
        user = await self._users.get_user_profile(user_id)
        if user is None or user.email is None:
            raise AuthError("User not found.", code="not_found")
        return {
            "id": str(user.id),
            "email": user.email,
            "name": _display_name(user.raw_user_meta_data, user.email),
            "email_verified": user.email_confirmed_at is not None,
        }

    async def delete_account(self, user_id: uuid.UUID) -> None:
        """Delete personal account data. Scraped job listings are kept."""
        user = await self._users.get_user_profile(user_id)
        if user is None:
            raise AuthError("User not found.", code="not_found")

        await self._favorites.delete_all_for_user(user_id)
        await self._applied.delete_all_for_user(user_id)
        await self._notes.delete_all_for_user(user_id)
        await self._applications.anonymize_for_user(user_id)

        deleted = await self._users.soft_delete_account(user_id)
        if not deleted:
            raise AuthError("User not found.", code="not_found")

        await self._session.commit()
        delete_user_resume_tree(user_id)
