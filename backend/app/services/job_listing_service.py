from __future__ import annotations

import uuid
from datetime import date
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.listing_date_filter import ListingDateFilter
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
        "field": listing.field,
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


def _parse_date_filter(value: str | None) -> ListingDateFilter:
    if not value:
        return ListingDateFilter.ALL
    try:
        return ListingDateFilter(value)
    except ValueError as exc:
        raise ValueError(f"Invalid date_filter: {value}") from exc


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
        date_filter: str | None = None,
        listed_on: date | None = None,
    ) -> dict[str, Any]:
        bucket = _parse_date_filter(date_filter)
        if bucket == ListingDateFilter.ON_DATE and listed_on is None:
            raise ValueError("listed_on is required when date_filter is on_date.")

        listings, total = await self._repo.list_for_user(
            user_id,
            page=page,
            page_size=page_size,
            job_application_id=job_application_id,
            date_filter=bucket,
            listed_on=listed_on,
        )
        return {
            "items": [_to_list_item(row) for row in listings],
            "total": total,
            "page": page,
            "page_size": page_size,
        }

    async def date_counts_for_user(
        self,
        user_id: uuid.UUID,
        *,
        job_application_id: uuid.UUID | None = None,
    ) -> dict[str, int]:
        raw = await self._repo.count_by_date_filters(
            user_id, job_application_id=job_application_id
        )
        return {
            "all": raw.get("all", 0),
            "today": raw.get("today", 0),
            "last_7_days": raw.get("last_7_days", 0),
            "last_2_weeks": raw.get("last_2_weeks", 0),
            "last_30_days": raw.get("last_30_days", 0),
            "older": raw.get("older", 0),
        }

    async def get_for_user(
        self, user_id: uuid.UUID, listing_id: uuid.UUID
    ) -> dict[str, Any]:
        listing = await self._repo.get_for_user(user_id, listing_id)
        if listing is None:
            raise JobListingNotFoundError()
        return _to_detail(listing)
