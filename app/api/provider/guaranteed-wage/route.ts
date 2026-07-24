import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { providerProfiles, guaranteedWageCycles } from "@/lib/db/schema/providers";
import { requireUser } from "@/lib/auth/server";
import { isAuUser } from "@/lib/coins/ledger";
import { requestGuaranteedWage, cancelGuaranteedWage } from "@/lib/providers/actions";

/**
 * GET/POST/DELETE /api/provider/guaranteed-wage
 * Opt-in income floor for AU providers — see plan doc for rationale.
 * Providers stay independent contractors; this only sets a per-cycle
 * minimum payment floor topped up by app/api/cron/guaranteed-wage-topup.
 */
export async function GET() {
  const user = await requireUser();
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

  return NextResponse.json({ ...full, cycles: cycles.reverse() });
}

export async function POST(req: NextRequest) {
  const user = await requireUser();
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
  return NextResponse.json(result);
}

export async function DELETE() {
  const user = await requireUser();

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
