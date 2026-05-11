import type { z } from "zod";

import { JOB_LIMIT, jobSearchFormSchema } from "@/schemas/job-search-form";

export type JobSearchFormValues = z.infer<typeof jobSearchFormSchema>;

export type JobSearchFormInput = z.input<typeof jobSearchFormSchema>;

export const defaultJobSearchFormValues: JobSearchFormValues = {
  firstName: "",
  lastName: "",
  allIndustries: false,
  selectedIndustries: [],
  industryNamesFromNaics: [],
  remote: false,
  hybrid: false,
  employmentType: [],
  experienceLevels: [],
  omitWords: [],
  mustInclude: [],
  desiredJobTitle1: [],
  selectedCities: [],
  selectedStates: [],
  selectedRegions: [],
  payRangeFilter: {},
  resumeUrl: "",
  limitJobs: JOB_LIMIT,
};
