"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import type { PortalNavItem } from "@/constants/portal-nav";

type PortalSidebarLinkProps = {
  item: PortalNavItem;
  onComingSoon?: () => void;
  badgeOverride?: string;
};

export function PortalSidebarLink({
  item,
  onComingSoon,
  badgeOverride,
}: PortalSidebarLinkProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const Icon = item.icon;
  const view = searchParams.get("view");
  const badge = badgeOverride ?? item.badge;

  const isActive =
    item.href != null &&
    (item.id === "dashboard"
      ? pathname === ROUTES.dashboard
      : item.id === "saved"
      ? pathname === "/jobs" && view === "favorites"
      : item.id === "applied"
        ? pathname === "/jobs" && view === "applied"
        : item.id === "archived"
          ? pathname === "/jobs" && view === "archived"
          : item.id === "scrapped-jobs"
            ? pathname === item.href &&
              view !== "favorites" &&
              view !== "applied" &&
              view !== "archived"
            : pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`)));

  const className = cn("portal-nav-link");
  const content = (
    <>
      <Icon className="size-4 shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
      <span className="truncate">{item.label}</span>
      {badge ? (
        <span className="portal-nav-badge" data-tone={item.badgeTone ?? "muted"}>
          {badge}
        </span>
      ) : null}
    </>
  );

  if (item.comingSoon || !item.href) {
    return (
      <button
        type="button"
        className={className}
        data-disabled="true"
        onClick={onComingSoon}
        title="Coming soon"
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      className={className}
      data-active={isActive ? "true" : undefined}
      aria-current={isActive ? "page" : undefined}
    >
      {content}
    </Link>
  );
}
