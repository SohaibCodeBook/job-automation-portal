import type { ReactNode } from "react";
import { Suspense } from "react";

import { PortalSidebar } from "@/components/portal/portal-sidebar";

type PortalShellProps = {
  children: ReactNode;
};

export function PortalShell({ children }: PortalShellProps) {
  return (
    <div className="portal-shell">
      <Suspense fallback={<aside className="portal-sidebar" aria-hidden />}>
        <PortalSidebar />
      </Suspense>
      <div className="portal-main">
        <div className="portal-main-inner">{children}</div>
      </div>
    </div>
  );
}
