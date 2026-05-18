from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, SmallInteger, String, Text, false
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AuthUser(Base):
    """Maps to existing Supabase-compatible auth.users (schema managed via Alembic baseline)."""

    __tablename__ = "users"
    __table_args__ = {"schema": "auth"}

    instance_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    aud: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    encrypted_password: Mapped[str | None] = mapped_column(String, nullable=True)
    email_confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    invited_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    confirmation_token: Mapped[str | None] = mapped_column(String, nullable=True)
    confirmation_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    recovery_token: Mapped[str | None] = mapped_column(String, nullable=True)
    recovery_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    email_change_token_new: Mapped[str | None] = mapped_column(String, nullable=True)
    email_change: Mapped[str | None] = mapped_column(String, nullable=True)
    email_change_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_sign_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    raw_app_meta_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    raw_user_meta_data: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    is_super_admin: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    phone: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone_confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    phone_change: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone_change_token: Mapped[str | None] = mapped_column(String, nullable=True)
    phone_change_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    email_change_token_current: Mapped[str | None] = mapped_column(String, nullable=True)
    email_change_confirm_status: Mapped[int | None] = mapped_column(
        SmallInteger, nullable=True
    )
    banned_until: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    reauthentication_token: Mapped[str | None] = mapped_column(String, nullable=True)
    reauthentication_sent_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_sso_user: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=false())
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_anonymous: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=false())
