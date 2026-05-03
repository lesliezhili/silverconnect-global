import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AuthCard } from "@/components/domain/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <AuthCard title={t("loginTitle")} subtitle={t("loginSub")}>
      <form className="flex flex-col gap-4" action="/api/auth/login" method="post">
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
        <div>
          <Label htmlFor="password">{tCommon("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={8}
            required
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="mt-1.5 text-[14px] text-text-secondary">
            {t("passwordHint")}
          </p>
        </div>
        <Button type="submit" variant="primary" block size="md">
          {t("loginCta")}
        </Button>
      </form>

      <Link
        href="/auth/forgot"
        className="mt-3 inline-flex h-12 items-center justify-center text-[15px] font-semibold text-brand"
      >
        {t("forgot")}
      </Link>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" aria-hidden />
        <span className="text-[13px] text-text-tertiary">{tCommon("or")}</span>
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          className="flex h-14 items-center justify-center gap-2 rounded-md border-[1.5px] border-border-strong bg-bg-base text-[16px] font-semibold text-text-primary"
        >
          <span aria-hidden>G</span>
          {t("google")}
        </button>
        <button
          type="button"
          className="flex h-14 items-center justify-center gap-2 rounded-md border-[1.5px] border-border-strong bg-bg-base text-[16px] font-semibold text-text-primary"
        >
          <span aria-hidden></span>
          {t("apple")}
        </button>
      </div>

      <p className="mt-6 text-center text-[15px] text-text-secondary">
        {t("noAccount")}{" "}
        <Link href="/auth/register" className="font-semibold text-brand">
          {t("registerLink")}
        </Link>
      </p>
      <p className="mt-3 text-center text-[12px] text-text-tertiary">
        {t("termsAgree")}
      </p>
    </AuthCard>
  );
}
