"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { FormFieldWrapper } from "./form-field-wrapper";

export type MultiSelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

type MultiSelectInputProps = {
  id: string;
  label: string;
  required?: boolean;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (nextValues: string[]) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
};

export function MultiSelectInput({
  id,
  label,
  required,
  options,
  selectedValues,
  onChange,
  placeholder = "Select options",
  description,
  error,
  disabled,
  className,
}: MultiSelectInputProps) {
  const selectedLabels = options
    .filter((option) => selectedValues.includes(option.value))
    .map((option) => option.label);

  return (
    <FormFieldWrapper
      label={label}
      htmlFor={id}
      required={required}
      description={description}
      error={error}
      className={className}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className="h-10 w-full justify-between"
          >
            <span className="truncate text-left">
              {selectedLabels.length > 0
                ? selectedLabels.join(", ")
                : placeholder}
            </span>
            <ChevronDown className="size-4 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width)">
          {options.map((option) => {
            const checked = selectedValues.includes(option.value);
            return (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={checked}
                disabled={option.disabled}
                onCheckedChange={(nextChecked) => {
                  if (nextChecked) {
                    onChange([...selectedValues, option.value]);
                    return;
                  }
                  onChange(selectedValues.filter((v) => v !== option.value));
                }}
              >
                <span className={cn(option.disabled && "opacity-50")}>
                  {option.label}
                </span>
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </FormFieldWrapper>
  );
}
