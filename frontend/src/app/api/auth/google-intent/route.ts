import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  intent: z.enum(["signin", "signup"]),
});

const COOKIE = "google_oauth_intent";

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, parsed.data.intent, {
    httpOnly: true,
    path: "/",
    maxAge: 600,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}
