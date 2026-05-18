"""SQLAlchemy ORM models."""

from app.models.job_application import JobApplication
from app.models.user import AuthUser

__all__ = ["AuthUser", "JobApplication"]
