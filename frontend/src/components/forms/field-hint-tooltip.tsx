"use client";

import { Info } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type FieldHintTooltipProps = {
  content: string;
  /** Used for the trigger’s accessible name. */
  labelText: string;
  className?: string;
};

/**
 * Info icon beside a label — opens on hover (pointer fine) and tap / focus (mobile & keyboard).
 */
export function FieldHintTooltip({
  content,
  labelText,
  className,
}: FieldHintTooltipProps) {
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
            className,
          )}
          aria-label={`More information: ${labelText}`}
        >
          <Info className="size-3.5" strokeWidth={2} aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" align="start" className="max-w-sm text-pretty">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
