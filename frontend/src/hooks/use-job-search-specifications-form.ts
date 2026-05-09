"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import {
  serializeJobApplicationForApi,
  submitJobApplication,
} from "@/lib/api/job-applications";
import { createZodResolver } from "@/lib/validation";
import { jobSearchFormSchema } from "@/schemas/job-search-form";
import {
  defaultJobSearchFormValues,
  type JobSearchFormValues,
} from "@/types/job-search-form";

export function useJobSearchSpecificationsForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<JobSearchFormValues>({
    resolver: createZodResolver(jobSearchFormSchema) as unknown as Resolver<JobSearchFormValues>,
    defaultValues: defaultJobSearchFormValues,
    mode: "onBlur",
  });

  const submit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);
    try {
      const payload = serializeJobApplicationForApi(values);
      console.log("[job-application] request payload", payload);
      const result = await submitJobApplication(payload);
      setSubmitMessage(result.message ?? "Job application created successfully.");
      form.reset(defaultJobSearchFormValues);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Submission failed.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  });

  return {
    form,
    submit,
    isSubmitting,
    submitMessage,
    submitError,
  };
}
