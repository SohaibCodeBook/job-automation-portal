"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";

import {
  serializeJobApplicationForApi,
  submitJobApplication,
} from "@/lib/api/job-applications";
import { getCurrentUser, updateProfile } from "@/lib/api/users";
import { formatPhoneNumber, parseStoredPhone } from "@/lib/phone-countries";
import { createZodResolver } from "@/lib/validation";
import { jobSearchFormSchema } from "@/schemas/job-search-form";
import {
  defaultJobSearchFormValues,
  type JobSearchFormValues,
} from "@/types/job-search-form";

function phoneFieldsFromSaved(savedPhone: string): Pick<
  JobSearchFormValues,
  "phoneAlreadySaved" | "phoneCountryCode" | "phoneNumber"
> {
  const parsed = parseStoredPhone(savedPhone);
  if (parsed) {
    return {
      phoneAlreadySaved: true,
      phoneCountryCode: parsed.isoCode,
      phoneNumber: parsed.localNumber,
    };
  }
  return {
    phoneAlreadySaved: true,
    phoneCountryCode: "",
    phoneNumber: "",
  };
}

export function useJobSearchSpecificationsForm() {
  const { data: session, status: sessionStatus } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeFileError, setResumeFileError] = useState<string | null>(null);
  const [phoneLocked, setPhoneLocked] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [lockedDisplayPhone, setLockedDisplayPhone] = useState<string | null>(
    null,
  );
  const savedPhoneRef = useRef("");

  const form = useForm<JobSearchFormValues>({
    resolver: createZodResolver(jobSearchFormSchema) as unknown as Resolver<JobSearchFormValues>,
    defaultValues: defaultJobSearchFormValues,
    mode: "onBlur",
  });

  useEffect(() => {
    const accessToken = session?.accessToken;
    if (sessionStatus === "loading") return;
    if (!accessToken) {
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const result = await getCurrentUser(accessToken);
      if (cancelled) return;
      if (result.ok && result.user.phone) {
        savedPhoneRef.current = result.user.phone;
        const parsed = parseStoredPhone(result.user.phone);
        if (parsed) {
          form.setValue("phoneCountryCode", parsed.isoCode);
          form.setValue("phoneNumber", parsed.localNumber);
          setLockedDisplayPhone(null);
        } else {
          setLockedDisplayPhone(result.user.phone);
        }
        form.setValue("phoneAlreadySaved", true);
        setPhoneLocked(true);
      }
      setProfileLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, sessionStatus, form]);

  const submit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    setSubmitMessage(null);
    setSubmitError(null);
    setResumeFileError(null);

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
      if (!phoneLocked) {
        const fullPhone = formatPhoneNumber(
          values.phoneCountryCode,
          values.phoneNumber,
        );
        const phoneResult = await updateProfile(accessToken, {
          phone: fullPhone,
        });
        if (!phoneResult.ok) {
          throw new Error(phoneResult.message);
        }
        savedPhoneRef.current = fullPhone;
        setLockedDisplayPhone(null);
        form.setValue("phoneAlreadySaved", true);
        form.setValue("phoneCountryCode", values.phoneCountryCode);
        form.setValue("phoneNumber", values.phoneNumber.replace(/\D/g, ""));
        setPhoneLocked(true);
      }

      const payload = serializeJobApplicationForApi(values);
      const result = await submitJobApplication(payload, accessToken, resumeFile);
      setSubmitMessage(result.message ?? "Job application created successfully.");
      form.reset({
        ...defaultJobSearchFormValues,
        ...phoneFieldsFromSaved(savedPhoneRef.current),
      });
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
    phoneLocked,
    profileLoading,
    lockedDisplayPhone,
  };
}
