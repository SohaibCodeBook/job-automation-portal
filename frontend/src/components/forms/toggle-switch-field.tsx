"use client";

import * as React from "react";

import { Switch } from "@/components/ui/switch";

import { FormFieldWrapper } from "./form-field-wrapper";

type ToggleSwitchFieldProps = {
  id: string;
  label: string;
  description?: string;
  error?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  labelHint?: string;
};

export function ToggleSwitchField({
  id,
  label,
  description,
  error,
  checked,
  onCheckedChange,
  disabled,
  className,
  labelHint,
}: ToggleSwitchFieldProps) {
  return (
    <FormFieldWrapper
      label={label}
      htmlFor={id}
      description={description}
      error={error}
      className={className}
      labelHint={labelHint}
    >
      <div className="flex min-h-10 items-center">
        <Switch
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
        />
      </div>
    </FormFieldWrapper>
  );
}
