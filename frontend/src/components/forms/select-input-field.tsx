"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { FormFieldWrapper } from "./form-field-wrapper";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectInputFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (nextValue: string) => void;
  options: SelectOption[];
  placeholder?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
};

export function SelectInputField({
  id,
  label,
  required,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  description,
  error,
  disabled,
  className,
}: SelectInputFieldProps) {
  return (
    <FormFieldWrapper
      label={label}
      htmlFor={id}
      required={required}
      description={description}
      error={error}
      className={className}
    >
      <Select
        value={value || undefined}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-10 w-full max-w-none min-w-0 rounded-xl bg-transparent px-3 py-2",
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  );
}
