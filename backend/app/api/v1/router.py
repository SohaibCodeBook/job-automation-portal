from fastapi import APIRouter

from app.api.v1 import job_applications, job_listings
from app.api.v1.endpoints import auth, health, users

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(job_applications.router)
api_router.include_router(job_listings.router)
