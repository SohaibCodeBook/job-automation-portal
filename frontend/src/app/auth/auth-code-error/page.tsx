import Link from "next/link";

import { APP_CONFIG } from "@/constants/app";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign-in could not be completed</CardTitle>
          <CardDescription>
            The authorization link was missing, invalid, or expired. Try signing
            in again.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          If you were using Google, confirm that{" "}
          <span className="font-medium text-foreground">{APP_CONFIG.name}</span>{" "}
          is allowed in your Google account and that redirect URLs match your
          Supabase project settings.
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/login">Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
