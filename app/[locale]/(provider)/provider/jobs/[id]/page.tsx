import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect, notFound } from "next/navigation";
import { after } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { Phone, MapPin, AlertTriangle, Check, Star } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { DeclineJobModal } from "@/components/domain/DeclineJobModal";
import { getCountry } from "@/components/domain/countryCookie";
import { priceCountry } from "@/components/domain/pricing";
import { db } from "@/lib/db";
import { bookings, bookingChanges, bookingEvidence } from "@/lib/db/schema/bookings";
import { providerProfiles } from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";
import { addresses } from "@/lib/db/schema/customer-data";
import { services } from "@/lib/db/schema/services";
import { getCurrentUser } from "@/lib/auth/server";
import { notifyAndEmail } from "@/lib/notifications/server";
import { buildBookingStatusEmail } from "@/components/domain/email";
import { payments, wallets } from "@/lib/db/schema/payments";
import { cancelBooking, CancelBookingError } from "@/lib/bookings/cancelBooking";
import { GenerateInvoiceButton } from "@/components/domain/GenerateInvoiceButton";
import { EvidenceUploadModal } from "@/components/domain/EvidenceUploadModal";
import { RateCustomerWidget } from "@/components/domain/RateCustomerWidget";
import { reviews } from "@/lib/db/schema/reviews";

export const dynamic = "force-dynamic";

type DbStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "disputed"
  | "released";

type Action = "accept" | "decline" | "start" | "complete" | "cancel";

async function ensureProviderJob(
  bookingId: string,
  userId: string,
): Promise<{ booking: { id: string; status: DbStatus }; providerId: string } | null> {
  const [profile] = await db
    .select({ id: providerProfiles.id })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, userId))
    .limit(1);
  if (!profile) return null;
  const [b] = await db
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(
      and(eq(bookings.id, bookingId), eq(bookings.providerId, profile.id)),
    )
    .limit(1);
  if (!b) return null;
  return { booking: { id: b.id, status: b.status as DbStatus }, providerId: profile.id };
}

async function jobAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "") as Action;
  const reason = String(formData.get("reason") ?? "");
  const me = await getCurrentUser();
  if (!me || me.role !== "provider") {
    nextRedirect(`/${locale}/auth/login`);
  }
  const owned = await ensureProviderJob(id, me.id);
  if (!owned) nextRedirect(`/${locale}/provider/jobs`);
  const from = owned.booking.status;

  // Validate transition. "decline" (pre-acceptance) and "cancel"
  // (already accepted, or already underway) are both provider-initiated
  // cancellations — routed through lib/bookings/cancelBooking.ts so they
  // get the same policy/refund/compensation handling as everything else,
  // instead of just flipping status with no money movement at all.
  const transitions: Record<Action, { from: DbStatus[]; to: DbStatus }> = {
    accept:   { from: ["pending"],                  to: "confirmed" },
    decline:  { from: ["pending"],                  to: "cancelled" },
    start:    { from: ["confirmed"],                to: "in_progress" },
    complete: { from: ["in_progress"],               to: "completed" },
    cancel:   { from: ["confirmed", "in_progress"],  to: "cancelled" },
  };
  const rule = transitions[action];
  if (!rule || !rule.from.includes(from)) {
    nextRedirect(
      `/${locale}/provider/jobs/${id}?error=invalid_transition`,
    );
  }

  // "start"/"complete" each require a matching before/after photo — the
  // client-side modal already blocks submission without one, but that's
  // UX only; this is the real boundary, matching the convention used
  // throughout this codebase for anything client-toggleable.
  if (action === "start" || action === "complete") {
    const requiredPhase = action === "start" ? "before" : "after";
    const [evidence] = await db
      .select({ id: bookingEvidence.id })
      .from(bookingEvidence)
      .where(and(eq(bookingEvidence.bookingId, id), eq(bookingEvidence.phase, requiredPhase)))
      .limit(1);
    if (!evidence) {
      nextRedirect(`/${locale}/provider/jobs/${id}?error=evidence_required`);
    }
  }

  if (action === "decline" || action === "cancel") {
    const { default: postgres } = await import("postgres");
    const sql2 = postgres(process.env.DATABASE_URL || "", { prepare: false, connect_timeout: 10 });
    try {
      await cancelBooking(sql2, {
        bookingId: id,
        cancelledBy: me.id,
        reason: reason || (action === "decline" ? "provider_declined" : "provider_unavailable"),
        notes: action === "decline" ? `Provider decline: ${reason || "—"}` : `Provider cancel: ${reason || "—"}`,
      });
      await db.insert(bookingChanges).values({
        bookingId: id,
        type: "cancel",
        fromStatus: from,
        toStatus: "cancelled",
        actorId: me.id,
        note: action === "decline" ? `Provider decline: ${reason || "—"}` : `Provider cancel: ${reason || "—"}`,
      });
    } catch (e) {
      await sql2.end().catch(() => {});
      const message = e instanceof CancelBookingError ? e.message : "Cancellation failed";
      nextRedirect(`/${locale}/provider/jobs/${id}?error=${encodeURIComponent(message)}`);
    }
    await sql2.end();
  } else {
    await db.transaction(async (tx) => {
      const patch: Record<string, unknown> = {
        status: rule.to,
        updatedAt: new Date(),
      };
      if (action === "accept") patch.confirmedAt = new Date();
      if (action === "start") patch.startedAt = new Date();
      if (action === "complete") patch.completedAt = new Date();
      await tx.update(bookings).set(patch).where(eq(bookings.id, id));
      await tx.insert(bookingChanges).values({
        bookingId: id,
        type: "status_change",
        fromStatus: from,
        toStatus: rule.to,
        actorId: me.id,
        note: `Provider ${action}`,
      });

      // Capture payment when job is completed (end-to-end payment flow)
      if (action === "complete") {
        const [pmt] = await db.select().from(payments).where(eq(payments.bookingId, id)).limit(1);
        if (pmt && pmt.status !== "captured") {
          await db.update(payments).set({ status: "captured" as never, capturedAt: new Date(), updatedAt: new Date() }).where(eq(payments.id, pmt.id));
          // Credit provider wallet (15% platform commission like Airtasker)
          const commission = 0.15;
          const providerAmount = Number(pmt.amount) * (1 - commission);
          await db.execute(sql`
            INSERT INTO wallets (id, provider_id, balance_pending, balance_available, currency, updated_at)
            VALUES (gen_random_uuid(), ${owned.providerId}, ${providerAmount.toFixed(2)}, '0', ${pmt.currency}, NOW())
            ON CONFLICT (provider_id) DO UPDATE SET
              balance_pending = wallets.balance_pending::numeric + ${providerAmount.toFixed(2)}::numeric,
              updated_at = NOW()
          `);
        }
      }
    });
  }

  // Notify the customer about every transition. Deferred so the
  // redirect lands instantly.
  after(async () => {
    const [b] = await db
      .select({ customerId: bookings.customerId })
      .from(bookings)
      .where(eq(bookings.id, id))
      .limit(1);
    if (!b?.customerId) return;

    const titles: Record<Action, string> = {
      accept: "Provider accepted your booking",
      decline: "Provider declined — please rebook",
      start: "Your provider is on the way",
      complete: "Your service is complete",
      cancel: "Provider cancelled — full refund issued",
    };
    const link = `/${locale}/bookings/${id}`;

    if (action === "decline" || action === "cancel") {
      await notifyAndEmail({
        userId: b.customerId,
        kind: "booking_update",
        title: titles[action],
        link,
        relatedBookingId: id,
        email: buildBookingStatusEmail(
          "cancelled",
          process.env.NEXT_PUBLIC_APP_URL ?? "",
          id,
          locale,
        ),
      });
      return;
    }
    const emailStatus = action === "accept"
      ? "confirmed"
      : action === "start"
        ? "in_progress"
        : "completed";
    await notifyAndEmail({
      userId: b.customerId,
      kind: "booking_update",
      title: titles[action],
      link,
      relatedBookingId: id,
      email: buildBookingStatusEmail(
        emailStatus,
        process.env.NEXT_PUBLIC_APP_URL ?? "",
        id,
        locale,
      ),
    });
  });
  // After complete, leaving the provider on the same page is fine.
  // After decline/cancel, send them back to the jobs list.
  if (action === "decline") {
    nextRedirect(`/${locale}/provider/jobs?declined=1`);
  }
  if (action === "cancel") {
    nextRedirect(`/${locale}/provider/jobs?cancelled=1`);
  }
  nextRedirect(`/${locale}/provider/jobs/${id}`);
}

function initialsOf(name: string | null, fallback: string): string {
  const src = (name || fallback).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (src.slice(0, 2) || "?").toUpperCase();
}

export default async function ProviderJobDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  if (me.role !== "provider") nextRedirect(`/${locale}/home`);
  const country = await getCountry();
  const t = await getTranslations("provider");
  const tCategories = await getTranslations("categories");
  const tCommon = await getTranslations("common");

  let row: any;
  try {
    const owned = await ensureProviderJob(id, me.id);
    if (!owned) notFound();

    const [dbRow] = await db
      .select({
        id: bookings.id,
        customerId: bookings.customerId,
        scheduledAt: bookings.scheduledAt,
        durationMin: bookings.durationMin,
        status: bookings.status,
        totalPrice: bookings.totalPrice,
        basePrice: bookings.basePrice,
        taxAmount: bookings.taxAmount,
        notes: bookings.notes,
        customerName: users.name,
        customerEmail: users.email,
        customerPhone: users.phone,
        addressLine1: addresses.line1,
        addressCity: addresses.city,
        addressState: addresses.state,
        addressPostcode: addresses.postcode,
        serviceCategory: services.categoryCode,
      })
      .from(bookings)
      .leftJoin(users, eq(users.id, bookings.customerId))
      .leftJoin(addresses, eq(addresses.id, bookings.addressId))
      .leftJoin(services, eq(services.id, bookings.serviceId))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!dbRow) notFound();
    row = dbRow;
  } catch (error) {
    console.error("[jobs/id] DB unavailable", error);
    notFound();
  }
  const status = row.status as DbStatus;

  const justCompleted = status === "completed";
  const isCancelled = status === "cancelled";

  // Customer reputation from other providers — lets this provider see who
  // they're working with, mirroring the established avg(rating) pattern
  // used for provider ratings throughout the app.
  const [customerRatingAgg] = await db
    .select({
      n: sql<number>`count(*)::int`,
      avg: sql<number>`coalesce(avg(${reviews.rating}), 0)::float`,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.customerId, row.customerId),
        eq(reviews.direction, "provider_to_customer"),
        eq(reviews.status, "published"),
      ),
    );
  const customerReviewCount = customerRatingAgg?.n ?? 0;
  const customerAvgRating = customerRatingAgg?.avg ?? 0;

  const dateLabel = row.scheduledAt.toLocaleDateString(
    locale === "zh" ? "zh-CN" : "en-AU",
    { weekday: "long", month: "short", day: "numeric" },
  );
  const timeLabel = row.scheduledAt.toLocaleTimeString(
    locale === "zh" ? "zh-CN" : "en-AU",
    { hour: "2-digit", minute: "2-digit" },
  );

  const dispName =
    row.customerName || (row.customerEmail?.split("@")[0] ?? "—");
  const initials = initialsOf(row.customerName, row.customerEmail ?? "?");
  const addressStr = [
    row.addressLine1,
    row.addressCity,
    row.addressState,
    row.addressPostcode,
  ]
    .filter(Boolean)
    .join(", ");
  const serviceLabel = row.serviceCategory
    ? tCategories(row.serviceCategory as Parameters<typeof tCategories>[0])
    : "—";

  return (
    <>
      <Header
        country={country}
        back
        signedIn={true}
        initials={me.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[140px] pt-6 sm:pb-12"
      >
        <p className="text-[16px] font-semibold uppercase tracking-wide text-text-tertiary tabular-nums">
          {dateLabel} · {timeLabel}
        </p>
        <h1 className="mt-1 text-h2">{serviceLabel}</h1>

        {justCompleted && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-3 text-[17px] font-semibold text-success"
          >
            <Check size={18} aria-hidden /> {t("statusCompleted")}
          </div>
        )}

        {(status === "completed" || status === "released") && (
          <GenerateInvoiceButton
            bookingId={id}
            strings={{
              generate: t("generateInvoice"),
              generating: t("generatingInvoice"),
              view: t("viewInvoice"),
              alreadyInvoiced: t("alreadyInvoiced"),
            }}
          />
        )}

        {(status === "completed" || status === "released") && (
          <RateCustomerWidget
            bookingId={id}
            strings={{
              title: t("rateCustomerTitle"),
              submit: t("rateCustomerSubmit"),
              submitting: t("rateCustomerSubmitting"),
              submitted: t("rateCustomerSubmitted"),
              failed: t("rateCustomerFailed"),
              commentPh: t("rateCustomerCommentPh"),
            }}
          />
        )}

        {isCancelled && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-md border-[1.5px] border-warning bg-warning-soft p-3.5 text-warning"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
            <p className="text-[16px] font-semibold">
              {t("cancelPolicyTitle")}
            </p>
          </div>
        )}

        <section className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-bg-base p-4">
          <ProviderAvatar size={56} hue={3} initials={initials} />
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold">{dispName}</p>
            {customerReviewCount > 0 && (
              <p className="mt-0.5 flex items-center gap-1 text-[16px] text-text-secondary">
                <Star size={14} className="text-[var(--brand-accent)]" aria-hidden />
                <span className="font-bold tabular-nums">{customerAvgRating.toFixed(1)}</span>
                <span className="text-text-tertiary">
                  ({customerReviewCount} {t("customerReviewsFromProviders")})
                </span>
              </p>
            )}
            {row.customerPhone && (
              <p className="mt-0.5 text-[17px] text-text-tertiary tabular-nums">
                {row.customerPhone}
              </p>
            )}
          </div>
          {row.customerPhone && (
            <a
              href={`tel:${row.customerPhone}`}
              aria-label={t("jobCall")}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success"
            >
              <Phone size={20} aria-hidden />
            </a>
          )}
        </section>

        {addressStr && (
          <section className="mt-3 flex items-start gap-3 rounded-lg border border-border bg-bg-base p-4">
            <span
              aria-hidden
              className="flex h-12 w-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand"
            >
              <MapPin size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[17px] font-semibold">{addressStr}</p>
            </div>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(addressStr)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center rounded-sm border-[1.5px] border-brand bg-bg-base px-3 text-[16px] font-bold text-brand"
            >
              {t("jobNavigate")}
            </a>
          </section>
        )}

        {row.notes && (
          <section className="mt-3 rounded-lg border border-border bg-bg-base p-4">
            <p className="text-[16px] font-bold">{t("jobNotes")}</p>
            <p className="mt-1 text-[17px] text-text-primary">{row.notes}</p>
          </section>
        )}

        <section className="mt-3 rounded-lg border border-border bg-bg-base p-4">
          <p className="text-[16px] font-bold">{t("priceBreakdown")}</p>
          <dl className="mt-3 flex flex-col gap-1.5 text-[16px]">
            <Row label={t("priceBase")} value={priceCountry(country, Number(row.basePrice))} />
            <Row label="Tax" value={priceCountry(country, Number(row.taxAmount))} />
            <div className="my-1 h-px bg-border" />
            <Row
              label={t("priceTotal")}
              value={priceCountry(country, Number(row.totalPrice))}
              bold
            />
          </dl>
        </section>

        <Link
          href={`/safety/report?bookingId=${row.id}`}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md border-[1.5px] border-danger bg-bg-base text-[17px] font-bold text-danger"
        >
          {t("reportProblem")}
        </Link>

      </main>

      {!justCompleted && !isCancelled && (
        <ActionBar
          locale={locale}
          jobId={row.id}
          status={status}
          t={t}
          tCommon={tCommon}
        />
      )}
    </>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={bold ? "text-[17px] font-bold" : "text-text-secondary"}>
        {label}
      </dt>
      <dd className={"tabular-nums " + (bold ? "text-[16px] font-extrabold" : "")}>
        {value}
      </dd>
    </div>
  );
}

function ActionBar({
  locale,
  jobId,
  status,
  t,
  tCommon,
}: {
  locale: string;
  jobId: string;
  status: DbStatus;
  t: Awaited<ReturnType<typeof getTranslations<"provider">>>;
  tCommon: Awaited<ReturnType<typeof getTranslations<"common">>>;
}) {
  // "accept" needs no evidence — it's a plain action button. "start" and
  // "complete" each require a before/after photo first, so they render
  // an EvidenceUploadModal instead (see the matching server-side check
  // in jobAction).
  const acts: { key: Action; label: string; primary: boolean }[] =
    status === "pending"
      ? [{ key: "accept", label: t("jobAccept"), primary: true }]
      : [];

  const showEvidenceStart = status === "confirmed";
  const showEvidenceComplete = status === "in_progress";
  const showDecline = status === "pending";
  // Already accepted (or started) — "cancel" instead of "decline", routed
  // through the same policy engine so the customer/provider split still
  // applies (full refund if not started yet, prorated if in_progress).
  const showCancel = status === "confirmed" || status === "in_progress";
  if (
    acts.length === 0 &&
    !showDecline &&
    !showCancel &&
    !showEvidenceStart &&
    !showEvidenceComplete
  )
    return null;

  const evidenceStartStrings = {
    triggerLabel: t("jobOnTheWay"),
    title: t("evidenceBeforeTitle"),
    hint: t("evidenceBeforeHint"),
    photoLabel: t("evidencePhotoLabel"),
    cancel: tCommon("cancel"),
    submit: t("jobOnTheWay"),
    uploading: t("evidenceUploading"),
    uploadFailed: t("evidenceUploadFailed"),
  };

  const evidenceCompleteStrings = {
    triggerLabel: t("jobComplete"),
    title: t("evidenceAfterTitle"),
    hint: t("evidenceAfterHint"),
    photoLabel: t("evidencePhotoLabel"),
    cancel: tCommon("cancel"),
    submit: t("jobComplete"),
    uploading: t("evidenceUploading"),
    uploadFailed: t("evidenceUploadFailed"),
  };

  const declineStrings = {
    triggerLabel: t("jobDecline"),
    title: t("declineTitle"),
    hint: t("declineHint"),
    reasonLegend: t("declineReason"),
    reasonOptions: (
      ["declineReason1", "declineReason2", "declineReason3", "declineReason4"] as const
    ).map((k) => ({ value: k, label: t(k) })),
    cancel: tCommon("cancel"),
    submit: t("jobDecline"),
  };

  const cancelStrings = {
    triggerLabel: t("jobCancelBooking"),
    title: t("cancelJobTitle"),
    hint: t("declineHint"),
    reasonLegend: t("declineReason"),
    reasonOptions: (
      ["declineReason1", "declineReason2", "declineReason3", "declineReason4"] as const
    ).map((k) => ({ value: k, label: t(k) })),
    cancel: tCommon("cancel"),
    submit: t("jobCancelBooking"),
  };

  return (
    <div className="fixed inset-x-0 bottom-[84px] z-20 border-t border-border bg-bg-base px-5 py-3 sm:bottom-0">
      <div className="mx-auto flex max-w-content gap-3">
        {showDecline && (
          <DeclineJobModal
            action={jobAction}
            actionValue="decline"
            locale={locale}
            jobId={jobId}
            strings={declineStrings}
          />
        )}
        {showCancel && (
          <DeclineJobModal
            action={jobAction}
            actionValue="cancel"
            locale={locale}
            jobId={jobId}
            strings={cancelStrings}
          />
        )}
        {showEvidenceStart && (
          <EvidenceUploadModal
            action={jobAction}
            actionValue="start"
            phase="before"
            locale={locale}
            jobId={jobId}
            strings={evidenceStartStrings}
          />
        )}
        {showEvidenceComplete && (
          <EvidenceUploadModal
            action={jobAction}
            actionValue="complete"
            phase="after"
            locale={locale}
            jobId={jobId}
            strings={evidenceCompleteStrings}
          />
        )}
        {acts.map((a) => (
          <form key={a.key} action={jobAction} className="flex-1">
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={jobId} />
            <input type="hidden" name="action" value={a.key} />
            <button
              type="submit"
              className={
                "inline-flex h-12 w-full items-center justify-center rounded-md text-[17px] font-bold " +
                (a.primary
                  ? "bg-brand text-white"
                  : "border-[1.5px] border-border-strong bg-bg-base text-text-primary")
              }
            >
              {a.label}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
