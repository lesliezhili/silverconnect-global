import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { eq, and, gte, lt, asc } from "drizzle-orm";
import { ChevronRight, DollarSign } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { priceCountry } from "@/components/domain/pricing";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema/bookings";
import { providerProfiles } from "@/lib/db/schema/providers";
import { users } from "@/lib/db/schema/users";
import { services } from "@/lib/db/schema/services";
import { wallets } from "@/lib/db/schema/payments";
import { getCurrentUser } from "@/lib/auth/server";
import { RoleSwitchButton } from "@/components/RoleSwitchButton";

export const dynamic = "force-dynamic";

function formatTime(d: Date, locale: string) {
  return d.toLocaleTimeString(locale === "zh" ? "zh-CN" : "en-AU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function initialsOf(name: string | null, fallback: string): string {
  const src = (name || fallback).trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (src.slice(0, 2) || "?").toUpperCase();
}

export default async function ProviderWorkbenchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  let me: Awaited<ReturnType<typeof getCurrentUser>>;
  try {
    me = await getCurrentUser();
  } catch {
    nextRedirect(`/${locale}/auth/login`);
    return null as never;
  }
  if (!me) {
    nextRedirect(`/${locale}/auth/login`);
    return null as never;
  }
  if (me.role !== "provider") {
    nextRedirect(`/${locale}/home`);
    return null as never;
  }
  const country = await getCountry();
  const t = await getTranslations("provider");
  const tCategories = await getTranslations("categories");

  // DB queries with fallback (page works without seeded DB)
  let profileId: string | null = null;
  let todayJobs: Array<{
    id: string;
    scheduledAt: Date;
    status: string;
    totalPrice: string | null;
    customerName: string | null;
    customerEmail: string | null;
    serviceCode: string | null;
    serviceCategory: string | null;
  }> = [];
  let heldEarnings = 0;
  let paidEarnings = 0;

  try {
    const [profile] = await db
      .select({ id: providerProfiles.id })
      .from(providerProfiles)
      .where(eq(providerProfiles.userId, me.id))
      .limit(1);

    if (!profile) {
      nextRedirect(`/${locale}/provider/register`);
      return null as never;
    }
    profileId = profile.id;

    // Today window
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    todayJobs = await db
      .select({
        id: bookings.id,
        scheduledAt: bookings.scheduledAt,
        status: bookings.status,
        totalPrice: bookings.totalPrice,
        customerName: users.name,
        customerEmail: users.email,
        serviceCode: services.code,
        serviceCategory: services.categoryCode,
      })
      .from(bookings)
      .leftJoin(users, eq(users.id, bookings.customerId))
      .leftJoin(services, eq(services.id, bookings.serviceId))
      .where(
        and(
          eq(bookings.providerId, profile.id),
          gte(bookings.scheduledAt, startOfDay),
          lt(bookings.scheduledAt, endOfDay),
        ),
      )
      .orderBy(asc(bookings.scheduledAt))
      .limit(10);

    const [wallet] = await db
      .select({
        balancePending: wallets.balancePending,
        balanceAvailable: wallets.balanceAvailable,
      })
      .from(wallets)
      .where(eq(wallets.providerId, profile.id))
      .limit(1);

    heldEarnings = wallet ? Number(wallet.balancePending) : 0;
    paidEarnings = wallet ? Number(wallet.balanceAvailable) : 0;
  } catch (error) {
    console.error("[provider] DB unavailable, using empty state", error);
  }

  return (
    <>
      <Header
        country={country}
        signedIn={true}
        initials={me.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-h2">
          {t("greeting", { name: me.name ?? me.email.split("@")[0] })}
        </h1>
        <p className="mt-1 text-[16px] text-text-tertiary">
          {new Date().toLocaleDateString(locale === "zh" ? "zh-CN" : "en-AU", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </p>

        <Link
          href="/provider/earnings"
          className="mt-5 flex items-center gap-4 rounded-lg border border-border bg-bg-base p-4"
        >
          <span
            aria-hidden
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-success-soft text-success"
          >
            <DollarSign size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] text-text-tertiary">{t("weekEarnings")}</p>
            <p className="mt-0.5 text-[24px] font-extrabold tabular-nums">
              {priceCountry(country, heldEarnings + paidEarnings)}
            </p>
            <p className="mt-1 text-[17px] text-text-secondary">
              <span className="text-warning">{t("held")}</span>{" "}
              <span className="tabular-nums font-semibold">
                {priceCountry(country, heldEarnings)}
              </span>
              <span className="mx-2 text-border-strong">·</span>
              <span className="text-success">{t("paid")}</span>{" "}
              <span className="tabular-nums font-semibold">
                {priceCountry(country, paidEarnings)}
              </span>
            </p>
          </div>
          <ChevronRight
            size={20}
            className="shrink-0 text-text-tertiary"
            aria-hidden
          />
        </Link>

        <section className="mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[18px] font-bold">{t("todayJobs")}</h2>
            <Link
              href="/provider/jobs"
              className="text-[16px] font-semibold text-brand"
            >
              {t("seeAll")}
            </Link>
          </div>

          {todayJobs.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border-strong bg-bg-base p-6 text-center text-[17px] text-text-secondary">
              {t("noJobsToday")}
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {todayJobs.map((j) => {
                const dispName =
                  j.customerName ||
                  (j.customerEmail?.split("@")[0] ?? "—");
                const initials = initialsOf(
                  j.customerName,
                  j.customerEmail ?? "?",
                );
                const serviceLabel = j.serviceCategory
                  ? tCategories(
                      j.serviceCategory as Parameters<typeof tCategories>[0],
                    )
                  : (j.serviceCode ?? "—");
                const statusKey = j.status
                  ? `status${j.status.charAt(0).toUpperCase()}${j.status.slice(1).replace(/_./g, (m) => m.charAt(1).toUpperCase())}`
                  : "statusPending";
                return (
                  <li key={j.id}>
                    <Link
                      href={`/provider/jobs/${j.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border bg-bg-base p-4"
                    >
                      <ProviderAvatar
                        size={48}
                        hue={2}
                        initials={initials}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <p className="text-[17px] font-bold tabular-nums">
                            {formatTime(j.scheduledAt, locale)}
                          </p>
                          <p className="text-[17px] font-semibold">
                            {dispName}
                          </p>
                        </div>
                        <p className="mt-0.5 text-[17px] text-text-secondary">
                          {serviceLabel}
                        </p>
                        <p className="mt-0.5 text-[17px] font-semibold text-text-tertiary">
                          <span className="tabular-nums">
                            {priceCountry(country, Number(j.totalPrice))}
                          </span>
                          <span className="mx-2">·</span>
                          <span>
                            {t.has(statusKey as Parameters<typeof t>[0])
                              ? t(statusKey as Parameters<typeof t>[0])
                              : j.status}
                          </span>
                        </p>
                      </div>
                      <ChevronRight
                        size={20}
                        className="shrink-0 text-text-tertiary"
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      
                {/* Quick Actions */}
        <section className="mt-6">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/provider/services" className="flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-surface p-4 hover:border-brand">
              <span className="text-2xl">✨</span>
              <span className="text-[15px] font-semibold">{locale === "zh" ? "我的服务" : "My Services"}</span>
            </Link>
            <Link href="/provider/bank" className="flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-surface p-4 hover:border-brand">
              <span className="text-2xl">🏦</span>
              <span className="text-[15px] font-semibold">{locale === "zh" ? "银行与收入" : "Bank & Payouts"}</span>
            </Link>
            <Link href="/provider/jobs" className="flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-surface p-4 hover:border-brand">
              <span className="text-2xl">📋</span>
              <span className="text-[15px] font-semibold">{locale === "zh" ? "所有任务" : "All Jobs"}</span>
            </Link>
            <Link href="/provider/reviews" className="flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-surface p-4 hover:border-brand">
              <span className="text-2xl">⭐</span>
              <span className="text-[15px] font-semibold">{locale === "zh" ? "评价排名" : "Reviews & Ranking"}</span>
            </Link>
          </div>
        </section>

        {/* Training & Certification */}
        <section className="mt-8 rounded-xl border-2 border-dashed border-brand bg-brand-primary-soft p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div className="flex-1">
              <h2 className="text-[18px] font-bold text-text-primary">
                {locale === "zh" ? "培训与认证" : "Training & Certification"}
              </h2>
              <p className="mt-0.5 text-[16px] text-text-secondary">
                {locale === "zh"
                  ? "获取TAFE资格，提升您的收入和优先排名"
                  : "Get TAFE qualifications to boost your earnings & ranking"}
              </p>
            </div>
            <Link
              href="/provider/training"
              className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-[16px] font-bold text-white"
            >
              {locale === "zh" ? "查看课程" : "View Courses"}
            </Link>
          </div>
        </section>

      </main>
      {me && (
        <div className="mx-auto w-full max-w-content px-5 pb-6">
          <RoleSwitchButton role="provider" hasCompletedOnboarding locale={locale} />
        </div>
      )}
    </>
  );
}
