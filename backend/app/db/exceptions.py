class SupabaseConfigurationError(RuntimeError):
    """Raised when Supabase environment configuration is missing or invalid."""

    def __init__(self, message: str = "Supabase is not configured.") -> None:
        super().__init__(message)


class SupabaseClientError(RuntimeError):
    """Raised when the Supabase client cannot be initialized."""

    def __init__(self, message: str = "Unable to initialize Supabase client.") -> None:
        super().__init__(message)
