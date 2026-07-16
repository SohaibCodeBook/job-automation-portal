from __future__ import annotations

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_application import JobApplication
from app.models.job_listing import JobListing
from app.models.job_listing_archive import JobListingArchive


class JobListingArchiveRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def count_for_user(self, user_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(JobListingArchive)
            .join(JobListing, JobListingArchive.job_listing_id == JobListing.id)
            .join(JobApplication, JobListing.job_application_id == JobApplication.id)
            .where(
                JobListingArchive.user_id == user_id,
                JobApplication.user_id == user_id,
            )
        )
        return int((await self._session.execute(stmt)).scalar_one())

    async def list_ids_for_user(self, user_id: uuid.UUID) -> list[uuid.UUID]:
        stmt = (
            select(JobListingArchive.job_listing_id)
            .join(JobListing, JobListingArchive.job_listing_id == JobListing.id)
            .join(JobApplication, JobListing.job_application_id == JobApplication.id)
            .where(
                JobListingArchive.user_id == user_id,
                JobApplication.user_id == user_id,
            )
            .order_by(JobListingArchive.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def archived_ids_for_listings(
        self,
        user_id: uuid.UUID,
        listing_ids: list[uuid.UUID],
    ) -> set[uuid.UUID]:
        if not listing_ids:
            return set()
        stmt = select(JobListingArchive.job_listing_id).where(
            JobListingArchive.user_id == user_id,
            JobListingArchive.job_listing_id.in_(listing_ids),
        )
        result = await self._session.execute(stmt)
        return set(result.scalars().all())

    async def add(self, user_id: uuid.UUID, listing_id: uuid.UUID) -> None:
        stmt = (
            insert(JobListingArchive)
            .values(user_id=user_id, job_listing_id=listing_id)
            .on_conflict_do_nothing(
                constraint="uq_job_listing_archives_user_listing",
            )
        )
        await self._session.execute(stmt)

    async def add_many(self, user_id: uuid.UUID, listing_ids: list[uuid.UUID]) -> None:
        if not listing_ids:
            return
        stmt = (
            insert(JobListingArchive)
            .values(
                [
                    {"user_id": user_id, "job_listing_id": listing_id}
                    for listing_id in listing_ids
                ]
            )
            .on_conflict_do_nothing(
                constraint="uq_job_listing_archives_user_listing",
            )
        )
        await self._session.execute(stmt)

    async def remove(self, user_id: uuid.UUID, listing_id: uuid.UUID) -> None:
        stmt = delete(JobListingArchive).where(
            JobListingArchive.user_id == user_id,
            JobListingArchive.job_listing_id == listing_id,
        )
        await self._session.execute(stmt)

    async def remove_many(
        self, user_id: uuid.UUID, listing_ids: list[uuid.UUID]
    ) -> None:
        if not listing_ids:
            return
        stmt = delete(JobListingArchive).where(
            JobListingArchive.user_id == user_id,
            JobListingArchive.job_listing_id.in_(listing_ids),
        )
        await self._session.execute(stmt)

    async def delete_all_for_user(self, user_id: uuid.UUID) -> None:
        stmt = delete(JobListingArchive).where(JobListingArchive.user_id == user_id)
        await self._session.execute(stmt)
