from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_listing_note import JobListingNote


@dataclass(frozen=True)
class ListingNoteRow:
    note: str
    updated_at: datetime


class JobListingNoteRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def notes_for_listings(
        self,
        user_id: uuid.UUID,
        listing_ids: list[uuid.UUID],
    ) -> dict[uuid.UUID, ListingNoteRow]:
        if not listing_ids:
            return {}
        stmt = select(
            JobListingNote.job_listing_id,
            JobListingNote.note,
            JobListingNote.updated_at,
        ).where(
            JobListingNote.user_id == user_id,
            JobListingNote.job_listing_id.in_(listing_ids),
        )
        result = await self._session.execute(stmt)
        return {
            row[0]: ListingNoteRow(note=row[1], updated_at=row[2])
            for row in result.all()
        }

    async def upsert(
        self,
        user_id: uuid.UUID,
        listing_id: uuid.UUID,
        note: str,
    ) -> ListingNoteRow:
        stmt = (
            insert(JobListingNote)
            .values(user_id=user_id, job_listing_id=listing_id, note=note)
            .on_conflict_do_update(
                constraint="uq_job_listing_notes_user_listing",
                set_={
                    "note": note,
                    "updated_at": func.now(),
                },
            )
            .returning(JobListingNote.note, JobListingNote.updated_at)
        )
        result = await self._session.execute(stmt)
        row = result.one()
        return ListingNoteRow(note=row[0], updated_at=row[1])

    async def remove(self, user_id: uuid.UUID, listing_id: uuid.UUID) -> None:
        stmt = delete(JobListingNote).where(
            JobListingNote.user_id == user_id,
            JobListingNote.job_listing_id == listing_id,
        )
        await self._session.execute(stmt)

    async def delete_all_for_user(self, user_id: uuid.UUID) -> None:
        stmt = delete(JobListingNote).where(JobListingNote.user_id == user_id)
        await self._session.execute(stmt)
