/** Color accent per wizard section — used for section header icons. */
export type WizardSectionAccent =
  | "blue"
  | "purple"
  | "teal"
  | "indigo"
  | "rose";

export const WIZARD_SECTION_ACCENTS: Record<string, WizardSectionAccent> = {
  "personal-information": "blue",
  "industry-preferences": "purple",
  "work-preferences": "teal",
  "geographic-preferences": "indigo",
  "desired-job-titles": "indigo",
  "other-details": "rose",
};
