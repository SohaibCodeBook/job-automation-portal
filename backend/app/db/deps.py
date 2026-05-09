"""FastAPI dependency helpers for database access (no routes in this step)."""

from collections.abc import Generator

from supabase import Client

from app.db.client import get_supabase_client


def get_supabase() -> Generator[Client, None, None]:
    """
    Yield the shared Supabase client for use with `Depends(get_supabase)` in future routes.
    """
    yield get_supabase_client()
