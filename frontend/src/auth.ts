import { cookies } from "next/headers";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { authenticateCredentialsUser } from "@/lib/auth/email-password-users";
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
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";
        if (!email || !password) return null;

        const user = await authenticateCredentialsUser(email, password);
        if (!user) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "credentials") return true;

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
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "credentials" && user?.id) {
        token.sub = user.id;
        if (typeof user.email === "string") token.email = user.email;
        if (typeof user.name === "string") token.name = user.name;
        return token;
      }

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
      if (session.user && typeof token.email === "string") {
        session.user.email = token.email;
      }
      if (session.user && typeof token.name === "string") {
        session.user.name = token.name;
      }
      return session;
    },
  },
});
