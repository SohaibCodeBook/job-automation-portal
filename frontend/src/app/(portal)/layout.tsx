import { PortalShell } from "@/components/portal/portal-shell";
import { PortalTheme } from "@/components/portal/portal-theme";
import { JobFavoritesProvider } from "@/hooks/use-job-favorites";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalTheme>
      <JobFavoritesProvider>
        <PortalShell>{children}</PortalShell>
      </JobFavoritesProvider>
    </PortalTheme>
  );
}
