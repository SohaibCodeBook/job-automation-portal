from datetime import datetime

from pydantic import BaseModel, Field


class JobApplicationCreatedData(BaseModel):
    id: str


class JobApplicationCreateResponse(BaseModel):
    success: bool = True
    message: str = "Job application created successfully"
    data: JobApplicationCreatedData


class JobApplicationErrorResponse(BaseModel):
    success: bool = False
    message: str
    data: None = None


class JobApplicationListItem(BaseModel):
    id: str
    first_name: str | None = None
    last_name: str | None = None
    desired_job_title_1: str | None = None
    remote: bool | None = None
    hybrid: bool | None = None
    job_type: str | None = None
    created_at: datetime | None = None


class JobApplicationListResponse(BaseModel):
    items: list[JobApplicationListItem]
    total: int
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=100)


class JobApplicationDetailResponse(BaseModel):
    id: str
    first_name: str | None = None
    last_name: str | None = None
    selected_industries: str | None = None
    industry_names_from_naics: str | None = None
    remote: bool | None = None
    hybrid: bool | None = None
    onsite: bool | None = None
    job_type: str | None = None
    experience_levels: str | None = None
    omit_words: str | None = None
    must_include: str | None = None
    desired_job_title_1: str | None = None
    selected_cities: str | None = None
    selected_states: str | None = None
    selected_regions: list[str] | None = None
    pay_range_filter: dict | list | None = None
    resume_url: str | None = None
    limit_jobs: int | None = None
    created_at: datetime | None = None
