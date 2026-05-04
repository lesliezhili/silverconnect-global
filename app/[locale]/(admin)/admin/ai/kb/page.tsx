import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { redirect } from "@/i18n/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { getAdmin } from "@/components/domain/adminCookie";
import { MOCK_KB } from "@/components/domain/adminMock";

async function saveKb(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  nextRedirect(`/${locale}/admin/ai/kb?saved=1`);
}

export default async function AdminKbPage({
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
  const tA = await getTranslations("aAi");
  const tCountry = await getTranslations("admin");
  const adding = sp.add === "1";

  const fieldClass = "block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body";

  return (
    <AdminShell email={admin.email ?? ""}>
      <div className="flex items-center justify-between">
        <h1 className="text-h2">{tA("kbTitle")}</h1>
        <a href="?add=1" className="inline-flex h-10 items-center gap-2 rounded-md bg-brand px-3 text-[13px] font-bold text-white">
          <Plus size={14} aria-hidden />
          {tA("kbAdd")}
        </a>
      </div>

      <ul className="mt-5 flex flex-col gap-3">
        {MOCK_KB.map((e) => (
          <li key={e.id} className="rounded-lg border border-border bg-bg-base p-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold">{e.title}</p>
                <p className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-sm bg-brand-soft px-2 py-0.5 font-bold uppercase text-brand">
                    {e.country === "all" ? "ALL" : tCountry(`country${e.country}`)}
                  </span>
                  <span className="rounded-sm bg-bg-surface-2 px-2 py-0.5 font-semibold uppercase text-text-secondary">
                    {e.lang.toUpperCase()}
                  </span>
                </p>
                <p className="mt-2 text-[14px] text-text-secondary">{e.body}</p>
              </div>
              <button type="button" aria-label={tA("kbDelete")} className="inline-flex h-9 w-9 items-center justify-center rounded-sm border-[1.5px] border-danger bg-bg-base text-danger">
                <Trash2 size={14} aria-hidden />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {adding && (
        <form action={saveKb} className="mt-6 flex flex-col gap-4 rounded-lg border-2 border-brand bg-bg-base p-5">
          <input type="hidden" name="locale" value={locale} />
          <h2 className="text-h3">{tA("kbAdd")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="kb-country">{tA("kbCountry")}</Label>
              <select id="kb-country" name="country" className={fieldClass}>
                <option value="all">ALL</option>
                <option value="AU">AU</option>
                <option value="CN">CN</option>
                <option value="CA">CA</option>
              </select>
            </div>
            <div>
              <Label htmlFor="kb-lang">{tA("kbLang")}</Label>
              <select id="kb-lang" name="lang" className={fieldClass}>
                <option value="en">EN</option>
                <option value="zh">ZH</option>
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="kb-title">{tA("kbTitleLabel")}</Label>
            <Input id="kb-title" name="title" required />
          </div>
          <div>
            <Label htmlFor="kb-body">{tA("kbBody")}</Label>
            <textarea
              id="kb-body"
              name="body"
              rows={5}
              required
              aria-describedby="kb-var-hint"
              className="block w-full rounded-md border-[1.5px] border-border-strong bg-bg-base p-3 text-[14px] focus:border-brand focus:outline-none"
            />
            <p id="kb-var-hint" className="mt-1.5 text-[12px] text-text-tertiary">
              {tA("kbVarHint")}
            </p>
          </div>
          <Button type="submit" variant="primary" block size="md">
            {tA("kbSave")}
          </Button>
        </form>
      )}
    </AdminShell>
  );
}
