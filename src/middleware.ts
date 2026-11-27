import { NextResponse, type NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_TOKEN_PATTERN,
} from "@/lib/session-constants";

const protectedPageRoots = [
  "/billing",
  "/chat",
  "/dashboard",
  "/drivers",
  "/fuel/new",
  "/history",
  "/settings",
  "/vehicles",
];

function isProtectedPage(pathname: string): boolean {
  return protectedPageRoots.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`)
  );
}

/**
 * Exposes the current pathname to server components via a request header,
 * so layouts can make route-aware decisions (e.g. the subscription paywall
 * must not block /billing or /settings).
 */
export function middleware(req: NextRequest) {
  if (
    isProtectedPage(req.nextUrl.pathname) &&
    !SESSION_TOKEN_PATTERN.test(req.cookies.get(SESSION_COOKIE_NAME)?.value ?? "")
  ) {
    return NextResponse.redirect(new URL("/login?expired=1", req.url));
  }

  const headers = new Headers(req.headers);
  headers.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: [
    // Everything except static assets and image optimisation.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|manifest.webmanifest).*)",
  ],
};
