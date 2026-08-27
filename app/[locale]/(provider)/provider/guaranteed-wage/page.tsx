import { setRequestLocale, getTranslations } from "next-intl/server";
import { eq } from "drizzle-orm";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { getCountry } from "@/components/domain/countryCookie";
import { getCurrentUser } from "@/lib/auth/server";
import { isAuUser } from "@/lib/coins/ledger";
import { db } from "@/lib/db";
import { providerProfiles, guaranteedWageCycles } from "@/lib/db/schema/providers";
import { checkGuaranteedWageEligibility } from "@/lib/providers/actions";
import { GuaranteedWagePanel } from "./GuaranteedWagePanel";

export const dynamic = "force-dynamic";

export default async function GuaranteedWagePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  if (!me) redirect({ href: "/auth/login", locale });
  if (me!.role !== "provider") redirect({ href: "/home", locale });
  if (!(await isAuUser(me!.id))) redirect({ href: "/provider", locale });

  const country = await getCountry();
  const t = await getTranslations("guaranteedWage");

  const [profile] = await db
    .select({
      id: providerProfiles.id,
      payArrangement: providerProfiles.payArrangement,
      guaranteedWageStatus: providerProfiles.guaranteedWageStatus,
      guaranteedCommittedHours: providerProfiles.guaranteedCommittedHours,
      guaranteedMinCycleAmount: providerProfiles.guaranteedMinCycleAmount,
      guaranteedWageEnrolledAt: providerProfiles.guaranteedWageEnrolledAt,
    })
    .from(providerProfiles)
    .where(eq(providerProfiles.userId, me!.id))
    .limit(1);

  const cycles = profile
    ? await db
        .select()
        .from(guaranteedWageCycles)
        .where(eq(guaranteedWageCycles.providerId, profile.id))
        .orderBy(guaranteedWageCycles.cycleStart)
    : [];

  const eligibility = profile ? await checkGuaranteedWageEligibility(profile.id) : null;

  return (
    <>
      <Header country={country} back signedIn initials={me!.initials} />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-elder-heading font-extrabold">{t("title")}</h1>
        <p className="mt-2 text-body text-text-secondary">{t("subtitle")}</p>

        <GuaranteedWagePanel
          status={profile?.guaranteedWageStatus ?? null}
          committedHours={profile?.guaranteedCommittedHours ?? null}
          guaranteedAmount={profile?.guaranteedMinCycleAmount ?? null}
          eligibility={eligibility}
          cycles={cycles
            .map((c) => ({
              id: c.id,
              cycleStart: c.cycleStart,
              cycleEnd: c.cycleEnd,
              actualEarnings: c.actualEarnings,
              guaranteedAmount: c.guaranteedAmount,
              topupAmount: c.topupAmount,
            }))
            .reverse()}
        />
      </main>
    </>
  );
}
