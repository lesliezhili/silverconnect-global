import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getCurrentUser } from "@/lib/auth/server";
import { getAccountSummary, isAuUser, verifyChain, PERK_CATALOG } from "@/lib/coins/ledger";
import { CoinWallet } from "./CoinWallet";

export const dynamic = "force-dynamic";

export default async function CoinsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  if (!me) redirect({ href: "/auth/login", locale });
  if (!(await isAuUser(me!.id))) redirect({ href: "/profile", locale });

  const country = await getCountry();
  const t = await getTranslations("coins");

  const summary = await getAccountSummary(me!.id);
  const chain = await verifyChain();

  return (
    <>
      <Header country={country} back signedIn initials={me!.initials} />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-elder-heading font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-body text-text-secondary">{t("subtitle")}</p>

        <CoinWallet
          initialBalance={summary.balance}
          initialUnlockedPerks={summary.unlockedPerks}
          initialLedger={summary.ledger.map((e) => ({
            id: e.id,
            entryRole: e.entryRole,
            amount: e.amount,
            reason: e.reason,
            hash: e.hash,
            createdAt: e.createdAt.toISOString(),
          }))}
          catalog={PERK_CATALOG}
          chainValid={chain.valid}
          chainChecked={chain.checked}
        />
      </main>
    </>
  );
}
