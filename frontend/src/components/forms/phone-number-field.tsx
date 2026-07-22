"use client";

import * as React from "react";
import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";

import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PORTAL_FORM_DROPDOWN } from "@/constants/portal-form-classes";
import {
  getOtherPhoneCountryOptions,
  getPhoneCountryByIso,
  getPopularPhoneCountryOptions,
} from "@/lib/phone-countries";
import { cn } from "@/lib/utils";
import type { JobSearchFormValues } from "@/types/job-search-form";

type PhoneNumberFieldProps = {
  control: Control<JobSearchFormValues>;
  errors: FieldErrors<JobSearchFormValues>;
  disabled?: boolean;
  readOnly?: boolean;
  lockedDisplayPhone?: string | null;
};

function CountryCodeSelect({
  value,
  onChange,
  disabled,
  readOnly,
  invalid,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
  invalid?: boolean;
}) {
  const selected = getPhoneCountryByIso(value);
  const popularOptions = React.useMemo(() => getPopularPhoneCountryOptions(), []);
  const otherOptions = React.useMemo(() => getOtherPhoneCountryOptions(), []);

  if (readOnly && selected) {
    return (
      <div className="flex h-10 min-w-[7.5rem] items-center rounded-xl border border-input bg-muted/40 px-3 text-sm">
        <span aria-hidden="true">{selected.flag}</span>
        <span className="ml-2 font-medium">+{selected.dialCode}</span>
      </div>
    );
  }

  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled || readOnly}
    >
      <SelectTrigger
        id="phoneCountryCode"
        aria-invalid={invalid}
        className={cn(
          "h-10 w-[8.75rem] shrink-0 rounded-xl bg-transparent px-3 py-2",
        )}
      >
        <SelectValue placeholder="Code">
          {selected ? (
            <span className="flex items-center gap-2">
              <span aria-hidden="true">{selected.flag}</span>
              <span>+{selected.dialCode}</span>
            </span>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className={cn(PORTAL_FORM_DROPDOWN, "max-h-72")}>
        <SelectGroup>
          <SelectLabel>Popular</SelectLabel>
          {popularOptions.map((country) => (
            <SelectItem key={country.isoCode} value={country.isoCode}>
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-muted-foreground">+{country.dialCode}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>All countries</SelectLabel>
          {otherOptions.map((country) => (
            <SelectItem key={country.isoCode} value={country.isoCode}>
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{country.flag}</span>
                <span>{country.name}</span>
                <span className="text-muted-foreground">+{country.dialCode}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

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
      <div className="flex gap-2">
        <Controller
          control={control}
          name="phoneCountryCode"
          render={({ field }) => (
            <CountryCodeSelect
              value={field.value}
              onChange={field.onChange}
              disabled={disabled}
              readOnly={readOnly}
              invalid={Boolean(countryError)}
            />
          )}
        />
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field }) => (
            <Input
              {...field}
              id="phoneNumber"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="300 1234567"
              readOnly={readOnly}
              disabled={disabled}
              aria-invalid={Boolean(numberError)}
              className={cn(
                "h-10 min-w-0 flex-1 rounded-xl",
                readOnly && "bg-muted/40",
              )}
              onChange={(event) => {
                const digits = event.target.value.replace(/[^\d\s-]/g, "");
                field.onChange(digits);
              }}
            />
          )}
        />
      </div>
    </FormFieldWrapper>
  );
}
