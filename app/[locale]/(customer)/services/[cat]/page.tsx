import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { ProviderCard } from "@/components/domain/ProviderCard";
import { CURRENCY_SYMBOL, TAX_ABBR } from "@/components/domain/country";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { EmptyState } from "@/components/domain/PageStates";
import { isReleaseCategory } from "@/lib/release";
import { Link } from "@/i18n/navigation";
import { isReleaseCountry, liveAreasFor, type ReleaseCategory, type ReleaseCountry } from "@/lib/release";
import { EFFORT_TIERS, TIER_SCOPE, priceFor } from "@/lib/release-pricing";
import { eligibleProviders } from "@/lib/trust";

/** Placeholder customer id for anonymous visitors (no pair blocks apply). */
const ANON_CUSTOMER = "00000000-0000-0000-0000-000000000000";

export const dynamic = "force-dynamic";

type CatKey = "cleaning" | "companion" | "garden" | "personalCare" | "repair" | "transport" | "faith" | "mealDelivery";

const VALID_CATS = ["cleaning", "companion", "garden", "personalCare", "repair", "transport", "faith", "mealDelivery"];

const CAT_EMOJI: Record<string, string> = {
  cleaning: "🧹",
  garden: "🌿",
  repair: "🔧",
  personalCare: "💊",
  companion: "👋",
  transport: "🚗",
  faith: "🙏",
  mealDelivery: "🍱",
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
  // Release 1 only exposes cleaning / garden (lib/release.ts)
  if (!VALID_CATS.includes(cat) || !isReleaseCategory(cat)) notFound();

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

  // Release 1: standard tier prices + trust-gated providers.
  const relCountry: ReleaseCountry = isReleaseCountry(country) ? country : "AU";
  const relCat = cat as ReleaseCategory;
  const taxRate = liveAreasFor(relCountry)[0]?.tax.rate ?? 0;
  const tiers = EFFORT_TIERS.map((tier) => ({ tier, ...priceFor({ country: relCountry, category: relCat, tier, taxRate }) }));
  cheapestHourly = Math.round(tiers[0].hourly);
  hourlyLabel = `${sym}${Math.round(tiers[0].hourly)}–${Math.round(tiers[2].hourly)}`;
  try {
    provs = (await eligibleProviders(cat, session.userId ?? ANON_CUSTOMER, relCountry)).map((p) => ({
      id: p.id,
      userId: p.userId,
      name: p.providerName,
      email: p.providerEmail,
      ratingAvg: p.avgRating,
      ratingCount: p.reviewCount,
    }));
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
                  ? `${hourlyLabel}/小时（不含${taxAbbr}）`
                  : `${hourlyLabel}/h (ex ${taxAbbr})`}
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-[17px] text-text-secondary">
          {tCat(`${cat}Desc` as Parameters<typeof tCat>[0])}
        </p>

        <section className="mt-5 rounded-lg border border-border bg-bg-base p-4">
          <h2 className="text-[18px] font-bold">{isZh ? "标准价格" : "Standard prices"}</h2>
          <ul className="mt-2 flex flex-col divide-y divide-border">
            {tiers.map((p) => (
              <li key={p.tier} className="py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[17px] font-semibold">
                    {isZh ? { regular: "常规", medium: "中度", high: "高强度" }[p.tier] : { regular: "Regular", medium: "Medium effort", high: "High effort" }[p.tier]}
                    {" · "}{p.hours}h
                  </span>
                  <span className="text-[17px] font-bold text-brand tabular-nums">{sym}{p.base.toFixed(0)}</span>
                </div>
                <p className="mt-0.5 text-[15px] text-text-secondary">{isZh ? TIER_SCOPE[relCat][p.tier].zh : TIER_SCOPE[relCat][p.tier].en}</p>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[14px] text-text-tertiary">
            {isZh
              ? "常规为固定价格。中度/高强度首次按此价格，之后服务者可按实际用时报价，需您确认。"
              : "Regular is a fixed price. Medium/high: first visit at this price; the provider may then quote later visits from the real time — you approve."}
          </p>
          <Link
            href={`/bookings/new?step=1&cat=${cat}`}
            className="mt-3 flex h-14 items-center justify-center rounded-md bg-brand text-[18px] font-bold text-white"
          >
            {isZh ? "立即预约" : "Book now"}
          </Link>
        </section>

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
                category={cat}
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
