import { PortalShell } from "@/components/portal/portal-shell";
import { PortalTheme } from "@/components/portal/portal-theme";
import { JobAppliedProvider } from "@/hooks/use-job-applied";
import { JobArchivedProvider } from "@/hooks/use-job-archived";
import { JobFavoritesProvider } from "@/hooks/use-job-favorites";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalTheme>
      <JobFavoritesProvider>
        <JobAppliedProvider>
          <JobArchivedProvider>
            <PortalShell>{children}</PortalShell>
          </JobArchivedProvider>
        </JobAppliedProvider>
      </JobFavoritesProvider>
    </PortalTheme>
  );
}
