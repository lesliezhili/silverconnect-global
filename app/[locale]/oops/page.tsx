import { setRequestLocale, getTranslations } from "next-intl/server";
import { AlertTriangle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";

export default async function OopsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  const country = await getCountry();
  const t = await getTranslations("oops");

  return (
    <>
      <Header country={country} signedIn={session.signedIn} initials={session.initials} />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-content flex-col items-center gap-3 px-5 pb-12 pt-12 text-center"
      >
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-warning-soft text-warning">
          <AlertTriangle size={56} aria-hidden />
        </span>
        <h1 className="text-h1">{t("title")}</h1>
        <p className="max-w-[340px] text-[16px] text-text-secondary">{t("sub")}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/home"
            className="inline-flex h-14 items-center rounded-md bg-brand px-7 text-[17px] font-bold text-white"
          >
            {t("home")}
          </Link>
          <Link
            href="/help"
            className="inline-flex h-14 items-center rounded-md border-[1.5px] border-border-strong bg-bg-base px-5 text-[15px] font-semibold text-text-primary"
          >
            {t("contact")}
          </Link>
        </div>
      </main>
    </>
  );
}
