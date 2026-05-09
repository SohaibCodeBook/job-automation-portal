import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FormFieldWrapperProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  description?: string;
  error?: string;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
};

export function FormFieldWrapper({
  label,
  htmlFor,
  required,
  description,
  error,
  className,
  labelClassName,
  children,
}: FormFieldWrapperProps) {
  const descriptionId = React.useId();
  const errorId = React.useId();

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className={labelClassName}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {description ? (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
