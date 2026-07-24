import { setRequestLocale, getTranslations } from "next-intl/server";
import { eq, and, sql } from "drizzle-orm";
import { ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { fmtPriceRange } from "@/components/domain/country";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { db } from "@/lib/db";
import {
  serviceCategories,
  services,
  servicePrices,
} from "@/lib/db/schema/services";
import {
  providerCategories,
  providerProfiles,
} from "@/lib/db/schema/providers";
import { reviews } from "@/lib/db/schema/reviews";

export const dynamic = "force-dynamic";

type CatKey =
  | "cleaning"
  | "companion"
  | "garden"
  | "personalCare"
  | "repair"
  | "transport";

const CAT_EMOJI: Record<string, string> = {
  faith: "🙏",
  cleaning: "🧹",
  garden: "🌿",
  repair: "🔧",
  personalCare: "💊",
  companion: "👋",
  transport: "🚗",
  mealDelivery: "🍱",
};

const FALLBACK_CATS = [
  { code: "cleaning", sortOrder: 10, requiresCertificate: false, suppliesProvidedBy: "either", parkingFeeApplies: false },
  { code: "garden", sortOrder: 20, requiresCertificate: false, suppliesProvidedBy: "provider", parkingFeeApplies: false },
  { code: "repair", sortOrder: 30, requiresCertificate: false, suppliesProvidedBy: "provider", parkingFeeApplies: true },
  { code: "personalCare", sortOrder: 40, requiresCertificate: true, suppliesProvidedBy: "either", parkingFeeApplies: false },
  { code: "companion", sortOrder: 50, requiresCertificate: false, suppliesProvidedBy: "customer", parkingFeeApplies: false },
  { code: "transport", sortOrder: 60, requiresCertificate: true, suppliesProvidedBy: "provider", parkingFeeApplies: true },
];

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const tCat = await getTranslations("categories");
  const tTax = await getTranslations("tax");
  const country = await getCountry();
  const session = await getSession();
  const isZh = locale === "zh" || locale === "zh_tw";

  // Categories — with fallback if DB unavailable
  let cats: (typeof FALLBACK_CATS)[number][] = FALLBACK_CATS;
  const ranges = new Map<string, { lo: number; hi: number }>();
  const countMap = new Map<string, number>();
  const ratingMap = new Map<string, number>();

  try {
    const dbCats = await db
      .select({
        code: serviceCategories.code,
        sortOrder: serviceCategories.sortOrder,
        requiresCertificate: serviceCategories.requiresCertificate,
        suppliesProvidedBy: serviceCategories.suppliesProvidedBy,
        parkingFeeApplies: serviceCategories.parkingFeeApplies,
      })
      .from(serviceCategories)
      .where(eq(serviceCategories.enabled, true))
      .orderBy(serviceCategories.sortOrder);

    if (dbCats.length > 0) cats = dbCats;
    // Faith services are opt-in and shown only to signed-in users.
    if (!session.signedIn) cats = cats.filter((c) => c.code !== "faith");

    // Average rating per category — from published reviews of approved
    // providers offering it. Drives the sort below, alongside
    // requiresCertificate: no-cert, well-reviewed categories (e.g.
    // cleaning) surface first since they're faster/easier to book than
    // categories needing a certified provider (e.g. personal care),
    // which typically have fewer available providers.
    const ratingRows = await db
      .select({
        category: providerCategories.category,
        avgRating: sql<number>`COALESCE(AVG(${reviews.rating}), 0)`,
      })
      .from(providerCategories)
      .innerJoin(providerProfiles, eq(providerProfiles.id, providerCategories.providerId))
      .innerJoin(reviews, and(eq(reviews.providerId, providerProfiles.id), eq(reviews.status, "published")))
      .where(eq(providerProfiles.onboardingStatus, "approved"))
      .groupBy(providerCategories.category);

    for (const r of ratingRows) {
      ratingMap.set(r.category as string, Number(r.avgRating));
    }

    cats = [...cats].sort((a, b) => {
      if (a.requiresCertificate !== b.requiresCertificate) {
        return a.requiresCertificate ? 1 : -1;
      }
      const ra = ratingMap.get(a.code) ?? 0;
      const rb = ratingMap.get(b.code) ?? 0;
      if (rb !== ra) return rb - ra;
      return a.sortOrder - b.sortOrder;
    });

    // Hourly rate window per category (this country)
    const priceRows = await db
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

    for (const r of priceRows) {
      const hr = (Number(r.basePrice) * 60) / Math.max(1, r.durationMin);
      const cur = ranges.get(r.category);
      if (!cur) ranges.set(r.category, { lo: hr, hi: hr });
      else ranges.set(r.category, { lo: Math.min(cur.lo, hr), hi: Math.max(cur.hi, hr) });
    }

    // Provider counts per category
    const counts = await db
      .select({
        category: providerCategories.category,
        n: (sql<number>`count(*)::int`),
      })
      .from(providerCategories)
      .innerJoin(
        providerProfiles,
        eq(providerProfiles.id, providerCategories.providerId),
      )
      .where(eq(providerProfiles.onboardingStatus, "approved"))
      .groupBy(providerCategories.category);

    for (const c of counts) {
      countMap.set(c.category as string, c.n);
    }
  } catch (error) {
    console.error("[services] DB unavailable, using fallback categories", error);
  }

  return (
    <>
      <Header
        country={country}
        signedIn={session.signedIn}
        initials={session.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-5 sm:pb-12"
      >
        <h1 className="text-elder-heading font-extrabold">{t("title")}</h1>

        {(country !== "CN" && country !== "HK") && (
        <div className="mt-4 flex h-12 items-center gap-2 rounded-md border border-border bg-bg-base px-4 text-[17px] text-text-secondary">
          <span aria-hidden>ℹ️</span>
          <span>{tTax("inclLine", { rate: country === "AU" ? "10% GST" : country === "CA" ? "13% HST" : country === "US" ? "8.25% Tax" : country === "SG" ? "9% GST" : country === "TW" ? "5% VAT" : country === "MY" ? "6% SST" : "" })}</span>
        </div>
        )}

        <ul className="mt-4 flex flex-col gap-3">
          {cats.map((c) => {
            const emoji = CAT_EMOJI[c.code] ?? "📋";
            const range = ranges.get(c.code);
            const lo = range ? Math.round(range.lo) : 0;
            const hi = range ? Math.round(range.hi) : 0;
            const providerCount = countMap.get(c.code) ?? 0;
            return (
              <li key={c.code}>
                <Link
                  href={`/services/${c.code}`}
                  className="flex min-h-[120px] cursor-pointer items-center gap-4 rounded-lg border border-border bg-bg-base p-5 shadow-card"
                >
                  <span
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-bg-surface text-2xl"
                    aria-hidden
                  >
                    {emoji}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-elder-body font-bold">
                      {tCat(c.code as CatKey)}
                    </span>
                    <span className="mt-1 block text-[16px] leading-tight text-text-secondary">
                      {tCat(`${c.code}Desc` as Parameters<typeof tCat>[0])}
                    </span>
                    {range && (
                      <span className="mt-2 block text-[18px] font-bold text-brand">
                        {fmtPriceRange(country, lo, hi)}
                        {isZh ? "/小时" : "/h"}
                      </span>
                    )}
                    {providerCount > 0 && (
                      <span className="mt-1 block text-[16px] text-text-tertiary">
                        {isZh
                          ? `${providerCount} 位可服务者`
                          : `${providerCount} provider${providerCount === 1 ? "" : "s"}`}
                      </span>
                    )}
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {c.requiresCertificate && (
                        <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[13px] font-semibold text-warning">
                          {t("certificateRequired")}
                        </span>
                      )}
                      <span className="rounded-full bg-bg-surface px-2 py-0.5 text-[13px] text-text-secondary">
                        {c.suppliesProvidedBy === "customer"
                          ? t("suppliesCustomer")
                          : c.suppliesProvidedBy === "either"
                            ? t("suppliesEither")
                            : t("suppliesProvider")}
                      </span>
                      {c.parkingFeeApplies && (
                        <span className="rounded-full bg-bg-surface px-2 py-0.5 text-[13px] text-text-secondary">
                          {t("parkingFeeMayApply")}
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronRight
                    size={24}
                    className="shrink-0 text-text-tertiary"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
