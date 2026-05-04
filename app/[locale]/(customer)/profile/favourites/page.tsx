import { setRequestLocale, getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link, redirect } from "@/i18n/navigation";
import { ProviderCard } from "@/components/domain/ProviderCard";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { EmptyState } from "@/components/domain/PageStates";

const SAMPLE_FAVOURITES = [
  { id: "p1", initials: { zh: "李", en: "HL" }, name: { zh: "李 师傅", en: "Helen Li" }, hue: 0 as const, rating: 4.9, reviews: 132, distanceKm: "2.1", pricePerHour: 55 },
  { id: "p4", initials: { zh: "林", en: "JL" }, name: { zh: "林 阿姨", en: "Jane Lin" }, hue: 3 as const, rating: 4.7, reviews: 67, distanceKm: "4.8", pricePerHour: 52 },
];

export default async function ProfileFavouritesPage({
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
  if (!session.signedIn) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("favourites");
  const lang: "zh" | "en" = locale === "zh" ? "zh" : "en";
  const empty = sp.state === "empty";
  const items = empty ? [] : SAMPLE_FAVOURITES;

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
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-h2">{t("title")}</h1>

        {items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              illustration={Heart as never}
              title={t("empty")}
              hint={t("emptyHint")}
              cta={
                <Link
                  href="/services"
                  className="inline-flex h-14 items-center justify-center rounded-md bg-brand px-7 text-[17px] font-bold text-white"
                >
                  {t("browse")}
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="mt-5 flex flex-col gap-3">
            {items.map((p) => (
              <li key={p.id}>
                <ProviderCard
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
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
