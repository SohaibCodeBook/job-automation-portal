"""Database package (ORM / drivers can be added here)."""

from app.db.exceptions import SupabaseClientError, SupabaseConfigurationError

__all__ = [
    "SupabaseClientError",
    "SupabaseConfigurationError",
]
