"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type LocationSearchOption = {
  value: string;
  label: string;
  subLabel?: string;
  leading?: React.ReactNode;
};

type LocationSearchComboboxProps = {
  id: string;
  placeholder: string;
  options?: readonly LocationSearchOption[];
  /** When set, options are resolved from the current search query (for large lists). */
  resolveOptions?: (query: string) => readonly LocationSearchOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  emptyHint?: string;
  className?: string;
};

export function LocationSearchCombobox({
  id,
  placeholder,
  options = [],
  resolveOptions,
  value,
  onValueChange,
  disabled = false,
  emptyHint,
  className,
}: LocationSearchComboboxProps) {
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const portalDropdownRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();

  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [listBox, setListBox] = React.useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);

  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value) ?? null,
    [options, value],
  );

  const filtered = React.useMemo(() => {
    if (resolveOptions) {
      return resolveOptions(query);
    }
    const q = query.trim().toLowerCase();
    return options.filter((opt) => {
      if (!q) return true;
      return (
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [options, query, resolveOptions]);

  const displayValue = open ? query : (selectedOption?.label ?? "");

  React.useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (event: PointerEvent) => {
      const anchor = anchorRef.current;
      const portalEl = portalDropdownRef.current;
      const target = event.target as Node;
      if (anchor?.contains(target)) return;
      if (portalEl?.contains(target)) return;
      setOpen(false);
      setQuery("");
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [open]);

  const syncListPosition = React.useCallback(() => {
    const el = anchorRef.current;
    if (!el || typeof window === "undefined") {
      setListBox(null);
      return;
    }
    const r = el.getBoundingClientRect();
    const top = r.bottom + 4;
    const maxHeight = Math.max(120, Math.min(256, window.innerHeight - top - 12));
    setListBox({
      top,
      left: r.left,
      width: r.width,
      maxHeight,
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!open || disabled) {
      setListBox(null);
      return;
    }
    syncListPosition();
    const onScrollOrResize = () => syncListPosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, disabled, syncListPosition, query, filtered.length]);

  const onSelect = (next: string) => {
    onValueChange(next);
    setQuery("");
    setOpen(false);
  };

  const dropdownBody =
    open && !disabled ? (
      <>
        {resolveOptions && query.trim().length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">
            {emptyHint ?? "Type to search."}
          </p>
        ) : null}
        {filtered.map((opt) => (
          <button
            key={`${opt.value}-${opt.subLabel ?? ""}`}
            type="button"
            role="option"
            aria-selected={opt.value === value}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-accent"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSelect(opt.value)}
          >
            {opt.leading ? (
              <span className="shrink-0 text-base leading-none">{opt.leading}</span>
            ) : null}
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{opt.label}</span>
              {opt.subLabel ? (
                <span className="block truncate text-xs text-muted-foreground">
                  {opt.subLabel}
                </span>
              ) : null}
            </span>
          </button>
        ))}
        {query.trim().length > 0 && filtered.length === 0 ? (
          <p className="px-2 py-2 text-xs text-muted-foreground">No matches found.</p>
        ) : null}
      </>
    ) : null;

  const dropdownPortal =
    open && !disabled && listBox && typeof document !== "undefined" && dropdownBody
      ? createPortal(
          <div
            ref={portalDropdownRef}
            id={listboxId}
            role="listbox"
            style={{
              position: "fixed",
              top: listBox.top,
              left: listBox.left,
              width: listBox.width,
              maxHeight: listBox.maxHeight,
              zIndex: 10000,
            }}
            className="overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg ring-1 ring-foreground/10 [scrollbar-gutter:stable]"
          >
            {dropdownBody}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={anchorRef} className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <Input
        id={id}
        value={displayValue}
        disabled={disabled}
        aria-expanded={open}
        aria-controls={listboxId}
        aria-autocomplete="list"
        role="combobox"
        onChange={(event) => {
          setQuery(event.target.value);
          if (!disabled) setOpen(true);
        }}
        onFocus={() => {
          if (!disabled) {
            setQuery(selectedOption?.label ?? "");
            setOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter") {
            event.preventDefault();
            if (filtered[0]) onSelect(filtered[0].value);
          }
          if (event.key === "Escape") {
            setOpen(false);
            setQuery("");
          }
        }}
        className="h-10 pl-9 disabled:cursor-not-allowed disabled:opacity-60"
        placeholder={placeholder}
      />
      {dropdownPortal}
    </div>
  );
}
