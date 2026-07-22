import { z } from "zod";

export const validationMessages = {
  required: "This field is required.",
  selectAtLeastOne: "Please select at least one option.",
  invalidUrl: "Please enter a valid URL.",
  invalidPhone: "Enter a valid phone number.",
  limitJobsFixed: "Limit jobs must remain set to 25.",
  jobTitleTagsMaxLength:
    "Combined tags must be at most 200 characters (API limit).",
  workModeRequired:
    "Please select at least one work mode — Remote, Hybrid, or Onsite.",
  hybridLocationRequired: "Select a country when Hybrid is enabled.",
  onsiteLocationRequired: "Select a country when Onsite is enabled.",
} as const;

export const requiredText = z.string().trim().min(1, validationMessages.required);

export const requiredPhoneCountryCode = z
  .string()
  .trim()
  .min(2, validationMessages.required)
  .max(2, validationMessages.required);

export const requiredPhoneNumber = z
  .string()
  .trim()
  .min(1, validationMessages.invalidPhone)
  .transform((value) => value.replace(/\D/g, ""))
  .refine((digits) => digits.length >= 6 && digits.length <= 15, {
    message: validationMessages.invalidPhone,
  });

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

export const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (!value) return true;
      try {
        const u = new URL(value);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: validationMessages.invalidUrl },
  );
