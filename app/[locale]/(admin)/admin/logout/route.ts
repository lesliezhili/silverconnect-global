import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/components/domain/adminCookie";

async function handle(req: Request, params: { locale: string }) {
  const { locale } = params;
  const url = new URL(req.url);
  const target = new URL(`/${locale}/admin/login`, url.origin);
  const res = NextResponse.redirect(target, { status: 302 });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ locale: string }> }
) {
  return handle(req, await ctx.params);
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ locale: string }> }
) {
  return handle(req, await ctx.params);
}
