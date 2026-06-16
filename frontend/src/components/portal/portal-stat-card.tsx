import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type PortalStatAccent = "blue" | "green" | "orange" | "purple";

type PortalStatCardProps = {
  label: string;
  value: string | number;
  footer?: React.ReactNode;
  icon: LucideIcon;
  accent: PortalStatAccent;
  href?: string;
  className?: string;
};

export function PortalStatCard({
  label,
  value,
  footer,
  icon: Icon,
  accent,
  href,
  className,
}: PortalStatCardProps) {
  const content = (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <Icon
          className="size-4 text-[var(--portal-accent)] opacity-90"
          strokeWidth={1.75}
          aria-hidden
        />
      </div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {footer ? (
        <div className="mt-1 text-xs text-muted-foreground">{footer}</div>
      ) : null}
    </>
  );

  const cardClass = cn(
    "portal-stat-card block text-left transition-colors",
    href && "portal-stat-card--link",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cardClass} data-accent={accent}>
        {content}
      </Link>
    );
  }

  return (
    <div className={cardClass} data-accent={accent}>
      {content}
    </div>
  );
}
