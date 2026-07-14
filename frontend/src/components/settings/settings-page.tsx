"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import { PortalHeader } from "@/components/portal";
import { ChangePasswordSection } from "@/components/settings/change-password-section";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { getCurrentUser, type UserMe } from "@/lib/api/users";

export function SettingsPage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = React.useState<UserMe | null>(null);

  React.useEffect(() => {
    const token = session?.accessToken;
    if (!token || status !== "authenticated") return;

    let cancelled = false;
    void (async () => {
      const result = await getCurrentUser(token);
      if (cancelled || !result.ok) return;
      setProfile(result.user);
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.accessToken, status]);

  return (
    <div className="space-y-6">
      <PortalHeader
        title="Settings"
        subtitle="Manage your account and preferences."
      />

      <section
        className="portal-dashboard-panel"
        aria-labelledby="account-overview-heading"
      >
        <div className="portal-dashboard-panel-header">
          <div>
            <h2
              id="account-overview-heading"
              className="portal-dashboard-panel-title"
            >
              Account
            </h2>
            <p className="text-sm text-muted-foreground">
              Signed-in profile for this portal session.
            </p>
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Name
            </dt>
            <dd className="mt-1 text-sm text-foreground">
              {profile?.name ?? session?.user?.name ?? "—"}
            </dd>
          </div>
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
      </section>

      <ChangePasswordSection authProvider={profile?.auth_provider ?? null} />
      <DeleteAccountSection />
    </div>
  );
}
