import { NextRequest, NextResponse } from "next/server";
import postgres from "postgres";
import { verifyCronAuth } from "@/lib/cron/auth";
import { notify } from "@/lib/notifications/server";

export const dynamic = "force-dynamic";

/** Mirrors the 15% platform commission used elsewhere (capture/route.ts, feedback/route.ts, cancelBooking.ts). */
const PLATFORM_COMMISSION = 0.15;
/** Weekly cycles, run weekly (cron.yml) — kept 1:1 with the run cadence so
 *  rolling-window overlap can't double-count/double-top-up a booking. */
const CYCLE_DAYS = 7;

/**
 * POST /api/cron/guaranteed-wage-topup
 * Weekly: for every provider enrolled in the guaranteed-wage income
 * floor (guaranteed_wage_status = 'approved'), compares actual net
 * earnings in the just-closed cycle against their agreed minimum and
 * credits the shortfall to their wallet. No clawback if they earned more.
 */
export async function POST(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const url = process.env.DATABASE_URL;
  if (!url) return NextResponse.json({ error: "No DATABASE_URL" }, { status: 500 });
  const sql = postgres(url, { prepare: false, connect_timeout: 15 });

  const cycleEnd = new Date();
  const cycleStart = new Date(cycleEnd);
  cycleStart.setDate(cycleStart.getDate() - CYCLE_DAYS);

  try {
    const providers = await sql`
      SELECT pp.id, pp.user_id, pp.guaranteed_min_cycle_amount
      FROM provider_profiles pp
      WHERE pp.guaranteed_wage_status = 'approved'
        AND pp.guaranteed_min_cycle_amount IS NOT NULL
    `;

    let processed = 0;
    let toppedUp = 0;

    for (const p of providers) {
      const [earnings] = await sql`
        SELECT coalesce(sum(total_price::numeric), 0) AS gross
        FROM bookings
        WHERE provider_id = ${p.id}
          AND status IN ('completed', 'released')
          AND completed_at >= ${cycleStart.toISOString()}
          AND completed_at < ${cycleEnd.toISOString()}
      `;
      const actualEarnings = Number(earnings.gross) * (1 - PLATFORM_COMMISSION);
      const guaranteedAmount = Number(p.guaranteed_min_cycle_amount);
      const topupAmount = Math.max(0, guaranteedAmount - actualEarnings);

      const inserted = await sql.begin(async (tx) => {
        const rows = await tx`
          INSERT INTO guaranteed_wage_cycles
            (provider_id, cycle_start, cycle_end, actual_earnings, guaranteed_amount, topup_amount, status, paid_at)
          VALUES
            (${p.id}, ${cycleStart.toISOString().slice(0, 10)}, ${cycleEnd.toISOString().slice(0, 10)},
             ${actualEarnings.toFixed(2)}, ${guaranteedAmount.toFixed(2)}, ${topupAmount.toFixed(2)}, 'paid', NOW())
          ON CONFLICT (provider_id, cycle_start) DO NOTHING
          RETURNING id
        `;
        if (rows.length === 0) return false; // already processed this cycle

        if (topupAmount > 0) {
          await tx`
            INSERT INTO wallets (id, provider_id, balance_available, balance_pending, currency, updated_at)
            VALUES (gen_random_uuid(), ${p.id}, ${topupAmount.toFixed(2)}, '0', 'AUD', NOW())
            ON CONFLICT (provider_id)
            DO UPDATE SET
              balance_available = wallets.balance_available + ${topupAmount.toFixed(2)},
              updated_at = NOW()
          `;
        }
        return true;
      });

      if (!inserted) continue;
      processed++;
      if (topupAmount > 0) toppedUp++;

      if (p.user_id) {
        await notify({
          userId: p.user_id,
          kind: "payment",
          title:
            topupAmount > 0
              ? `Guaranteed wage top-up: $${topupAmount.toFixed(2)} added to your wallet`
              : "Guaranteed wage cycle complete — no top-up needed this cycle",
          body:
            topupAmount > 0
              ? `Your earnings this cycle ($${actualEarnings.toFixed(2)}) were below your guaranteed $${guaranteedAmount.toFixed(2)}, so we topped up the difference.`
              : `Your earnings this cycle ($${actualEarnings.toFixed(2)}) met or exceeded your guaranteed $${guaranteedAmount.toFixed(2)}.`,
          link: "/provider/guaranteed-wage",
        });
      }
    }

    await sql.end();
    return NextResponse.json({ success: true, processed, toppedUp });
  } catch (e: unknown) {
    await sql.end().catch(() => {});
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
