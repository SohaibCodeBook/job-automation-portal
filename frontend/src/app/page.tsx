"use client";

import { Controller } from "react-hook-form";
import { useWatch } from "react-hook-form";

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
} from "@/components/forms";
import { Input } from "@/components/ui/input";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
} from "@/constants/job-search-form";
import { JOB_SEARCH_WIZARD_STEPS } from "@/constants/job-search-wizard";
import { useJobSearchSpecificationsForm } from "@/hooks/use-job-search-specifications-form";
import { getFieldErrorMessage } from "@/lib/validation";
import { JOB_LIMIT } from "@/schemas/job-search-form";

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
    formState: { errors },
  } = form;

  const remoteEnabled = useWatch({ control, name: "remote" });
  const hybridEnabled = useWatch({ control, name: "hybrid" });
  const allIndustries = useWatch({ control, name: "allIndustries" });

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
                  label="Selected Industries"
                  required
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
      case "work-preferences":
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
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        setValue("selectedRegions", []);
                        setValue("payRangeFilter", {});
                      }
                    }}
                    description="Include fully remote jobs."
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
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        setValue("selectedCities", []);
                        setValue("selectedStates", []);
                      }
                    }}
                    description="Include hybrid work options."
                  />
                )}
              />
            </div>
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
      case "desired-job-titles":
        return (
          <div className="space-y-4">
            <Controller
              control={control}
              name="desiredJobTitle1"
              render={({ field }) => (
                <TagInput
                  id="desiredJobTitle1"
                  label="Desired Job Title 1"
                  required
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
                    tags={field.value}
                    onTagsChange={field.onChange}
                    error={errors.omitWords?.message}
                    description="Required. Terms to exclude from matching."
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
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Job Search Specifications
        </h1>
        <ThemeToggle />
      </header>

      <form onSubmit={submit} className="space-y-8" noValidate>
        <div className="space-y-8">
          {JOB_SEARCH_WIZARD_STEPS.filter(
            (step) => step.id !== "geographic-preferences",
          ).map((step) => (
            <FormSectionCard
              key={step.id}
              title={sectionTitle(step.title)}
              description={step.description}
            >
              {renderSection(step.id)}
            </FormSectionCard>
          ))}
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
