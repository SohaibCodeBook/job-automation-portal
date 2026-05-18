from collections.abc import AsyncGenerator

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.services.auth_service import AuthService


async def verify_internal_api_key(
    x_internal_key: str = Header(..., alias="X-Internal-Key"),
) -> None:
    if x_internal_key != settings.INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API key.",
        )


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_auth_service(
    session: AsyncSession = Depends(get_db_session),
) -> AsyncGenerator[AuthService, None]:
    yield AuthService(session)
