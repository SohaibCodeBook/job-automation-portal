"use client";

import * as React from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import { LoadingButton } from "@/components/forms/loading-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function safeNextParam(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

async function setGoogleIntent(intent: "signin" | "signup") {
  const res = await fetch("/api/auth/google-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ intent }),
  });
  if (!res.ok) {
    throw new Error("Could not start Google.");
  }
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = safeNextParam(searchParams.get("next"));

  const [error, setError] = React.useState<string | null>(null);
  const [loadingSignIn, setLoadingSignIn] = React.useState(false);
  const [loadingCreate, setLoadingCreate] = React.useState(false);

  React.useEffect(() => {
    const err = searchParams.get("error");
    if (err === "no_account") {
      setError(
        "No account for this Google user. Use Create New Account first.",
      );
    } else if (err === "account_exists") {
      setError(
        "This Google account is already registered. Use Sign in with Google.",
      );
    } else if (err === "oauth_email") {
      setError("Google did not return an email. Try another Google account.");
    } else if (err === "oauth_create_failed") {
      setError("Could not create the account. Please try again.");
    } else if (err === "AccessDenied" || err === "Configuration") {
      setError("Sign-in was cancelled or denied. Please try again.");
    } else if (err) {
      setError("Something went wrong. Please try again.");
    }
  }, [searchParams]);

  async function onSignInWithGoogle() {
    setError(null);
    setLoadingSignIn(true);
    try {
      await setGoogleIntent("signin");
      await signIn("google", { callbackUrl: next });
    } catch {
      setError("Could not start Google sign-in.");
      setLoadingSignIn(false);
    }
  }

  async function onCreateNewAccount() {
    setError(null);
    setLoadingCreate(true);
    try {
      await setGoogleIntent("signup");
      await signIn("google", { callbackUrl: next });
    } catch {
      setError("Could not start account creation.");
      setLoadingCreate(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Google only — sign in with an existing account or create one with the
          same Google OAuth flow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoadingButton
          type="button"
          variant="default"
          className="w-full"
          loading={loadingSignIn}
          loadingText="Redirecting…"
          onClick={() => void onSignInWithGoogle()}
        >
          <GoogleIcon className="size-4" />
          Sign in with Google
        </LoadingButton>
        <LoadingButton
          type="button"
          variant="outline"
          className="w-full"
          loading={loadingCreate}
          loadingText="Redirecting…"
          onClick={() => void onCreateNewAccount()}
        >
          <GoogleIcon className="size-4" />
          Create New Account
        </LoadingButton>
        {error ? (
          <p className="text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
