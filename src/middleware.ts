import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SUPPORTED_LANGS } from "@/lib/i18n-static";

// Default language for users with no language preference.
// Admin can change which languages are *enabled* at /admin/languages, but the
// URL-level supported set is fixed at build time (ta/en/si).
const DEFAULT_LANG = "ta";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip Next internals, static files, favicon, robots, sitemap, the API surface,
  // and the admin section (NextAuth handles those).
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.match(/\.[a-zA-Z0-9]+$/) // any file extension
  ) {
    return NextResponse.next();
  }

  const seg = pathname.split("/")[1];

  if (SUPPORTED_LANGS.includes(seg as any)) {
    const res = NextResponse.next();
    res.headers.set("x-pathname", pathname);
    return res;
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${DEFAULT_LANG}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
