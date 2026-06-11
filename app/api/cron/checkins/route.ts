import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyCronAuth } from "@/lib/cron/auth";
import { runScheduledCheckIns } from "@/lib/dispatch/emergency";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cron: AI Check-In Dispatcher (Module 6)
 * Runs every 30 minutes to check on upcoming bookings.
 * Triggers provider confirmation requests at 24h, 12h, 6h, 4h, 2h windows.
 */
export async function GET(req: NextRequest) {
  const fail = verifyCronAuth(req);
  if (fail) return fail;

  const result = await runScheduledCheckIns();

  return NextResponse.json({
    ok: true,
    checked: result.checked,
    escalated: result.escalated,
  });
}
