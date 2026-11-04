import { setRequestLocale } from "next-intl/server";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import EmergencyButton from "@/components/safety/EmergencyButton";
import { RELEASE_FEATURES } from "@/lib/release";
import { EmergencyOverlay } from "@/components/layout/EmergencyOverlay";
import { BackButton } from "@/components/layout/BackButton";
import { getCountry } from "@/components/domain/countryCookie";

export default async function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const country = await getCountry();

  return (
    <>
      <BackButton />
      {children}
      {/* SOS is not part of Release 1 (lib/release.ts RELEASE_FEATURES) */}
      {RELEASE_FEATURES.emergencySos && <EmergencyButton country={country} />}
      {RELEASE_FEATURES.emergencySos && <EmergencyOverlay country={country} />}
      <BottomTabBar />
    </>
  );
}
