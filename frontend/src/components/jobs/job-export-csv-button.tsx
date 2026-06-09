"use client";

import * as React from "react";
import { Download, Loader2 } from "lucide-react";

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
    <button
      type="button"
      className={cn("portal-export-csv-btn", className)}
      onClick={handleClick}
      disabled={disabled || exporting}
      aria-busy={exporting}
      aria-label="Export CSV"
    >
      {exporting ? (
        <Loader2
          className="portal-export-csv-icon size-[1.125rem] shrink-0 animate-spin"
          aria-hidden
        />
      ) : (
        <Download
          className="portal-export-csv-icon size-[1.125rem] shrink-0"
          aria-hidden
        />
      )}
      <span className="portal-export-csv-label">
        <span>Export</span>
        <span>CSV</span>
      </span>
    </button>
  );
}
