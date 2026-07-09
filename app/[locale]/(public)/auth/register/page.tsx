import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { after } from "next/server";
import { eq, sql } from "drizzle-orm";
import { Link, redirect } from "@/i18n/navigation";
import { AuthCard } from "@/components/domain/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Label } from "@/components/ui/Label";
import { issueCode } from "@/components/domain/verifyCode";
import { sendEmail, buildVerifyEmail } from "@/components/domain/email";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { findUserByEmail, getCurrentUser } from "@/lib/auth/server";
import { hashPassword } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

async function registerAction(formData: FormData) {
  "use server";
  const fullName = String(formData.get("fullName") ?? "").trim();
  const name = fullName; // DB column is "name"
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  const faithPreference = formData.get("faithPreference") === "christian" ? "christian" : null;

  // Unified signup: everyone is customer. No role selection.
  const role = "customer";

  if (!fullName) {
    nextRedirect(`/${locale}/auth/register?error=name`);
  }
  if (!email.includes("@") || password.length < 8) {
    nextRedirect(`/${locale}/auth/register?error=invalid`);
  }

  const existing = await findUserByEmail(email);
  if (existing && existing.emailVerifiedAt) {
    nextRedirect(`/${locale}/auth/register?error=taken`);
  }

  const passwordHash = await hashPassword(password);
  try {
    if (existing) {
      await db
        .update(users)
        .set({ passwordHash, name, role, updatedAt: new Date() })
        .where(eq(users.id, existing.id));
    } else {
      await db.insert(users).values({ email, passwordHash, name, role });
    }
  } catch (dbErr: unknown) {
    // If minimal insert fails, try absolute minimum (email + password only)
    try {
      await db.insert(users).values({ email, passwordHash, name, role } as any);
    } catch {
      console.error("[register] DB insert failed:", dbErr);
      nextRedirect(`/${locale}/auth/register?error=server`);
    }
  }

  // Auto-verify email
  try {
    const newUser = await findUserByEmail(email);
    if (newUser) {
      await db
        .update(users)
        .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, newUser.id));
    }
  } catch { /* emailVerifiedAt column might not exist — non-critical */ }

  // Send confirmation email in background (non-blocking)
  after(async () => {
    try {
      const code = await issueCode(email, "email_verify");
      const { subject, text, html } = buildVerifyEmail(code, locale);
      await sendEmail({ to: email, subject, text, html });
    } catch (e) {
      console.error("[register] welcome email failed:", e);
    }
  });

  // Redirect to login with success message
  nextRedirect(`/${locale}/auth/login?registered=1`);
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const me = await getCurrentUser();
  if (me) redirect({ href: "/home", locale });
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  const error = typeof sp.error === "string" ? sp.error : undefined;

  const errorMsg =
    error === "name" ? "Please enter your name"
    : error === "taken" ? t("errorEmailTaken")
    : error === "smtp" ? t("errorSmtpUnconfigured")
    : error === "send" ? t("errorSendFailed")
    : error === "invalid" ? t("errorGeneric")
    : null;

  return (
    <AuthCard title={t("registerTitle")} subtitle={t("registerSub")} locale={locale}>
      {/* NO AuthRoleTabs — unified signup, everyone is customer */}
      {errorMsg && (
        <div role="alert" className="mb-4 rounded-md border-[1.5px] border-danger bg-danger-soft px-3.5 py-3 text-[16px] font-semibold text-danger">
          {errorMsg}
        </div>
      )}
      <form className="flex flex-col gap-4" action={registerAction}>
        <input type="hidden" name="locale" value={locale} />
        {/* Name field — required for elder dignity */}
        <div>
          <Label htmlFor="fullName">Your name</Label>
          <Input id="fullName" name="fullName" type="text" autoComplete="name" placeholder="What should we call you?" required />
        </div>
        <div>
          <Label htmlFor="email">{tCommon("email")}</Label>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" placeholder={t("emailPh")} required />
        </div>
        <div>
          <Label htmlFor="password">{tCommon("password")}</Label>
          <PasswordInput id="password" name="password" minLength={8} required />
          <p id="password-hint" className="mt-1.5 text-[16px] text-text-secondary">{t("passwordHint")}</p>
        </div>
        {/* Optional faith preference — opt-in to see prayer/devotional content */}
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <input
            type="checkbox"
            id="faithPreference"
            name="faithPreference"
            value="christian"
            className="mt-1 h-5 w-5 rounded border-gray-300 text-teal-700 focus:ring-teal-600"
          />
          <label htmlFor="faithPreference" className="text-[16px] text-gray-700 leading-snug">
            I follow the Christian faith and would like to see daily prayer &amp; devotional content
            <span className="block text-[14px] text-gray-400 mt-0.5">(Optional — you can change this anytime in Settings)</span>
          </label>
        </div>
        <Button type="submit" variant="primary" block size="md">
          {t("registerCta")}
        </Button>
      </form>
      <p className="mt-6 text-center text-[17px] text-text-secondary">
        {t("hasAccount")}{" "}
        <Link href="/auth/login" className="font-semibold text-brand">{t("loginLink")}</Link>
      </p>
      {/* Helper prompt moved to post-registration onboarding */}
      <p className="mt-4 text-center text-[17px] text-text-secondary">
        <>{t("termsAgree")} <Link href="/terms" className="font-semibold text-brand underline px-1 py-1">{t("termsLink")}</Link></>
      </p>
    </AuthCard>
  );
}
