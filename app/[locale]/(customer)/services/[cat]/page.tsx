import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { ProviderCard } from "@/components/domain/ProviderCard";
import { CURRENCY_SYMBOL, TAX_ABBR } from "@/components/domain/country";
import { getCountry } from "@/components/domain/countryCookie";

const FILTER_KEYS = ["rating", "distance", "language", "weekend", "female", "firstAid"] as const;

const PROVIDERS = [
  { id: "p1", name: { zh: "李 师傅", en: "Helen Li" }, initials: { zh: "李", en: "HL" }, rating: 4.9, reviews: 132, distanceKm: "2.1", pricePerHour: 55, hue: 0 as const },
  { id: "p2", name: { zh: "陈 阿姨", en: "May Chen" }, initials: { zh: "陈", en: "MC" }, rating: 4.8, reviews: 98, distanceKm: "3.5", pricePerHour: 60, hue: 1 as const },
  { id: "p3", name: { zh: "王 师傅", en: "Tom Wang" }, initials: { zh: "王", en: "TW" }, rating: 5.0, reviews: 215, distanceKm: "4.2", pricePerHour: 65, hue: 2 as const },
  { id: "p4", name: { zh: "林 阿姨", en: "Jane Lin" }, initials: { zh: "林", en: "JL" }, rating: 4.7, reviews: 67, distanceKm: "4.8", pricePerHour: 52, hue: 3 as const },
];

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
  const isZh = locale === "zh";
  const sym = CURRENCY_SYMBOL[country];
  const taxAbbr = TAX_ABBR[country];
  const lang: "zh" | "en" = isZh ? "zh" : "en";
  const catName = tCat(cat as Parameters<typeof tCat>[0]);

  return (
    <>
      <Header country={country} back />
      <main className="mx-auto w-full max-w-content px-5 pb-[120px] pt-3">
        <h1 className="text-h2">
          {isZh ? `${catName}（${country}）` : `${catName} (${country})`}
        </h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          {country === "CN"
            ? isZh
              ? `¥360–640/小时（含 ${taxAbbr}）`
              : `¥360–640/h (incl. ${taxAbbr})`
            : isZh
            ? `${sym}45–80/小时（含 ${taxAbbr}）`
            : `${sym}45–80/h (incl. ${taxAbbr})`}
        </p>

        <div className="mt-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {FILTER_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className="inline-flex h-12 shrink-0 items-center rounded-pill border-[1.5px] border-border-strong bg-bg-base px-4 text-[15px] font-semibold text-text-primary"
            >
              {t(`filters.${k}` as Parameters<typeof t>[0])}
            </button>
          ))}
          <button
            type="button"
            className="inline-flex h-12 shrink-0 items-center rounded-pill border-[1.5px] border-border-strong bg-bg-base px-3.5 text-[15px] font-semibold text-text-primary"
          >
            {t("sortRecommended")} ▾
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {PROVIDERS.map((p) => (
            <ProviderCard
              key={p.id}
              country={country}
              provider={{
                id: p.id,
                name: p.name[lang],
                initials: p.initials[lang],
                hue: p.hue,
                rating: p.rating,
                reviews: p.reviews,
                distanceKm: p.distanceKm,
                pricePerHour: p.pricePerHour,
                verified: true,
                firstAid: true,
              }}
            />
          ))}
        </div>
      </main>
    </>
  );
}
