import { NextResponse } from "next/server";
import { z } from "zod";

import { findAuthUserEmailRow } from "@/lib/email/auth-email-repository";
import { sendPasswordResetEmail } from "@/lib/email/password-reset-mail";

export const runtime = "nodejs";

const bodySchema = z.object({
  email: z.string().email(),
});

/** Always returns ok to avoid account enumeration. Sends mail only when user exists. */
export async function POST(request: Request) {
  let email: string;
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: true });
    }
    email = parsed.data.email.trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: true });
  }

  try {
    const row = await findAuthUserEmailRow(email);
    if (row) {
      await sendPasswordResetEmail(email);
    }
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json(
      { error: "Could not send reset email. Try again later." },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
