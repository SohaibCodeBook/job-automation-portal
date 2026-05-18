import { NextResponse } from "next/server";
import { z } from "zod";

import { confirmAuthUserEmail } from "@/lib/email/auth-email-repository";
import { verifyEmailVerificationToken } from "@/lib/email/tokens";

export const runtime = "nodejs";

const bodySchema = z.object({
  token: z.string().min(20),
});

export async function POST(request: Request) {
  let token: string;
  try {
    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    ({ token } = parsed.data);
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const { email } = await verifyEmailVerificationToken(token);
    const ok = await confirmAuthUserEmail(email);
    if (!ok) {
      return NextResponse.json(
        { error: "No account found for this verification link." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired verification link." },
      { status: 400 },
    );
  }
}
