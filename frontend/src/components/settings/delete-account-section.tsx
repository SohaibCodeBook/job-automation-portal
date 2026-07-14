"use client";

import * as React from "react";
import { signOut, useSession } from "next-auth/react";
import { AlertTriangle } from "lucide-react";

import { LoadingButton } from "@/components/forms/loading-button";
import { Input } from "@/components/ui/input";
import { deleteAccount } from "@/lib/api/users";

const CONFIRM_WORD = "DELETE";

export function DeleteAccountSection() {
  const { data: session } = useSession();
  const [confirmText, setConfirmText] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const canDelete =
    confirmText.trim().toUpperCase() === CONFIRM_WORD && !loading;

  async function onDelete() {
    const token = session?.accessToken;
    if (!token) {
      setError("You must be signed in to delete your account.");
      return;
    }
    if (!canDelete) return;

    setError(null);
    setLoading(true);
    try {
      const result = await deleteAccount(token);
      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }
      await signOut({ callbackUrl: "/login" });
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <section
      className="portal-dashboard-panel border-destructive/30"
      aria-labelledby="delete-account-heading"
    >
      <div className="portal-dashboard-panel-header">
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive"
            aria-hidden
          >
            <AlertTriangle className="size-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2
              id="delete-account-heading"
              className="portal-dashboard-panel-title"
            >
              Delete account
            </h2>
            <p className="text-sm text-muted-foreground">
              Permanently remove your JobPilot account. This cannot be undone.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          <li>Your profile and sign-in credentials are removed</li>
          <li>Favorites, applied marks, and private notes are deleted</li>
          <li>Uploaded resumes are deleted</li>
          <li>
            Scraped job listings are deleted
          </li>
        </ul>

        <div className="space-y-2">
          <label
            htmlFor="delete-account-confirm"
            className="text-sm font-medium text-foreground"
          >
            Type <span className="font-semibold tracking-wide">{CONFIRM_WORD}</span>{" "}
            to confirm
          </label>
          <Input
            id="delete-account-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder={CONFIRM_WORD}
            disabled={loading}
            aria-describedby={error ? "delete-account-error" : undefined}
          />
        </div>

        {error ? (
          <p
            id="delete-account-error"
            className="text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <LoadingButton
          type="button"
          variant="destructive"
          loading={loading}
          loadingText="Deleting…"
          disabled={!canDelete}
          onClick={() => void onDelete()}
        >
          Delete my account
        </LoadingButton>
      </div>
    </section>
  );
}
