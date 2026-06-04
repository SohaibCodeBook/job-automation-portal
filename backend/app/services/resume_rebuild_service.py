from __future__ import annotations

import re
import uuid
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.job_application_repository import JobApplicationRepository
from app.repositories.job_listing_repository import JobListingRepository
from app.services.job_listing_service import JobListingNotFoundError
from app.services.resume_extractor_client import (
    ResumeExtractorError,
    extract_resume_text,
)
from app.services.resume_rebuilder_client import (
    ResumeRebuilderError,
    rebuild_resume_docx,
)
from app.services.resume_storage import ResumeStorageError, read_resume_file

_SAFE_FILENAME = re.compile(r"[^a-zA-Z0-9._-]+")


class ResumeRebuildValidationError(ValueError):
    pass


class ResumeRebuildServiceError(Exception):
    """Extract or rebuild external service failure."""


class ResumeRebuildService:
    def __init__(self, session: AsyncSession) -> None:
        self._listings = JobListingRepository(session)
        self._applications = JobApplicationRepository(session)

    async def rebuild_for_listing(
        self,
        user_id: uuid.UUID,
        listing_id: uuid.UUID,
    ) -> tuple[bytes, str]:
        listing = await self._listings.get_for_user(user_id, listing_id)
        if listing is None:
            raise JobListingNotFoundError()

        about_job = (listing.about_job or "").strip()
        if not about_job:
            raise ResumeRebuildValidationError(
                "This job listing has no job description to tailor the resume."
            )

        application = await self._applications.get_for_user(
            user_id,
            listing.job_application_id,
        )
        if application is None:
            raise ResumeRebuildValidationError(
                "Linked job application was not found."
            )

        storage_key = (application.resume_storage_key or "").strip()
        if not storage_key:
            raise ResumeRebuildValidationError(
                "No resume file found for this job application."
            )

        try:
            file_bytes = read_resume_file(storage_key)
        except ResumeStorageError as exc:
            raise ResumeRebuildValidationError(str(exc)) from exc

        filename = Path(storage_key).name or "resume.pdf"

        try:
            resume_text = await extract_resume_text(
                file_bytes=file_bytes,
                filename=filename,
            )
            docx_bytes = await rebuild_resume_docx(
                resume_text=resume_text,
                about_job=about_job,
            )
        except (ResumeExtractorError, ResumeRebuilderError) as exc:
            raise ResumeRebuildServiceError(str(exc)) from exc

        if not docx_bytes:
            raise ResumeRebuildServiceError(
                "Resume rebuilder returned an empty document."
            )

        return docx_bytes, _download_filename(listing.company, listing.title)


def _download_filename(
    company: str | None,
    title: str | None,
) -> str:
    company_part = _slug_part(company, "company")
    title_part = _slug_part(title, "role")
    return f"{company_part}-{title_part}-resume.docx"


def _slug_part(value: str | None, fallback: str) -> str:
    raw = (value or "").strip() or fallback
    cleaned = _SAFE_FILENAME.sub("_", raw.replace(" ", "-"))
    cleaned = cleaned.strip("._-")
    return cleaned or fallback
