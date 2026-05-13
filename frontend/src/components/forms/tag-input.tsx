"use client";

import * as React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FormFieldWrapper } from "./form-field-wrapper";

type TagInputProps = {
  id: string;
  label: string;
  required?: boolean;
  tags: string[];
  onTagsChange: (nextTags: string[]) => void;
  placeholder?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  maxTags?: number;
  className?: string;
  labelHint?: string;
};

export function TagInput({
  id,
  label,
  required,
  tags,
  onTagsChange,
  placeholder = "Type and press Enter",
  description,
  error,
  disabled,
  maxTags,
  className,
  labelHint,
}: TagInputProps) {
  const [value, setValue] = React.useState("");

  const addTag = React.useCallback(() => {
    const normalized = value.trim();
    if (!normalized || tags.includes(normalized)) return;
    if (maxTags && tags.length >= maxTags) return;
    onTagsChange([...tags, normalized]);
    setValue("");
  }, [maxTags, onTagsChange, tags, value]);

  const removeTag = React.useCallback(
    (tag: string) => onTagsChange(tags.filter((t) => t !== tag)),
    [onTagsChange, tags],
  );

  return (
    <FormFieldWrapper
      label={label}
      htmlFor={id}
      required={required}
      description={description}
      error={error}
      className={className}
      labelHint={labelHint}
    >
      <div className="space-y-2">
        <Input
          id={id}
          value={value}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
          onBlur={addTag}
        />
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs"
              >
                {tag}
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="size-4 rounded-full"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag}`}
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
