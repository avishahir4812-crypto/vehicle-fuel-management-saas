import { NextResponse, type NextRequest } from "next/server";

/**
 * Exposes the current pathname to server components via a request header,
 * so layouts can make route-aware decisions (e.g. the subscription paywall
 * must not block /billing or /settings).
 */
export function middleware(req: NextRequest) {
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
