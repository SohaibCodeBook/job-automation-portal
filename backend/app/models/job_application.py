from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class JobApplication(Base):
    """Maps to existing public.job_applications (schema managed via Alembic baseline)."""

    __tablename__ = "job_applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    trigger_flow: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    first_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_name: Mapped[str | None] = mapped_column(Text, nullable=True)
    selected_industries: Mapped[str | None] = mapped_column(Text, nullable=True)
    industry_names_from_naics: Mapped[str | None] = mapped_column(Text, nullable=True)
    remote: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    hybrid: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    onsite: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    experience_levels: Mapped[str | None] = mapped_column(Text, nullable=True)
    omit_words: Mapped[str | None] = mapped_column(Text, nullable=True)
    must_include: Mapped[str | None] = mapped_column(Text, nullable=True)
    desired_job_title_1: Mapped[str | None] = mapped_column(Text, nullable=True)
    selected_cities: Mapped[str | None] = mapped_column(Text, nullable=True)
    selected_states: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    resume_storage_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    limit_jobs: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=False), nullable=True
    )
    job_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    selected_regions: Mapped[list[str] | None] = mapped_column(
        ARRAY(Text), nullable=True
    )
    pay_range_filter: Mapped[dict[str, Any] | list[Any] | None] = mapped_column(
        JSONB, nullable=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
