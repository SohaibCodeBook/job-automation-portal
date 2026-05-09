"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

import {
  PAY_RANGE_STEP,
  PAY_RANGE_TRACK_MAX,
  PAY_RANGE_TRACK_MIN,
  formatCompactSalary,
} from "@/constants/regions";

type PayRangeDualSliderProps = {
  id: string;
  currencyCode: string;
  min: number;
  max: number;
  onChange: (next: { min: number; max: number }) => void;
  disabled?: boolean;
  className?: string;
};

export function PayRangeDualSlider({
  id,
  currencyCode,
  min,
  max,
  onChange,
  disabled,
  className,
}: PayRangeDualSliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  /** Which range input is on top — required so both thumbs receive drags (full-width overlap). */
  const [topSlider, setTopSlider] = React.useState<"min" | "max">("min");

  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const low = Math.max(PAY_RANGE_TRACK_MIN, Math.min(safeMin, PAY_RANGE_TRACK_MAX));
  const high = Math.max(PAY_RANGE_TRACK_MIN, Math.min(safeMax, PAY_RANGE_TRACK_MAX));
  const lo = Math.min(low, high);
  const hi = Math.max(low, high);

  const setLow = (v: number) => {
    const nextLow = Math.min(v, hi - PAY_RANGE_STEP);
    const clamped = Math.max(PAY_RANGE_TRACK_MIN, nextLow);
    onChange({ min: clamped, max: hi });
  };

  const setHigh = (v: number) => {
    const nextHigh = Math.max(v, lo + PAY_RANGE_STEP);
    const clamped = Math.min(PAY_RANGE_TRACK_MAX, nextHigh);
    onChange({ min: lo, max: clamped });
  };

  const pct = (v: number) =>
    ((v - PAY_RANGE_TRACK_MIN) / (PAY_RANGE_TRACK_MAX - PAY_RANGE_TRACK_MIN)) * 100;
  const fillLeft = pct(lo);
  const fillRight = pct(hi);

  const snapToStep = (raw: number) => {
    const stepped =
      PAY_RANGE_TRACK_MIN +
      Math.round((raw - PAY_RANGE_TRACK_MIN) / PAY_RANGE_STEP) * PAY_RANGE_STEP;
    return Math.max(PAY_RANGE_TRACK_MIN, Math.min(PAY_RANGE_TRACK_MAX, stepped));
  };

  /** Clicks on the bar (not on thumbs — inputs use pointer-events-none + thumbs auto). */
  const handleTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || disabled) return;
    const rect = el.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const raw =
      PAY_RANGE_TRACK_MIN + clickX * (PAY_RANGE_TRACK_MAX - PAY_RANGE_TRACK_MIN);
    const snapped = snapToStep(raw);

    const loX = pct(lo) / 100;
    const hiX = pct(hi) / 100;
    const distLo = Math.abs(clickX - loX);
    const distHi = Math.abs(clickX - hiX);

    if (distLo <= distHi) {
      setTopSlider("min");
      setLow(snapped);
    } else {
      setTopSlider("max");
      setHigh(snapped);
    }
  };

  const minZ = topSlider === "min" ? 5 : 3;
  const maxZ = topSlider === "max" ? 5 : 3;

  return (
    <div className={cn("space-y-3 pt-1", className)}>
      <div className="relative flex h-10 items-center justify-between px-0.5 text-xs font-medium text-primary">
        <span className="tabular-nums">{formatCompactSalary(lo, currencyCode)}</span>
        <span className="tabular-nums">{formatCompactSalary(hi, currencyCode)}</span>
      </div>
      <div
        ref={trackRef}
        className="relative h-9 w-full px-1"
        onPointerDown={handleTrackPointerDown}
      >
        <div className="pointer-events-none absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary/70"
          style={{
            left: `${fillLeft}%`,
            width: `${Math.max(0, fillRight - fillLeft)}%`,
          }}
        />
        <input
          id={`${id}-min`}
          type="range"
          min={PAY_RANGE_TRACK_MIN}
          max={Math.min(hi - PAY_RANGE_STEP, PAY_RANGE_TRACK_MAX)}
          step={PAY_RANGE_STEP}
          value={lo}
          disabled={disabled}
          onChange={(e) => setLow(Number(e.target.value))}
          onPointerDown={(e) => {
            e.stopPropagation();
            setTopSlider("min");
          }}
          className={cn(
            "pointer-events-none absolute top-1/2 left-0 w-full -translate-y-1/2 appearance-none bg-transparent",
            "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm",
            "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-primary",
          )}
          style={{ zIndex: minZ }}
          aria-label="Minimum salary"
        />
        <input
          id={`${id}-max`}
          type="range"
          min={Math.max(lo + PAY_RANGE_STEP, PAY_RANGE_TRACK_MIN)}
          max={PAY_RANGE_TRACK_MAX}
          step={PAY_RANGE_STEP}
          value={hi}
          disabled={disabled}
          onChange={(e) => setHigh(Number(e.target.value))}
          onPointerDown={(e) => {
            e.stopPropagation();
            setTopSlider("max");
          }}
          className={cn(
            "pointer-events-none absolute top-1/2 left-0 w-full -translate-y-1/2 appearance-none bg-transparent",
            "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm",
            "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-primary",
          )}
          style={{ zIndex: maxZ }}
          aria-label="Maximum salary"
        />
      </div>
      <div className="flex justify-between px-0.5 text-[11px] text-muted-foreground">
        <span>Min salary</span>
        <span>Max salary</span>
      </div>
    </div>
  );
}
