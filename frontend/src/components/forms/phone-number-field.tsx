"use client";

import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";

import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { PhoneNumberInput } from "@/components/forms/phone-number-input";
import { Input } from "@/components/ui/input";
import type { JobSearchFormValues } from "@/types/job-search-form";

type PhoneNumberFieldProps = {
  control: Control<JobSearchFormValues>;
  errors: FieldErrors<JobSearchFormValues>;
  disabled?: boolean;
  readOnly?: boolean;
  lockedDisplayPhone?: string | null;
};

export function PhoneNumberField({
  control,
  errors,
  disabled = false,
  readOnly = false,
  lockedDisplayPhone,
}: PhoneNumberFieldProps) {
  const countryError = errors.phoneCountryCode?.message;
  const numberError = errors.phoneNumber?.message;
  const error = countryError ?? numberError;

  if (readOnly && lockedDisplayPhone) {
    return (
      <FormFieldWrapper
        label="Phone Number"
        htmlFor="phoneNumber"
        required
        description="Saved on your account. You can change this in Settings later."
      >
        <Input
          id="phoneNumber"
          value={lockedDisplayPhone}
          readOnly
          disabled={disabled}
          className="h-10 rounded-xl bg-muted/40"
        />
      </FormFieldWrapper>
    );
  }

  return (
    <FormFieldWrapper
      label="Phone Number"
      htmlFor="phoneNumber"
      required
      description={
        readOnly
          ? "Saved on your account. You can change this in Settings later."
          : "Select country code and enter your number."
      }
      error={error}
    >
      <Controller
        control={control}
        name="phoneCountryCode"
        render={({ field: countryField }) => (
          <Controller
            control={control}
            name="phoneNumber"
            render={({ field: numberField }) => (
              <PhoneNumberInput
                phoneCountryCode={countryField.value}
                phoneNumber={numberField.value}
                onPhoneCountryCodeChange={countryField.onChange}
                onPhoneNumberChange={numberField.onChange}
                disabled={disabled || readOnly}
                countryInvalid={Boolean(countryError)}
                numberInvalid={Boolean(numberError)}
              />
            )}
          />
        )}
      />
    </FormFieldWrapper>
  );
}
