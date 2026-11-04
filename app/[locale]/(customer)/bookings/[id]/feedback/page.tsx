import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect, notFound } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { Star, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { getCountry } from "@/components/domain/countryCookie";
import { db } from "@/lib/db";
import { bookings, bookingEvidence } from "@/lib/db/schema/bookings";
import { providerProfiles } from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";
import { services } from "@/lib/db/schema/services";
import { reviews } from "@/lib/db/schema/reviews";
import { getCurrentUser } from "@/lib/auth/server";
import { releaseOrHold } from "@/lib/feedback/release";
import { isEffortTier } from "@/lib/release-pricing";

export const dynamic = "force-dynamic";

function initialsOf(name: string | null, fallback: string): string {
  const src = (name || fallback).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (src.slice(0, 2) || "?").toUpperCase();
}

async function feedbackAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  const ratingRaw = Number(formData.get("rating") ?? 0);
  const comment = String(formData.get("comment") ?? "").trim();
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  if (!id) nextRedirect(`/${locale}/bookings`);
  if (!Number.isFinite(ratingRaw) || ratingRaw < 1 || ratingRaw > 5) {
    nextRedirect(`/${locale}/bookings/${id}/feedback?error=rating`);
  }

  // Confirm booking belongs to this customer + has reached a state that
  // allows review (completed/released).
  const [b] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      providerId: bookings.providerId,
    })
    .from(bookings)
    .where(and(eq(bookings.id, id), eq(bookings.customerId, me.id)))
    .limit(1);
  if (!b) nextRedirect(`/${locale}/bookings`);
  if (b.status !== "completed" && b.status !== "released") {
    nextRedirect(`/${locale}/bookings/${id}/feedback?error=not_completed`);
  }
  if (!b.providerId) {
    nextRedirect(`/${locale}/bookings/${id}/feedback?error=no_provider`);
  }

  const aspects: Record<string, number> = {};
  for (const k of ["quality", "punctuality", "communication"]) {
    const n = Number(formData.get(`aspect_${k}`));
    if (Number.isInteger(n) && n >= 1 && n <= 5) aspects[k] = n;
  }
  const suggestedTier = String(formData.get("suggestedTier") ?? "");
  const rating = Math.round(ratingRaw);

  let held = false;
  try {
    const inserted = await db
      .insert(reviews)
      .values({
        bookingId: b.id,
        customerId: me.id,
        providerId: b.providerId!,
        rating,
        comment: comment || null,
        direction: "customer_to_provider",
        aspects: Object.keys(aspects).length ? aspects : null,
        suggestedTier: isEffortTier(suggestedTier) ? suggestedTier : null,
      })
      .onConflictDoNothing()
      .returning({ id: reviews.id });
    if (inserted.length === 0) nextRedirect(`/${locale}/bookings/${id}/feedback?error=duplicate`);
    // Confirming the job releases the payout, or holds it for review.
    held = (await releaseOrHold({ bookingId: b.id, actorId: me.id, rating })).held;
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect
    console.error("[feedback] insert failed:", e instanceof Error ? e.message : e);
    nextRedirect(`/${locale}/bookings/${id}/feedback?error=server`);
  }

  nextRedirect(`/${locale}/bookings/${id}/feedback?sent=1${held ? "&held=1" : ""}`);
}

const isVideo = (url: string) => /\.(mp4|mov|webm)(\?|$)/i.test(url);

export default async function FeedbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, id } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const zhFb = locale === "zh" || locale === "zh_tw";
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  const country = await getCountry();
  const t = await getTranslations("feedback");
  const tCommon = await getTranslations("common");
  const sent = sp.sent === "1";
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const [row] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      providerName: users.name,
      providerEmail: users.email,
      serviceCategory: services.categoryCode,
    })
    .from(bookings)
    .leftJoin(providerProfiles, eq(providerProfiles.id, bookings.providerId))
    .leftJoin(users, eq(users.id, providerProfiles.userId))
    .leftJoin(services, eq(services.id, bookings.serviceId))
    .where(and(eq(bookings.id, id), eq(bookings.customerId, me.id)))
    .limit(1);

  if (!row) notFound();

  const providerName =
    row.providerName || (row.providerEmail?.split("@")[0] ?? "—");
  const initials = initialsOf(row.providerName, row.providerEmail ?? "?");
  const tCategories = await getTranslations("categories");
  const serviceLabel = row.serviceCategory
    ? tCategories(row.serviceCategory as Parameters<typeof tCategories>[0])
    : t("mockService");

  // If a review already exists for this booking, show success without
  // letting the user submit a duplicate.
  const [existing] = await db
    .select({ id: reviews.id, rating: reviews.rating })
    .from(reviews)
    .where(and(eq(reviews.bookingId, id), eq(reviews.direction, "customer_to_provider")))
    .limit(1);

  const evidenceRows = await db
    .select({ phase: bookingEvidence.phase, fileUrl: bookingEvidence.fileUrl })
    .from(bookingEvidence)
    .where(eq(bookingEvidence.bookingId, id));
  const beforePhotos = evidenceRows.filter((e) => e.phase === "before");
  const afterPhotos = evidenceRows.filter((e) => e.phase === "after");

  if (sent || existing) {
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
          className="mx-auto flex w-full max-w-content flex-col items-center gap-3 px-5 pb-[120px] pt-12 text-center sm:pb-12"
        >
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={56} aria-hidden />
          </span>
          <h1 className="text-h1">{t("successTitle")}</h1>
          <p className="max-w-[320px] text-[16px] text-text-secondary">
            {t("successHint", { provider: providerName })}
          </p>
          {sp.held === "1" && (
            <p className="max-w-[320px] rounded-md bg-warning-soft p-3 text-[16px] text-warning">
              {zhFb
                ? "感谢反馈。我们的工作人员会先审核此次服务，再放款给服务者。"
                : "Thanks — our team will review this job before payment is released."}
            </p>
          )}
          {existing && (
            <p className="text-[16px] text-text-tertiary">
              {existing.rating}★ ·{" "}
              {locale === "zh" ? "已提交" : "submitted"}
            </p>
          )}
          <Link
            href={`/bookings/${id}`}
            className="mt-2 inline-flex h-14 items-center rounded-md bg-brand px-7 text-[17px] font-bold text-white"
          >
            {tCommon("viewBooking")}
          </Link>
        </main>
      </>
    );
  }

  const errorMsg =
    error === "rating"
      ? "Pick a rating (1-5)."
      : error === "not_completed"
        ? "You can only review a completed booking."
        : error === "duplicate"
          ? "You've already reviewed this booking."
          : error === "server"
            ? "Something went wrong. Please retry."
            : null;

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
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-h2">{t("title")}</h1>
        <p className="mt-1 text-[17px] text-text-secondary">
          {t("sub", { provider: providerName })}
        </p>

        {errorMsg && (
          <div
            role="alert"
            className="mt-3 rounded-md border-[1.5px] border-danger bg-danger-soft px-3.5 py-3 text-[16px] font-semibold text-danger"
          >
            {errorMsg}
          </div>
        )}

        <section className="mt-5 flex items-center gap-3 rounded-md border border-border bg-bg-base p-4">
          <ProviderAvatar size={56} hue={0} initials={initials} />
          <div>
            <p className="text-[16px] font-bold">{providerName}</p>
            <p className="text-[17px] text-text-tertiary">{serviceLabel}</p>
          </div>
        </section>

        {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
          <section className="mt-5 rounded-md border border-border bg-bg-base p-4">
            <p className="text-[16px] font-bold text-text-primary">{t("evidenceTitle")}</p>
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[15px] font-semibold text-text-tertiary">{t("evidenceBefore")}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {beforePhotos.length === 0 ? (
                    <p className="text-[15px] text-text-tertiary">—</p>
                  ) : (
                    beforePhotos.map((p, i) => (
                      isVideo(p.fileUrl) ? (
                        <video key={i} src={p.fileUrl} controls playsInline preload="metadata" aria-label={t("evidenceBefore")} className="w-full rounded-md border border-border" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={p.fileUrl} alt={t("evidenceBefore")} className="w-full rounded-md border border-border object-cover" />
                      )
                    ))
                  )}
                </div>
              </div>
              <div>
                <p className="text-[15px] font-semibold text-text-tertiary">{t("evidenceAfter")}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {afterPhotos.length === 0 ? (
                    <p className="text-[15px] text-text-tertiary">—</p>
                  ) : (
                    afterPhotos.map((p, i) => (
                      isVideo(p.fileUrl) ? (
                        <video key={i} src={p.fileUrl} controls playsInline preload="metadata" aria-label={t("evidenceAfter")} className="w-full rounded-md border border-border" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={p.fileUrl} alt={t("evidenceAfter")} className="w-full rounded-md border border-border object-cover" />
                      )
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <form className="mt-6 flex flex-col gap-6" action={feedbackAction}>
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="id" value={id} />
          <fieldset>
            <legend className="text-[16px] font-bold text-text-primary">
              {t("rating")}
            </legend>
            <div
              className="mt-3 flex gap-2"
              role="radiogroup"
              aria-required="true"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <label
                  key={n}
                  className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border-[1.5px] border-border-strong bg-bg-base hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand-soft"
                >
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    required
                    className="peer sr-only"
                    defaultChecked={n === 5}
                  />
                  <Star
                    size={32}
                    className="text-text-tertiary peer-checked:fill-[var(--brand-accent)] peer-checked:text-[var(--brand-accent)]"
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          {/* Aspect ratings + next-visit tier: feed provider matching and
              service selection (reviews.aspects / reviews.suggested_tier). */}
          <fieldset className="flex flex-col gap-3">
            <legend className="text-[16px] font-bold text-text-primary">
              {zhFb ? "分项评价（可选）" : "Rate each part (optional)"}
            </legend>
            {([
              ["quality", "Quality of work", "服务质量"],
              ["punctuality", "On time", "准时"],
              ["communication", "Communication", "沟通"],
            ] as const).map(([k, en, zh]) => (
              <label key={k} className="flex items-center justify-between gap-3 text-[16px]">
                <span>{zhFb ? zh : en}</span>
                <select name={`aspect_${k}`} defaultValue="" className="h-12 w-28 rounded-md border-[1.5px] border-border-strong bg-bg-base px-3">
                  <option value="">—</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{"★".repeat(n)}</option>
                  ))}
                </select>
              </label>
            ))}
            <label className="flex items-center justify-between gap-3 text-[16px]">
              <span>{zhFb ? "下次需要的强度" : "Next visit should be"}</span>
              <select name="suggestedTier" defaultValue="" className="h-12 w-40 rounded-md border-[1.5px] border-border-strong bg-bg-base px-3">
                <option value="">{zhFb ? "不变" : "Same"}</option>
                <option value="regular">{zhFb ? "常规" : "Regular"}</option>
                <option value="medium">{zhFb ? "中度" : "Medium effort"}</option>
                <option value="high">{zhFb ? "高强度" : "High effort"}</option>
              </select>
            </label>
          </fieldset>

          <div>
            <Label htmlFor="comment">{t("comment")}</Label>
            <textarea
              id="comment"
              name="comment"
              placeholder={t("commentPh")}
              rows={4}
              maxLength={2000}
              className="block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3.5 text-[16px] text-text-primary placeholder:text-text-placeholder focus:border-brand focus:outline-none"
            />
          </div>

          <Button type="submit" variant="primary" block size="md">
            {t("submit")}
          </Button>
        </form>
      </main>
    </>
  );
}
