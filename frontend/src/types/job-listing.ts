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
  created_at: string | null;
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
