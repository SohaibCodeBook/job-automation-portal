"use client";

import * as React from "react";

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

type CountryCodeSelectProps = {
  id: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  invalid?: boolean;
};

function CountryCodeSelect({
  id,
  value,
  onChange,
  disabled,
  invalid,
}: CountryCodeSelectProps) {
  const selected = getPhoneCountryByIso(value);
  const popularOptions = React.useMemo(() => getPopularPhoneCountryOptions(), []);
  const otherOptions = React.useMemo(() => getOtherPhoneCountryOptions(), []);

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        id={id}
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

export type PhoneNumberInputProps = {
  idPrefix?: string;
  phoneCountryCode: string;
  phoneNumber: string;
  onPhoneCountryCodeChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  disabled?: boolean;
  countryInvalid?: boolean;
  numberInvalid?: boolean;
};

export function PhoneNumberInput({
  idPrefix = "phone",
  phoneCountryCode,
  phoneNumber,
  onPhoneCountryCodeChange,
  onPhoneNumberChange,
  disabled = false,
  countryInvalid = false,
  numberInvalid = false,
}: PhoneNumberInputProps) {
  return (
    <div className="flex gap-2">
      <CountryCodeSelect
        id={`${idPrefix}-country-code`}
        value={phoneCountryCode}
        onChange={onPhoneCountryCodeChange}
        disabled={disabled}
        invalid={countryInvalid}
      />
      <Input
        id={`${idPrefix}-number`}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="300 1234567"
        value={phoneNumber}
        disabled={disabled}
        aria-invalid={numberInvalid}
        className="h-10 min-w-0 flex-1 rounded-xl"
        onChange={(event) => {
          onPhoneNumberChange(event.target.value.replace(/[^\d\s-]/g, ""));
        }}
      />
    </div>
  );
}
