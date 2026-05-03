import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Apply locale routing to everything except /api, /admin, /_next, /_vercel,
  // and any path with a file extension (static assets like favicon.ico).
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
