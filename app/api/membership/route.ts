import { NextRequest, NextResponse } from "next/server";
export async function GET(req: NextRequest) {
  const plans = req.nextUrl.searchParams.get("plans");
  const userId = req.nextUrl.searchParams.get("userId");
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    if (plans === "true") { const rows = await sql`SELECT * FROM membership_plans WHERE is_active = true ORDER BY sort_order`; await sql.end(); return NextResponse.json({ success: true, plans: rows }); }
    if (userId) {
      const [mem] = await sql`SELECT m.*, p.code as plan_code, p.name as plan_name, p.discount_percent, p.features FROM memberships m JOIN membership_plans p ON m.plan_id = p.id WHERE m.user_id = ${userId} AND m.status = 'active' LIMIT 1`;
      const month = new Date().toISOString().slice(0, 7);
      const [usage] = mem ? await sql`SELECT * FROM membership_usage WHERE membership_id = ${mem.id} AND month = ${month}` : [null];
      await sql.end();
      return NextResponse.json({ success: true, membership: mem || null, usage: usage || { bookings_used: 0, cancellations_used: 0, discount_savings: 0 } });
    }
    await sql.end();
    return NextResponse.json({ error: "Provide ?plans=true or ?userId=" }, { status: 400 });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
export async function POST(req: NextRequest) {
  const { userId, planCode, billingCycle = "monthly" } = await req.json();
  if (!userId || !planCode) return NextResponse.json({ error: "userId and planCode required" }, { status: 400 });
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    const [plan] = await sql`SELECT * FROM membership_plans WHERE code = ${planCode} AND is_active = true`;
    if (!plan) { await sql.end(); return NextResponse.json({ error: "Plan not found" }, { status: 404 }); }
    await sql`UPDATE memberships SET status = 'cancelled', cancelled_at = NOW() WHERE user_id = ${userId} AND status = 'active'`;
    const price = billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
    const nextBill = new Date(); nextBill.setMonth(nextBill.getMonth() + (billingCycle === "yearly" ? 12 : 1));
    const [mem] = await sql`INSERT INTO memberships (user_id, plan_id, status, billing_cycle, start_date, next_billing_date, payment_provider) VALUES (${userId}, ${plan.id}, 'active', ${billingCycle}, CURRENT_DATE, ${nextBill.toISOString().slice(0,10)}, 'phledger') RETURNING id`;
    await sql`INSERT INTO notifications (user_id, kind, title, body) VALUES (${userId}, 'booking', 'Membership Activated', ${'Welcome to ' + plan.name + '! ' + plan.discount_percent + '% off all services.'})`.catch(() => {});
    await sql.end();
    return NextResponse.json({ success: true, membershipId: mem.id, plan: planCode, billingCycle, price: parseFloat(price), discount: plan.discount_percent + "%" });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
export async function PATCH(req: NextRequest) {
  const { userId, reason } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const { default: postgres } = await import("postgres");
  const sql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
  try {
    const [mem] = await sql`UPDATE memberships SET status = 'cancelled', cancelled_at = NOW(), cancel_reason = ${reason || 'User cancelled'} WHERE user_id = ${userId} AND status = 'active' RETURNING id`;
    if (!mem) { await sql.end(); return NextResponse.json({ error: "No active membership" }, { status: 404 }); }
    await sql.end();
    return NextResponse.json({ success: true, cancelled: true, membershipId: mem.id });
  } catch (err: unknown) { await sql.end().catch(() => {}); return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 }); }
}
