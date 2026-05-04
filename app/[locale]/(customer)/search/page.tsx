import { setRequestLocale, getTranslations } from "next-intl/server";
import { Search as SearchIcon } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";

interface ProviderHit {
  id: string;
  name: { en: string; zh: string };
  initials: { en: string; zh: string };
  serviceKey: "cleaning" | "cooking" | "garden" | "personalCare" | "repair";
  rating: number;
}

const PROVIDERS: ProviderHit[] = [
  { id: "p1", name: { zh: "李 师傅", en: "Helen Li" }, initials: { zh: "李", en: "HL" }, serviceKey: "cleaning", rating: 4.9 },
  { id: "p2", name: { zh: "陈 阿姨", en: "May Chen" }, initials: { zh: "陈", en: "MC" }, serviceKey: "cooking", rating: 4.8 },
  { id: "p3", name: { zh: "王 师傅", en: "Tom Wang" }, initials: { zh: "王", en: "TW" }, serviceKey: "garden", rating: 5.0 },
  { id: "p4", name: { zh: "刘 阿姨", en: "Sarah Liu" }, initials: { zh: "刘", en: "SL" }, serviceKey: "personalCare", rating: 4.7 },
];

const HELP_ARTICLES = [
  { slug: "how-to-book", titleEn: "How to book a service", titleZh: "如何预订服务" },
  { slug: "refund-policy", titleEn: "Refund policy", titleZh: "退款政策" },
  { slug: "safety", titleEn: "Staying safe", titleZh: "如何保持安全" },
  { slug: "payment", titleEn: "Accepted payment methods", titleZh: "支持的支付方式" },
  { slug: "family", titleEn: "Adding family members", titleZh: "添加家人成员" },
];

const CATEGORIES = ["cleaning", "cooking", "garden", "personalCare", "repair"] as const;

function score(needle: string, haystack: string): number {
  const a = needle.toLowerCase().trim();
  const b = haystack.toLowerCase();
  if (!a) return 0;
  if (b === a) return 100;
  if (b.startsWith(a)) return 80;
  if (b.includes(a)) return 60;
  return 0;
}

export default async function SearchPage({
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
  const country = await getCountry();
  const t = await getTranslations("search");
  const tCategories = await getTranslations("categories");
  const tHelp = await getTranslations("help");

  const q = typeof sp.q === "string" ? sp.q : "";
  const isZh = locale === "zh";

  const providers = q
    ? PROVIDERS.map((p) => ({
        ...p,
        s: Math.max(
          score(q, p.name[locale === "zh" ? "zh" : "en"]),
          score(q, tCategories(p.serviceKey))
        ),
      })).filter((p) => p.s > 0).sort((a, b) => b.s - a.s)
    : [];

  const services = q
    ? CATEGORIES.map((c) => ({
        key: c,
        label: tCategories(c),
        s: score(q, tCategories(c)),
      })).filter((c) => c.s > 0).sort((a, b) => b.s - a.s)
    : [];

  const articles = q
    ? HELP_ARTICLES.map((a) => ({
        ...a,
        s: score(q, isZh ? a.titleZh : a.titleEn),
      })).filter((a) => a.s > 0).sort((a, b) => b.s - a.s)
    : [];

  const empty = q && providers.length === 0 && services.length === 0 && articles.length === 0;

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
        <h1 className="text-h2">{t("title")}</h1>

        <form method="get" className="mt-4 flex gap-2">
          <label htmlFor="q" className="sr-only">
            {t("title")}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t("placeholder")}
            autoComplete="off"
            className="block h-touch-btn flex-1 rounded-md border-[1.5px] border-border-strong bg-bg-base px-4 text-body text-text-primary placeholder:text-text-placeholder focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex h-touch-btn items-center gap-2 rounded-md bg-brand px-5 text-[15px] font-bold text-white"
          >
            <SearchIcon size={16} aria-hidden />
            {t("button")}
          </button>
        </form>

        {!q && (
          <p className="mt-6 text-center text-[14px] text-text-tertiary">
            {t("submitToSearch")}
          </p>
        )}

        {q && (
          <h2 className="mt-6 text-[18px] font-bold">
            {t("resultsFor", { q })}
          </h2>
        )}

        {empty && (
          <p className="mt-4 rounded-lg border border-dashed border-border-strong bg-bg-base px-5 py-8 text-center text-[14px] text-text-secondary">
            {t("noResults")}
          </p>
        )}

        {providers.length > 0 && (
          <section className="mt-5">
            <h3 className="text-[14px] font-bold uppercase tracking-wide text-text-tertiary">
              {t("sectionProviders")}
            </h3>
            <ul className="mt-2 flex flex-col gap-2">
              {providers.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/providers/${p.id}`}
                    className="flex items-center gap-3 rounded-lg border border-border bg-bg-base p-3"
                  >
                    <ProviderAvatar size={44} hue={1} initials={p.initials[isZh ? "zh" : "en"]} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold">{p.name[isZh ? "zh" : "en"]}</p>
                      <p className="text-[13px] text-text-tertiary">
                        {tCategories(p.serviceKey)} · ★ {p.rating.toFixed(1)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {services.length > 0 && (
          <section className="mt-5">
            <h3 className="text-[14px] font-bold uppercase tracking-wide text-text-tertiary">
              {t("sectionServices")}
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {services.map((c) => (
                <li key={c.key}>
                  <Link
                    href={`/services/${c.key}`}
                    className="inline-flex h-10 items-center rounded-pill border-[1.5px] border-brand bg-brand-soft px-4 text-[14px] font-semibold text-brand"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {articles.length > 0 && (
          <section className="mt-5">
            <h3 className="text-[14px] font-bold uppercase tracking-wide text-text-tertiary">
              {t("sectionHelp")}
            </h3>
            <ul className="mt-2 flex flex-col gap-2">
              {articles.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/help/${a.slug}`}
                    className="block rounded-lg border border-border bg-bg-base p-3 text-[14px] font-semibold text-text-primary"
                  >
                    {isZh ? a.titleZh : a.titleEn}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
