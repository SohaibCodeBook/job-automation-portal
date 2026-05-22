from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_application import JobApplication
from app.models.job_listing import JobListing


class JobListingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @staticmethod
    def _join_on_application():
        return JobListing.job_application_id == JobApplication.id

    @staticmethod
    def _filters(
        user_id: uuid.UUID, job_application_id: uuid.UUID | None = None
    ) -> list:
        clauses = [JobApplication.user_id == user_id]
        if job_application_id is not None:
            clauses.append(JobListing.job_application_id == job_application_id)
        return clauses

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
        job_application_id: uuid.UUID | None = None,
    ) -> tuple[list[JobListing], int]:
        offset = (page - 1) * page_size
        join = self._join_on_application()
        filters = self._filters(user_id, job_application_id)

        count_stmt = (
            select(func.count())
            .select_from(JobListing)
            .join(JobApplication, join)
            .where(*filters)
        )
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(JobListing)
            .join(JobApplication, join)
            .where(*filters)
            .order_by(
                JobListing.created_at.desc().nullslast(),
                JobListing.id.desc(),
            )
            .offset(offset)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_for_user(
        self, user_id: uuid.UUID, listing_id: uuid.UUID
    ) -> JobListing | None:
        stmt = (
            select(JobListing)
            .join(JobApplication, self._join_on_application())
            .where(JobListing.id == listing_id, JobApplication.user_id == user_id)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
