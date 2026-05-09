import { z } from "zod";

export const jobSearchSchema = z.object({
  query: z
    .string()
    .min(2, "Please enter at least 2 characters.")
    .max(120, "Search query is too long."),
  location: z
    .string()
    .min(2, "Please enter at least 2 characters.")
    .max(120, "Location is too long.")
    .optional()
    .or(z.literal("")),
  remoteOnly: z.boolean().default(false),
  jobType: z.enum(["full-time", "part-time", "contract", "internship"]),
});

export type JobSearchSchema = z.infer<typeof jobSearchSchema>;
