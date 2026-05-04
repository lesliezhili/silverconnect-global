import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { X, Check } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { getAdmin } from "@/components/domain/adminCookie";
import {
  MOCK_PROVIDERS,
  type AdminProvider,
  type ProviderApprovalStatus,
} from "@/components/domain/adminMock";

const STATUS_KEYS: Record<
  ProviderApprovalStatus,
  | "statusPending"
  | "statusDocsReview"
  | "statusBackground"
  | "statusStripe"
  | "statusApproved"
  | "statusRejected"
> = {
  pending: "statusPending",
  docsReview: "statusDocsReview",
  background: "statusBackground",
  stripe: "statusStripe",
  approved: "statusApproved",
  rejected: "statusRejected",
};

async function providerDecision(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  nextRedirect(`/${locale}/admin/providers?applied=${id}`);
}

export default async function AdminProvidersPage({
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

  const drawerId = typeof sp.id === "string" ? sp.id : null;
  const applied = typeof sp.applied === "string" ? sp.applied : null;
  const drawerItem = drawerId ? MOCK_PROVIDERS.find((p) => p.id === drawerId) : null;

  return (
    <AdminShell email={admin.email ?? ""}>
      <h1 className="text-h2">{t("providersTitle")}</h1>

      {applied && (
        <div
          role="status"
          className="mt-3 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-2.5 text-[14px] font-semibold text-success"
        >
          <Check size={16} aria-hidden /> {t("applied")} · {applied}
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-lg border border-border bg-bg-base">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-border bg-bg-surface-2 text-text-secondary">
            <tr>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">
                {t("colProvider")}
              </th>
              <th className="hidden px-4 py-3 text-[12px] font-semibold uppercase tracking-wide md:table-cell">
                {t("colCountry")}
              </th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">
                {t("colAppliedAt")}
              </th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">
                {t("colStep")}
              </th>
              <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide">
                {t("colStatus")}
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PROVIDERS.map((p) => (
              <Row key={p.id} p={p} locale={locale} t={t} active={p.id === drawerId} />
            ))}
          </tbody>
        </table>
      </div>

      {drawerItem && <ApproveDrawer item={drawerItem} locale={locale} t={t} />}
    </AdminShell>
  );
}

function Row({
  p,
  locale,
  t,
  active,
}: {
  p: AdminProvider;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"admin">>>;
  active: boolean;
}) {
  const initials = p.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <tr className={"border-b border-border last:border-b-0 " + (active ? "bg-brand-soft" : "")}>
      <td className="px-4 py-3">
        <Link href={`?id=${p.id}`} className="flex items-center gap-3">
          <ProviderAvatar size={36} hue={2} initials={initials} />
          <span className="min-w-0">
            <span className="block font-bold text-brand">{p.name}</span>
            <span className="block text-[12px] text-text-tertiary tabular-nums">
              {p.id}
            </span>
          </span>
        </Link>
      </td>
      <td className="hidden px-4 py-3 md:table-cell">{p.country}</td>
      <td className="px-4 py-3 tabular-nums text-text-tertiary">
        {new Date(p.appliedISO).toLocaleDateString(
          locale === "zh" ? "zh-CN" : "en-AU",
          { month: "short", day: "numeric" }
        )}
      </td>
      <td className="px-4 py-3 tabular-nums">{p.step}/5</td>
      <td className="px-4 py-3">
        <span className="inline-flex h-6 items-center rounded-sm bg-bg-surface-2 px-2 text-[11px] font-bold uppercase tracking-wide text-text-secondary">
          {t(STATUS_KEYS[p.status])}
        </span>
      </td>
    </tr>
  );
}

function ApproveDrawer({
  item,
  locale,
  t,
}: {
  item: AdminProvider;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"admin">>>;
}) {
  const checks = [
    { key: "police", labelKey: "providerStepCheck" },
    { key: "firstAid", labelKey: "providerStepCheck" },
    { key: "insurance", labelKey: "providerStepCheck" },
  ];
  return (
    <>
      <Link
        href="/admin/providers"
        aria-label={t("drawerClose")}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("providerDrawer")}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col overflow-y-auto border-l border-border bg-bg-base shadow-xl"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-border bg-bg-base px-5 py-3">
          <p className="text-[16px] font-bold">{item.name}</p>
          <Link
            href="/admin/providers"
            aria-label={t("drawerClose")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-bg-surface-2"
          >
            <X size={18} aria-hidden />
          </Link>
        </header>
        <div className="flex-1 px-5 py-5">
          <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-[14px]">
            <dt className="font-semibold text-text-tertiary">{t("colCountry")}</dt>
            <dd>{item.country}</dd>
            <dt className="font-semibold text-text-tertiary">{t("colAppliedAt")}</dt>
            <dd className="tabular-nums">
              {new Date(item.appliedISO).toLocaleDateString(
                locale === "zh" ? "zh-CN" : "en-AU",
                { month: "short", day: "numeric" }
              )}
            </dd>
            <dt className="font-semibold text-text-tertiary">{t("colStep")}</dt>
            <dd className="tabular-nums">{item.step}/5</dd>
            <dt className="font-semibold text-text-tertiary">{t("colStatus")}</dt>
            <dd className="font-bold">{t(STATUS_KEYS[item.status])}</dd>
          </dl>

          <p className="mt-5 text-[14px] font-bold">{t("providerStepCheck")}</p>
          <ul className="mt-2 flex flex-col gap-1.5">
            {checks.map((c) => (
              <li
                key={c.key}
                className="flex items-center justify-between rounded-md border border-border bg-bg-base px-3 py-2 text-[13px]"
              >
                <span>{c.key}</span>
                <span className="inline-flex h-5 items-center rounded-sm bg-success-soft px-2 text-[11px] font-bold uppercase text-success">
                  OK
                </span>
              </li>
            ))}
          </ul>

          <form action={providerDecision} className="mt-6 flex flex-col gap-4 border-t border-border pt-5">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={item.id} />
            <fieldset>
              <legend className="text-[14px] font-bold">{t("disputeAction")}</legend>
              <ul className="mt-2 flex flex-col gap-2">
                {(
                  [
                    { key: "approve", label: t("providerApprove") },
                    { key: "sendBack", label: t("providerSendBack") },
                    { key: "hold", label: t("providerHold") },
                    { key: "reject", label: t("providerReject") },
                  ] as const
                ).map((a) => (
                  <li key={a.key}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-border bg-bg-base p-3 has-[:checked]:border-2 has-[:checked]:border-brand">
                      <input
                        type="radio"
                        name="action"
                        value={a.key}
                        required
                        defaultChecked={a.key === "approve"}
                        className="peer sr-only"
                      />
                      <span
                        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border-strong after:hidden after:h-2.5 after:w-2.5 after:rounded-full after:bg-brand after:content-[''] peer-checked:border-brand peer-checked:after:block"
                        aria-hidden
                      />
                      <span className="text-[14px]">{a.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </fieldset>

            <div>
              <Label htmlFor="note">{t("disputeNote")}</Label>
              <textarea
                id="note"
                name="note"
                rows={3}
                aria-describedby="note-hint"
                className="block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3 text-[14px] focus:border-brand focus:outline-none"
              />
              <p id="note-hint" className="mt-1.5 text-[12px] text-text-tertiary">
                {t("providerNoteHint")}
              </p>
            </div>

            <Button type="submit" variant="primary" block size="md">
              {t("disputeApply")}
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
