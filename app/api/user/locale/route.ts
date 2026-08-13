import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { getCurrentUser } from "@/lib/auth/server";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/user/locale
 * Persists the signed-in user's language choice to their account, so it
 * follows them across devices (in addition to the guest-only NEXT_LOCALE
 * cookie next-intl's middleware sets automatically).
 */
export async function PATCH(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { locale } = await req.json();
  if (!routing.locales.includes(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  await db.update(users).set({ locale, updatedAt: new Date() }).where(eq(users.id, me.id));
  return NextResponse.json({ success: true });
}
