"use client";

import Link from "next/link";
import * as React from "react";

import { requestPasswordReset } from "@/lib/api/auth-client";
import { LoadingButton } from "@/components/forms/loading-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await requestPasswordReset(email.trim().toLowerCase());
      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>
          Enter your account email and we will send reset instructions if an
          account exists.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <p className="text-sm text-muted-foreground">
            If that email exists, a reset link has been sent.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <LoadingButton
              type="submit"
              className="w-full"
              loading={loading}
              loadingText="Sending…"
            >
              Send reset link
            </LoadingButton>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t pt-6">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
