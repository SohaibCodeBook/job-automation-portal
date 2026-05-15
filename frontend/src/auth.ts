import { cookies } from "next/headers";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import {
  findAuthUserByEmail,
  insertGoogleAuthUser,
  type GoogleOAuthProfile,
} from "@/lib/auth/google-users";

const INTENT_COOKIE = "google_oauth_intent";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          // Always show Google account picker + credential step (no silent SSO reuse).
          prompt: "select_account login",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return false;

      const googleProfile = profile as GoogleOAuthProfile;
      const email =
        typeof googleProfile.email === "string"
          ? googleProfile.email.trim()
          : "";

      if (!email) return "/login?error=oauth_email";

      const cookieStore = await cookies();
      const intent = cookieStore.get(INTENT_COOKIE)?.value === "signup" ? "signup" : "signin";
      cookieStore.delete(INTENT_COOKIE);

      const existing = await findAuthUserByEmail(email);

      if (intent === "signup") {
        if (existing) {
          return "/login?error=account_exists";
        }
        try {
          await insertGoogleAuthUser(googleProfile);
        } catch {
          return "/login?error=oauth_create_failed";
        }
        return true;
      }

      if (!existing) {
        return "/login?error=no_account";
      }
      return true;
    },
    async jwt({ token, account, profile }) {
      const googleProfile = profile as GoogleOAuthProfile | undefined;
      const email =
        googleProfile && typeof googleProfile.email === "string"
          ? googleProfile.email.trim()
          : null;

      if (account?.provider === "google" && email) {
        const row = await findAuthUserByEmail(email);
        if (row) token.sub = row.id;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
