import type { DefaultJWT } from "next-auth/jwt";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    accessToken?: string;
  }

  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    email?: string;
    name?: string;
    accessToken?: string;
  }
}
