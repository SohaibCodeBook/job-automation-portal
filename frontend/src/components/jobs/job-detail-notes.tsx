"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  removeJobListingNote,
  upsertJobListingNote,
} from "@/lib/api/job-listings";
import { formatListingCreatedAtAbsolute } from "@/lib/jobs-display";

type JobDetailNotesProps = {
  listingId: string;
  initialNote?: string | null;
  initialUpdatedAt?: string | null;
  onNoteUpdated?: (
    note: string | null,
    noteUpdatedAt: string | null,
  ) => void;
};

export function JobDetailNotes({
  listingId,
  initialNote = null,
  initialUpdatedAt = null,
  onNoteUpdated,
}: JobDetailNotesProps) {
  const { data: session } = useSession();
  const [draft, setDraft] = React.useState(initialNote ?? "");
  const [savedNote, setSavedNote] = React.useState(initialNote ?? "");
  const [savedAt, setSavedAt] = React.useState(initialUpdatedAt);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraft(initialNote ?? "");
    setSavedNote(initialNote ?? "");
    setSavedAt(initialUpdatedAt);
    setError(null);
  }, [listingId, initialNote, initialUpdatedAt]);

  const isDirty = draft.trim() !== savedNote.trim();

  async function handleSave() {
    const token = session?.accessToken;
    if (!token || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const result = await upsertJobListingNote(token, listingId, draft);
      const nextNote = result.note ?? "";
      setSavedNote(nextNote);
      setDraft(nextNote);
      setSavedAt(result.note_updated_at);
      onNoteUpdated?.(result.note, result.note_updated_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleClear() {
    const token = session?.accessToken;
    if (!token || isSaving) return;

    setIsSaving(true);
    setError(null);
    try {
      const result = await removeJobListingNote(token, listingId);
      setDraft("");
      setSavedNote("");
      setSavedAt(result.note_updated_at);
      onNoteUpdated?.(null, null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear note.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="job-detail-section job-detail-notes">
      <div className="job-detail-notes-head">
        <h3 className="job-detail-section-title">Notes</h3>
        {savedAt ? (
          <p className="job-detail-notes-meta">
            Updated {formatListingCreatedAtAbsolute(savedAt)}
          </p>
        ) : null}
      </div>
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Add a private note — referral contact, follow-up date, why you skipped it…"
        rows={4}
        maxLength={5000}
        className="job-detail-notes-input"
        disabled={isSaving}
      />
      <div className="job-detail-notes-actions">
        <Button
          type="button"
          size="sm"
          className="portal-btn-primary"
          disabled={!isDirty || isSaving}
          onClick={handleSave}
        >
          {isSaving ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Save note"
          )}
        </Button>
        {savedNote.trim() ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isSaving}
            onClick={handleClear}
          >
            Clear
          </Button>
        ) : null}
      </div>
      {error ? (
        <p className="job-detail-notes-error text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
