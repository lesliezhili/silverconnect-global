import { setRequestLocale } from "next-intl/server";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { AIFloatButton } from "@/components/layout/AIFloatButton";
import { EmergencyOverlay } from "@/components/layout/EmergencyOverlay";
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
      {children}
      <AIFloatButton />
      <EmergencyOverlay country={country} />
      <BottomTabBar />
    </>
  );
}
