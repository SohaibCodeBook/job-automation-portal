"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { UserRound } from "lucide-react";

import { LoadingButton } from "@/components/forms/loading-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile, type UserMe } from "@/lib/api/users";

type AccountProfileSectionProps = {
  profile: UserMe | null;
  onProfileUpdated: (user: UserMe) => void;
};

export function AccountProfileSection({
  profile,
  onProfileUpdated,
}: AccountProfileSectionProps) {
  const { data: session, update } = useSession();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (profile?.name) {
      setName(profile.name);
    } else if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [profile?.name, session?.user?.name]);

  const currentName = profile?.name ?? session?.user?.name ?? "";
  const trimmed = name.trim();
  const isDirty = trimmed.length > 0 && trimmed !== currentName.trim();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = session?.accessToken;
    if (!token) {
      setError("You must be signed in to update your name.");
      return;
    }
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    if (!isDirty) {
      setSuccess("Name is already up to date.");
      return;
    }

    setLoading(true);
    try {
      const result = await updateProfile(token, { name: trimmed });
      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }
      onProfileUpdated(result.user);
      setName(result.user.name);
      await update({ name: result.user.name });
      setSuccess("Name updated.");
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <section
      className="portal-dashboard-panel"
      aria-labelledby="account-overview-heading"
    >
      <div className="portal-dashboard-panel-header">
        <div className="flex items-start gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"
            aria-hidden
          >
            <UserRound className="size-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2
              id="account-overview-heading"
              className="portal-dashboard-panel-title"
            >
              Account
            </h2>
            <p className="text-sm text-muted-foreground">
              Your JobPilot account display name. This is not the first/last
              name from Job Specs.
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div className="space-y-2">
          <Label htmlFor="account-display-name">Display name</Label>
          <Input
            id="account-display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
            maxLength={120}
            disabled={loading || !profile}
            placeholder="Your name"
          />
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Email
            </dt>
            <dd className="mt-1 truncate text-sm text-foreground">
              {profile?.email ?? session?.user?.email ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Sign-in method
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {profile?.auth_provider === "google"
                ? "Google"
                : profile?.auth_provider === "credentials"
                  ? "Email & password"
                  : "—"}
            </dd>
          </div>
        </dl>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p
            className="text-sm text-emerald-600 dark:text-emerald-400"
            role="status"
          >
            {success}
          </p>
        ) : null}

        <LoadingButton
          type="submit"
          loading={loading}
          loadingText="Saving…"
          disabled={!profile || !isDirty}
        >
          Save name
        </LoadingButton>
      </form>
    </section>
  );
}
