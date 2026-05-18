import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { updateAuthUserPasswordHash } from "@/lib/email/auth-email-repository";
import { verifyPasswordResetToken } from "@/lib/email/tokens";

export const runtime = "nodejs";

const bodySchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  let token: string;
  let password: string;
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    ({ token, password } = parsed.data);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const { email } = await verifyPasswordResetToken(token);
    const hash = await bcrypt.hash(password, 12);
    const updated = await updateAuthUserPasswordHash(email, hash);
    if (!updated) {
      return NextResponse.json(
        { error: "This reset link is no longer valid." },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired reset link." },
      { status: 400 },
    );
  }
}
