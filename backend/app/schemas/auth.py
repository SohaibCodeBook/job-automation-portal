from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)


class RegisterResponse(BaseModel):
    ok: bool = True
    message: str = "Check your inbox to verify your email before signing in."


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserSummary(BaseModel):
    id: str
    email: str
    name: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSummary


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class OkResponse(BaseModel):
    ok: bool = True


class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=20)
    password: str = Field(..., min_length=8, max_length=128)


class ConfirmEmailRequest(BaseModel):
    token: str = Field(..., min_length=20)


class ErrorResponse(BaseModel):
    error: str
    code: str | None = None


class UserMeResponse(BaseModel):
    id: str
    email: str
    name: str
    email_verified: bool
    auth_provider: Literal["credentials", "google"]


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1, max_length=128)
    new_password: str = Field(..., min_length=8, max_length=128)


class ChangePasswordResponse(BaseModel):
    ok: bool = True
    message: str = "Password updated."


class DeleteAccountResponse(BaseModel):
    ok: bool = True
    message: str = "Your account has been deleted."


class GoogleProfilePayload(BaseModel):
    email: str | None = None
    name: str | None = None
    picture: str | None = None
    sub: str | None = None
    email_verified: bool | None = None


class GoogleSyncRequest(BaseModel):
    intent: Literal["signin", "signup"]
    profile: GoogleProfilePayload


class GoogleSyncResponse(BaseModel):
    user_id: str
    email: str
    name: str
    created: bool
    access_token: str
