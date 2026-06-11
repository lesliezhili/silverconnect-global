import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");
  if (key !== process.env.SESSION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Test 1: Simple select
    const count = await db.select({ id: users.id }).from(users).limit(1);
    
    // Test 2: Try insert a test user
    const testEmail = `test-${Date.now()}@example.com`;
    const inserted = await db.insert(users).values({
      email: testEmail,
      passwordHash: "test-hash-will-delete",
      role: "customer",
    }).returning({ id: users.id });

    // Clean up
    if (inserted[0]) {
      await db.delete(users).where(eq(users.id, inserted[0].id));
    }

    return NextResponse.json({
      success: true,
      existingUsers: count.length,
      testInsert: "passed",
      testDelete: "passed",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.stack || e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
