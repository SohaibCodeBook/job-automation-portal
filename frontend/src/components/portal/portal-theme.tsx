"use client";

import * as React from "react";

/** Marks portal routes so portaled overlays can match portal dark tokens. */
export function PortalTheme({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.add("portal-route");
    return () => {
      root.classList.remove("portal-route");
    };
  }, []);

  return <>{children}</>;
}
