import type { JobSearchFormValues } from "@/types/job-search-form";

type WizardStep = {
  id: string;
  title: string;
  description: string;
  fields: Array<keyof JobSearchFormValues>;
};

export const JOB_SEARCH_WIZARD_STEPS: WizardStep[] = [
  {
    id: "personal-information",
    title: "Step 1 — Personal Information",
    description: "Basic identity details used for personalization.",
    fields: ["firstName", "lastName"],
  },
  {
    id: "industry-preferences",
    title: "Step 2 — Industry Preferences",
    description: "Select target industries and optional NAICS-aligned names.",
    fields: ["selectedIndustries", "industryNamesFromNaics"],
  },
  {
    id: "work-preferences",
    title: "Step 3 — Work Preferences",
    description:
      "Choose remote/hybrid preferences, employment type, and experience levels.",
    fields: [
      "remote",
      "hybrid",
      "selectedRegions",
      "payRangeFilter",
      "employmentType",
      "experienceLevels",
    ],
  },
  {
    id: "desired-job-titles",
    title: "Step 4 — Desired Job Titles",
    description: "Define required and optional job title targets.",
    fields: [
      "desiredJobTitle1",
      "desiredJobTitle2",
      "desiredJobTitle3",
      "otherJobTitles",
    ],
  },
  {
    id: "geographic-preferences",
    title: "Step 5 — Geographic Preferences",
    description: "Optional location filters for city and state.",
    fields: ["selectedCities", "selectedStates"],
  },
  {
    id: "other-details",
    title: "Step 6 — Other Details",
    description: "Finalize inclusion rules, resume URL, and fixed job limit.",
    fields: ["omitWords", "mustInclude", "resumeUrl", "limitJobs"],
  },
];

export type { WizardStep };
