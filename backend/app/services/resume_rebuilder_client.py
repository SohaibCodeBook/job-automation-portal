from __future__ import annotations

import base64
import binascii

import httpx

from app.core.config import settings


class ResumeRebuilderError(Exception):
    """Resume rebuilder service failed or returned an invalid response."""


async def rebuild_resume_docx(*, resume_text: str, about_job: str) -> bytes:
    """POST JSON to the resume rebuilder service; returns decoded docx bytes."""
    base = settings.RESUME_REBUILDER_BASE_URL.rstrip("/")
    url = f"{base}/build-resume"
    timeout = httpx.Timeout(settings.RESUME_HTTP_TIMEOUT_SECONDS)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post(
                url,
                json={"resume": resume_text, "about_job": about_job},
            )
        except httpx.RequestError as exc:
            raise ResumeRebuilderError(
                "Resume rebuilder service is unavailable."
            ) from exc

    if response.status_code != 200:
        detail = _response_detail(response)
        raise ResumeRebuilderError(
            detail or f"Resume rebuilder failed (HTTP {response.status_code})."
        )

    try:
        payload = response.json()
    except ValueError as exc:
        raise ResumeRebuilderError(
            "Resume rebuilder returned invalid JSON."
        ) from exc

    encoded = payload.get("resumeDocx") if isinstance(payload, dict) else None
    if not isinstance(encoded, str) or not encoded.strip():
        raise ResumeRebuilderError(
            "Resume rebuilder did not return resumeDocx."
        )

    try:
        return base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise ResumeRebuilderError(
            "Resume rebuilder returned invalid base64 docx data."
        ) from exc


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
