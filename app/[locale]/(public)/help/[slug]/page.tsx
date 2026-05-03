import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { findArticle, HELP_ARTICLES } from "@/components/domain/helpArticles";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const country = await getCountry();
  const session = await getSession();
  const t = await getTranslations("help");
  const lang: "zh" | "en" = locale === "zh" ? "zh" : "en";
  const article = findArticle(slug);

  if (!article) {
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
          className="mx-auto flex w-full max-w-content flex-col items-center gap-3 px-5 pb-12 pt-12 text-center"
        >
          <h1 className="text-h1">{t("notFoundTitle")}</h1>
          <p className="max-w-[320px] text-[15px] text-text-secondary">
            {t("notFoundSub")}
          </p>
          <Link
            href="/help"
            className="mt-2 inline-flex h-14 items-center rounded-md bg-brand px-7 text-[17px] font-bold text-white"
          >
            {t("backToHelp")}
          </Link>
        </main>
      </>
    );
  }

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
        className="mx-auto w-full max-w-content px-5 pb-12 pt-6"
      >
        <p className="text-[14px] font-semibold uppercase tracking-wider text-brand">
          {t(`category${article.category.charAt(0).toUpperCase() + article.category.slice(1)}` as Parameters<typeof t>[0])}
        </p>
        <h1 className="mt-1 text-h1">{article.title[lang]}</h1>
        <p className="mt-2 text-[14px] text-text-tertiary">
          {t("lastUpdated", { date: article.updated })}
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {article.body[lang].map((para, i) => (
            <p key={i} className="text-[17px] leading-relaxed text-text-primary">
              {para}
            </p>
          ))}
        </div>

        <Link
          href="/help"
          className="mt-8 inline-flex h-12 items-center text-[15px] font-semibold text-brand"
        >
          ← {t("backToHelp")}
        </Link>
      </main>
    </>
  );
}
