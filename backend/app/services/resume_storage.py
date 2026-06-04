from __future__ import annotations

import re
import uuid
from pathlib import Path

from fastapi import UploadFile

from app.core.config import settings

_ALLOWED_EXTENSIONS = frozenset(
    ext.strip().lower()
    for ext in settings.RESUME_ALLOWED_EXTENSIONS.split(",")
    if ext.strip()
)
_SAFE_NAME = re.compile(r"[^a-zA-Z0-9._-]+")


class ResumeStorageError(ValueError):
    pass


def _upload_root() -> Path:
    root = Path(settings.RESUME_UPLOAD_ROOT).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def _normalize_extension(filename: str) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix not in _ALLOWED_EXTENSIONS:
        allowed = ", ".join(sorted(_ALLOWED_EXTENSIONS))
        raise ResumeStorageError(
            f"Unsupported file type. Allowed extensions: {allowed}."
        )
    return suffix


async def read_upload_file(upload: UploadFile, *, max_bytes: int) -> bytes:
    data = await upload.read()
    if not data:
        raise ResumeStorageError("Resume file is empty.")
    if len(data) > max_bytes:
        raise ResumeStorageError(
            f"Resume file is too large (max {max_bytes // (1024 * 1024)} MB)."
        )
    return data


def build_source_resume_key(
    user_id: uuid.UUID,
    application_id: uuid.UUID,
    original_filename: str,
) -> str:
    ext = _normalize_extension(original_filename)
    return f"users/{user_id}/applications/{application_id}/resume{ext}"


def save_source_resume(
    *,
    user_id: uuid.UUID,
    application_id: uuid.UUID,
    data: bytes,
    original_filename: str,
) -> str:
    if not data:
        raise ResumeStorageError("Resume file is empty.")
    if len(data) > settings.RESUME_MAX_BYTES:
        raise ResumeStorageError(
            f"Resume file is too large (max {settings.RESUME_MAX_BYTES // (1024 * 1024)} MB)."
        )

    storage_key = build_source_resume_key(user_id, application_id, original_filename)
    path = _upload_root() / storage_key
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return storage_key


def read_resume_file(storage_key: str) -> bytes:
    path = _upload_root() / storage_key
    if not path.is_file():
        raise ResumeStorageError("Resume file not found in storage.")
    return path.read_bytes()


def safe_download_filename(original: str | None, fallback: str = "resume") -> str:
    if not original:
        return fallback
    cleaned = _SAFE_NAME.sub("_", Path(original).name).strip("._")
    return cleaned or fallback
