import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { after } from "next/server";
import { eq, desc } from "drizzle-orm";
import { X, Check } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { getAdmin } from "@/components/domain/adminCookie";
import { db } from "@/lib/db";
import { organizationProfiles } from "@/lib/db/schema/organizations";
import { users } from "@/lib/db/schema/users";
import { notify } from "@/lib/notifications/server";

export const dynamic = "force-dynamic";

type DbStatus =
  | "pending"
  | "docs_review"
  | "approved"
  | "rejected"
  | "suspended";
type UiAction = "approve" | "sendBack" | "hold" | "reject";

function statusBadgeClass(s: DbStatus): string {
  switch (s) {
    case "pending":
      return "bg-bg-surface-2 text-text-secondary";
    case "docs_review":
      return "bg-warning-soft text-warning";
    case "approved":
      return "bg-success-soft text-success";
    case "rejected":
    case "suspended":
      return "bg-danger-soft text-danger";
  }
}

function initialsOf(name: string | null, fallback: string): string {
  const src = (name || fallback).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (src.slice(0, 2) || "?").toUpperCase();
}

async function organizationDecisionAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "") as UiAction;
  const note = String(formData.get("note") ?? "").trim();
  const admin = await getAdmin();
  if (!admin.signedIn) nextRedirect(`/${locale}/admin/login`);

  const patches: Record<UiAction, Partial<{
    onboardingStatus: DbStatus;
    approvedAt: Date | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
  }>> = {
    approve: {
      onboardingStatus: "approved",
      approvedAt: new Date(),
      rejectedAt: null,
      rejectionReason: null,
    },
    sendBack: { onboardingStatus: "docs_review" },
    hold: { onboardingStatus: "docs_review" },
    reject: {
      onboardingStatus: "rejected",
      rejectedAt: new Date(),
      rejectionReason: note || "Rejected by admin",
    },
  };
  const patch = patches[action];
  if (!patch) nextRedirect(`/${locale}/admin/organizations?id=${id}&error=invalid`);

  const [row] = await db
    .select({ id: organizationProfiles.id, ownerUserId: organizationProfiles.ownerUserId })
    .from(organizationProfiles)
    .where(eq(organizationProfiles.id, id))
    .limit(1);
  if (!row) nextRedirect(`/${locale}/admin/organizations?error=missing`);

  await db
    .update(organizationProfiles)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(organizationProfiles.id, id));

  after(async () => {
    if (!row.ownerUserId) return;
    const titles: Record<UiAction, string> = {
      approve: "Your day care centre application is approved",
      sendBack: "Action needed on your day care centre application",
      hold: "Your day care centre application is on hold",
      reject: "Your day care centre application was declined",
    };
    await notify({
      userId: row.ownerUserId,
      kind: "system",
      title: titles[action],
      body: note || undefined,
      link: `/${locale}/register/day-care-centre`,
    });
  });

  nextRedirect(`/${locale}/admin/organizations?applied=${id.slice(0, 8)}`);
}

const STATUS_FILTER_OPTIONS = [
  "all",
  "pending",
  "docs_review",
  "approved",
  "rejected",
  "suspended",
] as const;
type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number];

export default async function AdminOrganizationsPage({
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
  const rawStatus = typeof sp.status === "string" ? sp.status : "all";
  const fStatus: StatusFilter = (STATUS_FILTER_OPTIONS as readonly string[]).includes(
    rawStatus,
  )
    ? (rawStatus as StatusFilter)
    : "all";

  const where =
    fStatus === "all"
      ? undefined
      : eq(organizationProfiles.onboardingStatus, fStatus as DbStatus);

  try {
    const rows = await db
      .select({
        id: organizationProfiles.id,
        onboardingStatus: organizationProfiles.onboardingStatus,
        name: organizationProfiles.name,
        abn: organizationProfiles.abn,
        addressLine: organizationProfiles.addressLine,
        region: organizationProfiles.region,
        capacity: organizationProfiles.capacity,
        operatingHours: organizationProfiles.operatingHours,
        description: organizationProfiles.description,
        contactPhone: organizationProfiles.contactPhone,
        contactEmail: organizationProfiles.contactEmail,
        submittedAt: organizationProfiles.submittedAt,
        createdAt: organizationProfiles.createdAt,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(organizationProfiles)
      .leftJoin(users, eq(users.id, organizationProfiles.ownerUserId))
      .where(where)
      .orderBy(desc(organizationProfiles.createdAt))
      .limit(100);

    const drawerRow = drawerId ? rows.find((r) => r.id === drawerId) : null;

    return (
      <AdminShell email={admin.email ?? ""}>
        <h1 className="text-h2">{t("organizationsTitle")}</h1>

        {applied && (
          <div
            role="status"
            className="mt-3 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-2.5 text-[16px] font-semibold text-success"
          >
            <Check size={16} aria-hidden /> {t("applied")} · {applied}
          </div>
        )}

        <form
          method="get"
          className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-border bg-bg-base p-3"
        >
          <div>
            <Label htmlFor="status">{t("filterStatus")}</Label>
            <select
              id="status"
              name="status"
              defaultValue={fStatus}
              className="block h-12 rounded-md border-[1.5px] border-border bg-bg-base px-3 text-[16px]"
            >
              {STATUS_FILTER_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "all" ? t("filterAll") : s}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="ml-auto inline-flex h-12 items-center rounded-md bg-brand px-4 text-[16px] font-bold text-white"
          >
            {t("filterApply")}
          </button>
        </form>

        <p className="mt-3 text-[16px] text-text-tertiary tabular-nums">
          {rows.length} {rows.length === 1 ? "organization" : "organizations"}
        </p>

        <div className="mt-2 overflow-hidden rounded-lg border border-border bg-bg-base">
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-[16px] text-text-tertiary">
              No day care centre applications
            </p>
          ) : (
            <table className="w-full text-left text-[17px]">
              <thead className="border-b border-border bg-bg-surface-2 text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-[16px] font-semibold uppercase tracking-wide">
                    {t("colOrganization")}
                  </th>
                  <th className="hidden px-4 py-3 text-[16px] font-semibold uppercase tracking-wide md:table-cell">
                    {t("colRegion")}
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
                {rows.map((o) => {
                  const initials = initialsOf(o.name, o.name ?? "?");
                  const status = o.onboardingStatus as DbStatus;
                  const appliedDate = (o.submittedAt ?? o.createdAt).toLocaleDateString(
                    locale === "zh" ? "zh-CN" : "en-AU",
                    { month: "short", day: "numeric" },
                  );
                  return (
                    <tr
                      key={o.id}
                      className={
                        "border-b border-border last:border-b-0 " +
                        (drawerId === o.id ? "bg-brand-soft" : "")
                      }
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`?id=${o.id}`}
                          className="flex items-center gap-3"
                        >
                          <ProviderAvatar size={36} hue={1} initials={initials} />
                          <span className="min-w-0">
                            <span className="block font-bold text-brand">
                              {o.name}
                            </span>
                            <span className="block text-[16px] text-text-tertiary tabular-nums">
                              {o.id.slice(0, 8)}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {o.region ?? "—"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-text-tertiary">
                        {appliedDate}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            "inline-flex h-6 items-center rounded-sm px-2 text-[11px] font-bold uppercase tracking-wide " +
                            statusBadgeClass(status)
                          }
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {drawerRow && (
          <OrganizationDrawer row={drawerRow} locale={locale} t={t} />
        )}
      </AdminShell>
    );
  } catch (error) {
    console.error("[organizations] DB unavailable", error);
    return (
      <main className="mx-auto w-full max-w-content px-5 py-12 text-center">
        <p className="text-[48px]">⏳</p>
        <h1 className="mt-4 text-[22px] font-bold">Service Temporarily Unavailable</h1>
        <p className="mt-2 text-[17px] text-text-secondary">Please try again shortly.</p>
      </main>
    );
  }
}

function OrganizationDrawer({
  row,
  locale,
  t,
}: {
  row: {
    id: string;
    onboardingStatus: string;
    name: string;
    abn: string;
    addressLine: string;
    region: string;
    capacity: number | null;
    operatingHours: string | null;
    description: string | null;
    contactPhone: string;
    contactEmail: string;
    submittedAt: Date | null;
    createdAt: Date;
    ownerName: string | null;
    ownerEmail: string | null;
  };
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"admin">>>;
}) {
  const decided =
    row.onboardingStatus === "approved" ||
    row.onboardingStatus === "rejected" ||
    row.onboardingStatus === "suspended";
  return (
    <>
      <Link
        href="/admin/organizations"
        aria-label={t("drawerClose")}
        className="fixed inset-0 z-40 bg-black/30"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("organizationDrawer")}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col overflow-y-auto border-l border-border bg-bg-base shadow-xl"
      >
        <header className="sticky top-0 flex items-center justify-between border-b border-border bg-bg-base px-5 py-3">
          <p className="text-[16px] font-bold">{row.name}</p>
          <Link
            href="/admin/organizations"
            aria-label={t("drawerClose")}
            className="inline-flex h-12 w-10 items-center justify-center rounded-md hover:bg-bg-surface-2"
          >
            <X size={18} aria-hidden />
          </Link>
        </header>
        <div className="flex-1 px-5 py-5">
          <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-[16px]">
            <dt className="font-semibold text-text-tertiary">ABN</dt>
            <dd className="tabular-nums">{row.abn}</dd>
            <dt className="font-semibold text-text-tertiary">Owner</dt>
            <dd className="break-all">
              {row.ownerName ?? "—"} ({row.ownerEmail ?? "—"})
            </dd>
            <dt className="font-semibold text-text-tertiary">Contact</dt>
            <dd className="break-all">
              {row.contactPhone} · {row.contactEmail}
            </dd>
            <dt className="font-semibold text-text-tertiary">
              {t("colRegion")}
            </dt>
            <dd>{row.region}</dd>
            <dt className="font-semibold text-text-tertiary">Address</dt>
            <dd>{row.addressLine}</dd>
            <dt className="font-semibold text-text-tertiary">Capacity</dt>
            <dd>{row.capacity ?? "—"}</dd>
            <dt className="font-semibold text-text-tertiary">Hours</dt>
            <dd>{row.operatingHours ?? "—"}</dd>
            <dt className="font-semibold text-text-tertiary">
              {t("colAppliedAt")}
            </dt>
            <dd className="tabular-nums">
              {(row.submittedAt ?? row.createdAt).toLocaleString(
                locale === "zh" ? "zh-CN" : "en-AU",
              )}
            </dd>
            <dt className="font-semibold text-text-tertiary">
              {t("colStatus")}
            </dt>
            <dd className="font-bold">{row.onboardingStatus}</dd>
          </dl>

          {row.description && (
            <>
              <p className="mt-5 text-[16px] font-bold">Description</p>
              <p className="mt-1 whitespace-pre-line rounded-md border border-border bg-bg-surface-2 p-3 text-[16px] text-text-primary">
                {row.description}
              </p>
            </>
          )}

          {decided ? (
            <p className="mt-6 rounded-md bg-bg-surface-2 px-3.5 py-3 text-[16px] font-semibold text-text-secondary">
              Decision already recorded.
            </p>
          ) : (
            <form
              action={organizationDecisionAction}
              className="mt-6 flex flex-col gap-4 border-t border-border pt-5"
            >
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="id" value={row.id} />
              <fieldset>
                <legend className="text-[16px] font-bold">
                  {t("disputeAction")}
                </legend>
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
                        <span className="text-[16px]">{a.label}</span>
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
                  className="block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3 text-[16px] focus:border-brand focus:outline-none"
                />
                <p
                  id="note-hint"
                  className="mt-1.5 text-[16px] text-text-tertiary"
                >
                  {t("providerNoteHint")}
                </p>
              </div>

              <Button type="submit" variant="primary" block size="md">
                {t("disputeApply")}
              </Button>
            </form>
          )}
        </div>
      </aside>
    </>
  );
}
