"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { PortalNavItem } from "@/constants/portal-nav";

type PortalSidebarLinkProps = {
  item: PortalNavItem;
  onComingSoon?: () => void;
};

export function PortalSidebarLink({ item, onComingSoon }: PortalSidebarLinkProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive =
    item.href != null &&
    (pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(`${item.href}/`)));

  const className = cn("portal-nav-link");
  const content = (
    <>
      <Icon className="size-4 shrink-0 opacity-90" strokeWidth={1.75} aria-hidden />
      <span className="truncate">{item.label}</span>
      {item.badge ? (
        <span className="portal-nav-badge" data-tone={item.badgeTone ?? "muted"}>
          {item.badge}
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
