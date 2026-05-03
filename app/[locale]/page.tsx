import { setRequestLocale, getTranslations } from "next-intl/server";
import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { AIFloatButton } from "@/components/layout/AIFloatButton";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-content px-4 pb-24 pt-6">
        <h1 className="text-h1 text-text-primary">{t("prompt")}</h1>
        <p className="mt-3 text-body text-text-secondary">
          P0 baseline scaffold. Hi-fi screens land in P1.
        </p>
      </main>
      <BottomTabBar />
      <AIFloatButton />
    </>
  );
}
