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

/** Must match `size-4` thumb styling below (native thumbs use this travel inset). */
const THUMB_PX = 16;

const TRACK_RANGE = PAY_RANGE_TRACK_MAX - PAY_RANGE_TRACK_MIN;

function snapToStep(raw: number) {
  const stepped =
    PAY_RANGE_TRACK_MIN +
    Math.round((raw - PAY_RANGE_TRACK_MIN) / PAY_RANGE_STEP) * PAY_RANGE_STEP;
  return Math.max(PAY_RANGE_TRACK_MIN, Math.min(PAY_RANGE_TRACK_MAX, stepped));
}

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
  /** Which range input is on top — both spans are identical so only z-order separates hits. */
  const [topSlider, setTopSlider] = React.useState<"min" | "max">("min");
  const [trackPx, setTrackPx] = React.useState(0);

  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const low = Math.max(PAY_RANGE_TRACK_MIN, Math.min(safeMin, PAY_RANGE_TRACK_MAX));
  const high = Math.max(PAY_RANGE_TRACK_MIN, Math.min(safeMax, PAY_RANGE_TRACK_MAX));
  const lo = Math.min(low, high);
  const hi = Math.max(low, high);

  React.useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setTrackPx(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

  /** Thumb-center X along the track (same model as full-span range inputs). */
  const thumbCenterX = (value: number, width = trackPx) => {
    if (width <= THUMB_PX) return THUMB_PX / 2;
    const usable = width - THUMB_PX;
    return (
      THUMB_PX / 2 + ((value - PAY_RANGE_TRACK_MIN) / TRACK_RANGE) * usable
    );
  };

  const leftCx = thumbCenterX(lo);
  const rightCx = thumbCenterX(hi);
  const fillLeftPx = leftCx;
  const fillWidthPx = Math.max(0, rightCx - leftCx);

  const valueFromPointerClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el) return PAY_RANGE_TRACK_MIN;
    const w = el.clientWidth;
    if (w <= THUMB_PX) return PAY_RANGE_TRACK_MIN;
    const rect = el.getBoundingClientRect();
    const usable = w - THUMB_PX;
    const t = (clientX - rect.left - THUMB_PX / 2) / usable;
    const ratio = Math.max(0, Math.min(1, t));
    const raw = PAY_RANGE_TRACK_MIN + ratio * TRACK_RANGE;
    return snapToStep(raw);
  };

  /** Clicks on the bar (thumbs stop propagation; tracks are non-interactive). */
  const handleTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el || disabled) return;
    const w = el.clientWidth;
    if (w <= 0) return;
    const snapped = valueFromPointerClientX(event.clientX);

    const rect = el.getBoundingClientRect();
    const clickRatio = w > 0 ? Math.max(0, Math.min(1, (event.clientX - rect.left) / w)) : 0;
    const loRatio = w > 0 ? thumbCenterX(lo, w) / w : 0;
    const hiRatio = w > 0 ? thumbCenterX(hi, w) / w : 1;
    const distLo = Math.abs(clickRatio - loRatio);
    const distHi = Math.abs(clickRatio - hiRatio);

    if (distLo <= distHi) {
      setTopSlider("min");
      setLow(snapped);
    } else {
      setTopSlider("max");
      setHigh(snapped);
    }
  };

  const minZ = topSlider === "min" ? 30 : 12;
  const maxZ = topSlider === "max" ? 30 : 12;

  const trackThumbClasses =
    "pointer-events-none absolute top-1/2 left-0 w-full -translate-y-1/2 appearance-none bg-transparent touch-manipulation " +
    "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-primary [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm " +
    "[&::-webkit-slider-runnable-track]:pointer-events-none [&::-webkit-slider-container]:pointer-events-none " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-primary [&::-moz-range-thumb]:bg-primary " +
    "[&::-moz-range-track]:pointer-events-none";

  const attachPointerCapture = (e: React.PointerEvent<HTMLInputElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* Safari may throw for unsupported edge cases */
    }
  };

  return (
    <div className={cn("space-y-3 pt-1", className)}>
      <div className="relative flex h-10 items-center justify-between px-0.5 text-xs font-medium text-primary">
        <span className="tabular-nums">{formatCompactSalary(lo, currencyCode)}</span>
        <span className="tabular-nums">{formatCompactSalary(hi, currencyCode)}</span>
      </div>
      <div
        ref={trackRef}
        className="relative h-9 w-full"
        onPointerDown={handleTrackPointerDown}
      >
        <div className="pointer-events-none absolute top-1/2 right-0 left-0 h-1.5 -translate-y-1/2 rounded-full bg-muted" />
        <div
          className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary/70"
          style={{
            left: `${fillLeftPx}px`,
            width: `${fillWidthPx}px`,
          }}
        />
        <input
          id={`${id}-min`}
          type="range"
          min={PAY_RANGE_TRACK_MIN}
          max={PAY_RANGE_TRACK_MAX}
          step={PAY_RANGE_STEP}
          value={lo}
          disabled={disabled}
          onChange={(e) => setLow(Number(e.target.value))}
          onPointerDown={(e) => {
            e.stopPropagation();
            setTopSlider("min");
            attachPointerCapture(e);
          }}
          className={cn(trackThumbClasses)}
          style={{ zIndex: minZ }}
          aria-label="Minimum salary"
        />
        <input
          id={`${id}-max`}
          type="range"
          min={PAY_RANGE_TRACK_MIN}
          max={PAY_RANGE_TRACK_MAX}
          step={PAY_RANGE_STEP}
          value={hi}
          disabled={disabled}
          onChange={(e) => setHigh(Number(e.target.value))}
          onPointerDown={(e) => {
            e.stopPropagation();
            setTopSlider("max");
            attachPointerCapture(e);
          }}
          className={cn(trackThumbClasses)}
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
