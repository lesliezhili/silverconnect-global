import { setRequestLocale, getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import {
  C3HelperMei,
  C4CookZhang,
  C5GardenerTom,
  C6NurseAnna,
  C7FixerBob,
} from "@/components/illustrations";
import { fmtPriceRange } from "@/components/domain/country";
import { getCountry } from "@/components/domain/countryCookie";
import { ErrorState, LoadingList } from "@/components/domain/PageStates";

const CATS = [
  { key: "cleaning", lo: 45, hi: 80, Char: C3HelperMei },
  { key: "cooking", lo: 40, hi: 70, Char: C4CookZhang },
  { key: "garden", lo: 50, hi: 90, Char: C5GardenerTom },
  { key: "personalCare", lo: 70, hi: 120, Char: C6NurseAnna },
  { key: "repair", lo: 60, hi: 110, Char: C7FixerBob },
] as const;

export default async function ServicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const tCat = await getTranslations("categories");
  const tTax = await getTranslations("tax.inclLine");
  const tCommon = await getTranslations("common");
  const country = await getCountry();
  const isZh = locale === "zh";
  const state = typeof sp.state === "string" ? sp.state : undefined;

  if (state === "loading") {
    return (
      <>
        <Header country={country} />
        <main id="main-content" className="mx-auto w-full max-w-content pb-[120px] sm:pb-12 pt-3">
          <LoadingList rows={5} rowHeight={200} />
        </main>
      </>
    );
  }
  if (state === "error") {
    return (
      <>
        <Header country={country} />
        <main id="main-content" className="mx-auto w-full max-w-content pb-[120px] sm:pb-12 pt-3">
          <ErrorState
            title={t("errorLoad")}
            retryHref="/services"
            retryLabel={tCommon("retry")}
          />
        </main>
      </>
    );
  }

  return (
    <>
      <Header country={country} />
      <main id="main-content" className="mx-auto w-full max-w-content px-5 pb-[120px] sm:pb-12 pt-5">
        <h1 className="text-[28px] font-extrabold">{t("title")}</h1>

        <div className="mt-4 flex h-12 items-center gap-2 rounded-md border border-border bg-bg-base px-4 text-[15px] text-text-secondary">
          <span aria-hidden>ℹ️</span>
          <span>{tTax(country)}</span>
        </div>

        <ul className="mt-4 flex flex-col gap-3">
          {CATS.map((c) => {
            const Char = c.Char;
            return (
              <li key={c.key}>
                <Link
                  href={`/services/${c.key}`}
                  className="flex h-[200px] cursor-pointer items-center gap-4 rounded-lg border border-border bg-bg-base p-4"
                >
                  <span className="shrink-0">
                    <Char size={120} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[22px] font-bold">{tCat(c.key)}</span>
                    <span className="mt-1.5 block text-[16px] leading-tight text-text-secondary">
                      {tCat(`${c.key}Desc`)}
                    </span>
                    <span className="mt-2.5 block text-[18px] font-bold text-brand">
                      {fmtPriceRange(country, c.lo, c.hi)}
                      {isZh ? "/小时" : "/h"}
                    </span>
                  </span>
                  <ChevronRight size={24} className="shrink-0 text-text-tertiary" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
