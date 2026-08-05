import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { getAdmin } from "@/components/domain/adminCookie";
import { hasKpiDashboardAccess } from "@/lib/auth/kpiDashboardAccess";
import { getKpiMetrics, PLATFORM_COMMISSION } from "@/lib/admin/kpiMetrics";

export const dynamic = "force-dynamic";

function fmt$(n: number) {
  return `$${n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function KpiDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const admin = await getAdmin();
  if (!admin.signedIn) redirect({ href: "/admin/login", locale });
  if (!hasKpiDashboardAccess(admin.email)) redirect({ href: "/admin", locale });

  try {
    const m = await getKpiMetrics();

    return (
      <AdminShell email={admin.email ?? ""}>
        <h1 className="text-h2">Financial &amp; Cash-Flow Dashboard</h1>
        <p className="mt-2 text-[16px] text-text-secondary">
          Owner-only. Complements admin/analytics (ops metrics) with the
          numbers that matter for bootstrapping cash flow to fund Phase-2
          expansion — platform commission, money owed to providers, and the
          real cost of the guaranteed-wage program.
        </p>

        {/* Cash position */}
        <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Net cash position (est.)" value={fmt$(m.netCashPosition)} sub="Commission − wage cost − wallet liability" />
          <Stat label="Wallet liability" value={fmt$(m.walletLiability)} sub="Owed to providers, not yet paid out" />
          <Stat label="Platform commission (lifetime, est.)" value={fmt$(m.platformRevenue)} sub={`${(PLATFORM_COMMISSION * 100).toFixed(0)}% of GMV`} />
          <Stat label="Lifetime GMV" value={fmt$(m.gmv)} sub={`${m.completedBookings} completed bookings`} />
          <Stat label="Payments captured (lifetime)" value={fmt$(m.paymentsLifetime)} />
          <Stat label="Payouts paid (lifetime)" value={fmt$(m.payoutsLifetime)} />
          <Stat label="Guaranteed-wage cost to date" value={fmt$(m.guaranteedWageCost)} sub="Actual top-ups paid" />
          <Stat label="Guaranteed-wage forward liability" value={fmt$(m.guaranteedWageWeeklyLiability)} sub="Committed per week" />
        </section>

        {/* Revenue trend */}
        <section className="mt-5 rounded-lg border border-border bg-bg-base p-5">
          <p className="text-[16px] font-bold">GMV trend (6 months)</p>
          {m.monthlyTrend.length === 0 ? (
            <p className="mt-2 text-[16px] text-text-tertiary">No completed bookings yet</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-1.5">
              {m.monthlyTrend.map((row) => (
                <li key={row.month} className="flex items-center justify-between text-[16px]">
                  <span className="text-text-tertiary">{row.month}</span>
                  <span className="font-bold tabular-nums">{fmt$(row.gmv)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Phase 1 vs Phase 2 mix */}
        <section className="mt-5 rounded-lg border border-border bg-bg-base p-5">
          <p className="text-[16px] font-bold">Funding-scheme mix (Phase 1 vs Phase 2)</p>
          <div className="mt-3 grid grid-cols-2 gap-4 text-[16px]">
            <div>
              <p className="text-text-tertiary">Self-funded (Phase 1)</p>
              <p className="text-[20px] font-extrabold tabular-nums">{m.selfFundedN}</p>
              <p className="text-text-tertiary tabular-nums">{fmt$(m.selfFundedRevenue)}</p>
            </div>
            <div>
              <p className="text-text-tertiary">Government scheme (Phase 2)</p>
              <p className="text-[20px] font-extrabold tabular-nums">{m.govtN}</p>
              <p className="text-text-tertiary tabular-nums">{fmt$(m.govtRevenue)}</p>
            </div>
          </div>
          <p className="mt-3 text-[15px] text-text-tertiary">
            {m.govtSharePct}% of completed bookings are government-scheme funded.
          </p>
        </section>

        {/* Provider supply */}
        <section className="mt-5 rounded-lg border border-border bg-bg-base p-5">
          <p className="text-[16px] font-bold">Provider supply &amp; readiness</p>
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-5 text-[16px]">
            <MiniStat label="Approved providers" value={m.approvedProviders} />
            <MiniStat label="Sole traders" value={m.soleTraders} />
            <MiniStat label="Registered/agency" value={m.registeredProviders} />
            <MiniStat label="Agencies (organizations)" value={m.agencies} />
            <MiniStat label="NDIS-ready" value={m.ndisReady} />
            <MiniStat label="Guaranteed-wage enrolled" value={m.guaranteedWageEnrolled} />
          </div>
        </section>

        {/* Compliance / invoicing */}
        <section className="mt-5 rounded-lg border border-border bg-bg-base p-5">
          <p className="text-[16px] font-bold">Compliance &amp; invoicing</p>
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4 text-[16px]">
            <MiniStat label="Invoices issued" value={m.invoicesIssued} />
            <MiniStat label="Total invoiced" value={fmt$(m.totalInvoiced)} />
            <MiniStat label="GST collected" value={fmt$(m.gstCollected)} />
            <MiniStat label="Overdue" value={`${m.overdueInvoices} · ${fmt$(m.overdueAmount)}`} />
          </div>
        </section>

        {/* Growth */}
        <section className="mt-5 rounded-lg border border-border bg-bg-base p-5">
          <p className="text-[16px] font-bold">Growth (last 6 months)</p>
          <div className="mt-3 grid grid-cols-3 gap-4 text-[16px]">
            <MiniStat label="New customers" value={m.newCustomers6mo} />
            <MiniStat label="New providers" value={m.newProviders6mo} />
            <MiniStat label="Role switches" value={m.roleSwitches6mo} />
          </div>
        </section>

        <a
          href="/api/admin/kpi-dashboard/export"
          className="mt-5 inline-flex h-11 items-center rounded-md border-[1.5px] border-border-strong bg-bg-base px-4 text-[16px] font-semibold text-text-primary"
        >
          Export CSV
        </a>
      </AdminShell>
    );
  } catch (error) {
    console.error("[kpi-dashboard] DB unavailable", error);
    return (
      <main className="mx-auto w-full max-w-content px-5 py-12 text-center">
        <p className="text-[48px]">⏳</p>
        <h1 className="mt-4 text-[22px] font-bold">Service Temporarily Unavailable</h1>
        <p className="mt-2 text-[17px] text-text-secondary">Please try again shortly.</p>
      </main>
    );
  }
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-base p-4">
      <p className="text-[15px] text-text-tertiary">{label}</p>
      <p className="mt-1 text-[20px] font-extrabold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[14px] text-text-tertiary">{sub}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-text-tertiary">{label}</p>
      <p className="text-[20px] font-extrabold tabular-nums">{value}</p>
    </div>
  );
}
