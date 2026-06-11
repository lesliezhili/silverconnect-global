import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { favourites } from "@/lib/db/schema/customer-data";
import { and, eq } from "drizzle-orm";

/**
 * POST /api/favourites — Toggle favourite provider
 * Body: { providerId: string }
 * Returns: { favourited: boolean }
 */
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { providerId } = body;

  if (!providerId || typeof providerId !== "string") {
    return NextResponse.json(
      { error: "providerId is required" },
      { status: 400 }
    );
  }

  try {
    // Check if already favourited
    const existing = await db
      .select()
      .from(favourites)
      .where(
        and(
          eq(favourites.userId, me.id),
          eq(favourites.providerId, providerId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Remove favourite
      await db
        .delete(favourites)
        .where(
          and(
            eq(favourites.userId, me.id),
            eq(favourites.providerId, providerId)
          )
        );
      return NextResponse.json({ favourited: false });
    } else {
      // Add favourite
      await db.insert(favourites).values({
        userId: me.id,
        providerId,
      });
      return NextResponse.json({ favourited: true });
    }
  } catch (error: any) {
    console.error("Favourites toggle error:", error);
    return NextResponse.json(
      { error: "Failed to update favourite" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/favourites — Get user's favourite provider IDs
 * Returns: { providerIds: string[] }
 */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db
      .select({ providerId: favourites.providerId })
      .from(favourites)
      .where(eq(favourites.userId, me.id));

    return NextResponse.json({
      providerIds: rows.map((r) => r.providerId),
    });
  } catch (error: any) {
    console.error("Favourites fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch favourites" },
      { status: 500 }
    );
  }
}
