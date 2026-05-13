"use client";

import * as React from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
      labelHint={labelHint}
      descriptionClassName={
        checked && !disabled
          ? "text-primary/85 dark:text-primary/80"
          : undefined
      }
      className={cn(
        "rounded-lg border p-3 transition-[border-color,box-shadow,background-color] duration-200",
        checked && !disabled
          ? "border-2 border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20"
          : "border-border bg-card/80",
        disabled && "opacity-70",
        className,
      )}
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
