import { setRequestLocale } from "next-intl/server";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { AIFloatButton } from "@/components/layout/AIFloatButton";

export default async function CustomerLayout({
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
      <AIFloatButton />
      <BottomTabBar />
    </>
  );
}
