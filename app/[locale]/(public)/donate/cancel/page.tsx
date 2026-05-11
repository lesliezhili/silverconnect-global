import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/Header";

export const metadata = { robots: { index: false, follow: false } };

export default async function DonateCancel({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("donate.cancel");
  return (
    <>
      <Header />
      <main className="min-h-[60vh] flex items-center justify-center px-5 py-16">
        <div className="max-w-md text-center">
          <h1 className="text-h1 font-extrabold tracking-tight">{t("title")}</h1>
          <p className="mt-4 text-text-secondary leading-relaxed">{t("body")}</p>
          <Link
            href="/donate"
            className="mt-8 inline-flex min-h-touch-btn px-6 items-center justify-center rounded-md bg-brand text-white font-semibold hover:bg-brand-hover"
          >
            {t("cta")}
          </Link>
        </div>
      </main>
    </>
  );
}
