"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-background/80 px-2 py-1.5 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <Sun
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <Switch
        checked={mounted ? isDark : false}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        disabled={!mounted}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      />
      <Moon
        className="size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}
