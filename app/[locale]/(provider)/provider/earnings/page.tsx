import { setRequestLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link, redirect } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { MOCK_JOBS, jobTotal, priceCountry } from "@/components/domain/providerMock";

type Range = "week" | "month" | "custom";

const PLATFORM_FEE_PCT = 0.18;

function inRange(d: Date, range: Range): boolean {
  const n = new Date();
  if (range === "week") {
    const lastWeek = new Date(n);
    lastWeek.setDate(n.getDate() - 7);
    return d >= lastWeek;
  }
  if (range === "month") {
    const lastMonth = new Date(n);
    lastMonth.setMonth(n.getMonth() - 1);
    return d >= lastMonth;
  }
  return true;
}

export default async function ProviderEarningsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session.signedIn) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("provider");
  const tService = await getTranslations("categories");

  const rawRange = Array.isArray(sp.range) ? sp.range[0] : sp.range;
  const range: Range = rawRange === "month" || rawRange === "custom" ? rawRange : "week";

  const jobs = MOCK_JOBS.filter((j) => inRange(new Date(j.startISO), range));
  const gross = jobs.reduce((s, j) => s + jobTotal(j), 0);
  const heldJobs = jobs.filter((j) => j.status === "completed" || j.status === "inProgress");
  const held = heldJobs.reduce((s, j) => s + jobTotal(j), 0);
  const paid = Math.max(gross - held, 0);
  const fee = Math.round(gross * PLATFORM_FEE_PCT);
  const net = gross - fee;

  // Sparkline-ish bar data: last 7 days of total earnings
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  const dayTotals = days.map((day) => {
    const k = day.toISOString().slice(0, 10);
    return jobs
      .filter((j) => j.startISO.slice(0, 10) === k)
      .reduce((s, j) => s + jobTotal(j), 0);
  });
  const peak = Math.max(1, ...dayTotals);

  const ranges: { key: Range; label: string }[] = [
    { key: "week", label: t("earnRangeWeek") },
    { key: "month", label: t("earnRangeMonth") },
    { key: "custom", label: t("earnRangeCustom") },
  ];

  return (
    <>
      <Header
        country={country}
        signedIn={session.signedIn}
        initials={session.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-h2">{t("earningsTitle")}</h1>

        {/* Range filter */}
        <nav role="tablist" className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide">
          {ranges.map((r) => {
            const on = r.key === range;
            return (
              <Link
                key={r.key}
                href={`?range=${r.key}`}
                role="tab"
                aria-selected={on}
                className={
                  "inline-flex h-10 items-center rounded-pill border-[1.5px] px-4 text-[14px] font-semibold " +
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

        {/* Top-line cards */}
        <section className="mt-5 grid grid-cols-2 gap-3">
          <Card label={t("earnGross")} value={priceCountry(country, gross)} />
          <Card label={t("earnNet")} value={priceCountry(country, net)} accent />
          <Card label={t("earnHeld")} value={priceCountry(country, held)} />
          <Card label={t("earnPaid")} value={priceCountry(country, paid)} />
        </section>

        <section className="mt-5 rounded-lg border border-border bg-bg-base p-4">
          <p className="text-[14px] font-bold">{t("earnFee")}</p>
          <p className="mt-1 text-[15px] tabular-nums">
            {priceCountry(country, fee)}{" "}
            <span className="text-text-tertiary">
              ({Math.round(PLATFORM_FEE_PCT * 100)}%)
            </span>
          </p>
        </section>

        {/* Trend (bar) */}
        <section className="mt-5 rounded-lg border border-border bg-bg-base p-4">
          <p className="text-[14px] font-bold">{t("earnRangeWeek")}</p>
          <div className="mt-4 grid h-24 grid-cols-7 items-end gap-2">
            {dayTotals.map((v, i) => {
              const h = Math.max(4, Math.round((v / peak) * 96));
              return (
                <div
                  key={i}
                  role="img"
                  className={"rounded-t-sm " + (v > 0 ? "bg-brand" : "bg-bg-surface-2")}
                  style={{ height: `${h}px` }}
                  aria-label={`${days[i].toLocaleDateString(locale === "zh" ? "zh-CN" : "en-AU", { month: "short", day: "numeric" })} ${priceCountry(country, v)}`}
                />
              );
            })}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2 text-center text-[11px] text-text-tertiary tabular-nums">
            {days.map((d, i) => (
              <div key={i}>{d.getDate()}</div>
            ))}
          </div>
        </section>

        {/* Job list */}
        <section className="mt-5">
          <ul className="overflow-hidden rounded-lg border border-border bg-bg-base">
            {jobs.length === 0 ? (
              <li className="p-5 text-[14px] text-text-tertiary">{t("payoutsEmpty")}</li>
            ) : (
              jobs.map((j, i) => (
                <li
                  key={j.id}
                  className={
                    "flex items-center gap-3 px-4 py-3.5 " +
                    (i > 0 ? "border-t border-border" : "")
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold">{tService(j.serviceKey)}</p>
                    <p className="mt-0.5 text-[12px] text-text-tertiary tabular-nums">
                      {new Date(j.startISO).toLocaleDateString(
                        locale === "zh" ? "zh-CN" : "en-AU",
                        { month: "short", day: "numeric" }
                      )}
                      {" · "}
                      {j.customerName}
                    </p>
                  </div>
                  <p className="tabular-nums text-[15px] font-semibold">
                    {priceCountry(country, jobTotal(j))}
                  </p>
                </li>
              ))
            )}
          </ul>
        </section>

        <button
          type="button"
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border-[1.5px] border-border-strong bg-bg-base text-[15px] font-semibold text-text-primary"
        >
          <Download size={18} aria-hidden />
          {t("earnExport")}
        </button>
      </main>
    </>
  );
}

function Card({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={
        "rounded-lg border bg-bg-base p-4 " +
        (accent ? "border-brand bg-brand-soft" : "border-border")
      }
    >
      <p className="text-[13px] text-text-tertiary">{label}</p>
      <p className={"mt-0.5 text-[22px] font-extrabold tabular-nums " + (accent ? "text-brand" : "")}>
        {value}
      </p>
    </div>
  );
}
