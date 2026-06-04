from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job_application import JobApplication


class JobApplicationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, *, user_id: uuid.UUID, row: dict[str, Any]) -> uuid.UUID:
        application = JobApplication(
            id=uuid.uuid4(),
            user_id=user_id,
            **row,
        )
        self._session.add(application)
        await self._session.flush()
        return application.id

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        page: int,
        page_size: int,
    ) -> tuple[list[JobApplication], int]:
        offset = (page - 1) * page_size
        base_filter = JobApplication.user_id == user_id

        count_stmt = select(func.count()).select_from(JobApplication).where(base_filter)
        total = int((await self._session.execute(count_stmt)).scalar_one())

        stmt = (
            select(JobApplication)
            .where(base_filter)
            .order_by(JobApplication.created_at.desc().nullslast(), JobApplication.id.desc())
            .offset(offset)
            .limit(page_size)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all()), total

    async def get_for_user(
        self, user_id: uuid.UUID, application_id: uuid.UUID
    ) -> JobApplication | None:
        stmt = select(JobApplication).where(
            JobApplication.id == application_id,
            JobApplication.user_id == user_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def update_resume_storage_key(
        self,
        *,
        user_id: uuid.UUID,
        application_id: uuid.UUID,
        storage_key: str,
    ) -> None:
        app = await self.get_for_user(user_id, application_id)
        if app is None:
            raise ValueError("Job application not found.")
        app.resume_storage_key = storage_key
        await self._session.flush()
