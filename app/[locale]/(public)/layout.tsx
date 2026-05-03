import { setRequestLocale } from "next-intl/server";

/**
 * Public route group — auth, landing, help.
 * Deliberately bare: no AIFloatButton, no BottomTabBar; the auth
 * screens are the user's first impression and need to be focused.
 */
export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <>{children}</>;
}
