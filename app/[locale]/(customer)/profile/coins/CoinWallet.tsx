"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";

type LedgerEntry = {
  id: string;
  entryRole: string;
  amount: string;
  reason: string;
  hash: string;
  createdAt: string;
};

type Catalog = Record<string, { cost: string; nameEn: string }>;

export function CoinWallet({
  initialBalance,
  initialUnlockedPerks,
  initialLedger,
  catalog,
  chainValid,
  chainChecked,
}: {
  initialBalance: string;
  initialUnlockedPerks: string[];
  initialLedger: LedgerEntry[];
  catalog: Catalog;
  chainValid: boolean;
  chainChecked: number;
}) {
  const t = useTranslations("coins");
  const [balance, setBalance] = React.useState(initialBalance);
  const [unlocked, setUnlocked] = React.useState(() => new Set(initialUnlockedPerks));
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  async function redeem(perkKey: string) {
    setPending(perkKey);
    setError("");
    try {
      const res = await fetch("/api/coins/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perkKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("redeemFailed"));
        return;
      }
      setBalance(data.balance);
      setUnlocked((prev) => new Set(prev).add(perkKey));
    } catch {
      setError(t("redeemFailed"));
    } finally {
      setPending(null);
    }
  }

  const visibleLedger = initialLedger.filter(
    (e) => e.entryRole === "credit" || e.entryRole === "debit",
  );

  return (
    <>
      <section className="mt-6 rounded-lg border border-border bg-bg-base p-5">
        <p className="text-[16px] font-bold text-text-primary">{t("balance")}</p>
        <p className="mt-1 text-h1 font-extrabold text-brand">{balance}</p>
        <p className="mt-1 text-[15px] text-text-tertiary">{t("balanceUnit")}</p>
        <div className="mt-3 flex items-center gap-2 text-[14px]">
          {chainValid ? (
            <>
              <ShieldCheck size={18} className="text-success" aria-hidden />
              <span className="font-semibold text-success">
                {t("chainValid", { count: chainChecked })}
              </span>
            </>
          ) : (
            <>
              <ShieldAlert size={18} className="text-danger" aria-hidden />
              <span className="font-semibold text-danger">{t("chainInvalid")}</span>
            </>
          )}
        </div>
      </section>

      {error && (
        <p className="mt-3 rounded-md bg-danger-soft px-4 py-3 text-[15px] text-danger">
          {error}
        </p>
      )}

      <section className="mt-4">
        <p className="text-[16px] font-bold text-text-primary">{t("redeemTitle")}</p>
        <ul className="mt-2 flex flex-col gap-3">
          {Object.entries(catalog).map(([key, perk]) => {
            const isUnlocked = unlocked.has(key);
            const canAfford = Number(balance) >= Number(perk.cost);
            return (
              <li
                key={key}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-bg-base p-5 shadow-card"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-elder-body font-bold text-text-primary">
                    {t(`perks.${key}.title` as Parameters<typeof t>[0])}
                  </p>
                  <p className="mt-1 text-[15px] text-text-secondary">
                    {t(`perks.${key}.desc` as Parameters<typeof t>[0])}
                  </p>
                  <p className="mt-1 text-[15px] font-bold text-brand">
                    {perk.cost} {t("balanceUnit")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={isUnlocked ? "secondary" : "primary"}
                  disabled={isUnlocked || !canAfford || pending === key}
                  onClick={() => redeem(key)}
                >
                  {isUnlocked ? t("unlocked") : pending === key ? t("redeeming") : t("redeem")}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-4">
        <p className="text-[16px] font-bold text-text-primary">{t("history")}</p>
        {visibleLedger.length === 0 ? (
          <p className="mt-2 text-[17px] text-text-tertiary">{t("noHistory")}</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {visibleLedger.map((e) => {
              const reasonKey = `reasons.${e.reason}` as Parameters<typeof t>[0];
              const label = t.has(reasonKey) ? t(reasonKey) : e.reason;
              return (
                <li key={e.id} className="rounded-md border border-border bg-bg-base px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[16px] text-text-primary">{label}</span>
                    <span
                      className={
                        "text-[16px] font-bold " +
                        (Number(e.amount) >= 0 ? "text-success" : "text-danger")
                      }
                    >
                      {Number(e.amount) >= 0 ? "+" : ""}
                      {e.amount}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[12px] text-text-tertiary" title={e.hash}>
                    {t("receipt")}: {e.hash.slice(0, 16)}…
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
