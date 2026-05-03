import { setRequestLocale, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { S1TeaTime } from "@/components/illustrations";
import { ProviderCard } from "@/components/domain/ProviderCard";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { CURRENCY_SYMBOL } from "@/components/domain/country";
import {
  EmptyState,
  ErrorState,
  LoadingList,
} from "@/components/domain/PageStates";
import type { CountryCode } from "@/components/layout";
import { getCountry } from "@/components/domain/countryCookie";

interface Cat {
  key: "cleaning" | "cooking" | "garden" | "personalCare" | "repair";
  basePrice: number;
  iconBg: string;
  iconFg: string;
}

const CATS: Cat[] = [
  { key: "cleaning",     basePrice: 55, iconBg: "#E8F0FE", iconFg: "#1F6FEB" },
  { key: "cooking",      basePrice: 40, iconBg: "#FEF3C7", iconFg: "#F59E0B" },
  { key: "garden",       basePrice: 50, iconBg: "#DCFCE7", iconFg: "#16A34A" },
  { key: "personalCare", basePrice: 70, iconBg: "#FCE7F3", iconFg: "#DB2777" },
  { key: "repair",       basePrice: 60, iconBg: "#EDE9FE", iconFg: "#7C3AED" },
];

function pricePerHour(country: CountryCode, base: number, locale: string) {
  const cn = country === "CN";
  const value = cn ? base * 8 : base;
  const sym = CURRENCY_SYMBOL[country];
  return locale === "zh" ? `${sym}${value}/小时起` : `from ${sym}${value}/h`;
}

function CategoryIcon({ k }: { k: Cat["key"] }) {
  const labels: Record<Cat["key"], string> = {
    cleaning: "🧹",
    cooking: "🍳",
    garden: "🌿",
    personalCare: "🤝",
    repair: "🔧",
  };
  return <span aria-hidden className="text-2xl">{labels[k]}</span>;
}

export default async function CustomerHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tCat = await getTranslations("categories");
  const tCommon = await getTranslations("common");
  const country = await getCountry();
  const state = typeof sp.state === "string" ? sp.state : undefined;

  if (state === "loading") {
    return (
      <>
        <Header country={country} />
        <main className="mx-auto w-full max-w-content pb-[120px]">
          <LoadingList rows={5} rowHeight={140} />
        </main>
      </>
    );
  }

  if (state === "error") {
    return (
      <>
        <Header country={country} />
        <main className="mx-auto flex w-full max-w-content flex-col pb-[120px]">
          <ErrorState
            title={t("errorLoad")}
            retryHref="/home"
            retryLabel={tCommon("retry")}
          />
        </main>
      </>
    );
  }

  const isEmpty = state === "empty";

  return (
    <>
      <Header country={country} />
      <main className="mx-auto w-full max-w-content pb-[120px]">
        {/* Hero */}
        <section className="flex items-start justify-between gap-3 px-5 pb-1 pt-5">
          <div className="min-w-0 flex-1">
            <h1 className="text-[30px] font-extrabold leading-tight">
              {t("greeting", { name: "Margaret" })}
            </h1>
            <p className="mt-1.5 text-[17px] text-text-secondary">{t("prompt")}</p>
          </div>
          <div className="-mt-2 shrink-0">
            <S1TeaTime width={140} height={100} />
          </div>
        </section>

        {/* Search */}
        <div className="px-5 py-3">
          <input
            type="search"
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="block h-14 w-full rounded-md border-[1.5px] border-border-strong bg-bg-base px-4 text-[17px] text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none"
          />
        </div>

        {/* Categories */}
        <section className="px-5 pt-1">
          <h2 className="my-3 text-h3">{t("categoriesTitle")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {CATS.slice(0, 4).map((c) => (
              <Link
                key={c.key}
                href={`/services/${c.key}`}
                className="flex h-40 flex-col justify-between rounded-lg border border-border bg-bg-base p-4 shadow-card"
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-md"
                  style={{ background: c.iconBg, color: c.iconFg }}
                >
                  <CategoryIcon k={c.key} />
                </span>
                <span>
                  <span className="block text-[18px] font-bold text-text-primary">
                    {tCat(c.key)}
                  </span>
                  <span className="mt-0.5 block text-[14px] text-text-secondary">
                    {pricePerHour(country, c.basePrice, locale)}
                  </span>
                </span>
              </Link>
            ))}
            <Link
              href="/services/repair"
              className="col-span-2 flex h-40 items-center gap-4 rounded-lg border border-border bg-bg-base p-4 shadow-card"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-md"
                style={{ background: CATS[4].iconBg, color: CATS[4].iconFg }}
              >
                <CategoryIcon k="repair" />
              </span>
              <span className="flex-1">
                <span className="block text-[18px] font-bold text-text-primary">
                  {tCat("repair")}
                </span>
                <span className="mt-0.5 block text-[14px] text-text-secondary">
                  {pricePerHour(country, CATS[4].basePrice, locale)}
                </span>
              </span>
              <ChevronRight size={24} className="text-text-tertiary" aria-hidden />
            </Link>
          </div>
        </section>

        {/* Recently booked */}
        {!isEmpty && (
        <section className="pl-5 pt-5">
          <h2 className="text-h3">{t("recentTitle")}</h2>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1 pr-5">
            {[
              { name: locale === "zh" ? "李 师傅" : "Mr Li", svc: locale === "zh" ? "清洁" : "Cleaning", init: locale === "zh" ? "李" : "L", hue: 0 as const },
              { name: locale === "zh" ? "陈 阿姨" : "May Chen", svc: locale === "zh" ? "清洁" : "Cleaning", init: locale === "zh" ? "陈" : "M", hue: 1 as const },
            ].map((p) => (
              <article
                key={p.name}
                className="flex h-[120px] min-w-[240px] items-center gap-3 rounded-md border border-border bg-bg-base p-3.5"
              >
                <ProviderAvatar size={64} hue={p.hue} initials={p.init} />
                <div className="flex-1">
                  <p className="text-[16px] font-bold text-text-primary">{p.name}</p>
                  <p className="mt-0.5 text-[13px] text-text-secondary">{p.svc}</p>
                  <button
                    type="button"
                    className="mt-2 rounded-sm border-[1.5px] border-brand px-2.5 py-1 text-[13px] font-semibold text-brand"
                  >
                    {t("bookAgain")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        )}

        {isEmpty && (
          <p className="px-5 pt-3 text-[15px] font-semibold text-brand">
            {t("welcomeFirst")}
          </p>
        )}

        {/* Recommended */}
        {!isEmpty && (
        <section className="px-5 pb-4 pt-3">
          <h2 className="mb-3 text-h3">{t("recommendedTitle")}</h2>
          <ProviderCard
            country={country}
            provider={{
              id: "p1",
              name: locale === "zh" ? "林 阿姨" : "Jane Lin",
              initials: locale === "zh" ? "林" : "JL",
              hue: 3,
              rating: 4.9,
              reviews: 132,
              distanceKm: "2.1",
              pricePerHour: 55,
              verified: true,
              firstAid: true,
            }}
          />
        </section>
        )}
        {isEmpty && (
          <div className="mt-4 px-5">
            <EmptyState title={t("noRecent").replace(/^· /, "")} />
          </div>
        )}
      </main>
    </>
  );
}
