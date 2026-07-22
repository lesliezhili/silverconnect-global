import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { hasGovtFundingAccess } from "@/lib/auth/govtFundingAccess";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/bookings/funding-scheme
 * Submit government funding claim for a booking or profile-level setup.
 * Body: { bookingId, scheme, claimNumber, ... }
 * 
 * bookingId = "profile-setup" means not tied to a specific booking
 */
export async function POST(req: NextRequest) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasGovtFundingAccess(me.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { bookingId, scheme, claimNumber } = body;

  if (!scheme || !claimNumber) {
    return NextResponse.json({
      error: "scheme and claimNumber are required",
    }, { status: 400 });
  }

  const validSchemes = ["tac", "worksafe", "ndis", "my_aged_care", "dva", "hcp", "aged_pension", "super"];
  if (!validSchemes.includes(scheme)) {
    return NextResponse.json({
      error: `Invalid scheme. Must be one of: ${validSchemes.join(", ")}`,
    }, { status: 400 });
  }

  // Server-side rate cap validation
  const RATE_CAPS: Record<string, number> = {
    ndis: 67.56, tac: 65.00, worksafe: 62.00,
    dva: 60.00, my_aged_care: 58.00, hcp: 58.00,
    aged_pension: 55.00, super: 67.56,
  };

  if (body.hourlyRate && RATE_CAPS[scheme]) {
    const cap = RATE_CAPS[scheme];
    if (Number(body.hourlyRate) > cap) {
      return NextResponse.json({
        error: `Rate $${body.hourlyRate}/hr exceeds ${scheme.toUpperCase()} cap of $${cap}/hr. Platform rates must be below government rates for sustainability.`,
      }, { status: 400 });
    }
  }

  try {
    const result = await db.execute(sql`
      INSERT INTO customer_funding_claims (
        booking_id, customer_id, scheme, claim_number,
        participant_number, plan_number, approval_letter_url,
        approval_date, service_scope, funding_amount, notes, status
      ) VALUES (
        ${bookingId || "profile-setup"},
        ${me.id},
        ${scheme},
        ${claimNumber},
        ${body.participantNumber || null},
        ${body.planNumber || null},
        ${body.approvalLetterUrl || null},
        ${body.approvalDate ? body.approvalDate : null},
        ${body.serviceScope || null},
        ${body.fundingAmount || null},
        ${body.notes || null},
        'pending_verification'
      )
      RETURNING *
    `);

    const claim = Array.isArray(result) ? result[0] : (result as any).rows?.[0];
    return NextResponse.json({ claim, status: "pending_verification" });
  } catch (error: any) {
    console.error("Funding claim error:", error);
    return NextResponse.json({
      error: "Failed to submit funding claim",
    }, { status: 500 });
  }
}

/**
 * GET /api/bookings/funding-scheme
 * Get all funding claims for the current user
 */
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasGovtFundingAccess(me.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const result = await db.execute(sql`
      SELECT * FROM customer_funding_claims
      WHERE customer_id = ${me.id}
      ORDER BY created_at DESC
    `);
    const claims = Array.isArray(result) ? result : (result as any).rows || [];
    return NextResponse.json({ claims });
  } catch (error: any) {
    console.error("Funding claims fetch error:", error);
    return NextResponse.json({ claims: [] });
  }
}
