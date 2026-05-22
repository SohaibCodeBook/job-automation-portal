from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class JobListing(Base):
    """Maps to existing public.job_listings (schema managed outside Alembic baseline)."""

    __tablename__ = "job_listings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    job_application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("job_applications.id"),
        nullable=False,
    )
    title: Mapped[str | None] = mapped_column(Text, nullable=True)
    company: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(Text, nullable=True)
    company_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    company_website: Mapped[str | None] = mapped_column(Text, nullable=True)
    pay_range: Mapped[str | None] = mapped_column(Text, nullable=True)
    posted_time: Mapped[str | None] = mapped_column(Text, nullable=True)
    employment_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    industries: Mapped[str | None] = mapped_column(Text, nullable=True)
    about_job: Mapped[str | None] = mapped_column(Text, nullable=True)
    name: Mapped[str | None] = mapped_column(Text, nullable=True)
    field: Mapped[str | None] = mapped_column(Text, nullable=True)
    work_type: Mapped[str | None] = mapped_column(Text, nullable=True)
    omit_words: Mapped[str | None] = mapped_column(Text, nullable=True)
    job_origin: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=False), nullable=True
    )
