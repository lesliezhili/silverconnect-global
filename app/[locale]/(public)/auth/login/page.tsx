/**
 * Login page — Server Component wrapper.
 * Handles locale setup + auth redirect, then delegates form rendering
 * to LoginForm (Client Component) which POSTs to /api/auth/login.
 *
 * Using a Client Component for the form avoids the Next.js 16 App Router
 * Server Action + session.save() + redirect() cookie-persistence bug.
 */
import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { LoginForm } from "@/components/domain/LoginForm";

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

  // Already logged in — skip to home
  const me = await getCurrentUser();
  if (me) redirect({ href: "/home", locale });

  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  const zh = locale === "zh" || locale === "zh_tw";

  return (
    <LoginForm
      locale={locale}
      registered={sp.registered === "1"}
      errorParam={typeof sp.error === "string" ? sp.error : undefined}
      labels={{
        title: t("loginTitle"),
        subtitle: t("loginSub"),
        email: tCommon("email"),
        password: tCommon("password"),
        emailPh: t("emailPh"),
        loginCta: t("loginCta"),
        forgotLink: t("forgotLink"),
        noAccount: t("noAccount"),
        registerLink: t("registerLink"),
        errorCreds: t("errorInvalidCreds"),
        errorGeneric: t("errorGeneric"),
        registeredOk: zh
          ? "✅ 账户创建成功！请登录。"
          : "✅ Account created! Please sign in below.",
      }}
    />
  );
}
