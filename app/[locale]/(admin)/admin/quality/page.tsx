import { setRequestLocale } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { getAdmin } from "@/components/domain/adminCookie";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { bookings, bookingEvidence } from "@/lib/db/schema/bookings";
import { providerProfiles } from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";
import { releaseOrHold } from "@/lib/feedback/release";
import { heldPayouts, pausedCustomers, pausedProviders } from "@/lib/trust";
import { TRUST_RULES } from "@/lib/release-quality";

export const dynamic = "force-dynamic";

/** Admin releases a held payout after checking the before/after evidence. */
async function releaseHeld(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) nextRedirect(`/${locale}/admin/login`);
  const [b] = await db.select({ status: bookings.status }).from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!b || b.status !== "completed") nextRedirect(`/${locale}/admin/quality?error=invalid`);
  await releaseOrHold({ bookingId: id, actorId: me.id, rating: 5, force: true });
  nextRedirect(`/${locale}/admin/quality?released=${id}`);
}

/** Admin adds/removes a provider from the emergency cover team. */
async function toggleEmergency(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("providerId") ?? "");
  const on = formData.get("on") === "1";
  const me = await getCurrentUser();
  if (!me || !me.isAdmin) nextRedirect(`/${locale}/admin/login`);
  await db.update(providerProfiles).set({ emergencyOptIn: on, updatedAt: new Date() }).where(eq(providerProfiles.id, id));
  nextRedirect(`/${locale}/admin/quality#emergency`);
}

/**
 * Release 1 quality & trust queue: payouts held by QC or a low rating,
 * and providers / customers paused by the trust gate (lib/trust.ts).
 * Nothing is banned automatically — admins decide here.
 */
export default async function AdminQualityPage({
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

  const [held, providers, customers] = await Promise.all([heldPayouts(), pausedProviders(), pausedCustomers()]);
  const team = await db
    .select({ id: providerProfiles.id, on: providerProfiles.emergencyOptIn, name: users.name, email: users.email, country: users.country })
    .from(providerProfiles)
    .leftJoin(users, eq(users.id, providerProfiles.userId))
    .where(eq(providerProfiles.onboardingStatus, "approved"))
    .orderBy(desc(providerProfiles.emergencyOptIn), users.name);
  const heldIds = held.map((h) => String(h.id));
  const evidence = heldIds.length
    ? await db
        .select({ bookingId: bookingEvidence.bookingId, phase: bookingEvidence.phase, area: bookingEvidence.description, url: bookingEvidence.fileUrl })
        .from(bookingEvidence)
        .where(inArray(bookingEvidence.bookingId, heldIds))
    : [];
  const money = (v: unknown, c: unknown) => `${String(c ?? "")} ${Number(v ?? 0).toFixed(2)}`;

  return (
    <AdminShell email={admin.email ?? ""}>
      <h1 className="text-[24px] font-bold">Quality &amp; trust</h1>
      <p className="mt-1 text-[15px] text-text-secondary">
        Payouts are held when QC flags a visit (on site &lt; 60% of booked time) or the customer rates ≤ {TRUST_RULES.pairBlockAt}★.
        Providers pause at avg &lt; {TRUST_RULES.providerMinAvg}★, {TRUST_RULES.maxCancels90d}+ self-cancels or {TRUST_RULES.maxQcFlags90d}+ QC flags in 90 days;
        customers at avg &lt; {TRUST_RULES.customerMinAvg}★ or {TRUST_RULES.maxCancels90d}+ late cancels / no-shows.
      </p>
      {typeof sp.released === "string" && (
        <p role="status" className="mt-3 rounded-md bg-success-soft p-3 text-success">Payout released.</p>
      )}

      <h2 className="mt-6 text-[19px] font-bold">Held payouts ({held.length})</h2>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-[14px]">
          <thead className="text-text-secondary">
            <tr><th className="py-2">Completed</th><th>Service</th><th>Customer → Provider</th><th>Why held</th><th>Evidence</th><th>Total</th><th /></tr>
          </thead>
          <tbody>
            {held.map((h) => (
              <tr key={String(h.id)} className="border-t border-border align-top">
                <td className="py-2">{h.completed_at ? new Date(String(h.completed_at)).toLocaleString("en-AU") : "—"}</td>
                <td>{String(h.category ?? "—")} / {String(h.effort_tier ?? "—")}</td>
                <td>{String(h.customer_name ?? "—")} → {String(h.provider_name ?? "—")}</td>
                <td>
                  {h.qc_flag ? <span className="block">QC: {String(h.qc_flag)}</span> : null}
                  {h.customer_rating != null ? <span className="block">{String(h.customer_rating)}★ {String(h.customer_comment ?? "")}</span> : null}
                </td>
                <td>
                  {(["before", "after", "feedback"] as const).map((ph) => (
                    <span key={ph} className="block">
                      {ph}:{" "}
                      {evidence
                        .filter((e) => e.bookingId === String(h.id) && e.phase === ph)
                        .map((e, i) => (
                          <a key={i} href={e.url} target="_blank" rel="noreferrer" className="mr-1.5 underline">
                            {e.area ?? i + 1}
                          </a>
                        ))}
                    </span>
                  ))}
                </td>
                <td className="tabular-nums">{money(h.total_price, h.currency)}</td>
                <td className="whitespace-nowrap">
                  <form action={releaseHeld} className="inline">
                    <input type="hidden" name="locale" value={locale} />
                    <input type="hidden" name="id" value={String(h.id)} />
                    <button className="rounded-md bg-brand px-3 py-1.5 font-semibold text-white">Release</button>
                  </form>
                </td>
              </tr>
            ))}
            {held.length === 0 && <tr><td colSpan={7} className="py-3 text-text-tertiary">Nothing held.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-[19px] font-bold">Paused providers ({providers.length})</h2>
      <ul className="mt-2 flex flex-col gap-1 text-[14px]">
        {providers.map((p) => (
          <li key={String(p.id)}>
            <Link href={`/admin/providers/${String(p.id)}`} className="underline">{String(p.name ?? p.email ?? p.id)}</Link>
            {" — "}{Number(p.avg_rating).toFixed(1)}★ ({String(p.review_count)}) · {String(p.cancels_90d)} self-cancels · {String(p.qc_flags_90d)} QC flags (90d)
            {Number(p.current_checks) < TRUST_RULES.requiredDocs.length && " · ⚠️ police check / ID missing or expired"}
          </li>
        ))}
        {providers.length === 0 && <li className="text-text-tertiary">None.</li>}
      </ul>

      <h2 id="emergency" className="mt-8 text-[19px] font-bold">
        Emergency cover team ({team.filter((p) => p.on).length})
      </h2>
      <p className="mt-1 text-[14px] text-text-secondary">
        When a provider withdraws, the job is reassigned automatically — team members first — to a free,
        background-checked provider in the same country. If nobody is free, the customer is refunded in full and admins are alerted.
      </p>
      <ul className="mt-2 flex flex-col gap-1 text-[14px]">
        {team.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <form action={toggleEmergency}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="providerId" value={p.id} />
              <input type="hidden" name="on" value={p.on ? "0" : "1"} />
              <button className={"rounded-md px-3 py-1 font-semibold " + (p.on ? "bg-brand text-white" : "border border-border")}>
                {p.on ? "On team" : "Add"}
              </button>
            </form>
            <span>{p.name ?? p.email} · {p.country}</span>
          </li>
        ))}
      </ul>

      <h2 className="mt-8 text-[19px] font-bold">Paused customers ({customers.length})</h2>
      <ul className="mt-2 flex flex-col gap-1 text-[14px]">
        {customers.map((c) => (
          <li key={String(c.id)}>
            <Link href={`/admin/customers/${String(c.id)}`} className="underline">{String(c.name ?? c.email ?? c.id)}</Link>
            {" — "}{Number(c.avg_rating).toFixed(1)}★ from providers ({String(c.review_count)}) · {String(c.late_cancels_90d)} late cancels / no-shows (90d)
          </li>
        ))}
        {customers.length === 0 && <li className="text-text-tertiary">None.</li>}
      </ul>
    </AdminShell>
  );
}
