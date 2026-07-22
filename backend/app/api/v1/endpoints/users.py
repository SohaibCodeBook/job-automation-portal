from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse

from app.api.deps import get_auth_service
from app.core.exceptions import AuthError
from app.core.security import get_current_user_id
from app.schemas.auth import (
    ChangePasswordRequest,
    ChangePasswordResponse,
    DeleteAccountResponse,
    ErrorResponse,
    UpdateProfileRequest,
    UserMeResponse,
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/users", tags=["users"])


def _auth_error_response(exc: AuthError) -> JSONResponse:
    status_code = status.HTTP_400_BAD_REQUEST
    if exc.code == "not_found":
        status_code = status.HTTP_404_NOT_FOUND
    elif exc.code in ("invalid_credentials", "google_only"):
        status_code = status.HTTP_401_UNAUTHORIZED
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


@router.patch(
    "/me",
    response_model=UserMeResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def update_me(
    body: UpdateProfileRequest,
    user_id=Depends(get_current_user_id),
    auth: AuthService = Depends(get_auth_service),
) -> UserMeResponse | JSONResponse:
    try:
        profile = await auth.update_profile(
            user_id,
            name=body.name,
            phone=body.phone,
        )
        return UserMeResponse(**profile)
    except AuthError as exc:
        return _auth_error_response(exc)


@router.post(
    "/me/password",
    response_model=ChangePasswordResponse,
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
async def change_password(
    body: ChangePasswordRequest,
    user_id=Depends(get_current_user_id),
    auth: AuthService = Depends(get_auth_service),
) -> ChangePasswordResponse | JSONResponse:
    try:
        await auth.change_password(
            user_id,
            current_password=body.current_password,
            new_password=body.new_password,
        )
        return ChangePasswordResponse()
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
