"use client";

import * as React from "react";

import { FieldHintTooltip } from "@/components/forms/field-hint-tooltip";
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
  /** Rich hint beside the label (info icon + tooltip / tap). */
  labelHint?: string;
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
  labelHint,
  children,
}: FormFieldWrapperProps) {
  const descriptionId = React.useId();
  const errorId = React.useId();
  const labelId = htmlFor ? `${htmlFor}-label` : undefined;

  const labelEl = (
    <Label
      id={labelId}
      htmlFor={htmlFor}
      className={cn(labelClassName, labelHint && "leading-none")}
    >
      {label}
      {required ? <span className="text-destructive"> *</span> : null}
    </Label>
  );

  return (
    <div className={cn("space-y-2", className)}>
      {labelHint ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {labelEl}
          <FieldHintTooltip content={labelHint} labelText={label} />
        </div>
      ) : (
        labelEl
      )}
      {children}
      {description ? (
        <p
          id={descriptionId}
          className="text-[0.8125rem] leading-relaxed text-muted-foreground"
        >
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
