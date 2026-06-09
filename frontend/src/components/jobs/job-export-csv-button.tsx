"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type JobExportCsvButtonProps = {
  onExport: () => Promise<void>;
  disabled?: boolean;
  className?: string;
};

export function JobExportCsvButton({
  onExport,
  disabled,
  className,
}: JobExportCsvButtonProps) {
  const [exporting, setExporting] = React.useState(false);

  async function handleClick() {
    if (exporting || disabled) return;
    setExporting(true);
    try {
      await onExport();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to export CSV.";
      window.alert(message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("portal-export-csv-btn", className)}
      onClick={handleClick}
      disabled={disabled || exporting}
      aria-busy={exporting}
    >
      {exporting ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
      ) : (
        <Download className="size-3.5 shrink-0" aria-hidden />
      )}
      Export CSV
    </Button>
  );
}
