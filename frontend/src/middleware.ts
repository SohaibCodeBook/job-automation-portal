import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { ROUTES } from "@/constants/routes";

function safeNextPath(pathname: string) {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return ROUTES.scrappedJobs;
  }
  return pathname;
}

function isPublicPath(pathname: string) {
  // NextAuth handler + Google intent cookie only (all other APIs are on FastAPI).
  if (pathname.startsWith("/api/auth")) return true;
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email" ||
    pathname === "/auth/auth-code-error"
  );
}

export default auth((request) => {
  const pathname = request.nextUrl.pathname;
  const loggedIn = !!request.auth?.user?.id;

  if (!loggedIn && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", safeNextPath(pathname));
    return NextResponse.redirect(url);
  }

  if (
    loggedIn &&
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/forgot-password")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = ROUTES.scrappedJobs;
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
