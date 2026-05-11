import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/layout/Header";
import { findDonationBySessionId } from "@/lib/donations/repository";

export const dynamic = "force-dynamic";

export const metadata = {
  // Block search engines from indexing post-checkout URLs (carry session_id).
  robots: { index: false, follow: false },
};

export default async function DonateSuccess({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  const { session_id } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("donate.success");

  let amountWithSymbol = "—";
  let email = "";
  let bodyKey: "bodyOnce" | "bodyMonthly" = "bodyOnce";
  if (session_id) {
    const donation = await findDonationBySessionId(session_id);
    if (donation) {
      amountWithSymbol = `$${(donation.amountCents / 100).toFixed(2)}`;
      bodyKey = donation.mode === "monthly" ? "bodyMonthly" : "bodyOnce";
      email = donation.donorEmail;
    }
  }

  // Each locale's bodyOnce / bodyMonthly is a complete sentence; we only
  // substitute `${amount}` (literal `$` + a `{amount}` token — t.raw bypasses
  // ICU so this is plain string replace) and `{email}`.
  const filled = (t.raw(bodyKey) as string)
    .replace("${amount}", amountWithSymbol)
    .replace("{email}", email || "");

  return (
    <>
      <Header />
      <main className="min-h-[60vh] flex items-center justify-center px-5 py-16">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4" aria-hidden>
            💙
          </div>
          <h1 className="text-h1 font-extrabold tracking-tight">{t("title")}</h1>
          <p className="mt-4 text-text-secondary leading-relaxed">{filled}</p>
          <Link
            href="/"
            className="mt-8 inline-flex min-h-touch-btn px-6 items-center justify-center rounded-md bg-brand text-white font-semibold hover:bg-brand-hover"
          >
            {t("cta")}
          </Link>
        </div>
      </main>
    </>
  );
}
