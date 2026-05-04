import { setRequestLocale, getTranslations } from "next-intl/server";
import { ChevronRight, DollarSign } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link, redirect } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import {
  MOCK_JOBS,
  jobTotal,
  priceCountry,
  type ProviderJob,
} from "@/components/domain/providerMock";

function formatTime(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

export default async function ProviderWorkbenchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session.signedIn) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("provider");
  const tService = await getTranslations("categories");

  const todayJobs = MOCK_JOBS.filter((j) => isToday(j.startISO)).slice(0, 3);
  const heldEarnings = MOCK_JOBS.filter(
    (j) => j.status === "completed" || j.status === "inProgress"
  ).reduce((s, j) => s + jobTotal(j), 0);
  const paidEarnings = 320;

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
        <h1 className="text-h2">{t("greeting", { name: session.name ?? "" })}</h1>
        <p className="mt-1 text-[14px] text-text-tertiary">
          {new Date().toLocaleDateString(locale === "zh" ? "zh-CN" : "en-AU", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </p>

        {/* Earnings card */}
        <Link
          href="/provider/earnings"
          className="mt-5 flex items-center gap-4 rounded-lg border border-border bg-bg-base p-4"
        >
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-success-soft text-success"
          >
            <DollarSign size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] text-text-tertiary">
              {t("weekEarnings")}
            </p>
            <p className="mt-0.5 text-[24px] font-extrabold tabular-nums">
              {priceCountry(country, heldEarnings + paidEarnings)}
            </p>
            <p className="mt-1 text-[13px] text-text-secondary">
              <span className="text-warning">{t("held")}</span>{" "}
              <span className="tabular-nums font-semibold">
                {priceCountry(country, heldEarnings)}
              </span>
              <span className="mx-2 text-border-strong">·</span>
              <span className="text-success">{t("paid")}</span>{" "}
              <span className="tabular-nums font-semibold">
                {priceCountry(country, paidEarnings)}
              </span>
            </p>
          </div>
          <ChevronRight
            size={20}
            className="shrink-0 text-text-tertiary"
            aria-hidden
          />
        </Link>

        {/* Today's jobs */}
        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-bold">{t("todayJobs")}</h2>
            <Link
              href="/provider/jobs"
              className="text-[14px] font-semibold text-brand"
            >
              {t("seeAll")}
            </Link>
          </div>

          {todayJobs.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border-strong bg-bg-base p-6 text-center text-[15px] text-text-secondary">
              {t("noJobsToday")}
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {todayJobs.map((j) => (
                <JobRow
                  key={j.id}
                  j={j}
                  locale={locale}
                  service={tService(j.serviceKey)}
                  status={t(
                    `status${j.status.charAt(0).toUpperCase()}${j.status.slice(1)}` as Parameters<typeof t>[0]
                  )}
                  totalLabel={priceCountry(country, jobTotal(j))}
                />
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function JobRow({
  j,
  locale,
  service,
  status,
  totalLabel,
}: {
  j: ProviderJob;
  locale: string;
  service: string;
  status: string;
  totalLabel: string;
}) {
  return (
    <li>
      <Link
        href={`/provider/jobs/${j.id}`}
        className="flex items-center gap-3 rounded-lg border border-border bg-bg-base p-4"
      >
        <ProviderAvatar size={48} hue={2} initials={j.customerInitials} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <p className="text-[15px] font-bold tabular-nums">
              {formatTime(j.startISO, locale)}
            </p>
            <p className="text-[15px] font-semibold">{j.customerName}</p>
          </div>
          <p className="mt-0.5 text-[13px] text-text-secondary">
            {service} · {j.addressLine}
          </p>
          <p className="mt-0.5 text-[13px] font-semibold text-text-tertiary">
            <span className="tabular-nums">{totalLabel}</span>
            <span className="mx-2">·</span>
            <span>{status}</span>
          </p>
        </div>
        <ChevronRight
          size={20}
          className="shrink-0 text-text-tertiary"
          aria-hidden
        />
      </Link>
    </li>
  );
}
