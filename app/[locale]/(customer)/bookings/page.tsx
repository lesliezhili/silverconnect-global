import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { BookingStatusBadge } from "@/components/domain/BookingStatusBadge";
import { CURRENCY_SYMBOL } from "@/components/domain/country";
import { cn } from "@/components/ui/cn";
import { getCountry } from "@/components/domain/countryCookie";
import {
  EmptyState,
  ErrorState,
  LoadingList,
} from "@/components/domain/PageStates";

const TABS = ["upcoming", "past", "recurring"] as const;
type Tab = (typeof TABS)[number];

const SAMPLE_UPCOMING = [
  {
    id: "BK-2024-1841",
    name: { zh: "李 师傅", en: "Helen Li" },
    initials: { zh: "李", en: "HL" },
    when: { zh: "5 月 8 日 周三 · 14:00", en: "Wed 8 May · 2:00pm" },
    status: "confirmed" as const,
    statusKey: "confirmed" as const,
    price: 195,
    hue: 0 as const,
  },
  {
    id: "BK-2024-1842",
    name: { zh: "陈 阿姨", en: "May Chen" },
    initials: { zh: "陈", en: "MC" },
    when: { zh: "5 月 12 日 周日 · 10:00", en: "Sun 12 May · 10:00am" },
    status: "pending" as const,
    statusKey: "pending" as const,
    price: 110,
    hue: 1 as const,
  },
];

export default async function BookingsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("booking");
  const tStatus = await getTranslations("booking.status");
  const tCommon = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const country = await getCountry();
  const sym = CURRENCY_SYMBOL[country];
  const lang: "zh" | "en" = locale === "zh" ? "zh" : "en";

  const rawTab = typeof sp.tab === "string" ? sp.tab : "upcoming";
  const tab: Tab = (TABS as readonly string[]).includes(rawTab) ? (rawTab as Tab) : "upcoming";
  const state = typeof sp.state === "string" ? sp.state : undefined;

  return (
    <>
      <Header country={country} />
      <main id="main-content" className="mx-auto w-full max-w-content pb-[120px] sm:pb-12">
        <nav
          aria-label={tNav("bookings")}
          className="flex border-b border-border bg-bg-base"
        >
          {TABS.map((k) => {
            const on = k === tab;
            return (
              <Link
                key={k}
                href={`/bookings?tab=${k}`}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-1 items-center justify-center text-[15px] font-medium",
                  on
                    ? "border-b-[3px] border-brand font-bold text-brand"
                    : "text-text-secondary"
                )}
              >
                {t(`tabs${k.charAt(0).toUpperCase() + k.slice(1)}` as Parameters<typeof t>[0])}
              </Link>
            );
          })}
        </nav>

        {state === "loading" && <LoadingList rows={3} rowHeight={140} />}
        {state === "error" && (
          <ErrorState
            title={t("errorLoad")}
            retryHref="/bookings"
            retryLabel={tCommon("retry")}
          />
        )}
        {state === "empty" && (
          <EmptyState
            title={t("noUpcoming")}
            cta={
              <Link
                href="/services"
                className="inline-flex h-14 items-center justify-center rounded-md bg-brand px-7 text-[17px] font-bold text-white"
              >
                {t("bookAClean")}
              </Link>
            }
          />
        )}

        {!state && (
        <ul className="flex flex-col gap-3 px-5 py-5">
          {tab === "upcoming" &&
            SAMPLE_UPCOMING.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/bookings/${b.id}`}
                  className="flex items-start gap-3 rounded-lg border border-border bg-bg-base p-4 shadow-card"
                >
                  <ProviderAvatar size={56} hue={b.hue} initials={b.initials[lang]} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-bold">{b.name[lang]}</p>
                    <p className="mt-0.5 text-[14px] text-text-tertiary">{b.when[lang]}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <BookingStatusBadge status={b.statusKey}>
                        {tStatus(b.statusKey)}
                      </BookingStatusBadge>
                      <span className="text-[16px] font-bold text-brand">
                        {sym}
                        {b.price}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          {tab !== "upcoming" && (
            <li className="rounded-md border border-border bg-bg-base p-8 text-center">
              <p className="text-[18px] font-bold">
                {tab === "past"
                  ? t("noPast")
                  : t("noRecurring")}
              </p>
              <p className="mt-1 text-[14px] text-text-secondary">
                {tab === "past" ? t("noPastHint") : t("noRecurringHint")}
              </p>
            </li>
          )}
        </ul>
        )}
      </main>
    </>
  );
}
