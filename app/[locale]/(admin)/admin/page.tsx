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
import { Link, redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { getAdmin } from "@/components/domain/adminCookie";
import { ADMIN_KPI, ADMIN_ALERTS } from "@/components/domain/adminMock";

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

  const kpis = [
    { Icon: ShoppingBag, label: t("kpiNewOrders"), value: ADMIN_KPI.newOrdersToday, hint: "today" },
    { Icon: Scale, label: t("kpiOpenDisputes"), value: ADMIN_KPI.openDisputes, accent: ADMIN_KPI.openDisputes > 0 },
    { Icon: Users, label: t("kpiPendingProviders"), value: ADMIN_KPI.pendingProviders },
    { Icon: ShieldAlert, label: t("kpiSafetyEvents"), value: ADMIN_KPI.safetyEvents, accent: ADMIN_KPI.safetyEvents > 0 },
    {
      Icon: TrendingUp,
      label: t("kpiGmv"),
      value: `$${ADMIN_KPI.gmvWeek.toLocaleString(locale === "zh" ? "zh-CN" : "en-AU")}`,
    },
    {
      Icon: Bot,
      label: t("kpiAi"),
      value: `${Math.round(ADMIN_KPI.aiResolutionRate * 100)}%`,
    },
  ];

  return (
    <AdminShell email={admin.email ?? ""}>
      <h1 className="text-h2">{t("overviewTitle")}</h1>

      {/* Alerts */}
      {ADMIN_ALERTS.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {ADMIN_ALERTS.map((a) => (
            <li
              key={a.key}
              className={
                "flex items-start gap-2 rounded-md border-[1.5px] p-3 text-[14px] " +
                (a.severity === "danger"
                  ? "border-danger bg-danger-soft text-danger"
                  : "border-warning bg-warning-soft text-warning")
              }
            >
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
              <span className="font-semibold">{t(a.key as Parameters<typeof t>[0])}</span>
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
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-md " +
                  (k.accent
                    ? "bg-warning-soft text-warning"
                    : "bg-brand-soft text-brand")
                }
              >
                <k.Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-text-tertiary">{k.label}</p>
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
        <p className="text-[14px] font-bold text-text-secondary">{t("quickLinks")}</p>
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand"
                >
                  <q.Icon size={20} />
                </span>
                <span className="flex-1 text-[15px] font-bold">{q.label}</span>
                <ArrowRight size={18} className="text-text-tertiary" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
