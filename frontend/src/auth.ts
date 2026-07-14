import { cookies } from "next/headers";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import {
  GoogleOnlyCredentialsSignin,
  UnverifiedCredentialsSignin,
} from "@/lib/auth/credentials-signin-errors";
import { loginViaFastApi, syncGoogleUser } from "@/lib/auth/fastapi-auth";
import type { GoogleOAuthProfile } from "@/lib/auth/google-profile";

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

        const result = await loginViaFastApi(email, password);
        if (!result.ok) {
          if (result.code === "google_only") {
            throw new GoogleOnlyCredentialsSignin();
          }
          if (result.code === "unverified") {
            throw new UnverifiedCredentialsSignin();
          }
          return null;
        }

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          accessToken: result.accessToken,
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
      const intent =
        cookieStore.get(INTENT_COOKIE)?.value === "signup" ? "signup" : "signin";
      cookieStore.delete(INTENT_COOKIE);

      const sync = await syncGoogleUser(intent, googleProfile);
      if (!sync.ok) {
        const errorByCode: Record<string, string> = {
          account_exists: "account_exists",
          no_account: "no_account",
          oauth_email: "oauth_email",
          oauth_create_failed: "oauth_create_failed",
        };
        return `/login?error=${errorByCode[sync.code] ?? "oauth_create_failed"}`;
      }

      return true;
    },
    async jwt({ token, account, profile, user, trigger, session }) {
      if (trigger === "update" && session && typeof session === "object") {
        const nextName =
          "name" in session && typeof session.name === "string"
            ? session.name.trim()
            : null;
        if (nextName) {
          token.name = nextName;
        }
        return token;
      }

      if (account?.provider === "credentials" && user?.id) {
        token.sub = user.id;
        if (typeof user.email === "string") token.email = user.email;
        if (typeof user.name === "string") token.name = user.name;
        const accessToken =
          typeof user === "object" &&
          user !== null &&
          "accessToken" in user &&
          typeof (user as { accessToken?: string }).accessToken === "string"
            ? (user as { accessToken: string }).accessToken
            : undefined;
        if (accessToken) {
          token.accessToken = accessToken;
        }
        return token;
      }

      const googleProfile = profile as GoogleOAuthProfile | undefined;
      if (account?.provider === "google" && googleProfile) {
        const sync = await syncGoogleUser("signin", googleProfile);
        if (sync.ok) {
          token.sub = sync.userId;
          token.email = sync.email;
          token.name = sync.name;
          token.accessToken = sync.accessToken;
        }
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
      if (typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
});
