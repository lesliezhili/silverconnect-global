import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { Link, redirect } from "@/i18n/navigation";
import { AuthCard } from "@/components/domain/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Label } from "@/components/ui/Label";
import { findUserByEmail, signInUser, getCurrentUser } from "@/lib/auth/server";
import { verifyPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  if (!email.includes("@") || password.length < 8) {
    nextRedirect(`/${locale}/auth/login?error=credentials`);
  }
  const user = await findUserByEmail(email);
  if (!user || user.deletedAt) {
    nextRedirect(`/${locale}/auth/login?error=credentials`);
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    nextRedirect(`/${locale}/auth/login?error=credentials`);
  }
  // MVP: auto-verify on first login rather than blocking with email gate.
  // Handles accounts created before email verification was reliable.
  if (!user.emailVerifiedAt) {
    try {
      await db
        .update(users)
        .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, user.id));
    } catch { /* emailVerifiedAt column may not exist in DB yet — non-critical */ }
  }
  await signInUser(user);

  // Redirect based on role (not role field)
  if (user.role === "provider") {
    nextRedirect(`/${locale}/provider`);
  }
  if (user.role === "admin") {
    nextRedirect(`/${locale}/admin`);
  }
  nextRedirect(`/${locale}/home`);
}

export default async function LoginPage({
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
  const registered = sp.registered === "1";
  const errorMsg =
    error === "credentials"
      ? t("errorInvalidCreds")
      : error
      ? t("errorGeneric")
      : null;

  return (
    <AuthCard title={t("loginTitle")} subtitle={t("loginSub")} locale={locale}>
      {/* NO AuthRoleTabs — unified login for all users */}
      {registered && (
        <div
          role="status"
          className="mb-4 rounded-md border-[1.5px] border-green-300 bg-green-50 px-3.5 py-3 text-[17px] font-semibold text-green-700"
        >
          {locale === "zh" || locale === "zh_tw"
            ? "✅ 账户创建成功！请登录。"
            : "✅ Account created successfully! Please sign in below."}
        </div>
      )}
      {errorMsg && (
        <div
          role="alert"
          className="mb-4 rounded-md border-[1.5px] border-danger bg-danger-soft px-3.5 py-3 text-[16px] font-semibold text-danger"
        >
          {errorMsg}
        </div>
      )}
      <form className="flex flex-col gap-4" action={loginAction}>
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
        <div>
          <Label htmlFor="password">{tCommon("password")}</Label>
          <PasswordInput id="password" name="password" minLength={8} required />
        </div>
        <Button type="submit" variant="primary" block size="md">
          {t("loginCta")}
        </Button>
      </form>
      <p className="mt-4 text-center text-[16px] text-text-secondary">
        <Link href="/auth/forgot" className="font-semibold text-brand">
          {t("forgotLink")}
        </Link>
      </p>
      <p className="mt-6 text-center text-[17px] text-text-secondary">
        {t("noAccount")}{" "}
        <Link href="/auth/register" className="font-semibold text-brand">
          {t("registerLink")}
        </Link>
      </p>
    </AuthCard>
  );
}
