class AuthError(Exception):
    """Base auth service error."""

    def __init__(self, message: str, *, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.code = code


class InvalidCredentialsError(AuthError):
    def __init__(self) -> None:
        super().__init__("Invalid email or password.", code="invalid_credentials")


class GoogleOnlyAccountError(AuthError):
    def __init__(self) -> None:
        super().__init__(
            "This account uses Google sign-in. Sign in with Google instead.",
            code="google_only",
        )


class UnverifiedEmailError(AuthError):
    def __init__(self) -> None:
        super().__init__(
            "Verify your email before signing in.",
            code="unverified",
        )
