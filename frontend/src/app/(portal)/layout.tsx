import { PortalShell } from "@/components/portal/portal-shell";
import { PortalTheme } from "@/components/portal/portal-theme";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PortalTheme>
      <PortalShell>{children}</PortalShell>
    </PortalTheme>
  );
}
