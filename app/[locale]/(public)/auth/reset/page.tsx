import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { CheckCircle2 } from "lucide-react";
import { AuthCard } from "@/components/domain/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getSession } from "@/components/domain/sessionCookie";

type ResetState = "default" | "success" | "expired";

function parseState(raw: string | undefined, sent: string | undefined): ResetState {
  if (sent === "1") return "success";
  if (raw === "expired") return "expired";
  return "default";
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const session = await getSession();
  if (session.signedIn) redirect({ href: "/home", locale });
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  const state = parseState(
    typeof sp.state === "string" ? sp.state : undefined,
    typeof sp.sent === "string" ? sp.sent : undefined
  );
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const errorMsg =
    error === "mismatch"
      ? t("errorPasswordMismatch")
      : error
      ? t("errorGeneric")
      : null;
  const token = typeof sp.token === "string" ? sp.token : "";

  if (state === "success") {
    return (
      <AuthCard title={t("resetSuccess")} subtitle={t("resetSuccessHint")}>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={48} aria-hidden />
          </span>
          <Link
            href="/auth/login"
            className="inline-flex h-14 w-full items-center justify-center rounded-md bg-brand text-[17px] font-bold text-white hover:bg-brand-hover"
          >
            {t("backToLogin")}
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (state === "expired") {
    return (
      <AuthCard title={t("resetExpired")} subtitle={t("resetExpiredHint")}>
        <Link
          href="/auth/forgot"
          className="inline-flex h-14 w-full items-center justify-center rounded-md bg-brand text-[17px] font-bold text-white hover:bg-brand-hover"
        >
          {t("forgotCta")}
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t("resetTitle")} subtitle={t("resetSub")}>
      {errorMsg && (
        <div
          role="alert"
          className="mb-4 rounded-md border-[1.5px] border-danger bg-danger-soft px-3.5 py-3 text-[14px] font-semibold text-danger"
        >
          {errorMsg}
        </div>
      )}
      <form className="flex flex-col gap-4" action="/api/auth/reset" method="post">
        <input type="hidden" name="token" value={token} />
        <div>
          <Label htmlFor="password">{t("newPassword")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="mt-1.5 text-[14px] text-text-secondary">
            {t("passwordHint")}
          </p>
        </div>
        <div>
          <Label htmlFor="confirm">{t("confirmPassword")}</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" variant="primary" block size="md">
          {t("resetCta")}
        </Button>
      </form>
      <Link
        href="/auth/login"
        className="mt-4 inline-flex h-12 w-full items-center justify-center text-[15px] font-semibold text-brand"
      >
        {tCommon("back")}
      </Link>
    </AuthCard>
  );
}
