import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

type JobListEmptyProps = {
  filtered?: boolean;
  favoritesView?: boolean;
};

export function JobListEmpty({
  filtered = false,
  favoritesView = false,
}: JobListEmptyProps) {
  const title = favoritesView
    ? "No favorites yet"
    : filtered
      ? "No jobs match your search"
      : "No scrapped jobs yet";

  const description = favoritesView
    ? "Tap the heart on any job card to save it here and apply when you're ready."
    : filtered
      ? "Try a different keyword or clear the search box."
      : "Complete Job Specs and run a scrape. Matching roles will appear here.";

  return (
    <div className="portal-empty-panel">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-[var(--portal-accent-muted)]">
        <Sparkles
          className="size-7 text-[var(--portal-accent)]"
          strokeWidth={1.5}
          aria-hidden
        />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {!filtered && !favoritesView ? (
        <Button className="portal-btn-primary mt-6" asChild>
          <Link href={ROUTES.jobSpecs}>Set up Job Specs</Link>
        </Button>
      ) : null}
    </div>
  );
}
