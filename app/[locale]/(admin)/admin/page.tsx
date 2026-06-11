import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  ShoppingBag,
  Scale,
  Users,
  ShieldAlert,
  TrendingUp,
  Bot,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { and, eq, gte, sql } from "drizzle-orm";
import { Link, redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { getAdmin } from "@/components/domain/adminCookie";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import { disputes } from "@/lib/db/schema/disputes";
import { providerProfiles } from "@/lib/db/schema/providers";
import { safetyEvents } from "@/lib/db/schema/safety";
import { aiConversations } from "@/lib/db/schema/ai";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const admin = await getAdmin();
  if (!admin.signedIn) redirect({ href: "/admin/login", locale });
  const t = await getTranslations("admin");

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  try {
    const [newOrdersRow] = await db
      .select({ n: (sql<number>`count(*)::int`) })
      .from(bookings)
      .where(gte(bookings.createdAt, startOfDay));
    const [openDisputesRow] = await db
      .select({ n: (sql<number>`count(*)::int`) })
      .from(disputes)
      .where(eq(disputes.status, "open"));
    const [pendingProvidersRow] = await db
      .select({ n: (sql<number>`count(*)::int`) })
      .from(providerProfiles)
      .where(eq(providerProfiles.onboardingStatus, "pending"));
    const [openSafetyRow] = await db
      .select({ n: (sql<number>`count(*)::int`) })
      .from(safetyEvents)
      .where(eq(safetyEvents.status, "open"));
    const [gmvRow] = await db
      .select({
        total: (sql<number>`coalesce(sum(${bookings.totalPrice}::numeric), 0)::float`),
      })
      .from(bookings)
      .where(
        and(
          gte(bookings.createdAt, sevenDaysAgo),
          sql`${bookings.status} in ('completed','released')`,
        ),
      );
    const [aiAgg] = await db
      .select({
        total: (sql<number>`count(*)::int`),
        resolved: (sql<number>`count(*) filter (where ${aiConversations.closedAt} is not null)::int`),
      })
      .from(aiConversations)
      .where(gte(aiConversations.createdAt, sevenDaysAgo));
    const aiResolutionRate =
      aiAgg && aiAgg.total > 0 ? aiAgg.resolved / aiAgg.total : 0;

    const newOrdersToday = newOrdersRow?.n ?? 0;
    const openDisputes = openDisputesRow?.n ?? 0;
    const pendingProviders = pendingProvidersRow?.n ?? 0;
    const safetyEventsCount = openSafetyRow?.n ?? 0;
    const gmvWeek = Number(gmvRow?.total ?? 0);

    const alerts: { key: string; severity: "warn" | "danger" }[] = [];
    if (safetyEventsCount > 0)
      alerts.push({ key: "alertSafetyOpen", severity: "danger" });
    if (openDisputes >= 5)
      alerts.push({ key: "alertWebhookLag", severity: "warn" });

    const kpis = [
      { Icon: ShoppingBag, label: t("kpiNewOrders"), value: newOrdersToday, hint: "today" },
      {
        Icon: Scale,
        label: t("kpiOpenDisputes"),
        value: openDisputes,
        accent: openDisputes > 0,
      },
      {
        Icon: Users,
        label: t("kpiPendingProviders"),
        value: pendingProviders,
      },
      {
        Icon: ShieldAlert,
        label: t("kpiSafetyEvents"),
        value: safetyEventsCount,
        accent: safetyEventsCount > 0,
      },
      {
        Icon: TrendingUp,
        label: t("kpiGmv"),
        value: `$${gmvWeek.toLocaleString(locale === "zh" ? "zh-CN" : "en-AU", { maximumFractionDigits: 0 })}`,
      },
      {
        Icon: Bot,
        label: t("kpiAi"),
        value: `${Math.round(aiResolutionRate * 100)}%`,
      },
    ];


    return (
      <AdminShell email={admin.email ?? ""}>
        <h1 className="text-h2">{t("overviewTitle")}</h1>

        {/* Alerts */}
        {alerts.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {alerts.map((a) => (
              <li
                key={a.key}
                className={
                  "flex items-start gap-2 rounded-md border-[1.5px] p-3 text-[16px] " +
                  (a.severity === "danger"
                    ? "border-danger bg-danger-soft text-danger"
                    : "border-warning bg-warning-soft text-warning")
                }
              >
                <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
                <span className="font-semibold">
                  {t(a.key as Parameters<typeof t>[0])}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* KPI grid */}
        <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((k) => (
            <div
              key={k.label}
              className={
                "rounded-lg border bg-bg-base p-4 " +
                (k.accent ? "border-warning" : "border-border")
              }
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={
                    "flex h-12 w-10 shrink-0 items-center justify-center rounded-md " +
                    (k.accent
                      ? "bg-warning-soft text-warning"
                      : "bg-brand-soft text-brand")
                  }
                >
                  <k.Icon size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] text-text-tertiary">{k.label}</p>
                  <p className="mt-0.5 text-[24px] font-extrabold tabular-nums">
                    {k.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Quick links */}
        <section className="mt-8">
          <p className="text-[16px] font-bold text-text-secondary">{t("quickLinks")}</p>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { href: "/admin/disputes", label: t("reviewDisputes"), Icon: Scale },
              { href: "/admin/safety", label: t("reviewSafety"), Icon: ShieldAlert },
              { href: "/admin/providers", label: t("reviewProviders"), Icon: Users },
            ].map((q) => (
              <li key={q.href}>
                <Link
                  href={q.href}
                  className="flex items-center gap-3 rounded-lg border border-border bg-bg-base p-4 hover:border-brand"
                >
                  <span
                    aria-hidden
                    className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand"
                  >
                    <q.Icon size={20} />
                  </span>
                  <span className="flex-1 text-[17px] font-bold">{q.label}</span>
                  <ArrowRight size={18} className="text-text-tertiary" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </AdminShell>
    );
  } catch (error) {
    console.error("[admin] DB unavailable", error);
    return (
      <main className="mx-auto w-full max-w-content px-5 py-12 text-center">
        <p className="text-[48px]">⏳</p>
        <h1 className="mt-4 text-[22px] font-bold">Service Temporarily Unavailable</h1>
        <p className="mt-2 text-[17px] text-text-secondary">Please try again shortly.</p>
      </main>
    );
  }
}
