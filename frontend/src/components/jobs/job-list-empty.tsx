import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

type JobListEmptyProps = {
  filtered?: boolean;
};

export function JobListEmpty({ filtered = false }: JobListEmptyProps) {
  return (
    <div className="portal-empty-panel">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--portal-accent-muted)]">
        <Sparkles
          className="size-7 text-[var(--portal-accent)]"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      <h2 className="text-lg font-semibold">
        {filtered ? "No jobs match your search" : "No scrapped jobs yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {filtered
          ? "Try a different keyword or clear the search box."
          : "Complete Job Specs and run a scrape. Matching roles will appear here."}
      </p>
      {!filtered ? (
        <Button className="portal-btn-primary mt-6" asChild>
          <Link href={ROUTES.jobSpecs}>Set up Job Specs</Link>
        </Button>
      ) : null}
    </div>
  );
}
