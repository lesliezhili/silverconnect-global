import { setRequestLocale } from "next-intl/server";
import { BackButton } from "@/components/layout/BackButton";

export default async function AdminLayoutGroup({
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
