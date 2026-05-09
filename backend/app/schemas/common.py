"""Shared validation helpers and messages for request/response models."""

from typing import Annotated, TypeVar

from pydantic import AfterValidator

T = TypeVar("T")


def _non_empty_string(value: str) -> str:
    stripped = value.strip()
    if not stripped:
        raise ValueError("This field is required.")
    return stripped


def _non_empty_list(value: list[T]) -> list[T]:
    if not value:
        raise ValueError("At least one value is required.")
    if any(isinstance(item, str) and not str(item).strip() for item in value):
        raise ValueError("List items cannot be blank.")
    return [item.strip() if isinstance(item, str) else item for item in value]  # type: ignore[misc]


NonEmptyStr = Annotated[str, AfterValidator(_non_empty_string)]

NonEmptyStrList = Annotated[list[str], AfterValidator(_non_empty_list)]


LIMIT_JOBS_FIXED: int = 25

__all__ = [
    "LIMIT_JOBS_FIXED",
    "NonEmptyStr",
    "NonEmptyStrList",
]
