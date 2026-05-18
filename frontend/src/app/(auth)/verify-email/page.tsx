"use client";

import Link from "next/link";
import * as React from "react";
import { useSearchParams } from "next/navigation";

import { confirmEmailAddress } from "@/lib/api/auth-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = React.useState<"loading" | "success" | "error">(
    () => (token ? "loading" : "error"),
  );
  const [message, setMessage] = React.useState<string>(() =>
    token
      ? "Verifying your email…"
      : "Missing verification link. Use the link from your email.",
  );

  React.useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function confirm() {
      const verificationToken = token;
      if (!verificationToken) return;
      try {
        const result = await confirmEmailAddress(verificationToken);
        if (cancelled) return;

        if (!result.ok) {
          setStatus("error");
          setMessage(result.message);
          return;
        }

        setStatus("success");
        setMessage("Your email has been verified. You can sign in now.");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Something went wrong. Please try again.");
        }
      }
    }

    void confirm();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Verify email</CardTitle>
        <CardDescription>
          {status === "loading"
            ? "Please wait while we confirm your address."
            : status === "success"
              ? "Verification complete"
              : "Verification failed"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p
          className={
            status === "error"
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
          role={status === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <Link
          href={
            status === "success" ? "/login?verified=true" : "/login"
          }
          className="text-sm font-medium text-primary hover:underline"
        >
          {status === "success" ? "Continue to sign in" : "Back to sign in"}
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <React.Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      }
    >
      <VerifyEmailContent />
    </React.Suspense>
  );
}
