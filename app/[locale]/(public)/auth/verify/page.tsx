import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, Mail } from "lucide-react";
import { AuthCard } from "@/components/domain/AuthCard";
import { Button } from "@/components/ui/Button";

type VerifyState = "pending" | "success" | "expired" | "resent";

function parseState(raw: string | undefined, resent: string | undefined): VerifyState {
  if (resent === "1") return "resent";
  if (raw === "success") return "success";
  if (raw === "expired") return "expired";
  return "pending";
}

export default async function VerifyEmailPage({
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
  const state = parseState(
    typeof sp.state === "string" ? sp.state : undefined,
    typeof sp.resent === "string" ? sp.resent : undefined
  );
  const email =
    typeof sp.email === "string" && sp.email.length > 0
      ? sp.email
      : "your@email.com";

  if (state === "success") {
    return (
      <AuthCard title={t("verifySuccess")} subtitle={t("verifySuccessHint")}>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={48} aria-hidden />
          </span>
          <Link
            href="/home"
            className="inline-flex h-14 w-full items-center justify-center rounded-md bg-brand text-[17px] font-bold text-white hover:bg-brand-hover"
          >
            {t("continueToHome")} →
          </Link>
        </div>
      </AuthCard>
    );
  }

  if (state === "expired") {
    return (
      <AuthCard title={t("verifyExpired")} subtitle={t("verifyExpiredHint")}>
        <form action="/api/auth/verify/resend" method="post" className="flex flex-col gap-3">
          <input type="hidden" name="email" value={email} />
          <Button type="submit" variant="primary" block size="md">
            {t("verifyResend")}
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={state === "resent" ? t("verifyResent") : t("verifyTitle")}
      subtitle={t("verifySub", { email })}
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Mail size={42} aria-hidden />
        </span>
        <p className="text-[15px] font-semibold text-text-primary">{email}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        <a
          href={`mailto:${email}`}
          className="flex h-14 items-center justify-center rounded-md bg-brand text-[17px] font-bold text-white hover:bg-brand-hover"
        >
          {t("openMailApp")}
        </a>
        <form action="/api/auth/verify/resend" method="post">
          <input type="hidden" name="email" value={email} />
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-md text-[15px] font-semibold text-brand"
          >
            {t("verifyResend")}
          </button>
        </form>
      </div>
    </AuthCard>
  );
}
