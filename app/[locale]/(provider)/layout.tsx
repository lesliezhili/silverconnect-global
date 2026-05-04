import { setRequestLocale } from "next-intl/server";
import { ProviderBottomTabBar } from "@/components/layout/ProviderBottomTabBar";

export default async function ProviderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      {children}
      <ProviderBottomTabBar />
    </>
  );
}
