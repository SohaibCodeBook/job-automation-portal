from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from app.api.deps import get_auth_service, verify_internal_api_key
from app.core.exceptions import AuthError
from app.schemas.auth import (
    ConfirmEmailRequest,
    ErrorResponse,
    ForgotPasswordRequest,
    GoogleSyncRequest,
    GoogleSyncResponse,
    LoginRequest,
    LoginResponse,
    OkResponse,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
)
from app.services.auth_service import AuthService
from app.services.email_service import SmtpConfigurationError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


def _auth_error_response(exc: AuthError) -> JSONResponse:
    status_code = status.HTTP_400_BAD_REQUEST
    if exc.code == "duplicate_email":
        status_code = status.HTTP_409_CONFLICT
    elif exc.code == "not_found":
        status_code = status.HTTP_404_NOT_FOUND
    elif exc.code == "account_exists":
        status_code = status.HTTP_409_CONFLICT
    elif exc.code == "no_account":
        status_code = status.HTTP_404_NOT_FOUND
    elif exc.code in ("invalid_credentials", "google_only", "unverified"):
        status_code = status.HTTP_401_UNAUTHORIZED
    elif exc.code in ("oauth_create_failed", "oauth_email"):
        status_code = status.HTTP_400_BAD_REQUEST
    elif exc.code == "email_send_failed":
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    return JSONResponse(
        status_code=status_code,
        content=ErrorResponse(error=exc.message, code=exc.code).model_dump(),
    )


@router.post(
    "/register",
    response_model=RegisterResponse,
    responses={409: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def register(
    body: RegisterRequest,
    auth: AuthService = Depends(get_auth_service),
) -> RegisterResponse | JSONResponse:
    try:
        await auth.register(
            name=body.name,
            email=str(body.email),
            password=body.password,
        )
        return RegisterResponse()
    except AuthError as exc:
        logger.exception("register failed: %s", exc.message)
        return _auth_error_response(exc)


@router.post(
    "/login",
    response_model=LoginResponse,
    responses={401: {"model": ErrorResponse}},
)
async def login(
    body: LoginRequest,
    auth: AuthService = Depends(get_auth_service),
) -> LoginResponse | JSONResponse:
    try:
        result = await auth.login(email=str(body.email), password=body.password)
        return LoginResponse(**result)
    except AuthError as exc:
        return _auth_error_response(exc)


@router.post("/forgot-password", response_model=OkResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    auth: AuthService = Depends(get_auth_service),
) -> OkResponse | JSONResponse:
    try:
        await auth.forgot_password(str(body.email))
        return OkResponse()
    except SmtpConfigurationError:
        logger.exception("forgot-password SMTP error")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=ErrorResponse(
                error="Could not send reset email. Try again later.",
                code="smtp_error",
            ).model_dump(),
        )
    except Exception as exc:
        logger.exception("forgot-password failed: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=ErrorResponse(
                error="Could not send reset email. Try again later.",
                code="smtp_error",
            ).model_dump(),
        )


@router.post(
    "/reset-password",
    response_model=OkResponse,
    responses={400: {"model": ErrorResponse}},
)
async def reset_password(
    body: ResetPasswordRequest,
    auth: AuthService = Depends(get_auth_service),
) -> OkResponse | JSONResponse:
    try:
        await auth.reset_password(token=body.token, password=body.password)
        return OkResponse()
    except AuthError as exc:
        return _auth_error_response(exc)


@router.post(
    "/confirm-email",
    response_model=OkResponse,
    responses={400: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
async def confirm_email(
    body: ConfirmEmailRequest,
    auth: AuthService = Depends(get_auth_service),
) -> OkResponse | JSONResponse:
    try:
        await auth.confirm_email(body.token)
        return OkResponse()
    except AuthError as exc:
        return _auth_error_response(exc)


@router.post(
    "/google/sync",
    response_model=GoogleSyncResponse,
    responses={
        400: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
    dependencies=[Depends(verify_internal_api_key)],
)
async def google_sync(
    body: GoogleSyncRequest,
    auth: AuthService = Depends(get_auth_service),
) -> GoogleSyncResponse | JSONResponse:
    try:
        result = await auth.sync_google_user(
            intent=body.intent,
            profile=body.profile.model_dump(),
        )
        return GoogleSyncResponse(**result)
    except AuthError as exc:
        return _auth_error_response(exc)
