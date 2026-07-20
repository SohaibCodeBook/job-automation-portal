export type JobListingListItem = {
  id: string;
  job_application_id: string;
  title: string | null;
  company: string | null;
  location: string | null;
  url: string | null;
  pay_range: string | null;
  posted_time: string | null;
  employment_type: string | null;
  work_type: string | null;
  field: string | null;
  job_origin: string | null;
  experience_levels?: string | null;
  created_at: string | null;
  is_favorited?: boolean;
  is_applied?: boolean;
  is_archived?: boolean;
  applied_at?: string | null;
  note?: string | null;
  note_updated_at?: string | null;
};

export type JobListingDetail = JobListingListItem & {
  company_url: string | null;
  company_website: string | null;
  industries: string | null;
  about_job: string | null;
  name: string | null;
  field: string | null;
  omit_words: string | null;
};

export type JobListingListResponse = {
  items: JobListingListItem[];
  total: number;
  page: number;
  page_size: number;
};

/** Matches backend `ListingDateFilter` query param. */
export type JobListingDateFilter =
  | "all"
  | "today"
  | "last_7_days"
  | "last_2_weeks"
  | "last_30_days"
  | "older"
  | "on_date";

export type JobListingDateCounts = {
  all: number;
  today: number;
  last_7_days: number;
  last_2_weeks: number;
  last_30_days: number;
  older: number;
};

export type JobListingFavoritesSummary = {
  count: number;
  ids: string[];
};

export type JobListingFavoriteToggleResult = {
  favorited: boolean;
  count: number;
};

export type JobListingAppliedSummary = {
  count: number;
  ids: string[];
};

export type JobListingAppliedToggleResult = {
  applied: boolean;
  count: number;
};

export type JobListingArchivesSummary = {
  count: number;
  ids: string[];
};

export type JobListingArchiveToggleResult = {
  archived: boolean;
  count: number;
};

export type JobListingBulkArchiveResult = {
  archived: boolean;
  count: number;
  updated: number;
};

export type JobListingNoteResult = {
  note: string | null;
  note_updated_at: string | null;
};

export type JobListingFilterOptions = {
  employment_types: string[];
  work_types: string[];
  locations: string[];
};
