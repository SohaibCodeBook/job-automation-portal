from __future__ import annotations

import uuid

from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_application import JobApplication
from app.models.job_listing import JobListing
from app.models.job_listing_applied import JobListingApplied


class JobListingAppliedRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def count_for_user(self, user_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(JobListingApplied)
            .join(JobListing, JobListingApplied.job_listing_id == JobListing.id)
            .join(JobApplication, JobListing.job_application_id == JobApplication.id)
            .where(
                JobListingApplied.user_id == user_id,
                JobApplication.user_id == user_id,
            )
        )
        return int((await self._session.execute(stmt)).scalar_one())

    async def list_ids_for_user(self, user_id: uuid.UUID) -> list[uuid.UUID]:
        stmt = (
            select(JobListingApplied.job_listing_id)
            .join(JobListing, JobListingApplied.job_listing_id == JobListing.id)
            .join(JobApplication, JobListing.job_application_id == JobApplication.id)
            .where(
                JobListingApplied.user_id == user_id,
                JobApplication.user_id == user_id,
            )
            .order_by(JobListingApplied.applied_at.desc())
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def applied_ids_for_listings(
        self,
        user_id: uuid.UUID,
        listing_ids: list[uuid.UUID],
    ) -> set[uuid.UUID]:
        if not listing_ids:
            return set()
        stmt = select(JobListingApplied.job_listing_id).where(
            JobListingApplied.user_id == user_id,
            JobListingApplied.job_listing_id.in_(listing_ids),
        )
        result = await self._session.execute(stmt)
        return set(result.scalars().all())

    async def applied_times_for_listings(
        self,
        user_id: uuid.UUID,
        listing_ids: list[uuid.UUID],
    ) -> dict[uuid.UUID, object]:
        if not listing_ids:
            return {}
        stmt = select(
            JobListingApplied.job_listing_id,
            JobListingApplied.applied_at,
        ).where(
            JobListingApplied.user_id == user_id,
            JobListingApplied.job_listing_id.in_(listing_ids),
        )
        result = await self._session.execute(stmt)
        return {row[0]: row[1] for row in result.all()}

    async def add(self, user_id: uuid.UUID, listing_id: uuid.UUID) -> None:
        stmt = (
            insert(JobListingApplied)
            .values(user_id=user_id, job_listing_id=listing_id)
            .on_conflict_do_nothing(
                constraint="uq_job_listing_applied_user_listing",
            )
        )
        await self._session.execute(stmt)

    async def remove(self, user_id: uuid.UUID, listing_id: uuid.UUID) -> None:
        stmt = delete(JobListingApplied).where(
            JobListingApplied.user_id == user_id,
            JobListingApplied.job_listing_id == listing_id,
        )
        await self._session.execute(stmt)
