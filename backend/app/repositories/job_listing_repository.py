from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import exists, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.lib.listing_date_filter import (
    ListingDateFilter,
    created_at_filter_clauses,
)
from app.lib.listing_text_filter import listing_text_filter_clauses
from app.models.job_application import JobApplication
from app.models.job_listing import JobListing
from app.models.job_listing_applied import JobListingApplied
from app.models.job_listing_archive import JobListingArchive
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

    @staticmethod
    def _archive_clauses(
        user_id: uuid.UUID,
        *,
        archived_only: bool = False,
    ) -> list:
        # archived_only uses an INNER JOIN (like favorites); filter by user there.
        # Active lists use NOT EXISTS so we don't join the archives table.
        if archived_only:
            return [JobListingArchive.user_id == user_id]
        archived_exists = exists(
            select(JobListingArchive.id).where(
                JobListingArchive.job_listing_id == JobListing.id,
                JobListingArchive.user_id == user_id,
            )
        )
        return [~archived_exists]

    def _all_clauses(
        self,
        user_id: uuid.UUID,
        *,
        job_application_id: uuid.UUID | None = None,
        date_filter: ListingDateFilter | None = None,
        listed_on: date | None = None,
        favorites_only: bool = False,
        applied_only: bool = False,
        archived_only: bool = False,
        search: str | None = None,
        type_filter: str | None = None,
        location: str | None = None,
    ) -> list:
        return [
            *self._base_clauses(user_id, job_application_id),
            *self._archive_clauses(user_id, archived_only=archived_only),
            *created_at_filter_clauses(date_filter, listed_on),
            *listing_text_filter_clauses(
                search=search,
                type_filter=type_filter,
                location=location,
            ),
            *([JobListingFavorite.user_id == user_id] if favorites_only else []),
            *([JobListingApplied.user_id == user_id] if applied_only else []),
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
        applied_only: bool = False,
        archived_only: bool = False,
        search: str | None = None,
        type_filter: str | None = None,
        location: str | None = None,
    ) -> tuple[list[JobListing], int]:
        offset = (page - 1) * page_size
        join = self._join_on_application()
        clauses = self._all_clauses(
            user_id,
            job_application_id=job_application_id,
            date_filter=date_filter,
            listed_on=listed_on,
            favorites_only=favorites_only,
            applied_only=applied_only,
            archived_only=archived_only,
            search=search,
            type_filter=type_filter,
            location=location,
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
        if applied_only:
            count_stmt = count_stmt.join(
                JobListingApplied,
                JobListingApplied.job_listing_id == JobListing.id,
            )
            listings_stmt = listings_stmt.join(
                JobListingApplied,
                JobListingApplied.job_listing_id == JobListing.id,
            )
        if archived_only:
            count_stmt = count_stmt.join(
                JobListingArchive,
                JobListingArchive.job_listing_id == JobListing.id,
            )
            listings_stmt = listings_stmt.join(
                JobListingArchive,
                JobListingArchive.job_listing_id == JobListing.id,
            )

        count_stmt = count_stmt.where(*clauses)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        order_by = [
            JobListing.created_at.desc().nullslast(),
            JobListing.id.desc(),
        ]
        if applied_only:
            order_by = [
                JobListingApplied.applied_at.desc(),
                JobListing.id.desc(),
            ]
        if archived_only:
            order_by = [
                JobListingArchive.created_at.desc(),
                JobListing.id.desc(),
            ]

        stmt = (
            listings_stmt.where(*clauses)
            .order_by(*order_by)
            .offset(offset)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all()), total

    async def filter_options_for_user(
        self,
        user_id: uuid.UUID,
        *,
        job_application_id: uuid.UUID | None = None,
        date_filter: ListingDateFilter | None = None,
        listed_on: date | None = None,
        favorites_only: bool = False,
        applied_only: bool = False,
        archived_only: bool = False,
        search: str | None = None,
        type_filter: str | None = None,
        location: str | None = None,
    ) -> dict[str, list[str]]:
        join = self._join_on_application()
        base_kwargs = {
            "user_id": user_id,
            "job_application_id": job_application_id,
            "date_filter": date_filter,
            "listed_on": listed_on,
            "favorites_only": favorites_only,
            "applied_only": applied_only,
            "archived_only": archived_only,
            "search": search,
        }

        async def distinct_values(
            column,
            *,
            clauses: list,
        ) -> list[str]:
            stmt = (
                select(column)
                .select_from(JobListing)
                .join(JobApplication, join)
            )
            if favorites_only:
                stmt = stmt.join(
                    JobListingFavorite,
                    JobListingFavorite.job_listing_id == JobListing.id,
                )
            if applied_only:
                stmt = stmt.join(
                    JobListingApplied,
                    JobListingApplied.job_listing_id == JobListing.id,
                )
            if archived_only:
                stmt = stmt.join(
                    JobListingArchive,
                    JobListingArchive.job_listing_id == JobListing.id,
                )
            stmt = (
                stmt.where(*clauses, column.is_not(None), column != "")
                .distinct()
                .order_by(column)
            )
            result = await self._session.execute(stmt)
            return list(result.scalars().all())

        type_clauses = self._all_clauses(
            **base_kwargs,
            type_filter=None,
            location=location,
        )
        location_clauses = self._all_clauses(
            **base_kwargs,
            type_filter=type_filter,
            location=None,
        )

        return {
            "employment_types": await distinct_values(
                JobListing.employment_type,
                clauses=type_clauses,
            ),
            "work_types": await distinct_values(
                JobListing.work_type,
                clauses=type_clauses,
            ),
            "locations": await distinct_values(
                JobListing.location,
                clauses=location_clauses,
            ),
        }

    async def count_by_date_filters(
        self,
        user_id: uuid.UUID,
        *,
        job_application_id: uuid.UUID | None = None,
    ) -> dict[str, int]:
        """Totals per date bucket across active (non-archived) listings."""
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

    async def experience_levels_by_application_ids(
        self, application_ids: list[uuid.UUID]
    ) -> dict[uuid.UUID, str | None]:
        if not application_ids:
            return {}
        stmt = select(JobApplication.id, JobApplication.experience_levels).where(
            JobApplication.id.in_(application_ids)
        )
        result = await self._session.execute(stmt)
        return {row[0]: row[1] for row in result.all()}

    async def list_owned_ids(
        self, user_id: uuid.UUID, listing_ids: list[uuid.UUID]
    ) -> list[uuid.UUID]:
        if not listing_ids:
            return []
        stmt = (
            select(JobListing.id)
            .join(JobApplication, self._join_on_application())
            .where(
                JobApplication.user_id == user_id,
                JobListing.id.in_(listing_ids),
            )
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())
