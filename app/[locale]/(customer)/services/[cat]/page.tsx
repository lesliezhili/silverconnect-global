import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { eq, and, desc, sql } from "drizzle-orm";
import { Header } from "@/components/layout/Header";
import { ProviderCard } from "@/components/domain/ProviderCard";
import { CURRENCY_SYMBOL, TAX_ABBR } from "@/components/domain/country";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { EmptyState } from "@/components/domain/PageStates";
import { db } from "@/lib/db";
import {
  serviceCategories,
  services,
  servicePrices,
} from "@/lib/db/schema/services";
import {
  providerProfiles,
  providerCategories,
} from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";
import { reviews } from "@/lib/db/schema/reviews";

export const dynamic = "force-dynamic";

type CatKey = "cleaning" | "companion" | "garden" | "personalCare" | "repair" | "transport" | "faith";

const VALID_CATS = ["cleaning", "companion", "garden", "personalCare", "repair", "transport", "faith"];

const CAT_EMOJI: Record<string, string> = {
  cleaning: "🧹",
  garden: "🌿",
  repair: "🔧",
  personalCare: "💊",
  companion: "👋",
  transport: "🚗",
  faith: "🙏",
};

function initialsOf(name: string | null, fallback: string): string {
  const src = (name || fallback).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (src.slice(0, 2) || "?").toUpperCase();
}

export default async function ProvidersByCategoryPage({
  params,
}: {
  params: Promise<{ locale: string; cat: string }>;
}) {
  const { locale, cat } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("providers");
  const tCat = await getTranslations("categories");
  const country = await getCountry();
  const session = await getSession();
  const isZh = locale === "zh" || locale === "zh_tw";
  const sym = CURRENCY_SYMBOL[country];
  const taxAbbr = TAX_ABBR[country];

  // Validate category is known
  if (!VALID_CATS.includes(cat)) notFound();

  const catName = tCat(cat as CatKey);
  const emoji = CAT_EMOJI[cat] ?? "📋";

  // DB queries — all wrapped in try/catch for resilience
  let hourlyLabel: string | null = null;
  let provs: Array<{
    id: string;
    userId: string;
    name: string | null;
    email: string | null;
    ratingAvg: number;
    ratingCount: number;
  }> = [];
  let cheapestHourly = 0;

  try {
    // Verify category exists in DB
    const [validCat] = await db
      .select({ code: serviceCategories.code })
      .from(serviceCategories)
      .where(
        and(
          eq(serviceCategories.code, cat),
          eq(serviceCategories.enabled, true),
        ),
      )
      .limit(1);

    // If DB has categories but this one isn't there, still show the page
    // (don't notFound — it's a valid category, just not seeded in DB)

    // Hourly price window
    const priceRows = await db
      .select({
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
      .where(
        and(
          eq(services.enabled, true),
          eq(services.categoryCode, cat),
        ),
      );

    let lo = Number.POSITIVE_INFINITY;
    let hi = 0;
    for (const r of priceRows) {
      const hr = (Number(r.basePrice) * 60) / Math.max(1, r.durationMin);
      lo = Math.min(lo, hr);
      hi = Math.max(hi, hr);
    }
    if (Number.isFinite(lo)) {
      hourlyLabel = `${sym}${Math.round(lo)}–${Math.round(hi)}`;
      cheapestHourly = Math.round(lo);
    }

    // Approved providers
    provs = await db
      .select({
        id: providerProfiles.id,
        userId: providerProfiles.userId,
        name: users.name,
        email: users.email,
        ratingAvg: (sql<number>`coalesce(avg(${reviews.rating}), 0)::float`),
        ratingCount: (sql<number>`count(${reviews.id})::int`),
      })
      .from(providerProfiles)
      .innerJoin(
        providerCategories,
        eq(providerCategories.providerId, providerProfiles.id),
      )
      .leftJoin(users, eq(users.id, providerProfiles.userId))
      .leftJoin(
        reviews,
        and(
          eq(reviews.providerId, providerProfiles.id),
          eq(reviews.status, "published"),
        ),
      )
      .where(
        and(
          eq(providerProfiles.onboardingStatus, "approved"),
          eq(providerCategories.category, cat as never),
        ),
      )
      .groupBy(providerProfiles.id, providerProfiles.userId, users.name, users.email)
      .orderBy(
        desc(sql`avg(${reviews.rating})`),
        desc(sql`count(${reviews.id})`),
      )
      .limit(50);
  } catch (error) {
    console.error(`[services/${cat}] DB unavailable`, error);
  }

  return (
    <>
      <Header
        country={country}
        back
        signedIn={session.signedIn}
        initials={session.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-5 sm:pb-12"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 items-center justify-center rounded-md bg-bg-surface text-2xl">
            {emoji}
          </span>
          <div>
            <h1 className="text-elder-subheading font-bold">
              {catName}
            </h1>
            {hourlyLabel && (
              <p className="mt-0.5 text-[16px] text-text-secondary">
                {isZh
                  ? `${hourlyLabel}/小时（含${taxAbbr}）`
                  : `${hourlyLabel}/h (incl. ${taxAbbr})`}
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-[17px] text-text-secondary">
          {tCat(`${cat}Desc` as Parameters<typeof tCat>[0])}
        </p>

        {provs.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              title={isZh ? "暂无可用服务人员" : "No providers available yet"}
            />
            <p className="mt-3 text-center text-[16px] text-text-secondary">
              {isZh
                ? "我们正在招募此区域的服务人员，请稍后再来查看。"
                : "We\'re recruiting providers in your area. Please check back soon."}
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            <p className="text-[16px] text-text-secondary">
              {isZh
                ? `${provs.length} 位可服务者`
                : `${provs.length} provider${provs.length === 1 ? "" : "s"} available`}
            </p>
            {provs.map((p, i) => (
              <ProviderCard
                key={p.id}
                country={country}
                provider={{
                  id: p.id,
                  name: p.name || (p.email?.split("@")[0] ?? "Provider"),
                  initials: initialsOf(p.name, p.email ?? "?"),
                  hue: (i % 4) as 0 | 1 | 2 | 3,
                  rating: Number(p.ratingAvg) || 0,
                  reviews: Number(p.ratingCount) || 0,
                  distanceKm: "—",
                  pricePerHour: cheapestHourly,
                  verified: true,
                  firstAid: false,
                }}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
