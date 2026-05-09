"""Job application HTTP routes (v1)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from starlette.concurrency import run_in_threadpool

from app.schemas.job_application import JobApplicationSubmissionRequest
from app.services.job_application_service import create_job_application

router = APIRouter(prefix="/job-applications", tags=["job-applications"])


def _http_status_for_service_error(message: str | None) -> int:
    if not message:
        return 500
    lowered = message.lower()
    if "database" in lowered or "credentials" in lowered:
        return 500
    return 400


@router.post("")
async def submit_job_application(
    request: JobApplicationSubmissionRequest,
) -> dict:
    payload = request.model_dump()
    result = await run_in_threadpool(create_job_application, payload)

    if result.get("success"):
        return {
            "success": True,
            "message": "Job application created successfully",
            "data": {"id": result.get("id")},
        }

    error_message = result.get("error") or "Unable to create job application."
    status_code = _http_status_for_service_error(error_message)
    raise HTTPException(
        status_code=status_code,
        detail={
            "success": False,
            "message": error_message,
            "data": None,
        },
    )
