import { NextResponse } from "next/server";
import { getAdmin } from "@/components/domain/adminCookie";
import { hasKpiDashboardAccess } from "@/lib/auth/kpiDashboardAccess";
import { getKpiMetrics } from "@/lib/admin/kpiMetrics";

export const dynamic = "force-dynamic";

/** CSV export for the owner-only financial/cash-flow dashboard. Same gate, same source of truth (lib/admin/kpiMetrics.ts). */
export async function GET() {
  const admin = await getAdmin();
  if (!admin.signedIn) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasKpiDashboardAccess(admin.email)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const m = await getKpiMetrics();

  const rows: [string, string | number][] = [
    ["Net cash position (est.)", m.netCashPosition.toFixed(2)],
    ["Wallet liability", m.walletLiability.toFixed(2)],
    ["Platform commission (lifetime, est.)", m.platformRevenue.toFixed(2)],
    ["Lifetime GMV", m.gmv.toFixed(2)],
    ["Completed bookings", m.completedBookings],
    ["Payments captured (lifetime)", m.paymentsLifetime.toFixed(2)],
    ["Payouts paid (lifetime)", m.payoutsLifetime.toFixed(2)],
    ["Guaranteed-wage cost to date", m.guaranteedWageCost.toFixed(2)],
    ["Guaranteed-wage forward liability (per week)", m.guaranteedWageWeeklyLiability.toFixed(2)],
    ["Self-funded bookings (Phase 1)", m.selfFundedN],
    ["Self-funded revenue", m.selfFundedRevenue.toFixed(2)],
    ["Government-scheme bookings (Phase 2)", m.govtN],
    ["Government-scheme revenue", m.govtRevenue.toFixed(2)],
    ["Government-scheme share (%)", m.govtSharePct],
    ["Approved providers", m.approvedProviders],
    ["Sole traders", m.soleTraders],
    ["Registered providers/agency (individual)", m.registeredProviders],
    ["Agencies (organizations)", m.agencies],
    ["NDIS-ready providers", m.ndisReady],
    ["Guaranteed-wage enrolled providers", m.guaranteedWageEnrolled],
    ["Invoices issued", m.invoicesIssued],
    ["Total invoiced", m.totalInvoiced.toFixed(2)],
    ["GST collected", m.gstCollected.toFixed(2)],
    ["Overdue invoices", m.overdueInvoices],
    ["Overdue amount", m.overdueAmount.toFixed(2)],
    ["New customers (6mo)", m.newCustomers6mo],
    ["New providers (6mo)", m.newProviders6mo],
    ["Role switches (6mo)", m.roleSwitches6mo],
  ];

  const csvLines = ["Metric,Value", ...rows.map(([label, value]) => `"${label.replace(/"/g, '""')}",${value}`)];
  csvLines.push("");
  csvLines.push("Month,GMV");
  for (const row of m.monthlyTrend) {
    csvLines.push(`${row.month},${row.gmv.toFixed(2)}`);
  }

  return new NextResponse(csvLines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="silverconnect-kpi-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
