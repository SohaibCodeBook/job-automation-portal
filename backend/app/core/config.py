from functools import lru_cache

from dotenv import load_dotenv
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "Job Application Workflow API"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = Field(
        ...,
        description="Async SQLAlchemy URL, e.g. postgresql+asyncpg://user:pass@host:port/db",
    )

    JWT_SECRET: str = Field(..., min_length=16)
    INTERNAL_API_KEY: str = Field(..., min_length=16)

    FRONTEND_BASE_URL: str = Field(
        default="http://localhost:3000",
        description="Frontend origin for email links (verify/reset).",
    )

    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASS: str = ""
    SMTP_FROM: str = ""
    SMTP_SECURE: bool = False

    CORS_ORIGINS: str = Field(
        default="http://localhost:3000",
        description="Comma-separated list of allowed origins.",
    )

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, value: str | list[str]) -> str:
        if isinstance(value, list):
            return ",".join(value)
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        raw = self.CORS_ORIGINS.strip()
        if not raw:
            return []
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    @property
    def database_url_sync(self) -> str:
        """Sync driver URL for Alembic migrations."""
        url = self.DATABASE_URL
        if "+asyncpg" in url:
            return url.replace("+asyncpg", "+psycopg2", 1)
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
