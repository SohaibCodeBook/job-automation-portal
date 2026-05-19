import type { JobSearchFormValues } from "@/types/job-search-form";

type WizardStep = {
  id: string;
  title: string;
  description: string;
  fields: Array<keyof JobSearchFormValues>;
};

/** Short labels for the steps chain (uppercase in UI). */
export const WIZARD_STEP_CHAIN_LABELS: Record<string, string> = {
  "personal-information": "Personal",
  "industry-preferences": "Industry",
  "work-preferences": "Work prefs",
  "geographic-preferences": "Location",
  "desired-job-titles": "Titles",
  "other-details": "Details",
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
    fields: ["allIndustries", "selectedIndustries", "industryNamesFromNaics"],
  },
  {
    id: "work-preferences",
    title: "Step 3 — Work Preferences",
    description:
      "Choose remote, hybrid, or onsite preferences, employment type, and experience levels.",
    fields: [
      "remote",
      "hybrid",
      "onsite",
      "selectedRegions",
      "payRangeFilter",
      "employmentType",
      "experienceLevels",
    ],
  },
  {
    id: "geographic-preferences",
    title: "Step 4 — Geographic Preferences",
    description: "Optional location filters for city and state.",
    fields: ["selectedCities", "selectedStates"],
  },
  {
    id: "desired-job-titles",
    title: "Step 5 — Desired Job Titles",
    description: "Define your primary target job titles.",
    fields: ["desiredJobTitle1"],
  },
  {
    id: "other-details",
    title: "Step 6 — Other Details",
    description: "Finalize inclusion rules, resume URL, and fixed job limit.",
    fields: ["omitWords", "mustInclude", "resumeUrl", "limitJobs"],
  },
];

export type { WizardStep };
