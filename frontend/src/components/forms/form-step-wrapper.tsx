import * as React from "react";

import { FormSectionCard } from "@/components/forms/form-section-card";

type FormStepWrapperProps = {
  title: string;
  description: string;
  stepNumber: number;
  totalSteps: number;
  children: React.ReactNode;
  icon?: React.ReactNode;
};

export function FormStepWrapper({
  title,
  description,
  stepNumber,
  totalSteps,
  children,
  icon,
}: FormStepWrapperProps) {
  const progress = (stepNumber / totalSteps) * 100;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Step {stepNumber} of {totalSteps}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label="Form progress"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="transition-all duration-300 ease-out data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-right-2">
        <FormSectionCard
          title={title}
          description={description}
          sectionNumber={stepNumber}
          icon={icon}
        >
          {children}
        </FormSectionCard>
      </div>
    </div>
  );
}
