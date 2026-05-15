"use client";

import * as React from "react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [loading, setLoading] = React.useState(false);

  async function onSignOut() {
    setLoading(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={() => void onSignOut()}
    >
      {loading ? "Signing out…" : "Sign out"}
    </Button>
  );
}
