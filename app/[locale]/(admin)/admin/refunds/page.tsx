import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { Check, RotateCcw } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { getAdmin } from "@/components/domain/adminCookie";
import { MOCK_REFUNDS } from "@/components/domain/adminMock";

async function processRefund(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  nextRedirect(`/${locale}/admin/refunds?applied=${id}`);
}

export default async function AdminRefundsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const admin = await getAdmin();
  if (!admin.signedIn) redirect({ href: "/admin/login", locale });
  const t = await getTranslations("admin");

  const applied = typeof sp.applied === "string" ? sp.applied : null;

  return (
    <AdminShell email={admin.email ?? ""}>
      <h1 className="text-h2">{t("refundsTitle")}</h1>

      {applied && (
        <div
          role="status"
          className="mt-3 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-2.5 text-[14px] font-semibold text-success"
        >
          <Check size={16} aria-hidden /> {t("applied")} · {applied}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-lg border border-border bg-bg-base">
        {MOCK_REFUNDS.length === 0 ? (
          <p className="px-5 py-8 text-center text-[14px] text-text-tertiary">
            {t("refundEmpty")}
          </p>
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-border bg-bg-surface-2 text-text-secondary">
              <tr>
                <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">
                  {t("colId")}
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">
                  {t("colBooking")}
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">
                  {t("colCustomer")}
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">
                  {t("colAmount")}
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">
                  {t("colReason")}
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">
                  {t("colStatus")}
                </th>
                <th className="px-4 py-3" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {MOCK_REFUNDS.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 font-bold tabular-nums">{r.id}</td>
                  <td className="px-4 py-3 tabular-nums">{r.bookingId}</td>
                  <td className="px-4 py-3">{r.customerName}</td>
                  <td className="px-4 py-3 tabular-nums">${r.amount}</td>
                  <td className="px-4 py-3">
                    {r.reason === "dispute"
                      ? t("reasonDispute")
                      : t("reasonSelfService")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex h-6 items-center rounded-sm px-2 text-[11px] font-bold uppercase " +
                        (r.status === "queued"
                          ? "bg-warning-soft text-warning"
                          : r.status === "processing"
                          ? "bg-brand-soft text-brand"
                          : r.status === "done"
                          ? "bg-success-soft text-success"
                          : "bg-danger-soft text-danger")
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {r.status === "queued" && (
                      <form action={processRefund} className="inline">
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center gap-1 rounded-sm bg-brand px-3 text-[12px] font-bold text-white"
                        >
                          <RotateCcw size={12} aria-hidden />
                          {t("refundProcess")}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}
