from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse

from app.api.deps import get_auth_service
from app.core.exceptions import AuthError
from app.core.security import get_current_user_id
from app.schemas.auth import DeleteAccountResponse, ErrorResponse, UserMeResponse
from app.services.auth_service import AuthService

router = APIRouter(prefix="/users", tags=["users"])


def _auth_error_response(exc: AuthError) -> JSONResponse:
    status_code = 404 if exc.code == "not_found" else 400
    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(error=exc.message, code=exc.code).model_dump(),
    )


@router.get(
    "/me",
    response_model=UserMeResponse,
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def get_me(
    user_id=Depends(get_current_user_id),
    auth: AuthService = Depends(get_auth_service),
) -> UserMeResponse | JSONResponse:
    try:
        profile = await auth.get_me(user_id)
        return UserMeResponse(**profile)
    except AuthError as exc:
        return _auth_error_response(exc)


@router.delete(
    "/me",
    response_model=DeleteAccountResponse,
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def delete_me(
    user_id=Depends(get_current_user_id),
    auth: AuthService = Depends(get_auth_service),
) -> DeleteAccountResponse | JSONResponse:
    try:
        await auth.delete_account(user_id)
        return DeleteAccountResponse()
    except AuthError as exc:
        return _auth_error_response(exc)
