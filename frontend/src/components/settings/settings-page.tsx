"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import { PortalHeader } from "@/components/portal";
import { AccountProfileSection } from "@/components/settings/account-profile-section";
import { AccountPhoneSection } from "@/components/settings/account-phone-section";
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

      <AccountProfileSection
        profile={profile}
        onProfileUpdated={setProfile}
      />
      <AccountPhoneSection
        profile={profile}
        onProfileUpdated={setProfile}
      />
      <ChangePasswordSection authProvider={profile?.auth_provider ?? null} />
      <DeleteAccountSection />
    </div>
  );
}
