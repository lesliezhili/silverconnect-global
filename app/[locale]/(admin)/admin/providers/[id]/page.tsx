import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound, redirect as nextRedirect } from "next/navigation";
import { after } from "next/server";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { ChevronLeft, Check } from "lucide-react";
import { Link, redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { getAdmin } from "@/components/domain/adminCookie";
import { db } from "@/lib/db";
import {
  providerProfiles,
  providerDocuments,
  providerCategories,
} from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";
import { bookings } from "@/lib/db/schema/bookings";
import { reviews } from "@/lib/db/schema/reviews";
import { disputes } from "@/lib/db/schema/disputes";
import { wallets } from "@/lib/db/schema/payments";
import { findUserByEmail } from "@/lib/auth/server";
import { notify } from "@/lib/notifications/server";

type DbStatus =
  | "pending"
  | "docs_review"
  | "approved"
  | "rejected"
  | "suspended";
type UiAction =
  | "approve"
  | "sendBack"
  | "hold"
  | "reject"
  | "suspend"
  | "resume";

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

async function providerDecisionAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "") as UiAction;
  const note = String(formData.get("note") ?? "").trim();
  const admin = await getAdmin();
  if (!admin.signedIn) nextRedirect(`/${locale}/admin/login`);

  const adminUser = admin.email ? await findUserByEmail(admin.email) : null;

  const patches: Record<
    UiAction,
    Partial<{
      onboardingStatus: DbStatus;
      approvedAt: Date | null;
      rejectedAt: Date | null;
      rejectionReason: string | null;
    }>
  > = {
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
    suspend: {
      onboardingStatus: "suspended",
      rejectionReason: note || "Suspended by admin",
    },
    resume: {
      onboardingStatus: "approved",
      approvedAt: new Date(),
      rejectionReason: null,
    },
  };
  const patch = patches[action];
  if (!patch) {
    nextRedirect(`/${locale}/admin/providers/${id}?error=invalid`);
  }

  const [row] = await db
    .select({ id: providerProfiles.id, userId: providerProfiles.userId })
    .from(providerProfiles)
    .where(eq(providerProfiles.id, id))
    .limit(1);
  if (!row) nextRedirect(`/${locale}/admin/providers?error=missing`);

  await db
    .update(providerProfiles)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(providerProfiles.id, id));

  after(async () => {
    if (!row.userId) return;
    const titles: Record<UiAction, string> = {
      approve: "Your provider application is approved",
      sendBack: "Action needed on your provider application",
      hold: "Your provider application is on hold",
      reject: "Your provider application was declined",
      suspend: "Your provider account has been suspended",
      resume: "Your provider account has been reinstated",
    };
    await notify({
      userId: row.userId,
      kind: "system",
      title: titles[action],
      body: note || undefined,
      link: `/${locale}/provider/onboarding-status`,
    });
  });

  void adminUser;

  nextRedirect(`/${locale}/admin/providers/${id}?applied=1`);
}

export default async function AdminProviderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, id } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const admin = await getAdmin();
  if (!admin.signedIn) redirect({ href: "/admin/login", locale });
  const t = await getTranslations("admin");
  const tCat = await getTranslations("categories");
  const applied = sp.applied === "1";

  const [row] = await db
    .select({
      id: providerProfiles.id,
      userId: providerProfiles.userId,
      onboardingStatus: providerProfiles.onboardingStatus,
      addressLine: providerProfiles.addressLine,
      serviceRadiusKm: providerProfiles.serviceRadiusKm,
      stripeAccountId: providerProfiles.stripeAccountId,
      bio: providerProfiles.bio,
      submittedAt: providerProfiles.submittedAt,
      approvedAt: providerProfiles.approvedAt,
      rejectedAt: providerProfiles.rejectedAt,
      rejectionReason: providerProfiles.rejectionReason,
      createdAt: providerProfiles.createdAt,
      providerName: users.name,
      providerEmail: users.email,
      providerCountry: users.country,
    })
    .from(providerProfiles)
    .leftJoin(users, eq(users.id, providerProfiles.userId))
    .where(eq(providerProfiles.id, id))
    .limit(1);
  if (!row) notFound();

  const [docs, cats, bookingAgg, ratingAgg, recentBookings, recentReviews, disputeCount, wallet] =
    await Promise.all([
      db
        .select({
          type: providerDocuments.type,
          status: providerDocuments.status,
          fileUrl: providerDocuments.fileUrl,
          documentNumber: providerDocuments.documentNumber,
        })
        .from(providerDocuments)
        .where(eq(providerDocuments.providerId, id)),
      db
        .select({ category: providerCategories.category })
        .from(providerCategories)
        .where(eq(providerCategories.providerId, id)),
      db
        .select({
          n: sql<number>`count(*)::int`,
          completed: sql<number>`count(*) filter (where ${bookings.status} in ('completed','released'))::int`,
          revenue: sql<number>`coalesce(sum(case when ${bookings.status} in ('completed','released') then ${bookings.totalPrice}::numeric else 0 end), 0)::float`,
        })
        .from(bookings)
        .where(eq(bookings.providerId, id)),
      db
        .select({
          avg: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
          n: sql<number>`count(*)::int`,
        })
        .from(reviews)
        .where(
          and(eq(reviews.providerId, id), eq(reviews.status, "published")),
        ),
      db
        .select({
          id: bookings.id,
          status: bookings.status,
          scheduledAt: bookings.scheduledAt,
          totalPrice: bookings.totalPrice,
        })
        .from(bookings)
        .where(eq(bookings.providerId, id))
        .orderBy(desc(bookings.scheduledAt))
        .limit(8),
      db
        .select({
          id: reviews.id,
          rating: reviews.rating,
          comment: reviews.comment,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .where(
          and(eq(reviews.providerId, id), eq(reviews.status, "published")),
        )
        .orderBy(desc(reviews.createdAt))
        .limit(5),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(disputes)
        .innerJoin(bookings, eq(bookings.id, disputes.bookingId))
        .where(eq(bookings.providerId, id)),
      db
        .select({
          held: wallets.balancePending,
          paid: wallets.balanceAvailable,
          currency: wallets.currency,
        })
        .from(wallets)
        .where(eq(wallets.providerId, id))
        .limit(1),
    ]);

  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const [recentAgg] = await db
    .select({
      n: sql<number>`count(*)::int`,
      revenue: sql<number>`coalesce(sum(case when ${bookings.status} in ('completed','released') then ${bookings.totalPrice}::numeric else 0 end), 0)::float`,
    })
    .from(bookings)
    .where(
      and(eq(bookings.providerId, id), gte(bookings.scheduledAt, since30)),
    );

  const status = row.onboardingStatus as DbStatus;
  const dispName = row.providerName || row.providerEmail?.split("@")[0] || "—";
  const initials = initialsOf(row.providerName, row.providerEmail ?? "?");
  const isApproved = status === "approved";
  const isSuspended = status === "suspended";
  const fmt = (d: Date) =>
    d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <AdminShell email={admin.email ?? ""}>
      <Link
        href="/admin/providers"
        className="inline-flex h-10 items-center gap-1 text-[13px] font-semibold text-brand"
      >
        <ChevronLeft size={16} aria-hidden /> {t("providersTitle")}
      </Link>

      {applied && (
        <div
          role="status"
          className="mt-2 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-2.5 text-[14px] font-semibold text-success"
        >
          <Check size={16} aria-hidden /> {t("applied")}
        </div>
      )}

      <header className="mt-3 flex flex-wrap items-start gap-4 rounded-lg border border-border bg-bg-base p-5">
        <ProviderAvatar size={72} hue={1} initials={initials} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-h2">{dispName}</h1>
            <span
              className={
                "inline-flex h-7 items-center rounded-sm px-2.5 text-[12px] font-bold uppercase " +
                statusBadgeClass(status)
              }
            >
              {status}
            </span>
          </div>
          <p className="mt-0.5 text-[13px] text-text-tertiary">
            {row.providerEmail}
          </p>
          <p className="mt-0.5 text-[12px] text-text-tertiary tabular-nums">
            {row.providerCountry} · Applied {fmt(row.submittedAt ?? row.createdAt)}
          </p>
          {cats.length > 0 && (
            <p className="mt-2 text-[13px] text-text-secondary">
              {cats
                .map((c) =>
                  tCat(c.category as Parameters<typeof tCat>[0]),
                )
                .join(" · ")}
            </p>
          )}
          {row.bio && (
            <p className="mt-2 whitespace-pre-line text-[13px] text-text-secondary">
              {row.bio}
            </p>
          )}
          {row.rejectionReason && (status === "rejected" || isSuspended) && (
            <p className="mt-2 rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">
              {row.rejectionReason}
            </p>
          )}
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label={t("colBookings")}
          value={String(bookingAgg[0]?.n ?? 0)}
          sub={`${bookingAgg[0]?.completed ?? 0} done`}
        />
        <Stat
          label="Revenue (lifetime)"
          value={`$${Number(bookingAgg[0]?.revenue ?? 0).toFixed(0)}`}
          sub={`30d: $${Number(recentAgg?.revenue ?? 0).toFixed(0)}`}
        />
        <Stat
          label="Rating"
          value={
            (ratingAgg[0]?.n ?? 0) > 0
              ? Number(ratingAgg[0].avg).toFixed(1)
              : "—"
          }
          sub={`${ratingAgg[0]?.n ?? 0} reviews`}
        />
        <Stat label="Disputes" value={String(disputeCount[0]?.n ?? 0)} />
      </section>

      <section className="mt-5 rounded-lg border border-border bg-bg-base p-5">
        <p className="text-[14px] font-bold">Wallet</p>
        {wallet[0] ? (
          <p className="mt-2 grid grid-cols-2 gap-4 text-[14px]">
            <span>
              <span className="block text-[12px] text-text-tertiary">Held</span>
              <span className="block font-semibold tabular-nums">
                {wallet[0].currency} {Number(wallet[0].held).toFixed(2)}
              </span>
            </span>
            <span>
              <span className="block text-[12px] text-text-tertiary">
                Available
              </span>
              <span className="block font-semibold tabular-nums">
                {wallet[0].currency} {Number(wallet[0].paid).toFixed(2)}
              </span>
            </span>
          </p>
        ) : (
          <p className="mt-2 text-[13px] text-text-tertiary">No wallet yet</p>
        )}
      </section>

      <section className="mt-5 rounded-lg border border-border bg-bg-base p-5">
        <p className="text-[14px] font-bold">Compliance documents</p>
        {docs.length === 0 ? (
          <p className="mt-2 text-[13px] text-text-tertiary">None uploaded</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {docs.map((d, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 py-2.5 text-[13px]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold uppercase">
                    {d.type}
                  </span>
                  {d.documentNumber && (
                    <span className="block text-[12px] text-text-tertiary tabular-nums">
                      {d.documentNumber}
                    </span>
                  )}
                </span>
                <span
                  className={
                    "inline-flex h-6 items-center rounded-sm px-2 text-[11px] font-bold uppercase " +
                    (d.status === "approved"
                      ? "bg-success-soft text-success"
                      : d.status === "rejected"
                        ? "bg-danger-soft text-danger"
                        : "bg-warning-soft text-warning")
                  }
                >
                  {d.status}
                </span>
                {d.fileUrl && (
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noopener"
                    className="text-[12px] font-semibold text-brand"
                  >
                    open
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-5 rounded-lg border border-border bg-bg-base p-5">
        <p className="text-[14px] font-bold">Recent bookings</p>
        {recentBookings.length === 0 ? (
          <p className="mt-2 text-[13px] text-text-tertiary">—</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {recentBookings.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between py-2.5 text-[13px]"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold tabular-nums">
                    B-{b.id.slice(0, 8)}
                  </span>
                  <span className="text-[12px] text-text-tertiary">
                    {fmt(b.scheduledAt)} ·{" "}
                    <span className="uppercase">{b.status}</span>
                  </span>
                </span>
                <span className="tabular-nums font-semibold">
                  ${Number(b.totalPrice).toFixed(0)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-5 rounded-lg border border-border bg-bg-base p-5">
        <p className="text-[14px] font-bold">Recent reviews</p>
        {recentReviews.length === 0 ? (
          <p className="mt-2 text-[13px] text-text-tertiary">—</p>
        ) : (
          <ul className="mt-2 divide-y divide-border">
            {recentReviews.map((r) => (
              <li key={r.id} className="py-2.5 text-[13px]">
                <span className="block font-semibold tabular-nums">
                  {"★".repeat(r.rating)}
                  <span className="text-text-tertiary">
                    {"★".repeat(Math.max(0, 5 - r.rating))}
                  </span>{" "}
                  <span className="text-[12px] font-normal text-text-tertiary">
                    {fmt(r.createdAt)}
                  </span>
                </span>
                {r.comment && (
                  <span className="mt-0.5 block text-text-secondary">
                    {r.comment}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <form
        action={providerDecisionAction}
        className="mt-6 flex flex-col gap-4 rounded-lg border border-border bg-bg-base p-5"
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="id" value={row.id} />
        <fieldset>
          <legend className="text-[14px] font-bold">Action</legend>
          <ul className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(
              [
                { key: "approve", label: t("provApprove"), show: !isApproved },
                { key: "sendBack", label: t("provSendBack"), show: !isSuspended },
                { key: "hold", label: t("provHold"), show: !isSuspended },
                { key: "reject", label: t("provReject"), show: status !== "rejected" },
                { key: "suspend", label: "Suspend", show: isApproved },
                { key: "resume", label: "Resume", show: isSuspended },
              ] as const
            )
              .filter((a) => a.show)
              .map((a, i) => (
                <li key={a.key}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-border bg-bg-base p-3 has-[:checked]:border-2 has-[:checked]:border-brand">
                    <input
                      type="radio"
                      name="action"
                      value={a.key}
                      required
                      defaultChecked={i === 0}
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
            className="block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3 text-[14px] focus:border-brand focus:outline-none"
          />
        </div>

        <Button type="submit" variant="primary" block size="md">
          {t("disputeApply")}
        </Button>
      </form>
    </AdminShell>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-base p-4">
      <p className="text-[12px] text-text-tertiary">{label}</p>
      <p className="mt-1 text-[22px] font-extrabold tabular-nums">{value}</p>
      {sub && (
        <p className="mt-0.5 text-[12px] text-text-tertiary tabular-nums">
          {sub}
        </p>
      )}
    </div>
  );
}
