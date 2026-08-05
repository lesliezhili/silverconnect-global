import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import { wallets, payments, payouts } from "@/lib/db/schema/payments";
import { providerProfiles, guaranteedWageCycles } from "@/lib/db/schema/providers";
import { organizationProfiles } from "@/lib/db/schema/organizations";
import { users, userRoleSwitches } from "@/lib/db/schema/users";

/** Mirrors the 15% platform commission used elsewhere (capture/route.ts, feedback/route.ts, cancelBooking.ts, guaranteed-wage-topup cron). */
export const PLATFORM_COMMISSION = 0.15;

export interface KpiMetrics {
  walletLiability: number;
  paymentsLifetime: number;
  payoutsLifetime: number;
  gmv: number;
  completedBookings: number;
  platformRevenue: number;
  guaranteedWageCost: number;
  guaranteedWageWeeklyLiability: number;
  netCashPosition: number;
  monthlyTrend: { month: string; gmv: number }[];
  selfFundedN: number;
  selfFundedRevenue: number;
  govtN: number;
  govtRevenue: number;
  govtSharePct: number;
  approvedProviders: number;
  soleTraders: number;
  registeredProviders: number;
  agencies: number;
  ndisReady: number;
  guaranteedWageEnrolled: number;
  invoicesIssued: number;
  totalInvoiced: number;
  gstCollected: number;
  overdueInvoices: number;
  overdueAmount: number;
  newCustomers6mo: number;
  newProviders6mo: number;
  roleSwitches6mo: number;
}

/**
 * Shared aggregate computation for the owner-only financial/cash-flow
 * dashboard (app/[locale]/(admin)/admin/kpi-dashboard) and its CSV export
 * route (app/api/admin/kpi-dashboard/export) — single source of truth so
 * the two never drift.
 */
export async function getKpiMetrics(): Promise<KpiMetrics> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  // Raw `sql` template interpolation needs a string, not a Date — the
  // postgres driver's parameter serializer only handles Dates correctly
  // when passed through a proper Drizzle operator (gte, etc), not embedded
  // directly in a sql`` tag.
  const sixMonthsAgoIso = sixMonthsAgo.toISOString();
  const now = new Date();

  const [
    walletAgg,
    paymentsAgg,
    payoutsAgg,
    revenueAgg,
    guaranteedWageAgg,
    guaranteedWageForward,
    fundingMixAgg,
    providerSupply,
    orgCount,
    signupAgg,
    roleSwitchAgg,
    monthlyTrend,
  ] = await Promise.all([
    db
      .select({
        liability: sql<number>`coalesce(sum(${wallets.balancePending}::numeric + ${wallets.balanceAvailable}::numeric), 0)::float`,
      })
      .from(wallets),
    db
      .select({ total: sql<number>`coalesce(sum(${payments.amount}::numeric), 0)::float` })
      .from(payments)
      .where(eq(payments.status, "captured")),
    db
      .select({ total: sql<number>`coalesce(sum(${payouts.amount}::numeric), 0)::float` })
      .from(payouts)
      .where(eq(payouts.status, "paid")),
    db
      .select({
        gmv: sql<number>`coalesce(sum(${bookings.totalPrice}::numeric), 0)::float`,
        n: sql<number>`count(*)::int`,
      })
      .from(bookings)
      .where(sql`${bookings.status} in ('completed', 'released')`),
    db
      .select({ topups: sql<number>`coalesce(sum(${guaranteedWageCycles.topupAmount}::numeric), 0)::float` })
      .from(guaranteedWageCycles),
    db
      .select({ weekly: sql<number>`coalesce(sum(${providerProfiles.guaranteedMinCycleAmount}::numeric), 0)::float` })
      .from(providerProfiles)
      .where(eq(providerProfiles.guaranteedWageStatus, "approved")),
    db
      .select({
        selfFundedN: sql<number>`count(*) filter (where ${bookings.fundingScheme} is null)::int`,
        selfFundedRev: sql<number>`coalesce(sum(${bookings.totalPrice}::numeric) filter (where ${bookings.fundingScheme} is null), 0)::float`,
        govtN: sql<number>`count(*) filter (where ${bookings.fundingScheme} is not null)::int`,
        govtRev: sql<number>`coalesce(sum(${bookings.totalPrice}::numeric) filter (where ${bookings.fundingScheme} is not null), 0)::float`,
      })
      .from(bookings)
      .where(sql`${bookings.status} in ('completed', 'released')`),
    db
      .select({
        approved: sql<number>`count(*) filter (where ${providerProfiles.onboardingStatus} = 'approved')::int`,
        soleTrader: sql<number>`count(*) filter (where ${providerProfiles.onboardingStatus} = 'approved' and (${providerProfiles.ndisPath} is null or ${providerProfiles.ndisPath} = 'sole_trader'))::int`,
        registeredProvider: sql<number>`count(*) filter (where ${providerProfiles.onboardingStatus} = 'approved' and ${providerProfiles.ndisPath} = 'registered_provider')::int`,
        ndisReady: sql<number>`count(*) filter (where ${providerProfiles.onboardingStatus} = 'approved' and ${providerProfiles.govtSchemes} is not null and array_length(${providerProfiles.govtSchemes}, 1) > 0)::int`,
        guaranteedWageEnrolled: sql<number>`count(*) filter (where ${providerProfiles.guaranteedWageStatus} = 'approved')::int`,
      })
      .from(providerProfiles),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(organizationProfiles)
      .where(eq(organizationProfiles.onboardingStatus, "approved")),
    db
      .select({
        customers: sql<number>`count(*) filter (where ${users.role} = 'customer' and ${users.createdAt} >= ${sixMonthsAgoIso}::timestamptz)::int`,
        providers: sql<number>`count(*) filter (where ${users.role} = 'provider' and ${users.createdAt} >= ${sixMonthsAgoIso}::timestamptz)::int`,
      })
      .from(users),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(userRoleSwitches)
      .where(gte(userRoleSwitches.switchedAt, sixMonthsAgo)),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${bookings.scheduledAt}), 'YYYY-MM')`,
        gmv: sql<number>`coalesce(sum(${bookings.totalPrice}::numeric), 0)::float`,
      })
      .from(bookings)
      .where(
        and(
          sql`${bookings.status} in ('completed', 'released')`,
          gte(bookings.scheduledAt, sixMonthsAgo),
          lte(bookings.scheduledAt, now),
        ),
      )
      .groupBy(sql`date_trunc('month', ${bookings.scheduledAt})`)
      .orderBy(sql`date_trunc('month', ${bookings.scheduledAt})`),
  ]);

  // `invoices` is a raw-SQL-only table (not in Drizzle schema, see
  // app/api/admin/seed-invoices-table/route.ts) that may not be
  // provisioned in every environment — isolated so a missing table
  // doesn't take down the caller.
  let invoiceRow = { n: 0, total_amount: "0", tax_amount: "0", overdue_n: 0, overdue_amount: "0" };
  {
    const { default: postgres } = await import("postgres");
    const rawSql = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
    try {
      const [row] = await rawSql`
        SELECT
          count(*)::int AS n,
          coalesce(sum(total_amount::numeric), 0)::text AS total_amount,
          coalesce(sum(tax_amount::numeric), 0)::text AS tax_amount,
          count(*) filter (where status = 'sent' and due_date < now())::int AS overdue_n,
          coalesce(sum(total_amount::numeric) filter (where status = 'sent' and due_date < now()), 0)::text AS overdue_amount
        FROM invoices
      `;
      if (row) invoiceRow = row as typeof invoiceRow;
    } catch (invoiceError) {
      console.error("[kpiMetrics] invoices table unavailable", invoiceError);
    } finally {
      // Always release the connection, even if the query above threw —
      // an earlier version only called .end() on the success path, which
      // leaked a connection on every failure and could exhaust the pool.
      await rawSql.end().catch(() => {});
    }
  }

  const gmv = revenueAgg[0]?.gmv ?? 0;
  const platformRevenue = gmv * PLATFORM_COMMISSION;
  const guaranteedWageCost = guaranteedWageAgg[0]?.topups ?? 0;
  const guaranteedWageWeeklyLiability = guaranteedWageForward[0]?.weekly ?? 0;
  const walletLiability = walletAgg[0]?.liability ?? 0;
  const fm = fundingMixAgg[0];
  const govtSharePct = fm && fm.selfFundedN + fm.govtN > 0 ? Math.round((fm.govtN / (fm.selfFundedN + fm.govtN)) * 100) : 0;

  return {
    walletLiability,
    paymentsLifetime: paymentsAgg[0]?.total ?? 0,
    payoutsLifetime: payoutsAgg[0]?.total ?? 0,
    gmv,
    completedBookings: revenueAgg[0]?.n ?? 0,
    platformRevenue,
    guaranteedWageCost,
    guaranteedWageWeeklyLiability,
    netCashPosition: platformRevenue - guaranteedWageCost - walletLiability,
    monthlyTrend,
    selfFundedN: fm?.selfFundedN ?? 0,
    selfFundedRevenue: fm?.selfFundedRev ?? 0,
    govtN: fm?.govtN ?? 0,
    govtRevenue: fm?.govtRev ?? 0,
    govtSharePct,
    approvedProviders: providerSupply[0]?.approved ?? 0,
    soleTraders: providerSupply[0]?.soleTrader ?? 0,
    registeredProviders: providerSupply[0]?.registeredProvider ?? 0,
    agencies: orgCount[0]?.n ?? 0,
    ndisReady: providerSupply[0]?.ndisReady ?? 0,
    guaranteedWageEnrolled: providerSupply[0]?.guaranteedWageEnrolled ?? 0,
    invoicesIssued: invoiceRow.n,
    totalInvoiced: Number(invoiceRow.total_amount),
    gstCollected: Number(invoiceRow.tax_amount),
    overdueInvoices: invoiceRow.overdue_n,
    overdueAmount: Number(invoiceRow.overdue_amount),
    newCustomers6mo: signupAgg[0]?.customers ?? 0,
    newProviders6mo: signupAgg[0]?.providers ?? 0,
    roleSwitches6mo: roleSwitchAgg[0]?.n ?? 0,
  };
}
