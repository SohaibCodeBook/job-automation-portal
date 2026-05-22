from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse

from app.api.deps import get_job_listing_service
from app.core.security import get_current_user_id
from app.schemas.job_listing_responses import (
    JobListingDetailResponse,
    JobListingErrorResponse,
    JobListingListResponse,
)
from app.services.job_listing_service import (
    JobListingNotFoundError,
    JobListingService,
)

router = APIRouter(prefix="/job-listings", tags=["job-listings"])


@router.get(
    "",
    response_model=JobListingListResponse,
    responses={401: {"model": JobListingErrorResponse}},
)
async def list_job_listings(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    job_application_id: uuid.UUID | None = Query(
        None,
        description="Optional filter: listings for a single job application owned by the user.",
    ),
) -> JobListingListResponse:
    result = await service.list_for_user(
        user_id,
        page=page,
        page_size=page_size,
        job_application_id=job_application_id,
    )
    return JobListingListResponse(**result)


@router.get(
    "/{listing_id}",
    response_model=JobListingDetailResponse,
    responses={
        401: {"model": JobListingErrorResponse},
        404: {"model": JobListingErrorResponse},
    },
)
async def get_job_listing(
    listing_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingDetailResponse | JSONResponse:
    try:
        detail = await service.get_for_user(user_id, listing_id)
        return JobListingDetailResponse(**detail)
    except JobListingNotFoundError:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=JobListingErrorResponse(
                message="Job listing not found.",
            ).model_dump(),
        )
