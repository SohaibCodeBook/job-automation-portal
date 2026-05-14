"""Resolve Supabase Auth user id from a browser access token (JWT)."""

from __future__ import annotations

import json
import logging
import urllib.error
import urllib.request

from app.core.config import settings

logger = logging.getLogger(__name__)


def get_user_id_from_access_token(access_token: str) -> str | None:
    """
    Validate the JWT via Supabase Auth ``GET /auth/v1/user`` and return ``id``.
    """
    if not settings.SUPABASE_URL or settings.SUPABASE_SERVICE_ROLE_KEY is None:
        logger.warning("Supabase URL or service role key missing; cannot resolve user.")
        return None

    url = settings.SUPABASE_URL.rstrip("/") + "/auth/v1/user"
    apikey = settings.SUPABASE_SERVICE_ROLE_KEY.get_secret_value().strip()
    if not apikey:
        return None

    request = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {access_token}",
            "apikey": apikey,
        },
        method="GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            if response.status != 200:
                return None
            payload = json.loads(response.read().decode())
    except urllib.error.HTTPError as exc:
        logger.info("Supabase auth user lookup failed: HTTP %s", exc.code)
        return None
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, OSError) as exc:
        logger.info("Supabase auth user lookup failed: %s", exc)
        return None

    user_id = payload.get("id")
    if user_id is None:
        return None
    return str(user_id)
