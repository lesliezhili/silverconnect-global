import { setRequestLocale, getTranslations } from "next-intl/server";
import { desc, eq } from "drizzle-orm";
import { AdminShell } from "@/components/layout/AdminShell";
import { getAdmin } from "@/components/domain/adminCookie";
import { redirect } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { donations } from "@/lib/db/schema/donations";
import { users } from "@/lib/db/schema/users";

export const dynamic = "force-dynamic";

function statusBadgeClass(s: string): string {
  switch (s) {
    case "succeeded":
      return "bg-success-soft text-success";
    case "failed":
      return "bg-danger-soft text-danger";
    default:
      return "bg-bg-surface-2 text-text-secondary";
  }
}

export default async function AdminDonationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const admin = await getAdmin();
  if (!admin.signedIn) redirect({ href: "/admin/login", locale });
  const t = await getTranslations("admin");

  let rows: {
    id: string;
    amount: string;
    currency: string;
    status: string;
    isAnonymous: boolean;
    message: string | null;
    createdAt: Date;
    donorName: string | null;
    donorEmail: string | null;
    accountName: string | null;
  }[] = [];
  let totalsByCurrency: Record<string, number> = {};

  try {
    rows = await db
      .select({
        id: donations.id,
        amount: donations.amount,
        currency: donations.currency,
        status: donations.status,
        isAnonymous: donations.isAnonymous,
        message: donations.message,
        createdAt: donations.createdAt,
        donorName: donations.donorName,
        donorEmail: donations.donorEmail,
        accountName: users.name,
      })
      .from(donations)
      .leftJoin(users, eq(users.id, donations.donorUserId))
      .orderBy(desc(donations.createdAt))
      .limit(200);

    for (const r of rows) {
      if (r.status !== "succeeded") continue;
      totalsByCurrency[r.currency] = (totalsByCurrency[r.currency] || 0) + Number(r.amount);
    }
  } catch (error) {
    console.error("[admin/donations] DB unavailable", error);
  }

  return (
    <AdminShell email={admin.email ?? ""}>
      <h1 className="text-h2">{t("donationsTitle")}</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        {Object.keys(totalsByCurrency).length === 0 ? (
          <div className="rounded-lg border border-border bg-bg-base px-4 py-3">
            <p className="text-[16px] text-text-tertiary">{t("donationsNoneYet")}</p>
          </div>
        ) : (
          Object.entries(totalsByCurrency).map(([currency, total]) => (
            <div key={currency} className="rounded-lg border border-border bg-bg-base px-4 py-3">
              <p className="text-[13px] font-semibold uppercase text-text-tertiary">{currency}</p>
              <p className="text-h3 font-extrabold text-success">{total.toFixed(2)}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-bg-base">
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-center text-[16px] text-text-tertiary">
            {t("donationsNoneYet")}
          </p>
        ) : (
          <table className="w-full text-left text-[17px]">
            <thead className="border-b border-border bg-bg-surface-2 text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-[16px] font-semibold uppercase tracking-wide">
                  {t("colDonor")}
                </th>
                <th className="px-4 py-3 text-[16px] font-semibold uppercase tracking-wide">
                  {t("colAmount")}
                </th>
                <th className="px-4 py-3 text-[16px] font-semibold uppercase tracking-wide">
                  {t("colAppliedAt")}
                </th>
                <th className="px-4 py-3 text-[16px] font-semibold uppercase tracking-wide">
                  {t("colStatus")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const dispName = r.isAnonymous
                  ? t("donationsAnonymous")
                  : r.donorName || r.accountName || r.donorEmail || "—";
                return (
                  <tr key={r.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <span className="block font-bold text-text-primary">{dispName}</span>
                      {r.message && (
                        <span className="mt-0.5 block text-[15px] text-text-tertiary">
                          &ldquo;{r.message}&rdquo;
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {r.currency} {r.amount}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-text-tertiary">
                      {r.createdAt.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-AU", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex h-6 items-center rounded-sm px-2 text-[11px] font-bold uppercase tracking-wide " +
                          statusBadgeClass(r.status)
                        }
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
