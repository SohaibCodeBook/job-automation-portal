"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type FormCompletionProgressProps = {
  /** Per-section completion flags (same order as visible wizard steps). */
  completion: readonly boolean[];
  className?: string;
};

export function FormCompletionProgress({
  completion,
  className,
}: FormCompletionProgressProps) {
  const total = completion.length;
  const done = completion.filter(Boolean).length;
  const percent =
    total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100));

  const labelId = React.useId();

  return (
    <section
      aria-labelledby={labelId}
      className={cn(
        "rounded-xl border border-border bg-card/90 px-4 py-3.5 shadow-sm backdrop-blur-sm sm:px-5 sm:py-4",
        className,
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <p
          id={labelId}
          className="shrink-0 text-sm leading-snug text-muted-foreground"
        >
          <span className="font-semibold tabular-nums text-foreground">{done}</span>
          {" of "}
          <span className="tabular-nums">{total}</span>
          {" sections complete"}
        </p>

        <div className="min-w-0 flex-1">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={`${percent}% complete, ${done} of ${total} sections`}
          >
            <div
              className="h-full max-w-full rounded-full bg-primary motion-reduce:transition-none motion-safe:transition-[width] motion-safe:duration-500 motion-safe:ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <p
          className="shrink-0 text-right text-sm font-semibold tabular-nums text-primary sm:min-w-[3ch]"
          aria-hidden
        >
          {percent}%
        </p>
      </div>
    </section>
  );
}
