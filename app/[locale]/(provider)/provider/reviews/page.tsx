import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { Star, Flag, Reply } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link, redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";
import { MOCK_REVIEWS, reviewStats } from "@/components/domain/providerMock";

const DIM_KEYS = [
  "dimPunctual",
  "dimProfessional",
  "dimClean",
  "dimAttitude",
  "dimPrice",
] as const;

const DIM_AVERAGES: Record<(typeof DIM_KEYS)[number], number> = {
  dimPunctual: 4.8,
  dimProfessional: 4.9,
  dimClean: 4.7,
  dimAttitude: 4.9,
  dimPrice: 4.5,
};

async function replyAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const id = String(formData.get("id") ?? "");
  nextRedirect(`/${locale}/provider/reviews?replied=${id}`);
}

export default async function ProviderReviewsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const session = await getSession();
  if (!session.signedIn) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("provider");

  const filterRaw = Array.isArray(sp.stars) ? sp.stars[0] : sp.stars;
  const filter = filterRaw && /^[1-5]$/.test(filterRaw) ? Number(filterRaw) : 0;
  const replyOpen = typeof sp.reply === "string" ? sp.reply : null;

  const reviews = filter
    ? MOCK_REVIEWS.filter((r) => r.rating === filter)
    : MOCK_REVIEWS;
  const { avg, n, pct } = reviewStats(MOCK_REVIEWS);

  const filters = [0, 5, 4, 3, 2, 1];

  return (
    <>
      <Header
        country={country}
        signedIn={session.signedIn}
        initials={session.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-h2">{t("reviewsTitle")}</h1>

        {/* Aggregate */}
        <section className="mt-4 grid grid-cols-3 gap-3">
          <Stat label={t("reviewsAvg", { avg: avg.toFixed(1) })} big>
            <Star size={18} className="fill-[var(--brand-accent)] text-[var(--brand-accent)]" aria-hidden />
          </Stat>
          <Stat label={t("reviewsCount", { n })} />
          <Stat label={t("reviewsRate", { pct })} />
        </section>

        {/* Dimension scores */}
        <section className="mt-5 rounded-lg border border-border bg-bg-base p-4">
          <ul className="flex flex-col gap-2.5">
            {DIM_KEYS.map((k) => {
              const v = DIM_AVERAGES[k];
              const w = Math.round((v / 5) * 100);
              return (
                <li key={k} className="grid grid-cols-[100px_1fr_44px] items-center gap-3">
                  <span className="text-[14px] font-semibold">{t(k)}</span>
                  <span className="h-2 rounded-full bg-bg-surface-2">
                    <span
                      className="block h-full rounded-full bg-brand"
                      style={{ width: `${w}%` }}
                      aria-hidden
                    />
                  </span>
                  <span className="text-right text-[13px] font-bold tabular-nums">
                    {v.toFixed(1)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Filter */}
        <nav role="tablist" className="mt-5 flex gap-2 overflow-x-auto">
          {filters.map((f) => {
            const on = f === filter;
            return (
              <Link
                key={f}
                href={f === 0 ? `?` : `?stars=${f}`}
                role="tab"
                aria-selected={on}
                className={
                  "inline-flex h-10 items-center gap-1 rounded-pill border-[1.5px] px-4 text-[14px] font-semibold tabular-nums " +
                  (on
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border-strong bg-bg-base text-text-primary")
                }
              >
                {f === 0 ? t("reviewsAll") : `${f}★`}
              </Link>
            );
          })}
        </nav>

        {/* List */}
        <ul className="mt-4 flex flex-col gap-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-border bg-bg-base p-4"
            >
              <div className="flex items-start gap-3">
                <ProviderAvatar size={44} hue={1} initials={r.customerInitials} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <p className="text-[15px] font-bold">{r.customerName}</p>
                    <p className="text-[12px] text-text-tertiary tabular-nums">
                      {new Date(r.dateISO).toLocaleDateString(
                        locale === "zh" ? "zh-CN" : "en-AU",
                        { month: "short", day: "numeric" }
                      )}
                    </p>
                  </div>
                  <div className="mt-1 flex gap-0.5" aria-label={t("reviewStars", { n: r.rating })}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i <= r.rating
                            ? "fill-[var(--brand-accent)] text-[var(--brand-accent)]"
                            : "text-text-tertiary"
                        }
                        aria-hidden
                      />
                    ))}
                  </div>
                  <p className="mt-2 text-[14px] text-text-primary">{r.comment}</p>
                </div>
              </div>

              {r.reply && (
                <div className="mt-3 rounded-md bg-bg-surface-2 p-3">
                  <p className="text-[12px] font-bold text-text-secondary">
                    {t("reviewsReplied")}
                  </p>
                  <p className="mt-0.5 text-[13px] text-text-primary">{r.reply}</p>
                </div>
              )}

              {!r.reply && replyOpen === r.id && (
                <form action={replyAction} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="locale" value={locale} />
                  <input type="hidden" name="id" value={r.id} />
                  <textarea
                    name="reply"
                    required
                    minLength={5}
                    rows={3}
                    className="block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3 text-[15px] text-text-primary focus:border-brand focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <Link
                      href="/provider/reviews"
                      className="inline-flex h-10 flex-1 items-center justify-center rounded-md border-[1.5px] border-border-strong bg-bg-base text-[14px] font-semibold text-text-primary"
                    >
                      {t("registerBack")}
                    </Link>
                    <Button type="submit" variant="primary" size="md">
                      {t("reviewsReply")}
                    </Button>
                  </div>
                </form>
              )}

              {!r.reply && replyOpen !== r.id && (
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`?reply=${r.id}${filter ? `&stars=${filter}` : ""}`}
                    className="inline-flex h-10 items-center gap-1 rounded-sm border-[1.5px] border-brand bg-bg-base px-3 text-[13px] font-semibold text-brand"
                  >
                    <Reply size={14} aria-hidden />
                    {t("reviewsReply")}
                  </Link>
                  <button
                    type="button"
                    className="ml-auto inline-flex h-10 items-center gap-1 rounded-sm border-[1.5px] border-border-strong bg-bg-base px-3 text-[13px] font-semibold text-text-tertiary"
                  >
                    <Flag size={14} aria-hidden />
                    {t("reviewsReport")}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

function Stat({
  label,
  big = false,
  children,
}: {
  label: string;
  big?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-base p-3 text-center">
      <p
        className={
          "flex items-center justify-center gap-1 tabular-nums font-extrabold " +
          (big ? "text-[20px]" : "text-[16px]")
        }
      >
        {children}
        {label}
      </p>
    </div>
  );
}
