from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class JobListingErrorResponse(BaseModel):
    success: bool = False
    message: str
    data: None = None


class JobListingListItem(BaseModel):
    id: str
    job_application_id: str
    title: str | None = None
    company: str | None = None
    location: str | None = None
    url: str | None = None
    pay_range: str | None = None
    posted_time: str | None = None
    employment_type: str | None = None
    work_type: str | None = None
    field: str | None = None
    job_origin: str | None = None
    experience_levels: str | None = None
    created_at: datetime | None = None
    is_favorited: bool = False
    is_applied: bool = False
    applied_at: datetime | None = None
    is_archived: bool = False
    note: str | None = None
    note_updated_at: datetime | None = None


class JobListingFavoritesSummaryResponse(BaseModel):
    count: int
    ids: list[str]


class JobListingAppliedSummaryResponse(BaseModel):
    count: int
    ids: list[str]


class JobListingArchivesSummaryResponse(BaseModel):
    count: int
    ids: list[str]


class JobListingFavoriteToggleResponse(BaseModel):
    favorited: bool
    count: int


class JobListingAppliedToggleResponse(BaseModel):
    applied: bool
    count: int


class JobListingArchiveToggleResponse(BaseModel):
    archived: bool
    count: int


class JobListingBulkArchiveRequest(BaseModel):
    listing_ids: list[UUID] = Field(..., min_length=1, max_length=100)
    archived: bool


class JobListingBulkArchiveResponse(BaseModel):
    archived: bool
    count: int
    updated: int


class JobListingNoteUpsertRequest(BaseModel):
    note: str = Field(..., max_length=5000)


class JobListingNoteResponse(BaseModel):
    note: str | None = None
    note_updated_at: datetime | None = None


class JobListingFilterOptionsResponse(BaseModel):
    employment_types: list[str]
    work_types: list[str]
    locations: list[str]


class JobListingListResponse(BaseModel):
    items: list[JobListingListItem]
    total: int
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=100)


class JobListingDateCountsResponse(BaseModel):
    all: int
    today: int
    last_7_days: int
    last_2_weeks: int
    last_30_days: int
    older: int


class JobListingDetailResponse(BaseModel):
    id: str
    job_application_id: str
    title: str | None = None
    company: str | None = None
    location: str | None = None
    url: str | None = None
    company_url: str | None = None
    company_website: str | None = None
    pay_range: str | None = None
    posted_time: str | None = None
    employment_type: str | None = None
    industries: str | None = None
    about_job: str | None = None
    name: str | None = None
    field: str | None = None
    work_type: str | None = None
    omit_words: str | None = None
    job_origin: str | None = None
    experience_levels: str | None = None
    created_at: datetime | None = None
    is_favorited: bool = False
    is_applied: bool = False
    applied_at: datetime | None = None
    is_archived: bool = False
    note: str | None = None
    note_updated_at: datetime | None = None
