import Link from "next/link";
import { RefreshCw, SlidersHorizontal } from "lucide-react";

import { JobExportCsvButton } from "@/components/jobs/job-export-csv-button";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

type ScrappedJobsPageHeaderProps = {
  subtitle: string;
  onExportCsv: () => Promise<void>;
  exportDisabled?: boolean;
};

export function ScrappedJobsPageHeader({
  subtitle,
  onExportCsv,
  exportDisabled,
}: ScrappedJobsPageHeaderProps) {
  return (
    <header className="portal-page-toolbar" aria-label="Discovered Jobs">
      <div className="portal-page-toolbar-inner">
        <div className="min-w-0 space-y-0.5">
          <h1 className="portal-page-toolbar-title">Discovered Jobs</h1>
          <p className="portal-page-toolbar-subtitle">{subtitle}</p>
        </div>

        <div className="portal-page-toolbar-actions">
          <JobExportCsvButton
            onExport={onExportCsv}
            disabled={exportDisabled}
          />
          <Button
            variant="outline"
            size="sm"
            className="portal-page-toolbar-btn-outline h-8 gap-1.5 border-border px-3"
            asChild
          >
            <Link href={ROUTES.jobSpecs}>
              <SlidersHorizontal className="size-3.5" aria-hidden />
              Edit Specs
            </Link>
          </Button>
          <Button
            size="sm"
            disabled
            className="portal-btn-primary h-8 gap-1.5 px-3"
          >
            <RefreshCw className="size-3.5" aria-hidden />
            Re-Scrape
          </Button>
        </div>
      </div>
    </header>
  );
}
