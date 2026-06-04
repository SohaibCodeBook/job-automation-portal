import { z } from "zod";

import { getCurrencyForCountryName } from "@/lib/locations";
import { EMPLOYMENT_TYPE_OPTIONS } from "@/constants/job-search-form";
import {
  optionalStringArray,
  requiredStringArray,
  requiredText,
  optionalUrl,
  validationMessages,
} from "@/schemas/shared";

export const JOB_LIMIT = 25 as const;

const JOB_TITLE_TAGS_JOINED_MAX = 200;

function joinedTitleLength(tags: string[]): number {
  return tags.join(", ").length;
}

const payRangeEntrySchema = z.object({
  min: z.number().int().min(1),
  max: z.number().int().min(1),
  currency: z.string().min(1),
});

export const jobSearchFormSchema = z
  .object({
    firstName: requiredText,
    lastName: requiredText,
    allIndustries: z.boolean().default(false),
    selectedIndustries: z.array(z.string().trim().min(1)).default([]),
    industryNamesFromNaics: optionalStringArray,
    remote: z.boolean().default(false),
    hybrid: z.boolean().default(false),
    onsite: z.boolean().default(false),
    employmentType: requiredStringArray.superRefine((arr, ctx) => {
      const allowed = new Set<string>(
        EMPLOYMENT_TYPE_OPTIONS.map((option) => option.value),
      );
      arr.forEach((value, index) => {
        if (!allowed.has(value)) {
          ctx.addIssue({
            code: "custom",
            message: "Please select valid employment types only.",
            path: [index],
          });
        }
      });
    }),
    experienceLevels: requiredStringArray,
    omitWords: z.array(z.string().trim().min(1)).default([]),
    mustInclude: z.array(z.string().trim().min(1)).default([]),
    desiredJobTitle1: requiredStringArray.max(
      4,
      "You can add at most 4 target roles.",
    ),
    selectedCities: z
      .array(z.string().trim().min(1))
      .max(3, "You can add at most 3 cities for hybrid locations.")
      .default([]),
    selectedStates: z
      .array(z.string().trim().min(1))
      .max(3, "You can add at most 3 states or provinces for hybrid locations.")
      .default([]),
    selectedRegions: z.array(z.string()).max(3).default([]),
    payRangeFilter: z
      .record(z.string(), payRangeEntrySchema)
      .default({}),
    resumeUrl: optionalUrl,
    limitJobs: z.literal(JOB_LIMIT, {
      message: validationMessages.limitJobsFixed,
    }),
  })
  .superRefine((values, ctx) => {
    // resume file is validated on submit (see useJobSearchSpecificationsForm)
    const hybridCities = values.selectedCities ?? [];
    const hybridStates = values.selectedStates ?? [];

    if (
      !values.allIndustries &&
      values.selectedIndustries.length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        message: validationMessages.selectAtLeastOne,
        path: ["selectedIndustries"],
      });
    }

    if (
      joinedTitleLength(values.desiredJobTitle1) > JOB_TITLE_TAGS_JOINED_MAX
    ) {
      ctx.addIssue({
        code: "custom",
        message: validationMessages.jobTitleTagsMaxLength,
        path: ["desiredJobTitle1"],
      });
    }

    if (!values.remote && !values.hybrid && !values.onsite) {
      ctx.addIssue({
        code: "custom",
        message: validationMessages.workModeRequired,
        path: ["remote"],
      });
    }

    const validateLocationPay = (country: string | undefined) => {
      if (!country) {
        ctx.addIssue({
          code: "custom",
          message: "Select a country.",
          path: ["selectedRegions"],
        });
        return;
      }
      if (!getCurrencyForCountryName(country)) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid country.",
          path: ["selectedRegions"],
        });
        return;
      }
      const entry = values.payRangeFilter[country];
      const expected = getCurrencyForCountryName(country);
      if (!entry || !expected) {
        ctx.addIssue({
          code: "custom",
          message: "Set a salary range for the selected country.",
          path: ["payRangeFilter"],
        });
        return;
      }
      if (entry.currency !== expected) {
        ctx.addIssue({
          code: "custom",
          message: `Currency must be ${expected} for ${country}.`,
          path: ["payRangeFilter", country, "currency"],
        });
      }
      if (entry.min > entry.max) {
        ctx.addIssue({
          code: "custom",
          message: "Minimum cannot exceed maximum salary for this country.",
          path: ["payRangeFilter", country, "min"],
        });
      }
    };

    if (values.hybrid) {
      const country = values.selectedRegions[0];
      if (!country) {
        ctx.addIssue({
          code: "custom",
          message: validationMessages.hybridLocationRequired,
          path: ["selectedRegions"],
        });
      } else {
        validateLocationPay(country);
      }
    }

    if (values.onsite) {
      const country = values.selectedRegions[0];
      if (!country) {
        ctx.addIssue({
          code: "custom",
          message: validationMessages.onsiteLocationRequired,
          path: ["selectedRegions"],
        });
      } else {
        validateLocationPay(country);
      }
    }

    if (!values.remote) {
      return;
    }

    if (values.selectedRegions.length === 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "Select at least one region when Remote is enabled, or turn Remote off.",
        path: ["selectedRegions"],
      });
      return;
    }

    if (values.selectedRegions.length > 3) {
      ctx.addIssue({
        code: "custom",
        message: "You can select at most 3 regions.",
        path: ["selectedRegions"],
      });
    }

    const seen = new Set<string>();
    values.selectedRegions.forEach((region, index) => {
      if (seen.has(region)) {
        ctx.addIssue({
          code: "custom",
          message: "Duplicate regions are not allowed.",
          path: ["selectedRegions", index],
        });
      }
      seen.add(region);
      if (!getCurrencyForCountryName(region)) {
        ctx.addIssue({
          code: "custom",
          message: "Invalid country.",
          path: ["selectedRegions", index],
        });
      }
    });

    const regionSet = new Set(values.selectedRegions);
    const filterKeys = Object.keys(values.payRangeFilter);
    if (
      regionSet.size !== filterKeys.length ||
      !filterKeys.every((k) => regionSet.has(k))
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Each selected region needs a salary range, with no extra regions.",
        path: ["payRangeFilter"],
      });
      return;
    }

    for (const region of values.selectedRegions) {
      const entry = values.payRangeFilter[region];
      if (!entry) continue;
      const expected = getCurrencyForCountryName(region);
      if (expected && entry.currency !== expected) {
        ctx.addIssue({
          code: "custom",
          message: `Currency must be ${expected} for ${region}.`,
          path: ["payRangeFilter", region, "currency"],
        });
      }
      if (entry.min > entry.max) {
        ctx.addIssue({
          code: "custom",
          message: "Minimum cannot exceed maximum salary for this region.",
          path: ["payRangeFilter", region, "min"],
        });
      }
    }
  });

export type JobSearchFormSchema = z.infer<typeof jobSearchFormSchema>;
