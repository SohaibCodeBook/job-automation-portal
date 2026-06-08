from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse, Response

from app.api.deps import get_job_listing_service, get_resume_rebuild_service
from app.core.security import get_current_user_id
from app.lib.listing_date_filter import ListingDateFilter
from app.schemas.job_listing_responses import (
    JobListingDateCountsResponse,
    JobListingDetailResponse,
    JobListingErrorResponse,
    JobListingFavoriteToggleResponse,
    JobListingFavoritesSummaryResponse,
    JobListingListResponse,
)
from app.services.job_listing_service import (
    JobListingNotFoundError,
    JobListingService,
)
from app.services.resume_rebuild_service import (
    ResumeRebuildService,
    ResumeRebuildServiceError,
    ResumeRebuildValidationError,
)

router = APIRouter(prefix="/job-listings", tags=["job-listings"])

_DOCX_MEDIA = (
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
)


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
    "/favorites",
    response_model=JobListingFavoritesSummaryResponse,
    responses={401: {"model": JobListingErrorResponse}},
)
async def job_listing_favorites_summary(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingFavoritesSummaryResponse:
    summary = await service.favorites_summary_for_user(user_id)
    return JobListingFavoritesSummaryResponse(**summary)


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
    favorites_only: bool = Query(
        False,
        description="When true, return only listings favorited by the current user.",
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
            favorites_only=favorites_only,
        )
        return JobListingListResponse(**result)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/{listing_id}/favorite",
    response_model=JobListingFavoriteToggleResponse,
    responses={
        401: {"model": JobListingErrorResponse},
        404: {"model": JobListingErrorResponse},
    },
)
async def add_job_listing_favorite(
    listing_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingFavoriteToggleResponse | JSONResponse:
    try:
        result = await service.add_favorite(user_id, listing_id)
        return JobListingFavoriteToggleResponse(**result)
    except JobListingNotFoundError:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=JobListingErrorResponse(
                message="Job listing not found.",
            ).model_dump(),
        )


@router.delete(
    "/{listing_id}/favorite",
    response_model=JobListingFavoriteToggleResponse,
    responses={
        401: {"model": JobListingErrorResponse},
        404: {"model": JobListingErrorResponse},
    },
)
async def remove_job_listing_favorite(
    listing_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingFavoriteToggleResponse | JSONResponse:
    try:
        result = await service.remove_favorite(user_id, listing_id)
        return JobListingFavoriteToggleResponse(**result)
    except JobListingNotFoundError:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=JobListingErrorResponse(
                message="Job listing not found.",
            ).model_dump(),
        )


@router.post(
    "/{listing_id}/rebuild-resume",
    response_model=None,
    responses={
        200: {
            "content": {_DOCX_MEDIA: {}},
            "description": "Tailored resume docx download.",
        },
        400: {"model": JobListingErrorResponse},
        401: {"model": JobListingErrorResponse},
        404: {"model": JobListingErrorResponse},
        502: {"model": JobListingErrorResponse},
    },
)
async def rebuild_job_listing_resume(
    listing_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: ResumeRebuildService = Depends(get_resume_rebuild_service),
) -> Response:
    try:
        docx_bytes, filename = await service.rebuild_for_listing(
            user_id,
            listing_id,
        )
        return Response(
            content=docx_bytes,
            media_type=_DOCX_MEDIA,
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
            },
        )
    except JobListingNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job listing not found.",
        ) from None
    except ResumeRebuildValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except ResumeRebuildServiceError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
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
