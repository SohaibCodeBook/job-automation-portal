from __future__ import annotations

import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse, Response

from app.api.deps import get_job_listing_service, get_resume_rebuild_service
from app.core.security import get_current_user_id
from app.lib.listing_date_filter import ListingDateFilter
from app.schemas.job_listing_responses import (
    JobListingAppliedSummaryResponse,
    JobListingAppliedToggleResponse,
    JobListingArchiveToggleResponse,
    JobListingArchivesSummaryResponse,
    JobListingBulkArchiveRequest,
    JobListingBulkArchiveResponse,
    JobListingDateCountsResponse,
    JobListingDetailResponse,
    JobListingErrorResponse,
    JobListingFavoriteToggleResponse,
    JobListingFavoritesSummaryResponse,
    JobListingFilterOptionsResponse,
    JobListingListResponse,
    JobListingNoteResponse,
    JobListingNoteUpsertRequest,
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
    "/applied",
    response_model=JobListingAppliedSummaryResponse,
    responses={401: {"model": JobListingErrorResponse}},
)
async def job_listing_applied_summary(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingAppliedSummaryResponse:
    summary = await service.applied_summary_for_user(user_id)
    return JobListingAppliedSummaryResponse(**summary)


@router.get(
    "/archives",
    response_model=JobListingArchivesSummaryResponse,
    responses={401: {"model": JobListingErrorResponse}},
)
async def job_listing_archives_summary(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingArchivesSummaryResponse:
    summary = await service.archives_summary_for_user(user_id)
    return JobListingArchivesSummaryResponse(**summary)


@router.get(
    "/filter-options",
    response_model=JobListingFilterOptionsResponse,
    responses={
        401: {"model": JobListingErrorResponse},
        400: {"model": JobListingErrorResponse},
    },
)
async def job_listing_filter_options(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
    job_application_id: uuid.UUID | None = Query(None),
    date_filter: ListingDateFilter = Query(ListingDateFilter.ALL),
    listed_on: date | None = Query(None),
    favorites_only: bool = Query(False),
    applied_only: bool = Query(False),
    archived_only: bool = Query(False),
    search: str | None = Query(
        None,
        max_length=200,
        description="Keyword search used to narrow filter option lists.",
    ),
    type_filter: str | None = Query(
        None,
        max_length=200,
        description="When set, location options are limited to this employment/work type.",
    ),
    location: str | None = Query(
        None,
        max_length=500,
        description="When set, type options are limited to this location.",
    ),
) -> JobListingFilterOptionsResponse | JSONResponse:
    try:
        options = await service.filter_options_for_user(
            user_id,
            job_application_id=job_application_id,
            date_filter=date_filter.value,
            listed_on=listed_on,
            favorites_only=favorites_only,
            applied_only=applied_only,
            archived_only=archived_only,
            search=search,
            type_filter=type_filter,
            location=location,
        )
        return JobListingFilterOptionsResponse(**options)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


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
    applied_only: bool = Query(
        False,
        description="When true, return only listings marked applied by the current user.",
    ),
    archived_only: bool = Query(
        False,
        description="When true, return only listings archived by the current user.",
    ),
    search: str | None = Query(
        None,
        max_length=200,
        description="Keyword search across title, company, location, field, work type, and source.",
    ),
    type_filter: str | None = Query(
        None,
        max_length=200,
        description="Match employment_type or work_type exactly.",
    ),
    location: str | None = Query(
        None,
        max_length=500,
        description="Match location exactly.",
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
            applied_only=applied_only,
            archived_only=archived_only,
            search=search,
            type_filter=type_filter,
            location=location,
        )
        return JobListingListResponse(**result)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/bulk-archive",
    response_model=JobListingBulkArchiveResponse,
    responses={401: {"model": JobListingErrorResponse}},
)
async def bulk_archive_job_listings(
    body: JobListingBulkArchiveRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingBulkArchiveResponse:
    result = await service.bulk_set_archived(
        user_id,
        body.listing_ids,
        body.archived,
    )
    return JobListingBulkArchiveResponse(**result)


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
    "/{listing_id}/applied",
    response_model=JobListingAppliedToggleResponse,
    responses={
        401: {"model": JobListingErrorResponse},
        404: {"model": JobListingErrorResponse},
    },
)
async def mark_job_listing_applied(
    listing_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingAppliedToggleResponse | JSONResponse:
    try:
        result = await service.mark_applied(user_id, listing_id)
        return JobListingAppliedToggleResponse(**result)
    except JobListingNotFoundError:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=JobListingErrorResponse(
                message="Job listing not found.",
            ).model_dump(),
        )


@router.delete(
    "/{listing_id}/applied",
    response_model=JobListingAppliedToggleResponse,
    responses={
        401: {"model": JobListingErrorResponse},
        404: {"model": JobListingErrorResponse},
    },
)
async def unmark_job_listing_applied(
    listing_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingAppliedToggleResponse | JSONResponse:
    try:
        result = await service.unmark_applied(user_id, listing_id)
        return JobListingAppliedToggleResponse(**result)
    except JobListingNotFoundError:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=JobListingErrorResponse(
                message="Job listing not found.",
            ).model_dump(),
        )


@router.post(
    "/{listing_id}/archive",
    response_model=JobListingArchiveToggleResponse,
    responses={
        401: {"model": JobListingErrorResponse},
        404: {"model": JobListingErrorResponse},
    },
)
async def archive_job_listing(
    listing_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingArchiveToggleResponse | JSONResponse:
    try:
        result = await service.archive(user_id, listing_id)
        return JobListingArchiveToggleResponse(**result)
    except JobListingNotFoundError:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=JobListingErrorResponse(
                message="Job listing not found.",
            ).model_dump(),
        )


@router.delete(
    "/{listing_id}/archive",
    response_model=JobListingArchiveToggleResponse,
    responses={
        401: {"model": JobListingErrorResponse},
        404: {"model": JobListingErrorResponse},
    },
)
async def unarchive_job_listing(
    listing_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingArchiveToggleResponse | JSONResponse:
    try:
        result = await service.unarchive(user_id, listing_id)
        return JobListingArchiveToggleResponse(**result)
    except JobListingNotFoundError:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=JobListingErrorResponse(
                message="Job listing not found.",
            ).model_dump(),
        )


@router.put(
    "/{listing_id}/note",
    response_model=JobListingNoteResponse,
    responses={
        401: {"model": JobListingErrorResponse},
        404: {"model": JobListingErrorResponse},
    },
)
async def upsert_job_listing_note(
    listing_id: uuid.UUID,
    body: JobListingNoteUpsertRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingNoteResponse | JSONResponse:
    try:
        result = await service.upsert_note(user_id, listing_id, body.note)
        return JobListingNoteResponse(**result)
    except JobListingNotFoundError:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=JobListingErrorResponse(
                message="Job listing not found.",
            ).model_dump(),
        )


@router.delete(
    "/{listing_id}/note",
    response_model=JobListingNoteResponse,
    responses={
        401: {"model": JobListingErrorResponse},
        404: {"model": JobListingErrorResponse},
    },
)
async def remove_job_listing_note(
    listing_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobListingService = Depends(get_job_listing_service),
) -> JobListingNoteResponse | JSONResponse:
    try:
        result = await service.remove_note(user_id, listing_id)
        return JobListingNoteResponse(**result)
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
