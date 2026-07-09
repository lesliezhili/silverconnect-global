import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getAuthSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const [user] = await db.select().from(users)
    .where(sql`LOWER(${users.email}) = LOWER(${email})`)
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Use the SAME session system as the rest of the app
  const session = await getAuthSession();
  session.userId = user.id;
  session.email = user.email;
  session.name = user.name ?? undefined;
  session.role = user.role === "admin" ? "customer" : (user.role as "customer" | "provider");
  await session.save();

  return NextResponse.json({ success: true, role: session.role, isAdmin: user.isAdmin });
}
