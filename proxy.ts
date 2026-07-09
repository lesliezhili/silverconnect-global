import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const SHORT_LINKS: Record<string, { pathname: string; query?: Record<string, string> }> = {
  "/login": { pathname: "/auth/login" },
  "/p": { pathname: "/auth/login", query: { role: "provider" } },
};

export default function proxy(request: NextRequest): NextResponse {
  const target = SHORT_LINKS[request.nextUrl.pathname];
  if (target) {
    request.nextUrl.pathname = target.pathname;
    if (target.query) {
      for (const [key, value] of Object.entries(target.query)) {
        request.nextUrl.searchParams.set(key, value);
      }
    }
  }
  return intlMiddleware(request);
}

export const config = {
  // Apply locale routing to everything except /api, /admin, /_next, /_vercel,
  // the icon/apple-icon metadata routes (no file extension in their URL,
  // so they'd otherwise be caught by the locale matcher and 404), and any
  // other path with a file extension (static assets like favicon.ico).
  matcher: ["/((?!api|admin|_next|_vercel|icon$|apple-icon$|.*\\..*).*)"],
};
