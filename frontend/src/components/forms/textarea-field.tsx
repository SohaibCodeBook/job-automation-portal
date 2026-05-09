import * as React from "react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { FormFieldWrapper } from "./form-field-wrapper";

type TextareaFieldProps = Omit<React.ComponentProps<typeof Textarea>, "id"> & {
  id: string;
  label: string;
  description?: string;
  error?: string;
  wrapperClassName?: string;
};

export function TextareaField({
  id,
  label,
  description,
  error,
  required,
  className,
  wrapperClassName,
  ...textareaProps
}: TextareaFieldProps) {
  return (
    <FormFieldWrapper
      label={label}
      htmlFor={id}
      description={description}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <Textarea
        id={id}
        required={required}
        aria-invalid={Boolean(error)}
        className={cn("min-h-24", className)}
        {...textareaProps}
      />
    </FormFieldWrapper>
  );
}
