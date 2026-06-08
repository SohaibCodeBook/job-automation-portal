from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.listing_date_filter import (
    ListingDateFilter,
    created_at_filter_clauses,
)
from app.models.job_application import JobApplication
from app.models.job_listing import JobListing
from app.models.job_listing_favorite import JobListingFavorite


class JobListingRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @staticmethod
    def _join_on_application():
        return JobListing.job_application_id == JobApplication.id

    @staticmethod
    def _base_clauses(
        user_id: uuid.UUID,
        job_application_id: uuid.UUID | None = None,
    ) -> list:
        clauses = [JobApplication.user_id == user_id]
        if job_application_id is not None:
            clauses.append(JobListing.job_application_id == job_application_id)
        return clauses

    def _all_clauses(
        self,
        user_id: uuid.UUID,
        *,
        job_application_id: uuid.UUID | None = None,
        date_filter: ListingDateFilter | None = None,
        listed_on: date | None = None,
        favorites_only: bool = False,
    ) -> list:
        return [
            *self._base_clauses(user_id, job_application_id),
            *created_at_filter_clauses(date_filter, listed_on),
            *(
                [JobListingFavorite.user_id == user_id]
                if favorites_only
                else []
            ),
        ]

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
        job_application_id: uuid.UUID | None = None,
        date_filter: ListingDateFilter | None = None,
        listed_on: date | None = None,
        favorites_only: bool = False,
    ) -> tuple[list[JobListing], int]:
        offset = (page - 1) * page_size
        join = self._join_on_application()
        clauses = self._all_clauses(
            user_id,
            job_application_id=job_application_id,
            date_filter=date_filter,
            listed_on=listed_on,
            favorites_only=favorites_only,
        )

        count_stmt = (
            select(func.count())
            .select_from(JobListing)
            .join(JobApplication, join)
        )
        listings_stmt = select(JobListing).join(JobApplication, join)
        if favorites_only:
            count_stmt = count_stmt.join(
                JobListingFavorite,
                JobListingFavorite.job_listing_id == JobListing.id,
            )
            listings_stmt = listings_stmt.join(
                JobListingFavorite,
                JobListingFavorite.job_listing_id == JobListing.id,
            )

        count_stmt = count_stmt.where(*clauses)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            listings_stmt
            .where(*clauses)
            .order_by(
                JobListing.created_at.desc().nullslast(),
                JobListing.id.desc(),
            )
            .offset(offset)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all()), total

    async def count_by_date_filters(
        self,
        user_id: uuid.UUID,
        *,
        job_application_id: uuid.UUID | None = None,
    ) -> dict[str, int]:
        """Totals per date bucket across all listings for the user."""
        counts: dict[str, int] = {}
        for bucket in (
            ListingDateFilter.ALL,
            ListingDateFilter.TODAY,
            ListingDateFilter.LAST_7_DAYS,
            ListingDateFilter.LAST_2_WEEKS,
            ListingDateFilter.LAST_30_DAYS,
            ListingDateFilter.OLDER,
        ):
            join = self._join_on_application()
            clauses = self._all_clauses(
                user_id,
                job_application_id=job_application_id,
                date_filter=bucket,
            )
            stmt = (
                select(func.count())
                .select_from(JobListing)
                .join(JobApplication, join)
                .where(*clauses)
            )
            counts[bucket.value] = int(
                (await self._session.execute(stmt)).scalar_one()
            )
        return counts

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
