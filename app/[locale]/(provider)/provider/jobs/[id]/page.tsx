import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect, notFound } from "next/navigation";
import { Phone, MapPin, AlertTriangle, Check, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link, redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import {
  MOCK_JOBS,
  jobTotal,
  priceCountry,
} from "@/components/domain/providerMock";

const ACTIONS = ["accept", "decline", "onTheWay", "arrived", "complete"] as const;
type JobAction = (typeof ACTIONS)[number];

async function jobAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  const flag =
    action === "decline"
      ? "decline=1"
      : action === "complete"
      ? "completed=1"
      : `last=${encodeURIComponent(action)}`;
  nextRedirect(`/${locale}/provider/jobs/${id}?${flag}`);
}

export default async function ProviderJobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, id } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session.signedIn) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("provider");
  const tService = await getTranslations("categories");
  const tCommon = await getTranslations("common");

  const job = MOCK_JOBS.find((j) => j.id === id);
  if (!job) notFound();

  const declineMode = sp.decline === "1";
  const completed = sp.completed === "1";

  const start = new Date(job.startISO);
  const dateLabel = start.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-AU", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
  const timeLabel = start.toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const cancelled = job.status === "cancelled";
  const customerCancelled = sp.cancelled === "1" || cancelled;

  return (
    <>
      <Header
        country={country}
        back
        signedIn={session.signedIn}
        initials={session.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[140px] pt-6 sm:pb-12"
      >
        <p className="text-[14px] font-semibold uppercase tracking-wide text-text-tertiary tabular-nums">
          {dateLabel} · {timeLabel}
        </p>
        <h1 className="mt-1 text-h2">{tService(job.serviceKey)}</h1>

        {completed && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-3 text-[15px] font-semibold text-success"
          >
            <Check size={18} aria-hidden /> {t("statusCompleted")}
          </div>
        )}

        {customerCancelled && (
          <div
            role="status"
            className="mt-4 flex items-start gap-2 rounded-md border-[1.5px] border-warning bg-warning-soft p-3.5 text-warning"
          >
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden />
            <p className="text-[14px] font-semibold">{t("cancelPolicyTitle")}</p>
          </div>
        )}

        {/* Customer */}
        <section className="mt-5 flex items-center gap-3 rounded-lg border border-border bg-bg-base p-4">
          <ProviderAvatar size={56} hue={3} initials={job.customerInitials} />
          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-bold">{job.customerName}</p>
            <p className="mt-0.5 text-[13px] text-text-tertiary tabular-nums">
              {job.phone}
            </p>
          </div>
          <a
            href={`tel:${job.phone}`}
            aria-label={t("jobCall")}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success"
          >
            <Phone size={20} aria-hidden />
          </a>
        </section>

        {/* Address */}
        <section className="mt-3 flex items-start gap-3 rounded-lg border border-border bg-bg-base p-4">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand"
          >
            <MapPin size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold">{job.addressLine}</p>
            <p className="mt-0.5 text-[13px] text-text-tertiary tabular-nums">
              {t("distanceKm", { km: job.distanceKm.toFixed(1) })}
            </p>
          </div>
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(job.addressLine)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center rounded-sm border-[1.5px] border-brand bg-bg-base px-3 text-[14px] font-bold text-brand"
          >
            {t("jobNavigate")}
          </a>
        </section>

        {/* Notes */}
        {job.notes && (
          <section className="mt-3 rounded-lg border border-border bg-bg-base p-4">
            <p className="text-[14px] font-bold">{t("jobNotes")}</p>
            <p className="mt-1 text-[15px] text-text-primary">{job.notes}</p>
          </section>
        )}

        {/* Price breakdown */}
        <section className="mt-3 rounded-lg border border-border bg-bg-base p-4">
          <p className="text-[14px] font-bold">{t("priceBreakdown")}</p>
          <dl className="mt-3 flex flex-col gap-1.5 text-[14px]">
            <Row label={t("priceBase")} value={priceCountry(country, job.basePrice)} />
            {job.weekendBonus ? (
              <Row label={t("priceWeekend")} value={priceCountry(country, job.weekendBonus)} />
            ) : null}
            {job.tip ? (
              <Row label={t("priceTip")} value={priceCountry(country, job.tip)} />
            ) : null}
            <div className="my-1 h-px bg-border" />
            <Row
              label={t("priceTotal")}
              value={priceCountry(country, jobTotal(job))}
              bold
            />
          </dl>
        </section>

        <Link
          href={`/safety/report?bookingId=${job.id}`}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-md border-[1.5px] border-danger bg-bg-base text-[15px] font-bold text-danger"
        >
          {t("reportProblem")}
        </Link>

        {/* Decline form */}
        {declineMode && (
          <form
            action={jobAction}
            className="mt-6 flex flex-col gap-4 rounded-lg border-2 border-danger bg-bg-base p-5"
          >
            <input type="hidden" name="locale" value={locale} />
            <input type="hidden" name="id" value={job.id} />
            <input type="hidden" name="action" value="decline" />
            <h2 className="text-h3 text-danger">{t("declineTitle")}</h2>
            <p className="text-[14px] text-text-secondary">{t("declineHint")}</p>
            <fieldset>
              <legend className="text-[14px] font-bold">{t("declineReason")}</legend>
              <ul className="mt-2 flex flex-col gap-2">
                {(["declineReason1", "declineReason2", "declineReason3", "declineReason4"] as const).map(
                  (k) => (
                    <li key={k}>
                      <label className="flex cursor-pointer items-center gap-3 rounded-md border-[1.5px] border-border bg-bg-base p-3.5 has-[:checked]:border-2 has-[:checked]:border-danger">
                        <input
                          type="radio"
                          name="reason"
                          value={k}
                          required
                          className="peer sr-only"
                        />
                        <span
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border-strong after:hidden after:h-3 after:w-3 after:rounded-full after:bg-danger after:content-[''] peer-checked:border-danger peer-checked:after:block"
                          aria-hidden
                        />
                        <span className="text-[15px]">{t(k)}</span>
                      </label>
                    </li>
                  )
                )}
              </ul>
            </fieldset>
            <div className="flex gap-3">
              <Link
                href={`/provider/jobs/${job.id}`}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-md border-[1.5px] border-border-strong bg-bg-base text-[15px] font-semibold text-text-primary"
              >
                {tCommon("cancel")}
              </Link>
              <Button type="submit" variant="primary" size="md">
                {t("jobDecline")}
              </Button>
            </div>
          </form>
        )}
      </main>

      {/* Sticky action bar */}
      {!declineMode && !completed && !customerCancelled && (
        <ActionBar locale={locale} jobId={job.id} status={job.status} t={t} />
      )}
    </>
  );
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={bold ? "text-[15px] font-bold" : "text-text-secondary"}>{label}</dt>
      <dd className={"tabular-nums " + (bold ? "text-[16px] font-extrabold" : "")}>{value}</dd>
    </div>
  );
}

function ActionBar({
  locale,
  jobId,
  status,
  t,
}: {
  locale: string;
  jobId: string;
  status: string;
  t: Awaited<ReturnType<typeof getTranslations<"provider">>>;
}) {
  const acts: { key: JobAction; label: string; variant: "primary" | "danger" | "neutral" }[] =
    status === "pending"
      ? [
          { key: "decline", label: t("jobDecline"), variant: "danger" },
          { key: "accept", label: t("jobAccept"), variant: "primary" },
        ]
      : status === "accepted"
      ? [{ key: "onTheWay", label: t("jobOnTheWay"), variant: "primary" }]
      : status === "enRoute"
      ? [{ key: "arrived", label: t("jobArrived"), variant: "primary" }]
      : status === "inProgress"
      ? [{ key: "complete", label: t("jobComplete"), variant: "primary" }]
      : [];

  if (acts.length === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-[84px] z-20 border-t border-border bg-bg-base px-5 py-3 sm:bottom-0">
      <div className="mx-auto flex max-w-content gap-3">
        {acts.map((a) =>
          a.key === "decline" ? (
            <Link
              key={a.key}
              href={`/provider/jobs/${jobId}?decline=1`}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-md border-[1.5px] border-danger bg-bg-base text-[15px] font-bold text-danger"
            >
              <X size={18} className="mr-1" aria-hidden />
              {a.label}
            </Link>
          ) : (
            <form key={a.key} action={jobAction} className="flex-1">
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="id" value={jobId} />
              <input type="hidden" name="action" value={a.key} />
              <button
                type="submit"
                className={
                  "inline-flex h-12 w-full items-center justify-center rounded-md text-[15px] font-bold " +
                  (a.variant === "primary"
                    ? "bg-brand text-white"
                    : "border-[1.5px] border-border-strong bg-bg-base text-text-primary")
                }
              >
                {a.label}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
