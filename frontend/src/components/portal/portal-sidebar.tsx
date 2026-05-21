"use client";

import * as React from "react";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { PortalSidebarLink } from "@/components/portal/portal-sidebar-link";
import { APP_CONFIG } from "@/constants/app";
import {
  PORTAL_NAV_ITEMS,
  PORTAL_NAV_SECTIONS,
  type PortalNavSectionId,
} from "@/constants/portal-nav";

export function PortalSidebar() {
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const itemsBySection = React.useMemo(() => {
    const map = new Map<PortalNavSectionId, typeof PORTAL_NAV_ITEMS>();
    for (const section of PORTAL_NAV_SECTIONS) {
      map.set(
        section.id,
        PORTAL_NAV_ITEMS.filter((item) => item.section === section.id),
      );
    }
    return map;
  }, []);

  return (
    <aside className="portal-sidebar">
      <div className="portal-sidebar-brand">
        <span className="portal-sidebar-brand-icon" aria-hidden>
          JP
        </span>
        <span className="bg-clip-text text-transparent [background-image:linear-gradient(to_right,var(--job-title-gradient-start),var(--job-title-gradient-end))]">
          {APP_CONFIG.name}
        </span>
      </div>

      <nav className="portal-sidebar-nav" aria-label="Portal">
        {PORTAL_NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            <p className="portal-sidebar-section-label">{section.label}</p>
            <ul className="flex flex-col gap-0.5">
              {itemsBySection.get(section.id)?.map((item) => (
                <li key={item.id}>
                  <PortalSidebarLink
                    item={item}
                    onComingSoon={() =>
                      setToast(`${item.label} is coming soon.`)
                    }
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {toast ? (
        <p
          className="mx-2 mb-1 rounded-md border border-border bg-card px-2 py-1.5 text-center text-xs text-muted-foreground"
          role="status"
        >
          {toast}
        </p>
      ) : null}

      <div className="portal-sidebar-footer">
        <div className="flex items-center justify-between gap-2 px-1">
          <ThemeToggle />
          <SignOutButton />
        </div>
        <p className="px-1 text-[0.65rem] text-muted-foreground">{APP_CONFIG.tagline}</p>
      </div>
    </aside>
  );
}
