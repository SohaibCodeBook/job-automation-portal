import { Suspense } from "react";

import { ScrappedJobsPage } from "@/components/jobs/scrapped-jobs-page";
import { JobListSkeleton } from "@/components/jobs/job-list-skeleton";

export default function JobsPage() {
  return (
    <Suspense fallback={<JobListSkeleton />}>
      <ScrappedJobsPage />
    </Suspense>
  );
}
