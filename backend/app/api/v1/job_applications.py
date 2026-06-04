from __future__ import annotations

import json
import logging
import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError

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
    JobApplicationValidationError,
)
from app.services.resume_storage import ResumeStorageError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/job-applications", tags=["job-applications"])


def _validation_error_response(exc: ValidationError) -> JSONResponse:
    messages = "; ".join(
        f"{'.'.join(str(loc) for loc in err.get('loc', ()))}: {err.get('msg', '')}"
        for err in exc.errors()
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=JobApplicationErrorResponse(message=messages or "Invalid payload.").model_dump(),
    )


async def _parse_submission_request(
    request: Request,
) -> tuple[JobApplicationSubmissionRequest, object | None]:
    """Returns (body, resume_upload). resume_upload is UploadFile for multipart."""
    content_type = request.headers.get("content-type", "")

    if "multipart/form-data" in content_type:
        form = await request.form()
        payload_raw = form.get("payload")
        if payload_raw is None:
            raise JobApplicationValidationError(
                "Missing form field 'payload' with application JSON."
            )
        payload_text = (
            payload_raw if isinstance(payload_raw, str) else getattr(payload_raw, "value", None)
        )
        if not payload_text or not isinstance(payload_text, str):
            raise JobApplicationValidationError(
                "Invalid form field 'payload'."
            )
        try:
            raw = json.loads(payload_text)
        except json.JSONDecodeError as exc:
            raise JobApplicationValidationError(
                "Invalid JSON in form field 'payload'."
            ) from exc
        body = JobApplicationSubmissionRequest.model_validate(raw)
        resume_upload = form.get("resume")
        return body, resume_upload

    raw = await request.json()
    body = JobApplicationSubmissionRequest.model_validate(raw)
    return body, None


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
    request: Request,
    user_id: uuid.UUID = Depends(get_current_user_id),
    service: JobApplicationService = Depends(get_job_application_service),
) -> JobApplicationCreateResponse | JSONResponse:
    try:
        body, resume_upload = await _parse_submission_request(request)
        application_id = await service.create(
            user_id=user_id,
            body=body,
            resume_upload=resume_upload,
        )
        return JobApplicationCreateResponse(
            data={"id": str(application_id)},
        )
    except JobApplicationValidationError as exc:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=JobApplicationErrorResponse(message=str(exc)).model_dump(),
        )
    except ResumeStorageError as exc:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content=JobApplicationErrorResponse(message=str(exc)).model_dump(),
        )
    except ValidationError as exc:
        return _validation_error_response(exc)
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
