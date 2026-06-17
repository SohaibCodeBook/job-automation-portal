import Link from "next/link";
import { Briefcase, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

export function JobSpecsPageHeader() {
  return (
    <header className="portal-page-toolbar" aria-label="Job Specs">
      <div className="portal-page-toolbar-inner">
        <div className="min-w-0 space-y-0.5">
          <h1 className="portal-page-toolbar-title">Job Specs</h1>
          <p className="portal-page-toolbar-subtitle">
            Define preferences for AI job matching and scraping
          </p>
        </div>

        <div className="portal-page-toolbar-actions">
          <Button
            variant="outline"
            size="sm"
            className="portal-page-toolbar-btn-outline h-8 gap-1.5 border-border px-3"
            asChild
          >
            <Link href={ROUTES.dashboard}>
              <LayoutDashboard className="size-3.5" aria-hidden />
              Dashboard
            </Link>
          </Button>
          <Button
            size="sm"
            className="portal-btn-primary h-8 gap-1.5 px-3"
            asChild
          >
            <Link href={ROUTES.scrappedJobs}>
              <Briefcase className="size-3.5" aria-hidden />
              View Jobs
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
