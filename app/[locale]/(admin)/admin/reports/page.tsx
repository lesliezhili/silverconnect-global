import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { Check, Flag } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/Button";
import { getAdmin } from "@/components/domain/adminCookie";
import {
  MOCK_REVIEW_REPORTS,
  type AdminReviewReport,
} from "@/components/domain/adminMock";

const REASON_KEYS: Record<
  AdminReviewReport["reason"],
  "reasonSpam" | "reasonOffensive" | "reasonFalse" | "reasonOther"
> = {
  spam: "reasonSpam",
  offensive: "reasonOffensive",
  false: "reasonFalse",
  other: "reasonOther",
};

async function reportAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  nextRedirect(`/${locale}/admin/reports?applied=${id}`);
}

export default async function AdminReportsPage({
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
  const tR = await getTranslations("aReports");

  const applied = typeof sp.applied === "string" ? sp.applied : null;

  return (
    <AdminShell email={admin.email ?? ""}>
      <h1 className="text-h2">{tR("title")}</h1>
      <p className="mt-1 text-[15px] text-text-secondary">{tR("sub")}</p>

      {applied && (
        <div
          role="status"
          className="mt-3 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-2.5 text-[14px] font-semibold text-success"
        >
          <Check size={16} aria-hidden /> {t("applied")} · {applied}
        </div>
      )}

      {MOCK_REVIEW_REPORTS.length === 0 ? (
        <p className="mt-6 rounded-lg border border-border bg-bg-base px-5 py-8 text-center text-[14px] text-text-tertiary">
          {tR("empty")}
        </p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {MOCK_REVIEW_REPORTS.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-border bg-bg-base p-4"
            >
              <div className="flex items-start gap-3">
                <span
                  aria-hidden
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-warning-soft text-warning"
                >
                  <Flag size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-text-tertiary tabular-nums">
                    {r.id} · {r.reviewId}
                  </p>
                  <p className="mt-1 text-[13px] text-text-secondary">
                    {tR("reportedReview")} · {r.reviewAuthor}
                  </p>
                  <blockquote className="mt-2 rounded-md border-l-2 border-border-strong bg-bg-surface-2 px-3 py-2 text-[14px] italic text-text-primary">
                    {r.reviewBody}
                  </blockquote>
                  <p className="mt-2 text-[13px]">
                    <span className="text-text-tertiary">{tR("reporter")}:</span>{" "}
                    <span className="font-semibold">{r.reportedBy}</span>
                  </p>
                  <p className="mt-1 text-[13px]">
                    <span className="text-text-tertiary">{tR("reason")}:</span>{" "}
                    <span className="font-semibold">{tR(REASON_KEYS[r.reason])}</span>
                  </p>
                </div>
              </div>
              <form
                action={reportAction}
                className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3"
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="id" value={r.id} />
                <button
                  type="submit"
                  name="action"
                  value="keep"
                  className="inline-flex h-10 items-center rounded-sm border-[1.5px] border-border-strong bg-bg-base px-3 text-[13px] font-semibold text-text-primary"
                >
                  {tR("actionKeep")}
                </button>
                <button
                  type="submit"
                  name="action"
                  value="delete"
                  className="inline-flex h-10 items-center rounded-sm border-[1.5px] border-danger bg-bg-base px-3 text-[13px] font-bold text-danger"
                >
                  {tR("actionDelete")}
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  name="action"
                  value="warn"
                >
                  {tR("actionWarnUser")}
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
