import { setRequestLocale, getTranslations } from "next-intl/server";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { S1TeaTime } from "@/components/illustrations";
import { ProviderCard } from "@/components/domain/ProviderCard";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { CURRENCY_SYMBOL } from "@/components/domain/country";
import { EmptyState } from "@/components/domain/PageStates";
import type { CountryCode } from "@/components/layout";
import { getCountry } from "@/components/domain/countryCookie";
import { db } from "@/lib/db";
import { serviceCategories, services, servicePrices } from "@/lib/db/schema/services";
import {
  providerProfiles,
  providerCategories,
} from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";
import { bookings } from "@/lib/db/schema/bookings";
import { reviews } from "@/lib/db/schema/reviews";
import { getCurrentUser } from "@/lib/auth/server";

type CatKey =
  | "cleaning"
  | "cooking"
  | "garden"
  | "personalCare"
  | "repair";

const CAT_ICON_BG: Record<string, { bg: string; fg: string; emoji: string }> = {
  cleaning:     { bg: "#E8F0FE", fg: "#1F6FEB", emoji: "🧹" },
  cooking:      { bg: "#FEF3C7", fg: "#F59E0B", emoji: "🍳" },
  garden:       { bg: "#DCFCE7", fg: "#16A34A", emoji: "🌿" },
  personalCare: { bg: "#FCE7F3", fg: "#DB2777", emoji: "🤝" },
  repair:       { bg: "#EDE9FE", fg: "#7C3AED", emoji: "🔧" },
};

function priceFromHourly(country: CountryCode, baseHr: number, locale: string) {
  const sym = CURRENCY_SYMBOL[country];
  return locale === "zh" ? `${sym}${baseHr}/小时起` : `from ${sym}${baseHr}/h`;
}

function initialsOf(name: string | null, fallback: string): string {
  const src = (name || fallback).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (src.slice(0, 2) || "?").toUpperCase();
}

export default async function CustomerHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tCat = await getTranslations("categories");
  const tCommon = await getTranslations("common");
  const country = await getCountry();
  const me = await getCurrentUser();
  const greetingName = me?.name ?? me?.email.split("@")[0] ?? tCommon("guest");

  // ----- Categories with min hourly price (per country) -----
  const catRows = await db
    .select({
      code: serviceCategories.code,
      sortOrder: serviceCategories.sortOrder,
    })
    .from(serviceCategories)
    .where(eq(serviceCategories.enabled, true))
    .orderBy(serviceCategories.sortOrder);

  // Cheapest hourly rate per category for the user's country.
  // Hourly = base_price / (duration_min / 60).
  const minHourlyRows = await db
    .select({
      category: services.categoryCode,
      basePrice: servicePrices.basePrice,
      durationMin: services.durationMin,
    })
    .from(services)
    .innerJoin(
      servicePrices,
      and(
        eq(servicePrices.serviceId, services.id),
        eq(servicePrices.country, country),
      ),
    )
    .where(eq(services.enabled, true));
  const minHourlyByCategory = new Map<string, number>();
  for (const r of minHourlyRows) {
    const hr = (Number(r.basePrice) * 60) / Math.max(1, r.durationMin);
    const prev = minHourlyByCategory.get(r.category);
    if (prev === undefined || hr < prev) {
      minHourlyByCategory.set(r.category, hr);
    }
  }

  // ----- Recently booked: last 4 distinct providers from this user's bookings -----
  const recentProviders: {
    providerProfileId: string;
    providerName: string;
    serviceCategory: string | null;
    initials: string;
  }[] = [];
  if (me) {
    const recentBookings = await db
      .select({
        providerId: bookings.providerId,
        serviceCategory: services.categoryCode,
        providerName: users.name,
        providerEmail: users.email,
      })
      .from(bookings)
      .leftJoin(services, eq(services.id, bookings.serviceId))
      .leftJoin(
        providerProfiles,
        eq(providerProfiles.id, bookings.providerId),
      )
      .leftJoin(users, eq(users.id, providerProfiles.userId))
      .where(eq(bookings.customerId, me.id))
      .orderBy(desc(bookings.createdAt))
      .limit(20);
    const seen = new Set<string>();
    for (const b of recentBookings) {
      if (!b.providerId || seen.has(b.providerId)) continue;
      seen.add(b.providerId);
      recentProviders.push({
        providerProfileId: b.providerId,
        providerName:
          b.providerName || (b.providerEmail?.split("@")[0] ?? "Provider"),
        serviceCategory: b.serviceCategory,
        initials: initialsOf(b.providerName, b.providerEmail ?? "?"),
      });
      if (recentProviders.length >= 4) break;
    }
  }

  // ----- Recommended: top approved provider by avg rating -----
  // (single-row featured card; multi-row carousel can be a Wave 7 polish)
  const recommended = await db
    .select({
      id: providerProfiles.id,
      userId: providerProfiles.userId,
      providerName: users.name,
      providerEmail: users.email,
      ratingAvg: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
      ratingCount: sql<number>`count(${reviews.id})::int`,
    })
    .from(providerProfiles)
    .leftJoin(users, eq(users.id, providerProfiles.userId))
    .leftJoin(
      reviews,
      and(
        eq(reviews.providerId, providerProfiles.id),
        eq(reviews.status, "published"),
      ),
    )
    .where(eq(providerProfiles.onboardingStatus, "approved"))
    .groupBy(providerProfiles.id, users.name, users.email)
    .orderBy(desc(sql`avg(${reviews.rating})`), desc(sql`count(${reviews.id})`))
    .limit(1);

  // Recommended provider's cheapest hourly (across the categories they offer).
  let recommendedHourly = 0;
  if (recommended.length) {
    const provCats = await db
      .select({ category: providerCategories.category })
      .from(providerCategories)
      .where(eq(providerCategories.providerId, recommended[0].id));
    const codes = provCats.map((c) => c.category as string);
    if (codes.length) {
      const min = Array.from(minHourlyByCategory.entries()).filter(([k]) =>
        codes.includes(k),
      );
      const cheapest = min
        .map(([, v]) => v)
        .reduce((a, b) => Math.min(a, b), Number.POSITIVE_INFINITY);
      if (Number.isFinite(cheapest)) recommendedHourly = Math.round(cheapest);
    }
  }

  return (
    <>
      <Header
        country={country}
        signedIn={!!me}
        initials={me?.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content pb-[120px] sm:pb-12"
      >
        <section className="flex items-start justify-between gap-3 px-5 pb-1 pt-5">
          <div className="min-w-0 flex-1">
            <h1 className="text-[30px] font-extrabold leading-tight">
              {t("greeting", { name: greetingName })}
            </h1>
            <p className="mt-1.5 text-[17px] text-text-secondary">
              {t("prompt")}
            </p>
          </div>
          <div className="-mt-2 shrink-0">
            <S1TeaTime width={140} height={100} />
          </div>
        </section>

        <form
          action={`/${locale}/search`}
          method="get"
          className="px-5 py-3"
        >
          <input
            type="search"
            name="q"
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchAria")}
            className="block h-14 w-full rounded-md border-[1.5px] border-border-strong bg-bg-base px-4 text-[17px] text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none"
          />
        </form>

        <section className="px-5 pt-1">
          <h2 className="my-3 text-h3">{t("categoriesTitle")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {catRows.map((c) => {
              const meta = CAT_ICON_BG[c.code] ?? {
                bg: "#E8F0FE",
                fg: "#1F6FEB",
                emoji: "•",
              };
              const hr = minHourlyByCategory.get(c.code);
              return (
                <Link
                  key={c.code}
                  href={`/services/${c.code}`}
                  className="flex h-40 flex-col justify-between rounded-lg border border-border bg-bg-base p-4 shadow-card"
                >
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-md"
                    style={{ background: meta.bg, color: meta.fg }}
                  >
                    <span aria-hidden className="text-2xl">
                      {meta.emoji}
                    </span>
                  </span>
                  <span>
                    <span className="block text-[18px] font-bold text-text-primary">
                      {tCat(c.code as CatKey)}
                    </span>
                    <span className="mt-0.5 block text-[14px] text-text-secondary">
                      {hr
                        ? priceFromHourly(country, Math.round(hr), locale)
                        : ""}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {me && recentProviders.length > 0 && (
          <section className="pl-5 pt-5">
            <h2 className="text-h3">{t("recentTitle")}</h2>
            <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-hide pb-1 pr-5">
              {recentProviders.map((p) => (
                <article
                  key={p.providerProfileId}
                  className="flex h-[120px] min-w-[240px] items-center gap-3 rounded-md border border-border bg-bg-base p-3.5"
                >
                  <ProviderAvatar size={64} hue={0} initials={p.initials} />
                  <div className="flex-1">
                    <p className="text-[16px] font-bold text-text-primary">
                      {p.providerName}
                    </p>
                    <p className="mt-0.5 text-[13px] text-text-secondary">
                      {p.serviceCategory
                        ? tCat(p.serviceCategory as CatKey)
                        : ""}
                    </p>
                    <Link
                      href={`/providers/${p.providerProfileId}`}
                      className="mt-2 inline-flex rounded-sm border-[1.5px] border-brand px-2.5 py-1 text-[13px] font-semibold text-brand"
                    >
                      {t("bookAgain")}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {!me && (
          <p className="px-5 pt-3 text-[15px] font-semibold text-brand">
            {t("welcomeFirst")}
          </p>
        )}

        {recommended.length > 0 ? (
          <section className="px-5 pb-4 pt-3">
            <h2 className="mb-3 text-h3">{t("recommendedTitle")}</h2>
            <ProviderCard
              country={country}
              provider={{
                id: recommended[0].id,
                name:
                  recommended[0].providerName ||
                  (recommended[0].providerEmail?.split("@")[0] ?? "Provider"),
                initials: initialsOf(
                  recommended[0].providerName,
                  recommended[0].providerEmail ?? "?",
                ),
                hue: 0,
                rating: Number(recommended[0].ratingAvg) || 0,
                reviews: Number(recommended[0].ratingCount) || 0,
                distanceKm: "—",
                pricePerHour: recommendedHourly || 0,
                verified: true,
                firstAid: false,
              }}
            />
          </section>
        ) : me ? (
          <div className="mt-4 px-5">
            <EmptyState title={t("noRecent").replace(/^· /, "")} />
          </div>
        ) : null}
      </main>
    </>
  );
}
