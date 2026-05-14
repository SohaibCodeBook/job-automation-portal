"""Job application HTTP routes (v1)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, status
from starlette.concurrency import run_in_threadpool

from app.schemas.job_application import JobApplicationSubmissionRequest
from app.services.job_application_service import create_job_application
from app.services.supabase_auth import get_user_id_from_access_token

router = APIRouter(prefix="/job-applications", tags=["job-applications"])


def _parse_bearer_token(authorization: str | None) -> str | None:
    if not authorization or not authorization.strip():
        return None
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    token = parts[1].strip()
    return token or None


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
    authorization: Annotated[str | None, Header()] = None,
) -> dict:
    access_token = _parse_bearer_token(authorization)
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Authentication required. Sign in and try again.",
                "data": None,
            },
        )

    user_id = await run_in_threadpool(get_user_id_from_access_token, access_token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "success": False,
                "message": "Invalid or expired session. Sign in again.",
                "data": None,
            },
        )

    payload = request.model_dump()
    result = await run_in_threadpool(
        create_job_application,
        payload,
        user_id=user_id,
    )

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
