"""Centralized Supabase client construction and lifecycle."""

from __future__ import annotations

import logging
import threading

from supabase import Client, create_client

from app.core.config import settings
from app.db.exceptions import SupabaseClientError, SupabaseConfigurationError

logger = logging.getLogger(__name__)

_lock = threading.Lock()
_client: Client | None = None


def _normalize_supabase_url(url: str) -> str:
    cleaned = url.strip().rstrip("/")
    if not cleaned.startswith("https://"):
        raise SupabaseConfigurationError(
            "SUPABASE_URL must be an https URL.",
        )
    return cleaned


def _require_credentials() -> tuple[str, str]:
    if not settings.SUPABASE_URL:
        raise SupabaseConfigurationError(
            "SUPABASE_URL is not set. Add it to your environment or .env file.",
        )
    if settings.SUPABASE_SERVICE_ROLE_KEY is None:
        raise SupabaseConfigurationError(
            "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to your environment or .env file.",
        )
    key = settings.SUPABASE_SERVICE_ROLE_KEY.get_secret_value().strip()
    if not key:
        raise SupabaseConfigurationError(
            "SUPABASE_SERVICE_ROLE_KEY is empty.",
        )
    url = _normalize_supabase_url(settings.SUPABASE_URL)
    return url, key


def _create_supabase_client() -> Client:
    url, key = _require_credentials()
    try:
        return create_client(url, key)
    except Exception as exc:  # noqa: BLE001 — wrap vendor errors without leaking secrets
        logger.exception("Failed to create Supabase client.")
        raise SupabaseClientError(
            "Failed to create Supabase client. Check SUPABASE_URL and credentials.",
        ) from exc


def get_supabase_client() -> Client:
    """
    Return a process-wide Supabase client (lazy, thread-safe singleton).

    Credentials are read from environment / .env via Settings (python-dotenv).
    """
    global _client
    if _client is not None:
        return _client
    with _lock:
        if _client is None:
            _client = _create_supabase_client()
    return _client


def reset_supabase_client() -> None:
    """Clear cached client (e.g. for tests). Not used at runtime."""
    global _client
    with _lock:
        _client = None
