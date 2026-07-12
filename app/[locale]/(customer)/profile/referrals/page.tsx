import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { getOrCreateReferralCode } from "@/lib/referrals/actions";
import { CopyReferralLink } from "./CopyReferralLink";

export const dynamic = "force-dynamic";

interface BalanceRow {
  currency: string;
  total: string;
}

interface HistoryRow {
  id: string;
  status: string;
  createdAt: string;
  rewardedAt: string | null;
  refereeName: string | null;
  refereeEmail: string | null;
}

function rowsOf<T>(result: unknown): T[] {
  return Array.isArray(result) ? (result as T[]) : ((result as { rows: T[] }).rows ?? []);
}

export default async function ReferralsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  if (!me) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("referrals");

  const code = await getOrCreateReferralCode(me!.id);
  const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://silverconnect-global.vercel.app";
  const shareLink = `${BASE}/${locale}/auth/register?ref=${code}`;

  let balances: BalanceRow[] = [];
  let history: HistoryRow[] = [];
  try {
    const balanceResult = await db.execute(sql`
      SELECT currency, COALESCE(SUM(amount), 0)::text AS total
      FROM referral_credits WHERE user_id = ${me!.id}
      GROUP BY currency
    `);
    balances = rowsOf<BalanceRow>(balanceResult);

    const historyResult = await db.execute(sql`
      SELECT r.id, r.status, r.created_at AS "createdAt", r.rewarded_at AS "rewardedAt",
        u.name AS "refereeName", u.email AS "refereeEmail"
      FROM referrals r
      LEFT JOIN users u ON u.id = r.referee_user_id
      WHERE r.referrer_user_id = ${me!.id}
      ORDER BY r.created_at DESC
    `);
    history = rowsOf<HistoryRow>(historyResult);
  } catch (e) {
    console.error("[referrals] query failed", e);
  }

  return (
    <>
      <Header country={country} back signedIn initials={me!.initials} />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-elder-heading font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-body text-text-secondary">{t("subtitle")}</p>

        <section className="mt-6 rounded-lg border border-border bg-bg-base p-5">
          <p className="text-[16px] font-bold text-text-primary">{t("yourCode")}</p>
          <p className="mt-1 text-h2 font-extrabold tracking-widest text-brand">{code}</p>
          <p className="mt-3 text-[16px] text-text-secondary">{t("shareHint")}</p>
          <CopyReferralLink
            link={shareLink}
            copyLabel={t("copyLink")}
            copiedLabel={t("copied")}
          />
        </section>

        <section className="mt-4 rounded-lg border border-border bg-bg-base p-5">
          <p className="text-[16px] font-bold text-text-primary">{t("balance")}</p>
          {balances.length === 0 ? (
            <p className="mt-2 text-[17px] text-text-tertiary">{t("noBalance")}</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1">
              {balances.map((b) => (
                <li key={b.currency} className="text-h3 font-extrabold text-success">
                  {b.currency} {b.total}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-4">
          <p className="text-[16px] font-bold text-text-primary">{t("history")}</p>
          {history.length === 0 ? (
            <p className="mt-2 text-[17px] text-text-tertiary">{t("noHistory")}</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between rounded-md border border-border bg-bg-base px-4 py-3"
                >
                  <span className="min-w-0 truncate text-[16px] text-text-primary">
                    {h.refereeName || h.refereeEmail || "—"}
                  </span>
                  <span
                    className={
                      "shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-bold uppercase " +
                      (h.status === "rewarded"
                        ? "bg-success-soft text-success"
                        : "bg-bg-surface-2 text-text-secondary")
                    }
                  >
                    {h.status === "rewarded" ? t("statusRewarded") : t("statusPending")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
