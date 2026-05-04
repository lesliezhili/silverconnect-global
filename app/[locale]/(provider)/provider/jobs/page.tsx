import { setRequestLocale, getTranslations } from "next-intl/server";
import { ChevronRight, MapPin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link, redirect } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { EmptyState } from "@/components/domain/PageStates";
import {
  MOCK_JOBS,
  jobTotal,
  priceCountry,
  type ProviderJob,
} from "@/components/domain/providerMock";
import { ListChecks } from "lucide-react";

type Tab = "today" | "week" | "history";

function isToday(d: Date) {
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}
function withinNext7Days(d: Date) {
  const n = new Date();
  const inSevenDays = new Date(n);
  inSevenDays.setDate(n.getDate() + 7);
  return d >= n && d <= inSevenDays;
}

function filterJobs(tab: Tab): ProviderJob[] {
  return MOCK_JOBS.filter((j) => {
    const d = new Date(j.startISO);
    if (tab === "today") return isToday(d);
    if (tab === "week") return withinNext7Days(d) && !isToday(d);
    return j.status === "completed" || j.status === "cancelled" || d < new Date();
  }).sort((a, b) => +new Date(a.startISO) - +new Date(b.startISO));
}

export default async function ProviderJobsPage({
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

  const rawTab = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab: Tab =
    rawTab === "week" || rawTab === "history" ? rawTab : "today";

  const jobs = filterJobs(tab);
  const tabs: { key: Tab; label: string }[] = [
    { key: "today", label: t("jobsTabToday") },
    { key: "week", label: t("jobsTabWeek") },
    { key: "history", label: t("jobsTabHistory") },
  ];
  const emptyKey =
    tab === "today" ? "jobsEmptyToday" : tab === "week" ? "jobsEmptyWeek" : "jobsEmptyHistory";

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
        <h1 className="text-h2">{t("navJobs")}</h1>

        {/* Tabs */}
        <nav
          role="tablist"
          aria-label={t("navJobs")}
          className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide"
        >
          {tabs.map((tb) => {
            const on = tb.key === tab;
            return (
              <Link
                key={tb.key}
                href={`?tab=${tb.key}`}
                role="tab"
                aria-selected={on}
                className={
                  "inline-flex h-10 items-center rounded-pill border-[1.5px] px-4 text-[14px] font-semibold " +
                  (on
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border-strong bg-bg-base text-text-primary")
                }
              >
                {tb.label}
              </Link>
            );
          })}
        </nav>

        {jobs.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              illustration={ListChecks as never}
              title={t(emptyKey)}
              hint={t("availabilityHint")}
            />
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {jobs.map((j) => (
              <JobCard
                key={j.id}
                j={j}
                locale={locale}
                service={tService(j.serviceKey)}
                status={t(
                  `status${j.status.charAt(0).toUpperCase()}${j.status.slice(1)}` as Parameters<typeof t>[0]
                )}
                kmLabel={t("distanceKm", { km: j.distanceKm.toFixed(1) })}
                totalLabel={priceCountry(country, jobTotal(j))}
              />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function JobCard({
  j,
  locale,
  service,
  status,
  kmLabel,
  totalLabel,
}: {
  j: ProviderJob;
  locale: string;
  service: string;
  status: string;
  kmLabel: string;
  totalLabel: string;
}) {
  const d = new Date(j.startISO);
  const dateLabel = d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-AU", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeLabel = d.toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <li>
      <Link
        href={`/provider/jobs/${j.id}`}
        className="flex items-start gap-3 rounded-lg border border-border bg-bg-base p-4"
      >
        <ProviderAvatar size={48} hue={2} initials={j.customerInitials} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-text-tertiary tabular-nums">
              {dateLabel} · {timeLabel}
            </p>
          </div>
          <p className="mt-0.5 text-[16px] font-bold">{j.customerName}</p>
          <p className="mt-0.5 text-[14px] text-text-secondary">{service}</p>
          <p className="mt-1 flex items-center gap-1 text-[13px] text-text-tertiary">
            <MapPin size={14} aria-hidden />
            <span className="truncate">{j.addressLine}</span>
            <span className="mx-1">·</span>
            <span className="tabular-nums">{kmLabel}</span>
          </p>
          <p className="mt-1 text-[14px] font-semibold tabular-nums">
            {totalLabel}
            <span className="ml-2 font-normal text-text-tertiary">· {status}</span>
          </p>
        </div>
        <ChevronRight
          size={20}
          className="mt-2 shrink-0 text-text-tertiary"
          aria-hidden
        />
      </Link>
    </li>
  );
}
