"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { KeyRound, ShieldCheck } from "lucide-react";

import { LoadingButton } from "@/components/forms/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword, type UserMe } from "@/lib/api/users";

type ChangePasswordSectionProps = {
  authProvider: UserMe["auth_provider"] | null;
};

export function ChangePasswordSection({
  authProvider,
}: ChangePasswordSectionProps) {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  if (authProvider === null) {
    return (
      <section
        className="portal-dashboard-panel"
        aria-labelledby="security-heading"
      >
        <div className="portal-dashboard-panel-header">
          <div>
            <h2 id="security-heading" className="portal-dashboard-panel-title">
              Security
            </h2>
            <p className="text-sm text-muted-foreground">Loading…</p>
          </div>
        </div>
      </section>
    );
  }

  if (authProvider === "google") {
    return (
      <section
        className="portal-dashboard-panel"
        aria-labelledby="security-heading"
      >
        <div className="portal-dashboard-panel-header">
          <div className="flex items-start gap-3">
            <div
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
              aria-hidden
            >
              <ShieldCheck className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <h2 id="security-heading" className="portal-dashboard-panel-title">
                Security
              </h2>
              <p className="text-sm text-muted-foreground">
                You sign in with Google. Password changes are managed in your
                Google account.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = session?.accessToken;
    if (!token) {
      setError("You must be signed in to change your password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword(token, {
        currentPassword,
        newPassword,
      });
      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }
      setSuccess(result.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <section
      className="portal-dashboard-panel"
      aria-labelledby="security-heading"
    >
      <div className="portal-dashboard-panel-header">
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
            aria-hidden
          >
            <KeyRound className="size-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 id="security-heading" className="portal-dashboard-panel-title">
              Change password
            </h2>
            <p className="text-sm text-muted-foreground">
              Update the password you use to sign in with email.
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div className="space-y-2">
          <Label htmlFor="current-password">Current password</Label>
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input
            id="new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm new password</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
            {success}
          </p>
        ) : null}

        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Updating…"
        >
          Update password
        </LoadingButton>
      </form>
    </section>
  );
}
