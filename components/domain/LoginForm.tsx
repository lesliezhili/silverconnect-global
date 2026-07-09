"use client";
/**
 * LoginForm — Client Component.
 * POSTs credentials to /api/auth/login (Route Handler).
 * The Route Handler sets the iron-session cookie reliably via HTTP response
 * headers, bypassing the Next.js App Router Server Action cookie-persistence
 * bug where session.save() + redirect() don’t always commit the Set-Cookie
 * header (observed in Next.js 16 + iron-session v8).
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/domain/AuthCard";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Label } from "@/components/ui/Label";
import { Link } from "@/i18n/navigation";

interface LoginLabels {
  title: string;
  subtitle: string;
  email: string;
  password: string;
  emailPh: string;
  loginCta: string;
  forgotLink: string;
  noAccount: string;
  registerLink: string;
  errorCreds: string;
  errorGeneric: string;
  registeredOk: string;
}

export function LoginForm({
  locale,
  registered,
  errorParam,
  labels,
}: {
  locale: string;
  registered: boolean;
  errorParam?: string;
  labels: LoginLabels;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(
    errorParam === "credentials" ? labels.errorCreds
    : errorParam ? labels.errorGeneric
    : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const email = ((fd.get("email") as string) ?? "").trim().toLowerCase();
    const password = (fd.get("password") as string) ?? "";

    if (!email.includes("@") || password.length < 8) {
      setError(labels.errorCreds);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",   // ensure Set-Cookie is received
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError(labels.errorCreds);
        setLoading(false);
        return;
      }

      const data: { success: boolean; role?: string; isAdmin?: boolean } = await res.json();
      const role = data.role ?? "customer";

      // router.push triggers a full navigation — the browser sends the
      // freshly-set sc-session cookie on the next server request.
      // Admins land on the dashboard by default; they still need the
      // separate /admin/login re-auth to actually get past its gate.
      if (data.isAdmin) router.push(`/${locale}/admin`);
      else if (role === "provider") router.push(`/${locale}/provider`);
      else router.push(`/${locale}/home`);
    } catch {
      setError(labels.errorGeneric);
      setLoading(false);
    }
  }

  return (
    <AuthCard title={labels.title} subtitle={labels.subtitle} locale={locale}>
      {registered && (
        <div
          role="status"
          className="mb-4 rounded-md border-[1.5px] border-green-300 bg-green-50 px-3.5 py-3 text-[17px] font-semibold text-green-700"
        >
          {labels.registeredOk}
        </div>
      )}
      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border-[1.5px] border-danger bg-danger-soft px-3.5 py-3 text-[16px] font-semibold text-danger"
        >
          {error}
        </div>
      )}
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="email">{labels.email}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={labels.emailPh}
            required
          />
        </div>
        <div>
          <Label htmlFor="password">{labels.password}</Label>
          <PasswordInput id="password" name="password" minLength={8} required />
        </div>
        <Button type="submit" variant="primary" block size="md" disabled={loading}>
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {labels.loginCta}
            </span>
          ) : labels.loginCta}
        </Button>
      </form>
      <p className="mt-4 text-center text-[16px] text-text-secondary">
        <Link href="/auth/forgot" className="font-semibold text-brand">
          {labels.forgotLink}
        </Link>
      </p>
      <p className="mt-6 text-center text-[17px] text-text-secondary">
        {labels.noAccount}{" "}
        <Link href="/auth/register" className="font-semibold text-brand">
          {labels.registerLink}
        </Link>
      </p>
    </AuthCard>
  );
}
