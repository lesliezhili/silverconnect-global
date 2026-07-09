import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { getCurrentUser, signInUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/switch-role
 * Toggles the current user between "customer" and "provider" roles.
 * Updates the DB role and refreshes the session.
 * This enables testing both roles on the same device/browser.
 */
export async function POST() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const newRole = me.role === "provider" ? "customer" : "provider";

  // Update DB
  await db
    .update(users)
    .set({ role: newRole, updatedAt: new Date() })
    .where(eq(users.id, me.id));

  // Refresh session
  await signInUser(me.id);

  return NextResponse.json({ success: true, role: newRole });
}
