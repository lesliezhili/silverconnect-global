import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { and, eq, lt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { disputes } from "@/lib/db/schema/disputes";
import { users } from "@/lib/db/schema/users";
import { notifyMany } from "@/lib/notifications/server";
import { verifyCronAuth } from "@/lib/cron/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SLA_HOURS = 48;

/**
 * Notifies all admins about disputes that have stayed `open` past the
 * SLA window. Idempotent because we only fire when the dispute is
 * still open and unresolved — once an admin acts, the dispute leaves
 * `open` and stops appearing.
 */
export async function GET(req: NextRequest) {
  const fail = verifyCronAuth(req);
  if (fail) return fail;

  const cutoff = new Date(Date.now() - SLA_HOURS * 60 * 60 * 1000);
  const overdue = await db
    .select({
      id: disputes.id,
      bookingId: disputes.bookingId,
      createdAt: disputes.createdAt,
    })
    .from(disputes)
    .where(
      and(
        eq(disputes.status, "open"),
        isNull(disputes.decidedAt),
        lt(disputes.createdAt, cutoff),
      ),
    );

  if (overdue.length === 0) {
    return NextResponse.json({ ok: true, overdue: 0, notified: 0 });
  }

  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "admin"));
  if (admins.length === 0) {
    return NextResponse.json({ ok: true, overdue: overdue.length, notified: 0 });
  }

  const inputs = overdue.flatMap((d) =>
    admins.map((a) => ({
      userId: a.id,
      kind: "dispute" as const,
      title: `Dispute SLA breach (${SLA_HOURS}h)`,
      body: `Dispute on booking ${d.bookingId} has been open since ${d.createdAt.toISOString()}.`,
      link: `/admin/disputes/${d.id}`,
      relatedBookingId: d.bookingId,
      relatedDisputeId: d.id,
    })),
  );
  await notifyMany(inputs);

  return NextResponse.json({
    ok: true,
    overdue: overdue.length,
    notified: inputs.length,
  });
}
