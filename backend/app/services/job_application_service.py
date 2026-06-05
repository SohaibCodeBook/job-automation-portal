from __future__ import annotations

import uuid
from typing import Any

from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.job_application_repository import JobApplicationRepository
from app.schemas.job_application import JobApplicationSubmissionRequest
from app.services.resume_storage import (
    ResumeStorageError,
    read_upload_file,
    save_source_resume,
)
from app.core.config import settings


def _join_semicolon(values: list[str] | None) -> str | None:
    if not values:
        return None
    cleaned = [item.strip() for item in values if item.strip()]
    if not cleaned:
        return None
    return ";".join(dict.fromkeys(cleaned))


def submission_to_row(body: JobApplicationSubmissionRequest) -> dict[str, Any]:
    pay_range_filter: dict[str, Any] | None = None
    if body.pay_range_filter is not None:
        pay_range_filter = {
            region: {
                "min": pay_range.min,
                "max": pay_range.max,
                "currency": pay_range.currency,
            }
            for region, pay_range in body.pay_range_filter.items()
        }

    selected_industries: str | None
    if body.selected_industries is None:
        selected_industries = None
    else:
        selected_industries = ";".join(body.selected_industries)

    return {
        "first_name": body.first_name,
        "last_name": body.last_name,
        "selected_industries": selected_industries,
        "industry_names_from_naics": _join_semicolon(body.industry_names_from_naics),
        "remote": body.remote,
        "hybrid": body.hybrid,
        "onsite": body.onsite,
        "job_type": body.job_type,
        "experience_levels": ";".join(body.experience_levels),
        "omit_words": _join_semicolon(body.omit_words),
        "must_include": _join_semicolon(body.must_include),
        "desired_job_title_1": body.desired_job_title_1,
        "selected_cities": _join_semicolon(body.selected_cities),
        "selected_states": _join_semicolon(body.selected_states),
        "selected_regions": body.selected_regions,
        "pay_range_filter": pay_range_filter,
        "resume_url": str(body.resume_url) if body.resume_url else None,
        "resume_storage_key": None,
        "limit_jobs": body.limit_jobs,
    }


def _to_list_item(app: Any) -> dict[str, Any]:
    return {
        "id": str(app.id),
        "first_name": app.first_name,
        "last_name": app.last_name,
        "desired_job_title_1": app.desired_job_title_1,
        "remote": app.remote,
        "hybrid": app.hybrid,
        "onsite": app.onsite,
        "job_type": app.job_type,
        "created_at": app.created_at,
    }


def _to_detail(app: Any) -> dict[str, Any]:
    return {
        "id": str(app.id),
        "first_name": app.first_name,
        "last_name": app.last_name,
        "selected_industries": app.selected_industries,
        "industry_names_from_naics": app.industry_names_from_naics,
        "remote": app.remote,
        "hybrid": app.hybrid,
        "onsite": app.onsite,
        "job_type": app.job_type,
        "experience_levels": app.experience_levels,
        "omit_words": app.omit_words,
        "must_include": app.must_include,
        "desired_job_title_1": app.desired_job_title_1,
        "selected_cities": app.selected_cities,
        "selected_states": app.selected_states,
        "selected_regions": app.selected_regions,
        "pay_range_filter": app.pay_range_filter,
        "resume_url": app.resume_url,
        "resume_storage_key": app.resume_storage_key,
        "limit_jobs": app.limit_jobs,
        "created_at": app.created_at,
    }


class JobApplicationNotFoundError(Exception):
    pass


class JobApplicationValidationError(ValueError):
    pass


class JobApplicationService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = JobApplicationRepository(session)
        self._session = session

    async def create(
        self,
        *,
        user_id: uuid.UUID,
        body: JobApplicationSubmissionRequest,
        resume_upload: UploadFile | None = None,
    ) -> uuid.UUID:
        try:
            row = submission_to_row(body)
            application_id = await self._repo.create(user_id=user_id, row=row)

            if resume_upload is not None:
                filename = resume_upload.filename or "resume.pdf"
                file_bytes = await read_upload_file(
                    resume_upload,
                    max_bytes=settings.RESUME_MAX_BYTES,
                )
                storage_key = save_source_resume(
                    user_id=user_id,
                    application_id=application_id,
                    data=file_bytes,
                    original_filename=filename,
                )
                await self._repo.update_resume_storage_key(
                    user_id=user_id,
                    application_id=application_id,
                    storage_key=storage_key,
                )

            await self._session.commit()
            return application_id
        except (ResumeStorageError, JobApplicationValidationError):
            await self._session.rollback()
            raise
        except Exception:
            await self._session.rollback()
            raise

    async def list_for_user(
        self, user_id: uuid.UUID, *, page: int = 1, page_size: int = 20
    ) -> dict[str, Any]:
        apps, total = await self._repo.list_for_user(
            user_id, page=page, page_size=page_size
        )
        return {
            "items": [_to_list_item(app) for app in apps],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    async def get_for_user(
        self, user_id: uuid.UUID, application_id: uuid.UUID
    ) -> dict[str, Any]:
        app = await self._repo.get_for_user(user_id, application_id)
        if app is None:
            raise JobApplicationNotFoundError()
        return _to_detail(app)
