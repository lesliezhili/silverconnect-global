import { setRequestLocale } from "next-intl/server";
import { BackButton } from "@/components/layout/BackButton";

/**
 * Public route group — auth, landing, help.
 * BackButton auto-hides on the landing page itself.
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
  return (
    <>
      <BackButton />
      {children}
    </>
  );
}
