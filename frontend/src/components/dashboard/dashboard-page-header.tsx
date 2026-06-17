import Link from "next/link";
import { Briefcase, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

type DashboardPageHeaderProps = {
  subtitle: string;
};

export function DashboardPageHeader({ subtitle }: DashboardPageHeaderProps) {
  return (
    <header className="portal-page-toolbar" aria-label="Dashboard">
      <div className="portal-page-toolbar-inner">
        <div className="min-w-0 space-y-0.5">
          <h1 className="portal-page-toolbar-title">Dashboard</h1>
          <p className="portal-page-toolbar-subtitle">{subtitle}</p>
        </div>

        <div className="portal-page-toolbar-actions">
          <Button
            variant="outline"
            size="sm"
            className="portal-page-toolbar-btn-outline h-8 gap-1.5 border-border px-3"
            asChild
          >
            <Link href={ROUTES.scrappedJobs}>
              <Briefcase className="size-3.5" aria-hidden />
              View Jobs
            </Link>
          </Button>
          <Button
            size="sm"
            className="portal-btn-primary h-8 gap-1.5 px-3"
            asChild
          >
            <Link href={ROUTES.jobSpecs}>
              <SlidersHorizontal className="size-3.5" aria-hidden />
              Edit Specs
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
