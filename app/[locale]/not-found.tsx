import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { S3EmptyBookings } from "@/components/illustrations";

export default async function NotFound() {
  // Note: Next.js 16 App Router calls not-found.tsx without page params,
  // so locale comes from the surrounding [locale] layout's
  // setRequestLocale earlier in the request lifecycle.
  const t = await getTranslations("errors");
  const tCommon = await getTranslations("common");
  const tHome = await getTranslations("nav");

  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-content flex-col items-center justify-center gap-3 px-5 py-12 text-center"
    >
      <S3EmptyBookings width={220} height={150} />
      <h1 className="text-h1">{t("notFound")}</h1>
      <p className="max-w-[320px] text-[15px] text-text-secondary">
        {t("generic")}
      </p>
      <Link
        href="/home"
        className="mt-2 inline-flex h-14 items-center rounded-md bg-brand px-7 text-[17px] font-bold text-white"
      >
        {tHome("home")} →
      </Link>
      <Link
        href="/help"
        className="inline-flex h-12 items-center text-[15px] font-semibold text-brand"
      >
        {tCommon("askAI")}
      </Link>
    </main>
  );
}
