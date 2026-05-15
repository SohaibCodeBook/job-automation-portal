"""Job application submit has moved to the Next.js BFF."""

from __future__ import annotations

from fastapi import APIRouter, status

router = APIRouter(prefix="/job-applications", tags=["job-applications"])


@router.post("", status_code=status.HTTP_410_GONE)
async def submit_job_application_deprecated() -> dict:
    return {
        "success": False,
        "message": (
            "POST /api/v1/job-applications is no longer supported. "
            "Use the Next.js app POST /api/job-applications instead."
        ),
        "data": None,
    }
