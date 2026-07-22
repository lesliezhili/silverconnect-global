import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";

export const dynamic = "force-dynamic";

const ITEMS = [
  { key: "robot", emoji: "🤖", price: "$2,500 – $8,000" },
  { key: "monitoring", emoji: "📹", price: "$150 – $1,200" },
  { key: "wheelchair", emoji: "♿", price: "$300 – $6,000" },
] as const;

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("products");
  const country = await getCountry();
  const session = await getSession();

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
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-5 sm:pb-12"
      >
        <h1 className="text-elder-heading font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-[17px] text-text-secondary">{t("subtitle")}</p>

        <ul className="mt-4 flex flex-col gap-3">
          {ITEMS.map((it) => (
            <li
              key={it.key}
              className="flex min-h-[120px] items-center gap-4 rounded-lg border border-border bg-bg-base p-5 shadow-card"
            >
              <span
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-bg-surface text-2xl"
                aria-hidden
              >
                {it.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-elder-body font-bold">
                  {t(`${it.key}.title`)}
                </span>
                <span className="mt-1 block text-[16px] leading-tight text-text-secondary">
                  {t(`${it.key}.desc`)}
                </span>
                <span className="mt-2 block text-[18px] font-bold text-brand">
                  {it.price}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <a
          href="mailto:info@harfoundation.org.au?subject=Product%20enquiry"
          className="mt-6 flex min-h-[56px] items-center justify-center rounded-lg border border-border bg-bg-base px-5 text-[17px] font-bold text-brand shadow-card"
        >
          {t("contact")}
        </a>
      </main>
    </>
  );
}
