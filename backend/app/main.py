from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env before any app imports touch Settings or Supabase.
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_BACKEND_ROOT / ".env")

from fastapi import FastAPI

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.cors import setup_cors


def create_application() -> FastAPI:
    application = FastAPI(
        title=settings.PROJECT_NAME,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )
    setup_cors(application)
    application.include_router(api_router, prefix=settings.API_V1_PREFIX)
    return application


app = create_application()
