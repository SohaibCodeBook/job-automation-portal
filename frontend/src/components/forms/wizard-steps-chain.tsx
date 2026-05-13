"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type WizardChainStep = {
  id: string;
  label: string;
};

type WizardStepsChainProps = {
  steps: readonly WizardChainStep[];
  /** Same length as `steps` — derived from form values. */
  completion: readonly boolean[];
  /** Index in `steps` that receives primary highlight. */
  activeIndex: number;
  className?: string;
};

export function WizardStepsChain({
  steps,
  completion,
  activeIndex,
  className,
}: WizardStepsChainProps) {
  const scrollToSection = React.useCallback((stepId: string) => {
    document
      .getElementById(`section-${stepId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <nav
      aria-label="Form sections"
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-0 gap-y-2 sm:gap-y-3",
        className,
      )}
    >
      <ol className="flex flex-wrap items-center justify-center gap-y-2">
        {steps.map((step, i) => {
          const isActive = i === activeIndex;
          const isDone = completion[i] === true;
          const num = String(i + 1).padStart(2, "0");

          return (
            <li key={step.id} className="flex items-center">
              {i > 0 ? (
                <span
                  className="mx-1 hidden h-px w-5 bg-border sm:mx-2 sm:block sm:w-8"
                  aria-hidden
                />
              ) : null}
              <button
                type="button"
                onClick={() => scrollToSection(step.id)}
                className={cn(
                  "flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-[11px] font-semibold tracking-wide uppercase transition-colors sm:text-xs",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground shadow-sm",
                  !isActive &&
                    isDone &&
                    "border-primary/40 bg-primary/10 text-foreground hover:bg-primary/15",
                  !isActive &&
                    !isDone &&
                    "border-border bg-card text-muted-foreground hover:bg-muted/60",
                )}
              >
                <span className="tabular-nums">{num}</span>
                <span className="max-w-[9rem] truncate sm:max-w-none">
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
