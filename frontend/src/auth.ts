import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { getPostgres } from "@/lib/db/postgres";

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
      const email = profile?.email;
      if (!email || typeof email !== "string") return false;

      const sql = getPostgres();
      const rows =
        await sql<{ id: string }[]>`
          select id::text as id
          from auth.users
          where lower(email) = lower(${email.trim()})
          limit 1
        `;

      return rows.length > 0;
    },
    async jwt({ token, account, profile }) {
      const email =
        profile && "email" in profile && typeof profile.email === "string"
          ? profile.email
          : null;

      if (account?.provider === "google" && email) {
        const sql = getPostgres();
        const rows =
          await sql<{ id: string }[]>`
            select id::text as id
            from auth.users
            where lower(email) = lower(${email.trim()})
            limit 1
          `;
        const id = rows[0]?.id;
        if (id) token.sub = id;
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
