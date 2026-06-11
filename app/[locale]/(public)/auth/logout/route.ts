import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/components/domain/sessionCookie";

/**
 * GET / POST sign-out endpoint.
 *
 * Route handlers (unlike page renderers) can mutate cookies, so we
 * delete the session cookie here, then 302 to /home for the same
 * locale. Works for both <a href="/auth/logout"> nav and <form
 * action="/auth/logout" method="post">.
 */
async function handle(req: Request, params: { locale: string }) {
  const { locale } = params;
  const url = new URL(req.url);
  const target = new URL(`/${locale}/home`, url.origin);
  const res = NextResponse.redirect(target, { status: 302 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ locale: string }> }
) {
  return handle(req, await ctx.params);
}
