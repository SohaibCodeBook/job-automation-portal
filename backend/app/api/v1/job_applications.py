from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse

from app.api.deps import get_job_application_service
from app.core.security import get_current_user_id
from app.schemas.job_application import JobApplicationSubmissionRequest
from app.schemas.job_application_responses import (
    JobApplicationCreateResponse,
    JobApplicationDetailResponse,
    JobApplicationErrorResponse,
    JobApplicationListResponse,
)
from app.services.job_application_service import (
    JobApplicationNotFoundError,
    JobApplicationService,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/job-applications", tags=["job-applications"])


@router.post(
    "",
    response_model=JobApplicationCreateResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": JobApplicationErrorResponse},
        401: {"model": JobApplicationErrorResponse},
        422: {"model": JobApplicationErrorResponse},
    },
)
async def create_job_application(
    body: JobApplicationSubmissionRequest,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobApplicationService = Depends(get_job_application_service),
) -> JobApplicationCreateResponse | JSONResponse:
    try:
        application_id = await service.create(user_id=user_id, body=body)
        return JobApplicationCreateResponse(
            data={"id": str(application_id)},
        )
    except Exception:
        logger.exception("job application insert failed")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=JobApplicationErrorResponse(
                message="Database insert failed. Check server logs and database permissions.",
            ).model_dump(),
        )


@router.get(
    "",
    response_model=JobApplicationListResponse,
    responses={401: {"model": JobApplicationErrorResponse}},
)
async def list_job_applications(
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobApplicationService = Depends(get_job_application_service),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> JobApplicationListResponse:
    result = await service.list_for_user(user_id, page=page, page_size=page_size)
    return JobApplicationListResponse(**result)


@router.get(
    "/{application_id}",
    response_model=JobApplicationDetailResponse,
    responses={
        401: {"model": JobApplicationErrorResponse},
        404: {"model": JobApplicationErrorResponse},
    },
)
async def get_job_application(
    application_id: uuid.UUID,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobApplicationService = Depends(get_job_application_service),
) -> JobApplicationDetailResponse | JSONResponse:
    try:
        detail = await service.get_for_user(user_id, application_id)
        return JobApplicationDetailResponse(**detail)
    except JobApplicationNotFoundError:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content=JobApplicationErrorResponse(
                message="Job application not found.",
            ).model_dump(),
        )
