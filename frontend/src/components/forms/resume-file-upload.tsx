"use client";

import * as React from "react";
import { FileUp, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ACCEPT = ".pdf,.doc,.docx,.rtf";
const ACCEPT_MIME_HINT = "PDF, Word (.doc, .docx), or RTF";

type ResumeFileUploadProps = {
  id?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string;
  description?: string;
  disabled?: boolean;
};

function isAllowedResumeFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".rtf")
  );
}

export function ResumeFileUpload({
  id = "resumeFile",
  file,
  onFileChange,
  error,
  description,
  disabled = false,
}: ResumeFileUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const picked = event.target.files?.[0] ?? null;
    setLocalError(null);
    if (!picked) {
      onFileChange(null);
      return;
    }
    if (!isAllowedResumeFile(picked)) {
      setLocalError(`Please choose a ${ACCEPT_MIME_HINT} file.`);
      onFileChange(null);
      event.target.value = "";
      return;
    }
    onFileChange(picked);
  }

  function clearFile() {
    setLocalError(null);
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const displayError = error ?? localError ?? undefined;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm leading-none font-medium select-none"
      >
        Upload resume
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={disabled}
        onChange={handleChange}
        aria-invalid={displayError ? true : undefined}
        aria-describedby={displayError ? `${id}-error` : `${id}-hint`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <FileUp className="size-4" aria-hidden />
          {file ? "Change file" : "Choose file"}
        </Button>
        {file ? (
          <>
            <span className="max-w-full truncate text-sm text-muted-foreground">
              {file.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              aria-label="Remove resume file"
              disabled={disabled}
              onClick={clearFile}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </>
        ) : null}
      </div>
      {description ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {displayError ? (
        <p id={`${id}-error`} className={cn("text-sm text-destructive")}>
          {displayError}
        </p>
      ) : null}
    </div>
  );
}
