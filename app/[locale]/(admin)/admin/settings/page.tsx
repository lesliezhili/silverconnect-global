import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { CheckCircle2, Plus } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getAdmin } from "@/components/domain/adminCookie";
import { PLATFORM_FEES, EMERGENCY_KEYWORDS } from "@/components/domain/adminMock";

async function saveSettings(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  nextRedirect(`/${locale}/admin/settings?saved=1`);
}

export default async function AdminSettingsPage({
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
  if (!admin.signedIn) redirect({ href: "/admin/login", locale });
  const tA = await getTranslations("aSettings");
  const tCountry = await getTranslations("admin");
  const saved = sp.saved === "1";

  return (
    <AdminShell email={admin.email ?? ""}>
      <h1 className="text-h2">{tA("title")}</h1>

      {saved && (
        <div role="status" className="mt-4 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-3 text-[15px] font-semibold text-success">
          <CheckCircle2 size={18} aria-hidden /> {tA("save")}
        </div>
      )}

      <form action={saveSettings} className="mt-5 flex flex-col gap-5">
        <input type="hidden" name="locale" value={locale} />

        <section className="rounded-lg border border-border bg-bg-base p-4">
          <p className="text-[15px] font-bold">{tA("feeRates")}</p>
          <ul className="mt-3 flex flex-col gap-3">
            {(["AU", "CN", "CA"] as const).map((c) => (
              <li key={c} className="grid grid-cols-[120px_1fr] items-center gap-3">
                <Label htmlFor={`fee-${c}`}>{tCountry(`country${c}`)}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`fee-${c}`}
                    name={`fee-${c}`}
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    defaultValue={Math.round(PLATFORM_FEES[c] * 100)}
                    inputMode="decimal"
                  />
                  <span className="text-[14px] text-text-tertiary">%</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-border bg-bg-base p-4">
          <Label htmlFor="cancelHours" className="text-[15px] font-bold">
            {tA("cancelWindow")}
          </Label>
          <div className="mt-3">
            <Input
              id="cancelHours"
              name="cancelHours"
              type="number"
              min={0}
              max={168}
              defaultValue={24}
              inputMode="numeric"
            />
          </div>
        </section>

        <section className="rounded-lg border border-border bg-bg-base p-4">
          <Label htmlFor="kw" className="text-[15px] font-bold">
            {tA("emergencyKw")}
          </Label>
          <textarea
            id="kw"
            name="kw"
            rows={3}
            aria-describedby="kw-hint"
            defaultValue={EMERGENCY_KEYWORDS.join(", ")}
            className="mt-3 block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3 text-[14px] focus:border-brand focus:outline-none"
          />
          <p id="kw-hint" className="mt-1.5 text-[12px] text-text-tertiary">
            {tA("emergencyKwHint")}
          </p>
        </section>

        <section className="rounded-lg border border-border bg-bg-base p-4">
          <p className="text-[15px] font-bold">{tA("admins")}</p>
          <ul className="mt-3 flex flex-col gap-2 text-[13px]">
            {[
              { email: "admin@silverconnect.com", role: "Owner" },
              { email: "ops@silverconnect.com", role: "Operations" },
            ].map((a) => (
              <li key={a.email} className="flex items-center justify-between rounded-md border border-border bg-bg-base px-3 py-2">
                <span>{a.email}</span>
                <span className="rounded-sm bg-bg-surface-2 px-2 py-0.5 text-[11px] font-bold uppercase text-text-secondary">
                  {a.role}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="mt-3 inline-flex h-10 items-center gap-1 rounded-sm border-[1.5px] border-brand bg-bg-base px-3 text-[13px] font-semibold text-brand">
            <Plus size={13} aria-hidden /> {tA("addAdmin")}
          </button>
        </section>

        <section className="rounded-lg border border-border bg-bg-base p-4">
          <p className="text-[15px] font-bold">{tA("auditLog")}</p>
          <p className="mt-2 text-[13px] text-text-tertiary">
            admin@silverconnect.com · login · {new Date().toLocaleString(locale === "zh" ? "zh-CN" : "en-AU")}
          </p>
        </section>

        <Button type="submit" variant="primary" block size="md">{tA("save")}</Button>
      </form>
    </AdminShell>
  );
}
