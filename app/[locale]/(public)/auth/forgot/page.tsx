import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/domain/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default async function ForgotPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  const sent = sp.sent === "1";

  if (sent) {
    return (
      <AuthCard title={t("forgotSent")} subtitle={t("forgotSentHint")}>
        <Link
          href="/auth/login"
          className="inline-flex h-14 w-full items-center justify-center rounded-md bg-brand text-[17px] font-bold text-white hover:bg-brand-hover"
        >
          {t("backToLogin")}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("forgotTitle")} subtitle={t("forgotSub")}>
      <form
        className="flex flex-col gap-4"
        action="/auth/forgot?sent=1"
        method="get"
      >
        <div>
          <Label htmlFor="email">{tCommon("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t("emailPh")}
            required
          />
        </div>
        <Button type="submit" variant="primary" block size="md">
          {t("forgotCta")}
        </Button>
      </form>

      <Link
        href="/auth/login"
        className="mt-4 inline-flex h-12 w-full items-center justify-center text-[15px] font-semibold text-brand"
      >
        {t("backToLogin")}
      </Link>
    </AuthCard>
  );
}
