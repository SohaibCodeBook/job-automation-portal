from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse

from app.api.deps import get_job_listing_service
from app.core.security import get_current_user_id
from app.lib.listing_date_filter import ListingDateFilter
from app.schemas.job_listing_responses import (
    JobListingDateCountsResponse,
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
    "/date-counts",
    response_model=JobListingDateCountsResponse,
    responses={401: {"model": JobListingErrorResponse}},
)
async def job_listing_date_counts(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
    job_application_id: uuid.UUID | None = Query(None),
) -> JobListingDateCountsResponse:
    counts = await service.date_counts_for_user(
        user_id, job_application_id=job_application_id
    )
    return JobListingDateCountsResponse(**counts)


@router.get(
    "",
    response_model=JobListingListResponse,
    responses={
        401: {"model": JobListingErrorResponse},
        400: {"model": JobListingErrorResponse},
    },
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
    date_filter: ListingDateFilter = Query(
        ListingDateFilter.ALL,
        description="Filter by job_listings.created_at bucket.",
    ),
    listed_on: date | None = Query(
        None,
        description="Calendar day (YYYY-MM-DD) when date_filter=on_date.",
    ),
) -> JobListingListResponse | JSONResponse:
    try:
        result = await service.list_for_user(
            user_id,
            page=page,
            page_size=page_size,
            job_application_id=job_application_id,
            date_filter=date_filter.value,
            listed_on=listed_on,
        )
        return JobListingListResponse(**result)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


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
