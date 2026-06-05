from __future__ import annotations

import httpx

from app.core.config import settings


def service_timeout(read_seconds: float) -> httpx.Timeout:
    """Long read timeout for slow rebuild; bounded connect/write."""
    return httpx.Timeout(
        connect=30.0,
        read=read_seconds,
        write=60.0,
        pool=30.0,
    )


def request_error_message(
    service_name: str,
    exc: httpx.RequestError,
    *,
    timeout_seconds: float,
    timeout_env_var: str,
) -> str:
    if isinstance(exc, httpx.TimeoutException):
        minutes = max(1, int(timeout_seconds // 60))
        return (
            f"{service_name} timed out after about {minutes} minute(s). "
            f"If the service is still running, increase {timeout_env_var} in backend .env."
        )
    return f"{service_name} is unavailable: {exc}"
