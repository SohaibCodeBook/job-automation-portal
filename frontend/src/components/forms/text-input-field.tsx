import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { FormFieldWrapper } from "./form-field-wrapper";

type TextInputFieldProps = Omit<React.ComponentProps<typeof Input>, "id"> & {
  id: string;
  label: string;
  description?: string;
  error?: string;
  wrapperClassName?: string;
};

export function TextInputField({
  id,
  label,
  description,
  error,
  required,
  className,
  wrapperClassName,
  ...inputProps
}: TextInputFieldProps) {
  return (
    <FormFieldWrapper
      label={label}
      htmlFor={id}
      description={description}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <Input
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn(className)}
        {...inputProps}
      />
    </FormFieldWrapper>
  );
}
