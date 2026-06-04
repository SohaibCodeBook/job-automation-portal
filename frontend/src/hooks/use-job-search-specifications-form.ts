"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
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
  const { data: session, status: sessionStatus } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileError, setResumeFileError] = useState<string | null>(null);

  const form = useForm<JobSearchFormValues>({
    resolver: createZodResolver(jobSearchFormSchema) as unknown as Resolver<JobSearchFormValues>,
    defaultValues: defaultJobSearchFormValues,
    mode: "onBlur",
  });

  const submit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);
    setResumeFileError(null);

    if (!resumeFile) {
      setResumeFileError("Upload a resume file (PDF, Word, or RTF).");
      setIsSubmitting(false);
      return;
    }

    const accessToken = session?.accessToken;
    if (sessionStatus === "loading") {
      setSubmitError("Session is still loading. Please try again.");
      setIsSubmitting(false);
      return;
    }
    if (!accessToken) {
      setSubmitError("Authentication required. Sign in and try again.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = serializeJobApplicationForApi(values);
      const result = await submitJobApplication(payload, accessToken, resumeFile);
      setSubmitMessage(result.message ?? "Job application created successfully.");
      form.reset(defaultJobSearchFormValues);
      setResumeFile(null);
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
    resumeFile,
    setResumeFile,
    resumeFileError,
  };
}
