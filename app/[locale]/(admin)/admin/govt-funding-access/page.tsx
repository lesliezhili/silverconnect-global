import { setRequestLocale } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { after } from "next/server";
import { eq, desc } from "drizzle-orm";
import { Check, ExternalLink } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { getAdmin } from "@/components/domain/adminCookie";
import { db } from "@/lib/db";
import { govtFundingGrants } from "@/lib/db/schema/govtFunding";
import { notify } from "@/lib/notifications/server";
import { users } from "@/lib/db/schema/users";

export const dynamic = "force-dynamic";

/**
 * Admin-managed replacement for the old hardcoded email allowlist in
 * lib/auth/govtFundingAccess.ts — lets the platform owner grant NDIS/
 * government-scheme access to specific vetted accounts one at a time
 * (Phase 2 rollout), without a code deploy per grant.
 *
 * There is no public API to automatically validate NDIS provider
 * registration — the only official tool is the NDIS Commission's "Find a
 * registered provider" search (manual, by ABN/name). This page records a
 * MANUAL verification note, it does not call any external service.
 */
async function grantAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const rawEmail = String(formData.get("email") ?? "").trim().toLowerCase();
  const abn = String(formData.get("abn") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const admin = await getAdmin();
  if (!admin.signedIn) nextRedirect(`/${locale}/admin/login`);
  if (!rawEmail) nextRedirect(`/${locale}/admin/govt-funding-access?error=missing_email`);

  const verificationNote = [abn ? `ABN ${abn}` : null, note || null].filter(Boolean).join(" — ") || null;

  await db
    .insert(govtFundingGrants)
    .values({
      email: rawEmail,
      grantedBy: admin.email ?? null,
      ndisVerified: !!verificationNote,
      ndisVerifiedAt: verificationNote ? new Date() : null,
      ndisVerificationNote: verificationNote,
      status: "active",
    })
    .onConflictDoUpdate({
      target: govtFundingGrants.email,
      set: {
        status: "active",
        grantedBy: admin.email ?? null,
        ndisVerified: !!verificationNote,
        ndisVerifiedAt: verificationNote ? new Date() : null,
        ndisVerificationNote: verificationNote,
        updatedAt: new Date(),
      },
    });

  after(async () => {
    const [grantee] = await db.select({ id: users.id }).from(users).where(eq(users.email, rawEmail)).limit(1);
    if (grantee) {
      await notify({
        userId: grantee.id,
        kind: "system",
        title: "Government-funded scheme access enabled",
        body: "You can now book/receive NDIS and other government-funded scheme services on SilverConnect.",
        link: `/${locale}/profile`,
      });
    }
  });

  nextRedirect(`/${locale}/admin/govt-funding-access?applied=1`);
}

async function revokeAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  const admin = await getAdmin();
  if (!admin.signedIn) nextRedirect(`/${locale}/admin/login`);

  await db
    .update(govtFundingGrants)
    .set({ status: "revoked", updatedAt: new Date() })
    .where(eq(govtFundingGrants.id, id));

  nextRedirect(`/${locale}/admin/govt-funding-access?applied=1`);
}

export default async function AdminGovtFundingAccessPage({
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
  const applied = sp.applied === "1";

  try {
    const grants = await db
      .select()
      .from(govtFundingGrants)
      .orderBy(desc(govtFundingGrants.createdAt))
      .limit(200);

    return (
      <AdminShell email={admin.email ?? ""}>
        <h1 className="text-h2">Government-funding access</h1>
        <p className="mt-2 text-[16px] text-text-secondary">
          Controls who can see and use NDIS/government-funded scheme booking
          features (Phase 2). SilverConnect has not yet completed its own
          NDIS Commission digital-platform registration, so keep this limited
          to accounts you have personally vetted.
        </p>
        <a
          href="https://www.ndiscommission.gov.au/provider-registration/find-registered-provider"
          target="_blank"
          rel="noopener"
          className="mt-3 inline-flex items-center gap-1.5 text-[16px] font-semibold text-brand"
        >
          Check NDIS Commission provider register <ExternalLink size={14} aria-hidden />
        </a>

        {applied && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-2.5 text-[16px] font-semibold text-success"
          >
            <Check size={16} aria-hidden /> Saved
          </div>
        )}

        <form
          action={grantAction}
          className="mt-5 flex flex-col gap-4 rounded-lg border border-border bg-bg-base p-5"
        >
          <input type="hidden" name="locale" value={locale} />
          <p className="text-[16px] font-bold">Grant access</p>
          <div>
            <Label htmlFor="email">Email</Label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <Label htmlFor="abn">ABN (if checked against the NDIS register)</Label>
            <input
              id="abn"
              name="abn"
              className="block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body focus:border-brand focus:outline-none"
            />
          </div>
          <div>
            <Label htmlFor="note">Verification note</Label>
            <textarea
              id="note"
              name="note"
              rows={2}
              placeholder="e.g. Checked NDIS Commission register 2026-08-05, registered provider, no banning orders"
              className="block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3 text-[16px] focus:border-brand focus:outline-none"
            />
          </div>
          <Button type="submit" variant="primary" block size="md">
            Grant access
          </Button>
        </form>

        <div className="mt-5 overflow-hidden rounded-lg border border-border bg-bg-base">
          {grants.length === 0 ? (
            <p className="px-5 py-8 text-center text-[16px] text-text-tertiary">No grants yet</p>
          ) : (
            <table className="w-full text-left text-[17px]">
              <thead className="border-b border-border bg-bg-surface-2 text-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-[16px] font-semibold uppercase tracking-wide">Email</th>
                  <th className="hidden px-4 py-3 text-[16px] font-semibold uppercase tracking-wide md:table-cell">
                    Verification
                  </th>
                  <th className="px-4 py-3 text-[16px] font-semibold uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {grants.map((g) => (
                  <tr key={g.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3">
                      <span className="block font-bold">{g.email}</span>
                      <span className="block text-[15px] text-text-tertiary">
                        granted by {g.grantedBy ?? "—"}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      {g.ndisVerified ? (
                        <span className="text-[15px] text-text-secondary">{g.ndisVerificationNote}</span>
                      ) : (
                        <span className="text-[15px] text-text-tertiary">not verified</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex h-6 items-center rounded-sm px-2 text-[11px] font-bold uppercase tracking-wide " +
                          (g.status === "active" ? "bg-success-soft text-success" : "bg-danger-soft text-danger")
                        }
                      >
                        {g.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {g.status === "active" && (
                        <form action={revokeAction}>
                          <input type="hidden" name="locale" value={locale} />
                          <input type="hidden" name="id" value={g.id} />
                          <button
                            type="submit"
                            className="text-[15px] font-semibold text-danger hover:underline"
                          >
                            Revoke
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
  } catch (error) {
    console.error("[govt-funding-access] DB unavailable", error);
    return (
      <main className="mx-auto w-full max-w-content px-5 py-12 text-center">
        <p className="text-[48px]">⏳</p>
        <h1 className="mt-4 text-[22px] font-bold">Service Temporarily Unavailable</h1>
        <p className="mt-2 text-[17px] text-text-secondary">Please try again shortly.</p>
      </main>
    );
  }
}
