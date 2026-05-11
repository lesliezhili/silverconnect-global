import { setRequestLocale } from "next-intl/server";
import { PublicThemeCorner } from "@/components/layout/PublicThemeCorner";

/**
 * Auth-only layout: adds the fixed top-right theme toggle. Auth pages render
 * a centered card with their own vertical centering, so the corner button
 * doesn't collide with content; if a specific auth page ever gets a top-edge
 * title, give that page `pt-16`.
 */
export default async function AuthLayout({
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
      <PublicThemeCorner />
      {children}
    </>
  );
}
