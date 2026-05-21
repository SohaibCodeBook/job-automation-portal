import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PortalHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export function PortalHeader({
  title,
  subtitle,
  actions,
  className,
}: PortalHeaderProps) {
  return (
    <header className={cn("portal-page-header", className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="portal-page-title">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
