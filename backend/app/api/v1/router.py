from fastapi import APIRouter

from app.api.v1 import job_applications
from app.api.v1.endpoints import health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(job_applications.router)
