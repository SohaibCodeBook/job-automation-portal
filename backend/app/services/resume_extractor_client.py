from __future__ import annotations

import httpx

from app.core.config import settings
from app.services.resume_http import request_error_message, service_timeout


class ResumeExtractorError(Exception):
    """Resume extractor service failed or returned an invalid response."""


async def extract_resume_text(*, file_bytes: bytes, filename: str) -> str:
    """POST multipart file to the resume extractor service."""
    base = settings.RESUME_EXTRACTOR_BASE_URL.rstrip("/")
    url = f"{base}/extract"
    timeout = service_timeout(settings.RESUME_EXTRACTOR_TIMEOUT_SECONDS)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(
                url,
                files={"file": (filename, file_bytes)},
            )
        except httpx.RequestError as exc:
            raise ResumeExtractorError(
                request_error_message(
                    "Resume extractor",
                    exc,
                    timeout_seconds=settings.RESUME_EXTRACTOR_TIMEOUT_SECONDS,
                    timeout_env_var="RESUME_EXTRACTOR_TIMEOUT_SECONDS",
                )
            ) from exc

    if response.status_code != 200:
        detail = _response_detail(response)
        raise ResumeExtractorError(
            detail or f"Resume extractor failed (HTTP {response.status_code})."
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise ResumeExtractorError(
            "Resume extractor returned invalid JSON."
        ) from exc

    resume_text = payload.get("resume") if isinstance(payload, dict) else None
    if not isinstance(resume_text, str) or not resume_text.strip():
        raise ResumeExtractorError(
            "Resume extractor did not return resume text."
        )
    return resume_text.strip()


def _response_detail(response: httpx.Response) -> str | None:
    try:
        payload = response.json()
    except ValueError:
        text = response.text.strip()
        return text[:500] if text else None
    if isinstance(payload, dict):
        for key in ("message", "error", "detail"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return None
