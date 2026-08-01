import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const { pathname } = req.nextUrl;

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

  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login).*)"],
};
