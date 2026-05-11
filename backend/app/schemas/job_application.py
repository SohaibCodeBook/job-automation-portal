"""Pydantic models for job application submission payloads from the frontend."""

from typing import Any, Final, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

from app.schemas.common import LIMIT_JOBS_FIXED, NonEmptyStr, NonEmptyStrList

_ALLOWED_JOB_TYPES: Final[frozenset[str]] = frozenset(
    {
        "Full Time",
        "Part Time",
        "Contract",
        "Internship",
        "Volunteer",
    },
)

_REGION_TO_CURRENCY: Final[dict[str, str]] = {
    "United States": "USD",
    "United Kingdom": "GBP",
    "Australia": "AUD",
    "Canada": "CAD",
    "Germany": "EUR",
    "Netherlands": "EUR",
    "UAE": "AED",
    "India": "INR",
    "Singapore": "SGD",
    "Pakistan": "PKR",
    "Ireland": "EUR",
    "France": "EUR",
}


class RegionPayRange(BaseModel):
    model_config = ConfigDict(extra="forbid")

    min: int = Field(..., ge=1, description="Minimum salary for region.")
    max: int = Field(..., ge=1, description="Maximum salary for region.")
    currency: str = Field(..., min_length=1, description="Region-mapped currency code.")

    @field_validator("currency", mode="before")
    @classmethod
    def normalize_currency(cls, value: Any) -> str:
        return str(value).strip().upper()

    @model_validator(mode="after")
    def validate_min_max(self) -> "RegionPayRange":
        if self.min > self.max:
            raise ValueError("min cannot exceed max for a region pay range.")
        return self


class JobApplicationSubmissionRequest(BaseModel):
    """
    Incoming job search / application specification payload (snake_case JSON).
    """

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid",
    )

    first_name: NonEmptyStr = Field(..., max_length=120, description="Applicant first name.")
    last_name: NonEmptyStr = Field(..., max_length=120, description="Applicant last name.")

    selected_industries: NonEmptyStrList = Field(
        ...,
        description="Target industries; custom entries allowed.",
    )
    industry_names_from_naics: list[str] | None = Field(
        default=None,
        description="Optional NAICS-aligned industry names.",
    )

    remote: bool = Field(default=False, description="Prefer or allow remote roles.")
    hybrid: bool = Field(default=False, description="Prefer or allow hybrid roles.")
    job_type: str = Field(
        ...,
        min_length=1,
        description="One or more employment types; multiple values joined with ';' for DB text.",
    )

    experience_levels: NonEmptyStrList = Field(
        ...,
        description="One or more experience bands (e.g. intern, junior).",
    )

    omit_words: NonEmptyStrList = Field(
        ...,
        description="Terms that must not appear in matched roles.",
    )
    must_include: NonEmptyStrList = Field(
        ...,
        description="Terms that must appear in matched roles.",
    )

    desired_job_title_1: NonEmptyStr = Field(
        ...,
        max_length=200,
        description="Primary target job title.",
    )

    selected_cities: list[str] | None = Field(
        default=None,
        description="Optional city filters.",
    )
    selected_states: list[str] | None = Field(
        default=None,
        description="Optional state/region filters.",
    )

    selected_regions: list[str] | None = Field(
        default=None,
        description="Salary filter regions when remote is true (max 3); null when remote is false.",
    )
    pay_range_filter: dict[str, RegionPayRange] | None = Field(
        default=None,
        description="Per-region pay when remote is true; null when remote is false.",
    )

    resume_url: HttpUrl = Field(
        ...,
        description="Public or signed URL to the applicant resume.",
    )

    limit_jobs: Literal[25] = Field(
        default=LIMIT_JOBS_FIXED,
        description="Fixed batch size for job results; must remain 25.",
    )

    @field_validator("job_type", mode="before")
    @classmethod
    def validate_job_type_joined(cls, value: Any) -> str:
        if value is None:
            raise ValueError("job_type is required.")
        parts_raw: list[str]
        if isinstance(value, list):
            parts_raw = [str(item).strip() for item in value if str(item).strip()]
        elif isinstance(value, str):
            parts_raw = [p.strip() for p in value.split(";") if p.strip()]
        else:
            raise ValueError("job_type must be a string or list of strings.")
        if not parts_raw:
            raise ValueError("job_type must contain at least one employment type.")
        deduped = list(dict.fromkeys(parts_raw))
        invalid = [p for p in deduped if p not in _ALLOWED_JOB_TYPES]
        if invalid:
            raise ValueError(f"Invalid employment type(s): {invalid}")
        return ";".join(deduped)

    @field_validator("selected_regions", mode="before")
    @classmethod
    def validate_selected_regions(cls, value: Any) -> list[str] | None:
        if value is None:
            return None
        if not isinstance(value, list):
            raise ValueError("selected_regions must be a list or null.")
        normalized = [str(item).strip() for item in value if str(item).strip()]
        if not normalized:
            raise ValueError("selected_regions must contain at least one region when provided.")
        if len(normalized) > 3:
            raise ValueError("selected_regions must contain at most 3 regions.")
        deduped = list(dict.fromkeys(normalized))
        unknown = [r for r in deduped if r not in _REGION_TO_CURRENCY]
        if unknown:
            raise ValueError(f"Invalid region(s): {unknown}")
        return deduped

    @field_validator(
        "industry_names_from_naics",
        "selected_cities",
        "selected_states",
        mode="before",
    )
    @classmethod
    def normalize_optional_string_lists(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        cleaned = [item.strip() for item in value if isinstance(item, str) and item.strip()]
        return cleaned or None

    @model_validator(mode="after")
    def validate_region_pay_ranges(self) -> "JobApplicationSubmissionRequest":
        if not self.remote:
            if self.selected_regions is not None or self.pay_range_filter is not None:
                raise ValueError(
                    "When remote is false, selected_regions and pay_range_filter must be null.",
                )
            return self

        if self.selected_regions is None or self.pay_range_filter is None:
            raise ValueError(
                "Remote roles require selected_regions and pay_range_filter.",
            )
        if set(self.pay_range_filter.keys()) != set(self.selected_regions):
            raise ValueError(
                "pay_range_filter keys must exactly match selected_regions.",
            )
        for region in self.selected_regions:
            expected = _REGION_TO_CURRENCY[region]
            actual = self.pay_range_filter[region].currency
            if actual != expected:
                raise ValueError(
                    f"Currency for {region!r} must be {expected!r}, got {actual!r}.",
                )
        return self


__all__ = ["JobApplicationSubmissionRequest"]
