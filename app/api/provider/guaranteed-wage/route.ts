import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { providerProfiles, guaranteedWageCycles } from "@/lib/db/schema/providers";
import { getCurrentUser } from "@/lib/auth/server";
import { isAuUser } from "@/lib/coins/ledger";
import { requestGuaranteedWage, cancelGuaranteedWage, checkGuaranteedWageEligibility } from "@/lib/providers/actions";

/**
 * GET/POST/DELETE /api/provider/guaranteed-wage
 * Opt-in income floor for AU providers — see plan doc for rationale.
 * Providers stay independent contractors; this only sets a per-cycle
 * minimum payment floor topped up by app/api/cron/guaranteed-wage-topup.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAuUser(user.id))) {
    return NextResponse.json({ error: "Guaranteed wage is only available to Australian providers." }, { status: 403 });
  }

  const [profile] = await db
    .select({ id: providerProfiles.id })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, user.id))
    .limit(1);
  if (!profile) {
    return NextResponse.json({ error: "Provider profile not found." }, { status: 404 });
  }

  const [full] = await db
    .select({
      payArrangement: providerProfiles.payArrangement,
      guaranteedWageStatus: providerProfiles.guaranteedWageStatus,
      guaranteedCommittedHours: providerProfiles.guaranteedCommittedHours,
      guaranteedMinCycleAmount: providerProfiles.guaranteedMinCycleAmount,
      guaranteedWageEnrolledAt: providerProfiles.guaranteedWageEnrolledAt,
    })
    .from(providerProfiles)
    .where(eq(providerProfiles.id, profile.id))
    .limit(1);

  const cycles = await db
    .select()
    .from(guaranteedWageCycles)
    .where(eq(guaranteedWageCycles.providerId, profile.id))
    .orderBy(guaranteedWageCycles.cycleStart);

  // Surfaced even for providers who haven't requested yet, so the UI can
  // show trial-period progress ("6/10 jobs, rating 4.2/4.0, 12/30 days")
  // before they hit the request button and get rejected.
  const eligibility = await checkGuaranteedWageEligibility(profile.id);

  return NextResponse.json({ ...full, cycles: cycles.reverse(), eligibility });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await isAuUser(user.id))) {
    return NextResponse.json({ error: "Guaranteed wage is only available to Australian providers." }, { status: 403 });
  }

  const { committedHours, guaranteedAmount } = await req.json();
  if (!Number.isFinite(committedHours) || committedHours <= 0 || committedHours > 80) {
    return NextResponse.json({ error: "Committed hours must be between 1 and 80." }, { status: 400 });
  }
  if (!Number.isFinite(guaranteedAmount) || guaranteedAmount <= 0) {
    return NextResponse.json({ error: "Guaranteed amount must be a positive number." }, { status: 400 });
  }

  const [profile] = await db
    .select({ id: providerProfiles.id })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, user.id))
    .limit(1);
  if (!profile) {
    return NextResponse.json({ error: "Provider profile not found." }, { status: 404 });
  }

  const result = await requestGuaranteedWage(profile.id, committedHours, guaranteedAmount);
  return NextResponse.json(result, { status: result.success ? 200 : 403 });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile] = await db
    .select({ id: providerProfiles.id })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, user.id))
    .limit(1);
  if (!profile) {
    return NextResponse.json({ error: "Provider profile not found." }, { status: 404 });
  }

  const result = await cancelGuaranteedWage(profile.id);
  return NextResponse.json(result);
}
