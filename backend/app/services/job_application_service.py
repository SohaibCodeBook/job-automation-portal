"""
Job application persistence service.

Pipeline: raw frontend dict → normalize_frontend_payload → Pydantic → Supabase insert.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Final, TypedDict

from pydantic import ValidationError

from app.db.client import get_supabase_client
from app.schemas.job_application import JobApplicationSubmissionRequest

logger = logging.getLogger(__name__)

# Semantic renames only (camelCase / wire key → canonical schema / DB column).
FIELD_MAP: Final[dict[str, str]] = {
    "employmentType": "job_type",
    "selectedRegions": "selected_regions",
    "payRangeFilter": "pay_range_filter",
}

# Explicit wire keys → canonical keys. No automatic camelCase conversion.
# Includes FIELD_MAP entries plus every other frontend alias.
WIRE_KEY_TO_CANONICAL: Final[dict[str, str]] = {
    **FIELD_MAP,
    "firstName": "first_name",
    "lastName": "last_name",
    "selectedIndustries": "selected_industries",
    "industryNamesFromNaics": "industry_names_from_naics",
    "remote": "remote",
    "hybrid": "hybrid",
    "experienceLevels": "experience_levels",
    "omitWords": "omit_words",
    "mustInclude": "must_include",
    "desiredJobTitle1": "desired_job_title_1",
    "selectedCities": "selected_cities",
    "selectedStates": "selected_states",
    "resumeUrl": "resume_url",
    "limitJobs": "limit_jobs",
}

_CANONICAL_FIELDS: Final[frozenset[str]] = frozenset(
    JobApplicationSubmissionRequest.model_fields.keys(),
)

_OPTIONAL_LIST_FIELDS: Final[frozenset[str]] = frozenset(
    {
        "industry_names_from_naics",
        "selected_cities",
        "selected_states",
    }
)

_REQUIRED_LIST_FIELDS: Final[frozenset[str]] = frozenset(
    {
        "selected_industries",
        "experience_levels",
        "omit_words",
        "must_include",
    }
)

_JSON_OBJECT_FIELDS: Final[frozenset[str]] = frozenset(
    {
        "pay_range_filter",
    }
)


class JobApplicationCreateResult(TypedDict):
    success: bool
    id: str | None
    error: str | None


def _resolve_canonical_key(key: str) -> str:
    if key in _CANONICAL_FIELDS:
        return key
    if key in WIRE_KEY_TO_CANONICAL:
        return WIRE_KEY_TO_CANONICAL[key]
    raise ValueError(f"Unknown field: {key!r}. Allowed keys are canonical snake_case " f"or known frontend aliases (see WIRE_KEY_TO_CANONICAL / FIELD_MAP).")


def _normalize_string_list(
    value: Any,
    *,
    optional: bool,
) -> list[str] | None:
    if value is None:
        return None
    if not isinstance(value, list):
        raise ValueError(f"Expected a list, got {type(value).__name__}.")
    cleaned = [str(item).strip() for item in value if str(item).strip()]
    deduped = list(dict.fromkeys(cleaned))
    if not deduped and optional:
        return None
    return deduped


def _normalize_scalar_for_field(canonical_key: str, value: Any) -> Any:
    if canonical_key == "limit_jobs":
        if value is None:
            raise ValueError(f"{canonical_key} cannot be null.")
        if isinstance(value, bool):
            raise ValueError(f"{canonical_key} must be a number.")
        if isinstance(value, int) and not isinstance(value, bool):
            return value
        if isinstance(value, float):
            return int(value)
        if isinstance(value, str) and value.strip():
            try:
                return int(value.strip())
            except ValueError as exc:
                raise ValueError(f"{canonical_key} must be an integer.") from exc
        raise ValueError(f"{canonical_key} must be an integer.")

    if canonical_key == "remote" or canonical_key == "hybrid":
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            lowered = value.strip().lower()
            if lowered in {"true", "1", "yes"}:
                return True
            if lowered in {"false", "0", "no"}:
                return False
        raise ValueError(f"{canonical_key} must be a boolean.")

    if isinstance(value, str):
        return value.strip()

    if value is None:
        raise ValueError(f"{canonical_key} cannot be null.")

    return value


def normalize_frontend_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """
    Map explicit wire keys to canonical schema keys, then normalize list values.

    Raises:
        ValueError: unknown fields, duplicate canonical keys, or bad value types.
    """
    if not isinstance(payload, dict):
        raise ValueError("Payload must be a JSON object (dict).")

    merged: dict[str, Any] = {}

    for raw_key, raw_value in payload.items():
        canonical = _resolve_canonical_key(raw_key)
        if canonical in merged:
            raise ValueError(
                f"Duplicate target field {canonical!r} from keys {raw_key!r} "
                "and an earlier alias or canonical key.",
            )

        if canonical == "selected_regions":
            if raw_value is None:
                merged[canonical] = None
            else:
                merged[canonical] = _normalize_string_list(
                    raw_value,
                    optional=False,
                )
        elif canonical in _JSON_OBJECT_FIELDS:
            if raw_value is None:
                merged[canonical] = None
            elif not isinstance(raw_value, dict):
                raise ValueError(f"{canonical} must be a JSON object.")
            else:
                merged[canonical] = raw_value
        elif canonical in _OPTIONAL_LIST_FIELDS | _REQUIRED_LIST_FIELDS:
            merged[canonical] = _normalize_string_list(
                raw_value,
                optional=canonical in _OPTIONAL_LIST_FIELDS,
            )
        else:
            merged[canonical] = _normalize_scalar_for_field(canonical, raw_value)

    return merged


def create_job_application(payload: dict[str, Any]) -> JobApplicationCreateResult:
    """
    Normalize a raw frontend payload, validate, insert into ``job_applications``.

    Returns a plain dict (TypedDict shape): success, id, error.
    """
    try:
        normalized = normalize_frontend_payload(payload)
        validated = JobApplicationSubmissionRequest.model_validate(normalized)
    except ValueError as exc:
        logger.info("Job application normalization failed: %s", exc)
        return {"success": False, "id": None, "error": str(exc)}
    except ValidationError as exc:
        logger.info("Job application validation failed: %s", exc)
        return {
            "success": False,
            "id": None,
            "error": json.dumps(exc.errors()),
        }

    row = validated.model_dump(mode="json", exclude_none=True)
    # Convert list fields to semicolon-separated strings for DB storage.
    list_fields = [
        "selected_industries", "industry_names_from_naics", "experience_levels",
        "omit_words", "must_include", "selected_cities", "selected_states",
    ]
    for field in list_fields:
        if field in row and isinstance(row[field], list):
            row[field] = ";".join(row[field])
    try:
        client = get_supabase_client()
        # supabase-py sync client: do not chain .select() after .insert().
        response = client.table("job_applications").insert(row).execute()
    except Exception as exc:  # noqa: BLE001 — surface safe message; log details
        logger.exception("Supabase insert failed for job_applications.")
        return {
            "success": False,
            "id": None,
            "error": "Database insert failed. Verify table job_applications and credentials.",
        }

    raw = getattr(response, "data", None)
    row_out: dict | None = None
    if isinstance(raw, list) and len(raw) > 0 and isinstance(raw[0], dict):
        row_out = raw[0]
    elif isinstance(raw, dict):
        row_out = raw

    if not row_out:
        return {
            "success": False,
            "id": None,
            "error": "Database insert returned no row data.",
        }

    inserted_id = row_out.get("id")
    if inserted_id is None:
        return {
            "success": False,
            "id": None,
            "error": "Database insert succeeded but no id was returned.",
        }

    return {"success": True, "id": str(inserted_id), "error": None}
