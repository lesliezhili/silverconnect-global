import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { Link, redirect } from "@/i18n/navigation";
import { AuthCard } from "@/components/domain/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getSession } from "@/components/domain/sessionCookie";
import { issueCode } from "@/components/domain/verifyCode";
import { sendEmail, buildResetEmail } from "@/components/domain/email";
import { findUserByEmail } from "@/lib/auth/server";

async function forgotAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const locale = String(formData.get("locale") ?? "en");
  if (!email.includes("@")) {
    nextRedirect(`/${locale}/auth/forgot?error=invalid`);
  }
  const user = await findUserByEmail(email);
  // Always pretend we sent (avoid email-existence oracle).
  if (user) {
    const code = await issueCode(email, "password_reset");
    const { subject, text, html } = buildResetEmail(code, locale);
    const result = await sendEmail({ to: email, subject, text, html });
    if (!result.ok && process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("[forgot] sendEmail failed:", result.reason, "code=", code);
    }
  }
  nextRedirect(
    `/${locale}/auth/reset?email=${encodeURIComponent(email)}&sent=1`,
  );
}

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
  const session = await getSession();
  if (session.signedIn) redirect({ href: "/home", locale });
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const errorMsg = error === "invalid" ? t("errorEmailInvalid") : null;

  return (
    <AuthCard title={t("forgotTitle")} subtitle={t("forgotSub")}>
      {errorMsg && (
        <div
          role="alert"
          className="mb-4 rounded-md border-[1.5px] border-danger bg-danger-soft px-3.5 py-3 text-[14px] font-semibold text-danger"
        >
          {errorMsg}
        </div>
      )}
      <form className="flex flex-col gap-4" action={forgotAction}>
        <input type="hidden" name="locale" value={locale} />
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
