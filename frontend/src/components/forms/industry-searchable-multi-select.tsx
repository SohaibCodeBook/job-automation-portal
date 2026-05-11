"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PREDEFINED_INDUSTRIES } from "@/constants/predefined-industries";
import { cn } from "@/lib/utils";

import { FormFieldWrapper } from "./form-field-wrapper";

type IndustrySearchableMultiSelectProps = {
  id: string;
  label: string;
  required?: boolean;
  selectedValues: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
};

export function IndustrySearchableMultiSelect({
  id,
  label,
  required,
  selectedValues,
  onChange,
  placeholder = "Search industries…",
  description,
  error,
  disabled,
  className,
}: IndustrySearchableMultiSelectProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listId = React.useId();
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const selectedSet = React.useMemo(
    () => new Set(selectedValues),
    [selectedValues],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return PREDEFINED_INDUSTRIES.filter((name) => !selectedSet.has(name));
    }
    return PREDEFINED_INDUSTRIES.filter(
      (name) =>
        !selectedSet.has(name) && name.toLowerCase().includes(q),
    );
  }, [query, selectedSet]);

  React.useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || root.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onDocPointerDown, true);
  }, [open]);

  const addIndustry = (name: string) => {
    if (selectedSet.has(name)) return;
    onChange([...selectedValues, name]);
    setQuery("");
  };

  const removeIndustry = (name: string) => {
    onChange(selectedValues.filter((v) => v !== name));
  };

  return (
    <FormFieldWrapper
      label={label}
      htmlFor={id}
      required={required}
      description={description}
      error={error}
      className={className}
    >
      <div ref={rootRef} className="space-y-2">
        <div className="relative">
          <Input
            id={id}
            type="search"
            autoComplete="off"
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            role="combobox"
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              }
            }}
          />
          {open && !disabled ? (
            <ul
              id={listId}
              role="listbox"
              className={cn(
                "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
              )}
            >
              {filtered.length === 0 ? (
                <li className="px-2 py-2 text-sm text-muted-foreground">
                  {query.trim()
                    ? "No matching industries."
                    : "All listed industries are selected."}
                </li>
              ) : (
                filtered.map((name) => (
                  <li key={name} role="presentation" className="list-none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      className={cn(
                        "flex w-full rounded-sm px-2 py-1.5 text-left text-sm",
                        "hover:bg-accent hover:text-accent-foreground",
                        "focus-visible:bg-accent focus-visible:outline-none",
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addIndustry(name)}
                    >
                      {name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>

        {selectedValues.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((name) => (
              <span
                key={name}
                className="inline-flex max-w-full items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
              >
                <span className="truncate" title={name}>
                  {name}
                </span>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="size-4 shrink-0 rounded-full"
                  onClick={() => removeIndustry(name)}
                  aria-label={`Remove ${name}`}
                  disabled={disabled}
                >
                  <X className="size-3" />
                </Button>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </FormFieldWrapper>
  );
}
