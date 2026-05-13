import { z } from "zod";

export const validationMessages = {
  required: "This field is required.",
  selectAtLeastOne: "Please select at least one option.",
  invalidUrl: "Please enter a valid URL.",
  limitJobsFixed: "Limit jobs must remain set to 25.",
  jobTitleTagsMaxLength:
    "Combined tags must be at most 200 characters (API limit).",
  workModeRequired:
    "Please select at least one work mode — Remote or Hybrid.",
  hybridLocationRequired:
    "Select at least one city or one state/province when Hybrid is enabled.",
} as const;

export const requiredText = z.string().trim().min(1, validationMessages.required);

export const optionalText = z.string().trim().optional().or(z.literal(""));

export const requiredStringArray = z
  .array(z.string().trim().min(1))
  .min(1, validationMessages.selectAtLeastOne);

export const optionalStringArray = z.array(z.string().trim().min(1)).optional();

export const requiredUrl = z
  .string()
  .trim()
  .min(1, validationMessages.required)
  .url(validationMessages.invalidUrl);
