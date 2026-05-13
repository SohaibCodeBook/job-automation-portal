"use client";

import * as React from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

type ProvidersProps = {
  children: React.ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={350} skipDelayDuration={200}>
        {children}
      </TooltipProvider>
    </ThemeProvider>
  );
}
