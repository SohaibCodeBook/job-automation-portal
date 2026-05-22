from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_listing import JobListing
from app.repositories.job_listing_repository import JobListingRepository


def _to_list_item(listing: JobListing) -> dict[str, Any]:
    return {
        "id": str(listing.id),
        "job_application_id": str(listing.job_application_id),
        "title": listing.title,
        "company": listing.company,
        "location": listing.location,
        "url": listing.url,
        "pay_range": listing.pay_range,
        "posted_time": listing.posted_time,
        "employment_type": listing.employment_type,
        "work_type": listing.work_type,
        "job_origin": listing.job_origin,
        "created_at": listing.created_at,
    }


def _to_detail(listing: JobListing) -> dict[str, Any]:
    return {
        "id": str(listing.id),
        "job_application_id": str(listing.job_application_id),
        "title": listing.title,
        "company": listing.company,
        "location": listing.location,
        "url": listing.url,
        "company_url": listing.company_url,
        "company_website": listing.company_website,
        "pay_range": listing.pay_range,
        "posted_time": listing.posted_time,
        "employment_type": listing.employment_type,
        "industries": listing.industries,
        "about_job": listing.about_job,
        "name": listing.name,
        "field": listing.field,
        "work_type": listing.work_type,
        "omit_words": listing.omit_words,
        "job_origin": listing.job_origin,
        "created_at": listing.created_at,
    }


class JobListingNotFoundError(Exception):
    pass


class JobListingService:
    def __init__(self, session: AsyncSession) -> None:
        self._repo = JobListingRepository(session)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 20,
        job_application_id: uuid.UUID | None = None,
    ) -> dict[str, Any]:
        listings, total = await self._repo.list_for_user(
            user_id,
            page=page,
            page_size=page_size,
            job_application_id=job_application_id,
        )
        return {
            "items": [_to_list_item(row) for row in listings],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    async def get_for_user(
        self, user_id: uuid.UUID, listing_id: uuid.UUID
    ) -> dict[str, Any]:
        listing = await self._repo.get_for_user(user_id, listing_id)
        if listing is None:
            raise JobListingNotFoundError()
        return _to_detail(listing)
