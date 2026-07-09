import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getAdmin, setAdmin } from "@/components/domain/adminCookie";
import { findUserByEmail, verifyPassword, signInUser } from "@/lib/auth/server";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  if (!email.includes("@") || password.length < 8) {
    nextRedirect(`/${locale}/admin/login?error=invalid`);
  }

  const user = await findUserByEmail(email);
  if (!user || !user.isAdmin || !(await verifyPassword(password, user.passwordHash))) {
    nextRedirect(`/${locale}/admin/login?error=invalid`);
  } else {
    // Establish both the admin-panel session (sc-admin, gates /admin/* pages)
    // and the regular session (reads via getCurrentUser(), which every admin
    // server action/API route checks for isAdmin) — otherwise someone who
    // authenticates only here, without a prior customer-facing login, would
    // have every admin action silently fail for lack of a regular session.
    await setAdmin(email);
    await signInUser(user.id);
    nextRedirect(`/${locale}/admin`);
  }
}

export default async function AdminLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const admin = await getAdmin();
  if (admin.signedIn) redirect({ href: "/admin", locale });
  const t = await getTranslations("admin");
  const error = sp.error === "invalid";

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-bg-surface-2 px-5 py-12"
    >
      <div className="w-full max-w-[420px] rounded-lg border border-border bg-bg-base p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-12 w-10 items-center justify-center rounded-md bg-brand-soft text-brand"
          >
            <ShieldCheck size={20} />
          </span>
          <p className="text-[16px] font-bold uppercase tracking-wider text-text-tertiary">
            SilverConnect <span className="text-brand">Admin</span>
          </p>
        </div>
        <h1 className="mt-4 text-h2">{t("loginTitle")}</h1>
        <p className="mt-1 text-[16px] text-text-secondary">{t("loginSub")}</p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-md border-[1.5px] border-danger bg-danger-soft px-3.5 py-3 text-[16px] font-semibold text-danger"
          >
            {t("loginInvalid")}
          </div>
        )}

        <form action={loginAction} className="mt-5 flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />
          <div>
            <Label htmlFor="email">{t("loginEmail")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">{t("loginPassword")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              minLength={8}
              required
            />
          </div>
          <Button type="submit" variant="primary" block size="md">
            {t("loginCta")}
          </Button>
        </form>

        <p className="mt-6 border-t border-border pt-4 text-[16px] text-text-tertiary">
          {t("loginIpHint")} · {t("loginLockHint")}
        </p>
      </div>
    </main>
  );
}
