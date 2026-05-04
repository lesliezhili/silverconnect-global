import { setRequestLocale, getTranslations } from "next-intl/server";
import { Image as ImageIcon } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { getAdmin } from "@/components/domain/adminCookie";
import {
  ANALYTICS_WEEKLY_ORDERS,
  ANALYTICS_KPIS,
} from "@/components/domain/adminMock";

type Range = "day" | "week" | "month" | "quarter" | "year";

const COUNTRY_COLOR: Record<string, string> = {
  AU: "bg-brand",
  CN: "bg-success",
  CA: "bg-warning",
};

export default async function AdminAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const admin = await getAdmin();
  if (!admin.signedIn) redirect({ href: "/admin/login", locale });
  const t = await getTranslations("admin");

  const rawRange = Array.isArray(sp.range) ? sp.range[0] : sp.range;
  const range: Range =
    rawRange === "day" ||
    rawRange === "month" ||
    rawRange === "quarter" ||
    rawRange === "year"
      ? rawRange
      : "week";

  const ranges: { key: Range; label: string }[] = [
    { key: "day", label: t("rangeDay") },
    { key: "week", label: t("rangeWeek") },
    { key: "month", label: t("rangeMonth") },
    { key: "quarter", label: t("rangeQuarter") },
    { key: "year", label: t("rangeYear") },
  ];

  const peak = Math.max(
    ...ANALYTICS_WEEKLY_ORDERS.flatMap((c) => c.values)
  );

  const kpiBlocks = [
    { label: t("metricReorder"), value: `${Math.round(ANALYTICS_KPIS.reorderRate * 100)}%` },
    { label: t("metricRating"), value: ANALYTICS_KPIS.avgRating.toFixed(1) },
    { label: t("metricDispute"), value: `${(ANALYTICS_KPIS.disputeRate * 100).toFixed(1)}%` },
    { label: t("metricAi"), value: `${Math.round(ANALYTICS_KPIS.aiResolutionRate * 100)}%` },
    { label: t("metricPayment"), value: `${(ANALYTICS_KPIS.paymentSuccess * 100).toFixed(1)}%` },
  ];

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <AdminShell email={admin.email ?? ""}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-h2">{t("analyticsTitle")}</h1>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-md border-[1.5px] border-border-strong bg-bg-base px-3 text-[13px] font-semibold text-text-primary"
        >
          <ImageIcon size={16} aria-hidden />
          {t("exportImage")}
        </button>
      </div>

      <nav role="tablist" className="mt-4 flex gap-2 overflow-x-auto">
        {ranges.map((r) => {
          const on = r.key === range;
          return (
            <Link
              key={r.key}
              href={`?range=${r.key}`}
              role="tab"
              aria-selected={on}
              className={
                "inline-flex h-9 items-center rounded-pill border-[1.5px] px-3 text-[13px] font-semibold " +
                (on
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-border-strong bg-bg-base text-text-primary")
              }
            >
              {r.label}
            </Link>
          );
        })}
      </nav>

      {/* Weekly orders by country */}
      <section className="mt-6 rounded-lg border border-border bg-bg-base p-5">
        <p className="text-[14px] font-bold">{t("metricOrders")}</p>
        <div className="mt-4 grid h-40 grid-cols-7 items-end gap-3">
          {days.map((_, i) => (
            <div key={i} className="flex h-full flex-col-reverse gap-1">
              {ANALYTICS_WEEKLY_ORDERS.map((c) => {
                const v = c.values[i];
                const h = Math.round((v / peak) * 140);
                return (
                  <div
                    key={c.country}
                    className={`rounded-t-sm ${COUNTRY_COLOR[c.country]}`}
                    style={{ height: `${Math.max(2, h / ANALYTICS_WEEKLY_ORDERS.length)}px` }}
                    aria-label={`${c.country} ${days[i]} ${v}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <ul className="mt-3 grid grid-cols-7 gap-3 text-center text-[11px] text-text-tertiary">
          {days.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
        <ul className="mt-4 flex flex-wrap gap-3 text-[12px]">
          {ANALYTICS_WEEKLY_ORDERS.map((c) => (
            <li key={c.country} className="flex items-center gap-1.5">
              <span aria-hidden className={`h-2.5 w-2.5 rounded-full ${COUNTRY_COLOR[c.country]}`} />
              <span>{t(`country${c.country}` as "countryAU" | "countryCN" | "countryCA")}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* KPI grid */}
      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {kpiBlocks.map((k) => (
          <div
            key={k.label}
            className="rounded-lg border border-border bg-bg-base p-4"
          >
            <p className="text-[12px] text-text-tertiary">{k.label}</p>
            <p className="mt-1 text-[22px] font-extrabold tabular-nums">
              {k.value}
            </p>
          </div>
        ))}
      </section>
    </AdminShell>
  );
}
