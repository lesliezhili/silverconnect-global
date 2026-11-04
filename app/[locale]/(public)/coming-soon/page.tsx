import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { LIVE_AREAS } from "@/lib/release";

export const dynamic = "force-dynamic";

/** Landing spot for features kept for later releases (see lib/release.ts FUTURE_ROUTES). */
export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const zh = locale === "zh" || locale === "zh_tw";
  const cities = LIVE_AREAS.map((a) => (zh ? a.cityZh : a.city)).join(zh ? "、" : " and ");

  return (
    <>
      <Header />
      <main className="mx-auto max-w-content px-5 pb-24 pt-10 text-center">
        <p className="text-[48px]" aria-hidden>🕒</p>
        <h1 className="mt-4 text-[26px] font-bold text-text-primary">
          {zh ? "此功能即将推出" : "Coming in a later release"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-[18px] text-text-secondary">
          {zh
            ? `目前我们在${cities}为长者提供上门清洁、园艺和杂工小修服务。`
            : `Right now we offer home cleaning, garden care and small handyman jobs for seniors in ${cities}.`}
        </p>
        <Link
          href="/services"
          className="mt-8 inline-flex h-14 items-center justify-center rounded-xl bg-brand px-8 text-[20px] font-bold text-white"
        >
          {zh ? "查看服务" : "See services"}
        </Link>
      </main>
    </>
  );
}
