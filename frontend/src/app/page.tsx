"use client";

import * as React from "react";
import { Controller } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { AlertTriangle } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  FormSectionCard,
  HybridLocationPreferencesPanel,
  IndustrySearchableMultiSelect,
  MultiSelectInput,
  RemoteRegionSalarySection,
  SubmitButton,
  TagInput,
  TextInputField,
  ToggleSwitchField,
  FormCompletionProgress,
  WizardStepsChain,
} from "@/components/forms";
import { Input } from "@/components/ui/input";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
} from "@/constants/job-search-form";
import {
  HINT_DESIRED_JOB_TITLES,
  HINT_HYBRID_TOGGLE,
  HINT_MUST_INCLUDE,
  HINT_OMIT_WORDS,
  HINT_REMOTE_TOGGLE,
  HINT_SELECTED_INDUSTRIES,
} from "@/constants/form-field-hints";
import { JOB_SEARCH_WIZARD_STEPS, WIZARD_STEP_CHAIN_LABELS } from "@/constants/job-search-wizard";
import { WIZARD_STEP_ICONS } from "@/constants/wizard-step-icons";
import {
  computeWizardStepCompletion,
  getActiveWizardStepIndex,
} from "@/lib/job-search-wizard-progress";
import { useJobSearchSpecificationsForm } from "@/hooks/use-job-search-specifications-form";
import { getFieldErrorMessage } from "@/lib/validation";
import { JOB_LIMIT } from "@/schemas/job-search-form";
import { validationMessages } from "@/schemas/shared";
import type { JobSearchFormValues } from "@/types/job-search-form";

function sectionTitle(stepTitle: string): string {
  return stepTitle.replace(/^Step \d+ — /, "");
}

export default function Home() {
  const { form, submit, isSubmitting, submitMessage, submitError } =
    useJobSearchSpecificationsForm();
  const {
    register,
    control,
    setValue,
    watch,
    clearErrors,
    formState: { errors },
  } = form;

  const remoteEnabled = useWatch({ control, name: "remote" });
  const hybridEnabled = useWatch({ control, name: "hybrid" });
  const allIndustries = useWatch({ control, name: "allIndustries" });

  React.useEffect(() => {
    if (!remoteEnabled && !hybridEnabled) return;
    if (errors.remote?.message !== validationMessages.workModeRequired) return;
    clearErrors("remote");
  }, [remoteEnabled, hybridEnabled, errors.remote?.message, clearErrors]);

  const visibleSteps = React.useMemo(
    () =>
      JOB_SEARCH_WIZARD_STEPS.filter(
        (step) => step.id !== "geographic-preferences",
      ),
    [],
  );

  const stepIds = React.useMemo(
    () => visibleSteps.map((s) => s.id),
    [visibleSteps],
  );

  const formValues = useWatch({ control }) as JobSearchFormValues;

  const completion = React.useMemo(
    () => computeWizardStepCompletion(formValues, stepIds),
    [formValues, stepIds],
  );
  const activeWizardIndex = React.useMemo(
    () => getActiveWizardStepIndex(completion),
    [completion],
  );

  const wizardChainSteps = React.useMemo(
    () =>
      visibleSteps.map((s) => ({
        id: s.id,
        label: WIZARD_STEP_CHAIN_LABELS[s.id] ?? sectionTitle(s.title),
      })),
    [visibleSteps],
  );

  const renderSection = (stepId: string) => {
    switch (stepId) {
      case "personal-information":
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextInputField
              id="firstName"
              label="First Name"
              placeholder="Enter first name"
              required
              error={errors.firstName?.message}
              description="Required field."
              {...register("firstName")}
            />
            <TextInputField
              id="lastName"
              label="Last Name"
              placeholder="Enter last name"
              required
              error={errors.lastName?.message}
              description="Required field."
              {...register("lastName")}
            />
          </div>
        );
      case "industry-preferences":
        return (
          <div className="space-y-4">
            <Controller
              control={control}
              name="selectedIndustries"
              render={({ field }) => (
                <IndustrySearchableMultiSelect
                  id="selectedIndustries"
                  label="Select Industries"
                  required
                  labelHint={HINT_SELECTED_INDUSTRIES}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  allIndustriesActive={allIndustries}
                  onAllIndustriesChange={(next) =>
                    setValue("allIndustries", next)
                  }
                  error={errors.selectedIndustries?.message}
                  description="Pick industries from the list, or turn on All Industries. At least one is required unless All Industries is on."
                />
              )}
            />
            <Controller
              control={control}
              name="industryNamesFromNaics"
              render={({ field }) => (
                <TagInput
                  id="industryNamesFromNaics"
                  label="Industry Names from NAICS"
                  tags={field.value ?? []}
                  onTagsChange={field.onChange}
                  error={errors.industryNamesFromNaics?.message}
                  description="Optional NAICS-aligned names."
                />
              )}
            />
          </div>
        );
      case "work-preferences": {
        const workModeError =
          !remoteEnabled &&
          !hybridEnabled &&
          errors.remote?.message === validationMessages.workModeRequired;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="remote"
                render={({ field }) => (
                  <ToggleSwitchField
                    id="remote"
                    label="Remote"
                    labelHint={HINT_REMOTE_TOGGLE}
                    checked={field.value}
                    disabled={hybridEnabled}
                    className={
                      workModeError
                        ? "rounded-lg border-2 border-destructive bg-background/80 p-3 shadow-sm"
                        : undefined
                    }
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (checked) {
                        setValue("hybrid", false);
                        setValue("selectedCities", []);
                        setValue("selectedStates", []);
                      } else {
                        setValue("selectedRegions", []);
                        setValue("payRangeFilter", {});
                      }
                    }}
                    description="Include fully remote jobs. Turn off Hybrid to use this."
                  />
                )}
              />
              <Controller
                control={control}
                name="hybrid"
                render={({ field }) => (
                  <ToggleSwitchField
                    id="hybrid"
                    label="Hybrid"
                    labelHint={HINT_HYBRID_TOGGLE}
                    checked={field.value}
                    disabled={remoteEnabled}
                    className={
                      workModeError
                        ? "rounded-lg border-2 border-destructive bg-background/80 p-3 shadow-sm"
                        : undefined
                    }
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (checked) {
                        setValue("remote", false);
                        setValue("selectedRegions", []);
                        setValue("payRangeFilter", {});
                      } else {
                        setValue("selectedCities", []);
                        setValue("selectedStates", []);
                      }
                    }}
                    description="Include hybrid work options. Turn off Remote to use this."
                  />
                )}
              />
            </div>
            {workModeError ? (
              <p
                className="flex items-start gap-2 text-sm font-medium text-destructive"
                role="alert"
              >
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
                <span>{errors.remote?.message}</span>
              </p>
            ) : null}
            {remoteEnabled ? (
              <RemoteRegionSalarySection
                setValue={setValue}
                watch={watch}
                errors={errors}
              />
            ) : null}
            {hybridEnabled ? (
              <HybridLocationPreferencesPanel
                setValue={setValue}
                watch={watch}
                errors={errors}
              />
            ) : null}
            <Controller
              control={control}
              name="employmentType"
              render={({ field }) => (
                <MultiSelectInput
                  id="employmentType"
                  label="Employment Type"
                  required
                  options={[...EMPLOYMENT_TYPE_OPTIONS]}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  error={errors.employmentType?.message}
                  description="Required. Select one or more employment types."
                  placeholder="Select employment types"
                />
              )}
            />
            <Controller
              control={control}
              name="experienceLevels"
              render={({ field }) => (
                <MultiSelectInput
                  id="experienceLevels"
                  label="Experience Levels"
                  required
                  options={[...EXPERIENCE_LEVEL_OPTIONS]}
                  selectedValues={field.value}
                  onChange={field.onChange}
                  error={errors.experienceLevels?.message}
                  description="Required. Select one or more experience levels."
                />
              )}
            />
          </div>
        );
      }
      case "desired-job-titles":
        return (
          <div className="space-y-4">
            <Controller
              control={control}
              name="desiredJobTitle1"
              render={({ field }) => (
                <TagInput
                  id="desiredJobTitle1"
                  label="Your Target Roles"
                  required
                  labelHint={HINT_DESIRED_JOB_TITLES}
                  tags={field.value}
                  onTagsChange={field.onChange}
                  error={errors.desiredJobTitle1?.message}
                  description="Required primary target titles. Type and press Enter to add each."
                />
              )}
            />
          </div>
        );
      case "geographic-preferences":
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="selectedCities"
              render={({ field }) => (
                <TagInput
                  id="selectedCities"
                  label="Selected Cities"
                  tags={field.value ?? []}
                  onTagsChange={field.onChange}
                  error={errors.selectedCities?.message}
                  description="Optional city filters."
                />
              )}
            />
            <Controller
              control={control}
              name="selectedStates"
              render={({ field }) => (
                <TagInput
                  id="selectedStates"
                  label="Selected States"
                  tags={field.value ?? []}
                  onTagsChange={field.onChange}
                  error={errors.selectedStates?.message}
                  description="Optional state filters."
                />
              )}
            />
          </div>
        );
      case "other-details":
        return (
          <div className="space-y-4">
            <TextInputField
              id="resumeUrl"
              label="Resume URL"
              type="url"
              inputMode="url"
              required
              placeholder="https://example.com/resume"
              error={errors.resumeUrl?.message}
              description="Required. Must be a valid URL."
              {...register("resumeUrl")}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="omitWords"
                render={({ field }) => (
                  <TagInput
                    id="omitWords"
                    label="Omit Words"
                    labelHint={HINT_OMIT_WORDS}
                    tags={field.value}
                    onTagsChange={field.onChange}
                    error={errors.omitWords?.message}
                    description="Optional. Terms to exclude from matching."
                  />
                )}
              />
              <Controller
                control={control}
                name="mustInclude"
                render={({ field }) => (
                  <TagInput
                    id="mustInclude"
                    label="Must Include"
                    labelHint={HINT_MUST_INCLUDE}
                    tags={field.value}
                    onTagsChange={field.onChange}
                    error={errors.mustInclude?.message}
                    description="Optional. Terms that must exist in results."
                  />
                )}
              />
            </div>
            <div className="max-w-xs space-y-2">
              <label
                htmlFor="limitJobs"
                className="text-sm leading-none font-medium select-none"
              >
                Limit Jobs
              </label>
              <Input
                id="limitJobs"
                value={JOB_LIMIT}
                readOnly
                disabled
                aria-readonly="true"
              />
              <p className="text-xs text-muted-foreground">
                Fixed to 25 for this workflow.
              </p>
              <input type="hidden" value={JOB_LIMIT} {...register("limitJobs")} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex items-start justify-between gap-4">
        <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
          <span className="bg-clip-text text-transparent [background-image:linear-gradient(to_right,var(--job-title-gradient-start),var(--job-title-gradient-end))]">
            Job Search Specifications
          </span>
        </h1>
        <ThemeToggle />
      </header>

      <div className="space-y-3">
        <FormCompletionProgress completion={completion} />

        <WizardStepsChain
          steps={wizardChainSteps}
          completion={completion}
          activeIndex={activeWizardIndex}
          className="rounded-xl border border-border bg-card/90 px-3 py-3.5 shadow-sm backdrop-blur-sm sm:px-5"
        />
      </div>

      <form onSubmit={submit} className="space-y-8" noValidate>
        <div className="space-y-8">
          {visibleSteps.map((step, index) => {
            const StepIcon = WIZARD_STEP_ICONS[step.id];
            return (
              <FormSectionCard
                key={step.id}
                sectionId={`section-${step.id}`}
                title={sectionTitle(step.title)}
                description={step.description}
                sectionNumber={index + 1}
                sectionComplete={completion[index] === true}
                icon={
                  StepIcon ? <StepIcon className="size-5" strokeWidth={1.75} /> : undefined
                }
              >
                {renderSection(step.id)}
              </FormSectionCard>
            );
          })}
        </div>

        <div className="space-y-3 rounded-xl border bg-card p-4 sm:p-5">
          {errors.root?.message ? (
            <p className="text-sm text-destructive">
              {getFieldErrorMessage(errors.root)}
            </p>
          ) : null}
          {submitMessage ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {submitMessage}
            </p>
          ) : null}
          {submitError ? (
            <p className="text-sm text-destructive">{submitError}</p>
          ) : null}
          <SubmitButton
            loading={isSubmitting}
            loadingText="Submitting..."
            size="lg"
            className="w-full sm:w-auto"
          >
            Save Job Search Specifications
          </SubmitButton>
        </div>
      </form>
    </main>
  );
}
