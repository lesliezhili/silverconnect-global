import { setRequestLocale, getTranslations } from "next-intl/server";
import { Heart } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { EmptyState } from "@/components/domain/PageStates";
import { sql } from "drizzle-orm";
import { FavouriteProviderCard } from "./FavouriteProviderCard";

export const dynamic = "force-dynamic";

export default async function FavouritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  if (!me) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("favourites");

  let favProviders: any[] = [];
  
  try {
    const result = await db.execute(sql`
      SELECT f.id as fav_id, f.provider_id, f.created_at,
             pp.bio, pp.service_radius_km, pp.avg_rating,
             u.full_name, u.avatar_url
      FROM favourites f
      JOIN provider_profiles pp ON pp.id = f.provider_id
      JOIN users u ON u.id = pp.user_id
      WHERE f.user_id = ${me!.id}
      ORDER BY f.created_at DESC
    `);
    favProviders = Array.isArray(result) ? result : (result as any).rows || [];
  } catch (error) {
    console.error("Favourites query error:", error);
    favProviders = [];
  }

  return (
    <>
      <Header country={country} back signedIn initials={me!.initials} />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-h2">{t("title")}</h1>

        {favProviders.length === 0 ? (
          <EmptyState
            icon={Heart}
            title={t("emptyTitle")}
            message={t("emptyMessage")}
          />
        ) : (
          <ul className="mt-6 flex flex-col gap-3">
            {favProviders.map((p: any) => (
              <li key={p.fav_id}>
                <FavouriteProviderCard
                  providerId={p.provider_id}
                  name={p.full_name || "Provider"}
                  rating={Number(p.avg_rating) || 0}
                  bio={p.bio || ""}
                  avatarUrl={p.avatar_url}
                  locale={locale}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
