import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // List of routes that require user to be signed in
  const isProtectedRoute =
    pathname.startsWith("/trades") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/dna") ||
    pathname.startsWith("/rules") ||
    pathname.startsWith("/psychology") ||
    pathname.startsWith("/reviews") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/screenshots") ||
    pathname.startsWith("/ai-coach");

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
