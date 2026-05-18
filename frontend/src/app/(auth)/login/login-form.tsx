"use client";

import Link from "next/link";
import * as React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { registerAccount } from "@/lib/api/auth-client";
import { LoadingButton } from "@/components/forms/loading-button";
import { useMounted } from "@/hooks/use-mounted";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span className="bg-card px-2">{label}</span>
      </div>
    </div>
  );
}

function loginUrlError(searchParams: URLSearchParams): string | null {
  const err = searchParams.get("error");
  const code = searchParams.get("code");

  if (err === "CredentialsSignin") {
    if (code === "google_only") {
      return "This email uses Google sign-in. Use Sign in with Google instead.";
    }
    if (code === "unverified" || code === "email_not_verified") {
      return "Please verify your email before signing in.";
    }
    return "Invalid email or password. If you recently signed up, check your inbox to verify your email.";
  }

  if (searchParams.get("unverified") === "true") {
    return "Please verify your email before signing in.";
  }

  if (err === "no_account") {
    return "No account for this Google user. Use Create New Account first.";
  }
  if (err === "account_exists") {
    return "This Google account is already registered. Use Sign in with Google.";
  }
  if (err === "oauth_email") {
    return "Google did not return an email. Try another Google account.";
  }
  if (err === "oauth_create_failed") {
    return "Could not create the account. Please try again.";
  }
  if (err === "AccessDenied" || err === "Configuration") {
    return "Sign-in was cancelled or denied. Please try again.";
  }
  if (err) {
    return "Something went wrong. Please try again.";
  }
  return null;
}

function loginUrlBanner(searchParams: URLSearchParams): string | null {
  if (searchParams.get("verified") === "true") {
    return "Your email has been verified. You can sign in now.";
  }
  if (searchParams.get("reset") === "true") {
    return "Your password has been updated. Sign in with your new password.";
  }
  return null;
}

function useClientSearch(initialSearch: string): URLSearchParams {
  const mounted = useMounted();
  const liveSearch = React.useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      window.addEventListener("popstate", onStoreChange);
      return () => window.removeEventListener("popstate", onStoreChange);
    },
    () => window.location.search,
    () => initialSearch,
  );
  const searchString = mounted ? liveSearch : initialSearch;
  return React.useMemo(
    () => new URLSearchParams(searchString.replace(/^\?/, "")),
    [searchString],
  );
}

type LoginFormProps = {
  /** Serialized query from the server page, e.g. `?error=...&code=...` */
  initialSearch?: string;
};

export function LoginForm({ initialSearch = "" }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useClientSearch(initialSearch);
  const next = safeNextParam(searchParams.get("next"));

  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null,
  );
  const [loadingSignIn, setLoadingSignIn] = React.useState(false);
  const [loadingCreate, setLoadingCreate] = React.useState(false);
  const [loadingEmailSignIn, setLoadingEmailSignIn] = React.useState(false);
  const [loadingRegister, setLoadingRegister] = React.useState(false);
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [registerName, setRegisterName] = React.useState("");
  const [registerEmail, setRegisterEmail] = React.useState("");
  const [registerPassword, setRegisterPassword] = React.useState("");
  const [screen, setScreen] = React.useState<"signin" | "signup">("signin");

  const urlError = loginUrlError(searchParams);
  const urlBanner = loginUrlBanner(searchParams);
  const displayError = error ?? urlError;
  const displayBanner = successMessage ?? urlBanner;

  async function onSignInWithGoogle() {
    setError(null);
    setSuccessMessage(null);
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
    setSuccessMessage(null);
    setLoadingCreate(true);
    try {
      await setGoogleIntent("signup");
      await signIn("google", { callbackUrl: next });
    } catch {
      setError("Could not start account creation.");
      setLoadingCreate(false);
    }
  }

  async function onEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoadingEmailSignIn(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
        callbackUrl: next,
      });

      // NextAuth may return ok: true (HTTP 200) while error is set on failed credentials.
      const signInFailed = Boolean(res?.error) || res?.ok === false;
      if (signInFailed) {
        const code = res?.code;
        if (code === "google_only") {
          setError(
            "This email uses Google sign-in. Use Sign in with Google instead.",
          );
        } else if (code === "unverified" || code === "email_not_verified") {
          setError("Please verify your email before signing in.");
        } else {
          setError(
            "Invalid email or password. If you recently signed up, check your inbox to verify your email.",
          );
        }
        return;
      }

      router.push(res?.url ?? next);
      router.refresh();
    } catch {
      setError("Could not sign in.");
    } finally {
      setLoadingEmailSignIn(false);
    }
  }

  async function onCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoadingRegister(true);
    try {
      const result = await registerAccount({
        name: registerName.trim(),
        email: registerEmail.trim().toLowerCase(),
        password: registerPassword,
      });
      if (!result.ok) {
        setError(result.message);
        setLoadingRegister(false);
        return;
      }
      setSuccessMessage(result.message);
      setRegisterPassword("");
      setLoadingRegister(false);
    } catch {
      setError("Something went wrong.");
      setLoadingRegister(false);
    }
  }

  const screenError = screen === "signin" ? displayError : error;
  const signupSuccess = screen === "signup" ? successMessage : null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>
          {screen === "signin" ? "Sign in" : "Create New Account"}
        </CardTitle>
        <CardDescription>
          {screen === "signin"
            ? "Sign in with Google or email. New accounts must verify email before signing in."
            : "Create an account with Google or email. You must verify your email before signing in."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {screen === "signin" ? (
          <>
            {displayBanner ? (
              <p
                className="rounded-md border border-border bg-muted/50 px-3 py-2 text-center text-sm text-foreground"
                role="status"
              >
                {displayBanner}
              </p>
            ) : null}

            <LoadingButton
              type="button"
              variant="default"
              className="w-full"
              loading={loadingSignIn}
              loadingText="Redirecting…"
              onClick={() => void onSignInWithGoogle()}
            >
              <GoogleIcon className="size-4" />
              Continue with Google
            </LoadingButton>

            <SectionDivider label="OR EMAIL" />

            <form className="space-y-3" onSubmit={(e) => void onEmailSignIn(e)}>
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="login-password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>
            <LoadingButton
              type="submit"
              variant="secondary"
              className="w-full"
              loading={loadingEmailSignIn}
              loadingText="Signing in…"
            >
              Sign in with Email
            </LoadingButton>
          </form>

            {screenError ? (
              <p className="text-center text-sm text-destructive" role="alert">
                {screenError}
              </p>
            ) : null}

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => setScreen("signup")}
              >
                Join now
              </button>
            </p>
          </>
        ) : (
          <>
            {signupSuccess ? (
              <p
                className="rounded-md border border-border bg-muted/50 px-3 py-2 text-center text-sm text-foreground"
                role="status"
              >
                {signupSuccess}
              </p>
            ) : null}

            <LoadingButton
              type="button"
              variant="default"
              className="w-full"
              loading={loadingCreate}
              loadingText="Redirecting…"
              onClick={() => void onCreateNewAccount()}
            >
              <GoogleIcon className="size-4" />
              Continue with Google
            </LoadingButton>

            <SectionDivider label="OR EMAIL" />

            <form className="space-y-3" onSubmit={(e) => void onCreateAccount(e)}>
            <div className="space-y-2">
              <Label htmlFor="register-name">Name</Label>
              <Input
                id="register-name"
                type="text"
                autoComplete="name"
                required
                maxLength={120}
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-email">Email</Label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="register-password">Password</Label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters
              </p>
            </div>
            <LoadingButton
              type="submit"
              variant="outline"
              className="w-full"
              loading={loadingRegister}
              loadingText="Creating…"
            >
              Create account
            </LoadingButton>
          </form>

            {screenError ? (
              <p className="text-center text-sm text-destructive" role="alert">
                {screenError}
              </p>
            ) : null}

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-foreground underline-offset-4 hover:underline"
                onClick={() => setScreen("signin")}
              >
                Sign in
              </button>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
