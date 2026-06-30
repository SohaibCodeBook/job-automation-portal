from __future__ import annotations

import uuid
from datetime import date
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.listing_date_filter import ListingDateFilter
from app.models.job_listing import JobListing
from app.repositories.job_listing_applied_repository import (
    JobListingAppliedRepository,
)
from app.repositories.job_listing_favorite_repository import (
    JobListingFavoriteRepository,
)
from app.repositories.job_listing_note_repository import (
    JobListingNoteRepository,
)
from app.repositories.job_listing_repository import JobListingRepository


def _normalize_note(note: str | None) -> str | None:
    if note is None:
        return None
    trimmed = note.strip()
    return trimmed if trimmed else None


def _to_list_item(
    listing: JobListing,
    *,
    is_favorited: bool = False,
    is_applied: bool = False,
    applied_at: object | None = None,
    note: str | None = None,
    note_updated_at: object | None = None,
) -> dict[str, Any]:
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
        "is_favorited": is_favorited,
        "is_applied": is_applied,
        "applied_at": applied_at,
        "note": note,
        "note_updated_at": note_updated_at,
    }


def _to_detail(
    listing: JobListing,
    *,
    is_favorited: bool = False,
    is_applied: bool = False,
    applied_at: object | None = None,
    note: str | None = None,
    note_updated_at: object | None = None,
) -> dict[str, Any]:
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
        "is_favorited": is_favorited,
        "is_applied": is_applied,
        "applied_at": applied_at,
        "note": note,
        "note_updated_at": note_updated_at,
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
        self._session = session
        self._repo = JobListingRepository(session)
        self._favorites = JobListingFavoriteRepository(session)
        self._applied = JobListingAppliedRepository(session)
        self._notes = JobListingNoteRepository(session)

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        page: int = 1,
        page_size: int = 20,
        job_application_id: uuid.UUID | None = None,
        date_filter: str | None = None,
        listed_on: date | None = None,
        favorites_only: bool = False,
        applied_only: bool = False,
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
            favorites_only=favorites_only,
            applied_only=applied_only,
        )
        listing_ids = [row.id for row in listings]
        favorite_ids = await self._favorites.favorite_ids_for_listings(
            user_id,
            listing_ids,
        )
        applied_ids = await self._applied.applied_ids_for_listings(
            user_id,
            listing_ids,
        )
        applied_times = await self._applied.applied_times_for_listings(
            user_id,
            listing_ids,
        )
        notes = await self._notes.notes_for_listings(user_id, listing_ids)
        return {
            "items": [
                _to_list_item(
                    row,
                    is_favorited=row.id in favorite_ids,
                    is_applied=row.id in applied_ids,
                    applied_at=applied_times.get(row.id),
                    note=_normalize_note(notes[row.id].note)
                    if row.id in notes
                    else None,
                    note_updated_at=notes[row.id].updated_at
                    if row.id in notes
                    else None,
                )
                for row in listings
            ],
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
        favorite_ids = await self._favorites.favorite_ids_for_listings(
            user_id,
            [listing.id],
        )
        applied_ids = await self._applied.applied_ids_for_listings(
            user_id,
            [listing.id],
        )
        applied_times = await self._applied.applied_times_for_listings(
            user_id,
            [listing.id],
        )
        notes = await self._notes.notes_for_listings(user_id, [listing.id])
        note_row = notes.get(listing.id)
        return _to_detail(
            listing,
            is_favorited=listing.id in favorite_ids,
            is_applied=listing.id in applied_ids,
            applied_at=applied_times.get(listing.id),
            note=_normalize_note(note_row.note) if note_row else None,
            note_updated_at=note_row.updated_at if note_row else None,
        )

    async def favorites_summary_for_user(
        self, user_id: uuid.UUID
    ) -> dict[str, Any]:
        ids = await self._favorites.list_ids_for_user(user_id)
        return {
            "count": len(ids),
            "ids": [str(listing_id) for listing_id in ids],
        }

    async def applied_summary_for_user(
        self, user_id: uuid.UUID
    ) -> dict[str, Any]:
        ids = await self._applied.list_ids_for_user(user_id)
        return {
            "count": len(ids),
            "ids": [str(listing_id) for listing_id in ids],
        }

    async def add_favorite(
        self, user_id: uuid.UUID, listing_id: uuid.UUID
    ) -> dict[str, Any]:
        listing = await self._repo.get_for_user(user_id, listing_id)
        if listing is None:
            raise JobListingNotFoundError()
        await self._favorites.add(user_id, listing_id)
        await self._session.commit()
        count = await self._favorites.count_for_user(user_id)
        return {"favorited": True, "count": count}

    async def remove_favorite(
        self, user_id: uuid.UUID, listing_id: uuid.UUID
    ) -> dict[str, Any]:
        listing = await self._repo.get_for_user(user_id, listing_id)
        if listing is None:
            raise JobListingNotFoundError()
        await self._favorites.remove(user_id, listing_id)
        await self._session.commit()
        count = await self._favorites.count_for_user(user_id)
        return {"favorited": False, "count": count}

    async def mark_applied(
        self, user_id: uuid.UUID, listing_id: uuid.UUID
    ) -> dict[str, Any]:
        listing = await self._repo.get_for_user(user_id, listing_id)
        if listing is None:
            raise JobListingNotFoundError()
        await self._applied.add(user_id, listing_id)
        await self._session.commit()
        count = await self._applied.count_for_user(user_id)
        return {"applied": True, "count": count}

    async def unmark_applied(
        self, user_id: uuid.UUID, listing_id: uuid.UUID
    ) -> dict[str, Any]:
        listing = await self._repo.get_for_user(user_id, listing_id)
        if listing is None:
            raise JobListingNotFoundError()
        await self._applied.remove(user_id, listing_id)
        await self._session.commit()
        count = await self._applied.count_for_user(user_id)
        return {"applied": False, "count": count}

    async def upsert_note(
        self,
        user_id: uuid.UUID,
        listing_id: uuid.UUID,
        note: str,
    ) -> dict[str, Any]:
        listing = await self._repo.get_for_user(user_id, listing_id)
        if listing is None:
            raise JobListingNotFoundError()

        trimmed = note.strip()
        if not trimmed:
            await self._notes.remove(user_id, listing_id)
            await self._session.commit()
            return {"note": None, "note_updated_at": None}

        row = await self._notes.upsert(user_id, listing_id, trimmed)
        await self._session.commit()
        return {
            "note": row.note,
            "note_updated_at": row.updated_at,
        }

    async def remove_note(
        self, user_id: uuid.UUID, listing_id: uuid.UUID
    ) -> dict[str, Any]:
        listing = await self._repo.get_for_user(user_id, listing_id)
        if listing is None:
            raise JobListingNotFoundError()
        await self._notes.remove(user_id, listing_id)
        await self._session.commit()
        return {"note": None, "note_updated_at": None}
