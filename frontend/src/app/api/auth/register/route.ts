import { NextResponse } from "next/server";
import { z } from "zod";

import { insertEmailPasswordUser } from "@/lib/auth/email-password-users";
import { sendEmailVerificationMessage } from "@/lib/email/verification-mail";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid registration data." },
        { status: 400 },
      );
    }
    body = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  let result: Awaited<ReturnType<typeof insertEmailPasswordUser>>;
  try {
    result = await insertEmailPasswordUser({
      name: body.name,
      email: body.email,
      password: body.password,
    });
  } catch (err) {
    console.error("[register] account creation failed:", err);
    return NextResponse.json(
      { error: "Could not create account. Please try again." },
      { status: 500 },
    );
  }

  if (!result.ok) {
    return NextResponse.json(
      {
        error:
          "An account with this email already exists. Try signing in with Google or email.",
      },
      { status: 409 },
    );
  }

  try {
    await sendEmailVerificationMessage(body.email);
  } catch (err) {
    console.error(
      "[register] verification email failed:",
      err,
      err instanceof Error ? err.stack : undefined,
    );
    return NextResponse.json(
      { error: errorMessage(err) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Check your inbox to verify your email before signing in.",
  });
}
