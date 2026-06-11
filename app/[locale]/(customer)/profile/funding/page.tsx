import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { FundingSetupForm } from "./FundingSetupForm";

export const dynamic = "force-dynamic";

export default async function FundingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  if (!me) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("funding");

  // Fetch existing funding claims for this user
  let claims: any[] = [];
  try {
    const result = await db.execute(sql`
      SELECT * FROM funding_claims
      WHERE customer_id = ${me!.id}
      ORDER BY created_at DESC
    `);
    claims = Array.isArray(result) ? result : (result as any).rows || [];
  } catch (e) {
    // Table may not exist yet — graceful fallback
    claims = [];
  }

  return (
    <>
      <Header country={country} back signedIn initials={me!.initials} />
      <main className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12">
        <h1 className="text-[28px] font-bold text-gray-900">
          {t("title")}
        </h1>
        <p className="mt-2 text-[18px] text-gray-600">
          {t("subtitle")}
        </p>

        {/* Existing Claims */}
        {claims.length > 0 && (
          <section className="mt-6">
            <h2 className="text-[22px] font-bold text-gray-900 mb-4">{t("yourClaims")}</h2>
            <ul className="flex flex-col gap-3">
              {claims.map((claim: any) => (
                <li key={claim.id} className="rounded-2xl border-2 border-gray-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-purple-100 px-3 py-1 text-[16px] font-bold text-purple-700 uppercase">
                      {claim.scheme}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-[14px] font-semibold ${
                      claim.status === "verified" ? "bg-green-100 text-green-700" :
                      claim.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                  <p className="mt-3 text-[20px] font-semibold text-gray-900">
                    {claim.claim_number}
                  </p>
                  {claim.service_scope && (
                    <p className="mt-1 text-[17px] text-gray-600">{claim.service_scope}</p>
                  )}
                  {claim.approval_letter_url && (
                    <a href={claim.approval_letter_url} target="_blank" rel="noopener"
                      className="mt-2 inline-flex items-center text-[17px] text-blue-600 font-medium">
                      📄 {t("viewLetter")}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Add New Funding Form */}
        <FundingSetupForm locale={locale} existingClaims={claims} />
      </main>
    </>
  );
}
