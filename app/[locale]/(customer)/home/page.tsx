import { setRequestLocale, getTranslations } from "next-intl/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { Header } from "@/components/layout/Header";
import { Link, redirect } from "@/i18n/navigation";
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
import { ScriptureBanner, ScriptureFooter } from "@/components/layout/ScriptureBanner";
import { RoleSwitchButton } from "@/components/domain/RoleSwitchButton";

export const dynamic = "force-dynamic";

type CatKey =
  | "cleaning"
  | "garden"
  | "repair"
  | "personalCare"
  | "companion"
  | "transport"
  | "itSupport";

const CAT_ICON_BG: Record<string, { bg: string; fg: string; emoji: string }> = {
  cleaning:        { bg: "#E8F0FE", fg: "#1F6FEB", emoji: "🧹" },
  garden:          { bg: "#DCFCE7", fg: "#16A34A", emoji: "🌿" },
  repair:          { bg: "#EDE9FE", fg: "#7C3AED", emoji: "🔧" },
  personalCare:    { bg: "#FCE7F3", fg: "#DB2777", emoji: "💊" },
  companion:       { bg: "#FEF3C7", fg: "#F59E0B", emoji: "👋" },
  transport:       { bg: "#FFF7ED", fg: "#EA580C", emoji: "🚗" },
  itSupport:       { bg: "#EFF6FF", fg: "#2563EB", emoji: "💻" },
  musicLesson:     { bg: "#FFF0F5", fg: "#C2185B", emoji: "🎵" },
  artClass:        { bg: "#F3E5F5", fg: "#6A1B9A", emoji: "🎨" },
  digitalLiteracy: { bg: "#E8F5E9", fg: "#1B5E20", emoji: "🤖" },
};

const FALLBACK_CATEGORIES = [
  { code: "cleaning",        sortOrder: 10 },
  { code: "garden",          sortOrder: 20 },
  { code: "repair",          sortOrder: 30 },
  { code: "personalCare",    sortOrder: 40 },
  { code: "companion",       sortOrder: 50 },
  { code: "transport",       sortOrder: 60 },
  { code: "itSupport",       sortOrder: 70 },
  { code: "musicLesson",     sortOrder: 80 },
  { code: "artClass",        sortOrder: 90 },
  { code: "digitalLiteracy", sortOrder: 100 },
];

const FALLBACK_HOURLY: Record<CountryCode, Record<string, number>> = {
  AU: { cleaning: 49, garden: 53, repair: 65, personalCare: 57, companion: 48, transport: 50, itSupport: 55, musicLesson: 60, artClass: 55, digitalLiteracy: 58 },
  CN: { cleaning: 25, garden: 22, repair: 35, personalCare: 30, companion: 22, transport: 28, itSupport: 30, musicLesson: 80, artClass: 70, digitalLiteracy: 65 },
  CA: { cleaning: 42, garden: 45, repair: 55, personalCare: 50, companion: 42, transport: 44, itSupport: 48, musicLesson: 55, artClass: 50, digitalLiteracy: 52 },
  US: { cleaning: 45, garden: 48, repair: 59, personalCare: 54, companion: 45, transport: 47, itSupport: 50, musicLesson: 58, artClass: 52, digitalLiteracy: 55 },
  TW: { cleaning: 350, garden: 310, repair: 490, personalCare: 420, companion: 310, transport: 390, itSupport: 400, musicLesson: 480, artClass: 420, digitalLiteracy: 450 },
  SG: { cleaning: 45, garden: 40, repair: 63, personalCare: 54, companion: 40, transport: 50, itSupport: 48, musicLesson: 60, artClass: 55, digitalLiteracy: 58 },
  HK: { cleaning: 150, garden: 130, repair: 210, personalCare: 180, companion: 130, transport: 170, itSupport: 160, musicLesson: 200, artClass: 180, digitalLiteracy: 190 },
  MY: { cleaning: 63, garden: 55, repair: 88, personalCare: 75, companion: 55, transport: 70, itSupport: 60, musicLesson: 80, artClass: 70, digitalLiteracy: 75 },
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
  const isZh = locale === "zh" || locale === "zh_tw";
  const t = await getTranslations("home");
  const tCat = await getTranslations("categories");
  const tCommon = await getTranslations("common");
  const country = await getCountry();
  const me = await getCurrentUser();
  if (!me) redirect({ href: "/auth/login", locale });
  const greetingName = me?.name ?? me?.email?.split("@")[0] ?? tCommon("guest");

  // ── Faith content (prayer widget) — only for opted-in Christian users ──
  // Faith content disabled until DB migration adds faith_preference column
  const showFaithContent = false;
  let devotional: { title?: string; scripture?: string; reference?: string; prayer?: string; type?: string } | null = null;
  if (showFaithContent) {
    try {
      const devResp = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "https://silverconnect-global.vercel.app"}/api/devotional?lang=${locale}`,
        { cache: "no-store" }
      );
      if (devResp.ok) {
        const devData = await devResp.json();
        devotional = devData.devotional || null;
      }
    } catch { /* graceful fallback */ }
  }


  // ----- Categories with min hourly price (per country) -----
  let catRows = FALLBACK_CATEGORIES;
  const minHourlyByCategory = new Map<string, number>(
    Object.entries(FALLBACK_HOURLY[country]),
  );

  try {
    catRows = await db
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
    minHourlyByCategory.clear();
    for (const r of minHourlyRows) {
      const hr = (Number(r.basePrice) * 60) / Math.max(1, r.durationMin);
      const prev = minHourlyByCategory.get(r.category);
      if (prev === undefined || hr < prev) {
        minHourlyByCategory.set(r.category, hr);
      }
    }
  } catch (error) {
    console.error("[home] Falling back to static category data", error);
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
  let recommended: {
    id: string;
    userId: string | null;
    providerName: string | null;
    providerEmail: string | null;
    ratingAvg: number;
    ratingCount: number;
  }[] = [];
  try {
    recommended = await db
      .select({
        id: providerProfiles.id,
        userId: providerProfiles.userId,
        providerName: users.name,
        providerEmail: users.email,
        ratingAvg: (sql<number>`coalesce(avg(${reviews.rating}), 0)::float`),
        ratingCount: (sql<number>`count(${reviews.id})::int`),
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
  } catch (error) {
    console.error("[home] Skipping recommended providers", error);
  }

  // Recommended provider's cheapest hourly (across the categories they offer).
  let recommendedHourly = 0;
  if (recommended.length) {
    try {
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
    } catch (error) {
      console.error("[home] Skipping recommended provider pricing", error);
    }
  }

  return (
    <>
      <Header
        country={country}
        signedIn={!!me}
        initials={me?.initials}
      />
      
      {me && (
        <div className="mx-auto w-full max-w-content px-5 pt-3">
          <RoleSwitchButton />
        </div>
      )}
      {showFaithContent && <ScriptureBanner />}
<main
        id="main-content"
        className="mx-auto w-full max-w-content pb-[120px] sm:pb-12"
      >
        <section className="flex items-start justify-between gap-3 px-5 pb-1 pt-5">
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-elder-heading font-extrabold leading-tight">
              {t("greeting", { name: greetingName })}
            </h1>
            <p className="mt-1.5 text-elder-body text-text-secondary">
              {t("prompt")}
            </p>
          </div>
          <div className="-mt-2 shrink-0">
            <S1TeaTime width={140} height={100} />
          </div>
        </section>

        {/* ── Faith content: prayer + ministry (Christian users only) ── */}
        {showFaithContent && devotional && (
          <section className="mx-5 mt-4 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-5 shadow-sm border border-amber-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🙏</span>
              <h3 className="text-[18px] font-bold text-amber-900">
                {locale === "zh" || locale === "zh_tw" ? "今日祷告" : locale === "vi" ? "Lời cầu nguyện" : locale === "ko" ? "오늘의 기도" : locale === "ja" ? "今日の祈り" : locale === "th" ? "บทสวดวันนี้" : "Today's Prayer"}
              </h3>
            </div>
            <p className="text-[15px] italic text-gray-700 leading-relaxed">&ldquo;{devotional.scripture}&rdquo;</p>
            <p className="mt-1 text-[13px] font-semibold text-amber-800">— {devotional.reference}</p>
            <p className="mt-3 text-[14px] text-gray-800 leading-relaxed">{devotional.prayer}</p>
          </section>
        )}

        {showFaithContent && (
          <section className="mx-5 mt-4 rounded-2xl border-2 border-indigo-200 bg-indigo-50 p-5">
            <h3 className="mb-2 text-[18px] font-bold text-gray-900">
              {locale === "zh" || locale === "zh_tw" ? "信仰与牧养" : locale === "vi" ? "Đức tin & Mục vụ" : locale === "ko" ? "신앙 & 사역" : locale === "ja" ? "信仰とミニストリー" : locale === "th" ? "ศรัทธาและศาสนกิจ" : "Faith & Ministry"}
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { e: "📖", label: locale === "zh" || locale === "zh_tw" ? "圣经研读" : "Bible Study" },
                { e: "🙏", label: locale === "zh" || locale === "zh_tw" ? "祷告小组" : "Prayer" },
                { e: "🎵", label: locale === "zh" || locale === "zh_tw" ? "敬拜赞美" : "Worship" },
                { e: "🏠", label: locale === "zh" || locale === "zh_tw" ? "牧养探访" : "Pastoral" },
              ].map((s) => (
                <Link key={s.label} href="/book-faith" className="flex flex-col items-center rounded-xl border border-indigo-200 bg-white p-3 active:scale-[0.96]" style={{ minHeight: "72px" }}>
                  <span className="text-[24px]">{s.e}</span>
                  <span className="text-[13px] font-semibold text-gray-800 text-center">{s.label}</span>
                </Link>
              ))}
            </div>
          </section>
        )}


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
            className="block h-14 w-full rounded-md border-[1.5px] border-border-strong bg-bg-base px-4 text-elder-body text-text-primary placeholder:text-text-tertiary focus:border-brand focus:outline-none"
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
                  className="flex h-44 flex-col justify-between rounded-lg border border-border bg-bg-base p-4 shadow-card"
                >
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-md"
                    style={{ background: meta.bg, color: meta.fg }}
                  >
                    <span aria-hidden className="text-2xl">
                      {meta.emoji}
                    </span>
                  </span>
                  <span>
                    <span className="block text-elder-body font-bold text-text-primary">
                      {tCat(c.code as CatKey)}
                    </span>
                    <span className="mt-0.5 block text-[17px] text-text-secondary">
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
                    <p className="text-elder-small font-bold text-text-primary">
                      {p.providerName}
                    </p>
                    <p className="mt-0.5 text-[16px] text-text-secondary">
                      {p.serviceCategory
                        ? tCat(p.serviceCategory as CatKey)
                        : ""}
                    </p>
                    <Link
                      href={`/providers/${p.providerProfileId}`}
                      className="mt-2 inline-flex rounded-sm border-[1.5px] border-brand px-2.5 py-1 text-[16px] font-semibold text-brand"
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
          <p className="px-5 pt-3 text-[17px] font-semibold text-brand">
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

        {/* ── 和润心语者 (Aged Mental Health) — CN platform only ── */}
        {country === "CN" && (
          <section className="mx-5 mt-5 mb-3">
            <Link
              href="/xinyuzhe"
              className="flex items-start gap-4 rounded-2xl bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 p-5 shadow-sm active:scale-[0.98] transition-transform"
            >
              <span className="text-[40px] shrink-0">🌸</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-elder-body font-bold text-gray-900">和润心语者</h3>
                  <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">老年心理健康</span>
                </div>
                <p className="text-[15px] text-gray-600 leading-relaxed">
                  专属情感陊伴 · 数字生命服务 · 心理健康支持
                </p>
                <p className="text-[14px] text-rose-600 font-semibold mt-1.5">了解更多 →</p>
              </div>
            </Link>
          </section>
        )}

      </main>
      {showFaithContent && <ScriptureFooter />}
    </>
  );
}
