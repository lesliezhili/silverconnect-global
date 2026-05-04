import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { CheckCircle2, UserPlus, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { getCountry } from "@/components/domain/countryCookie";
import { getSession } from "@/components/domain/sessionCookie";

interface Member {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: "admin" | "viewer" | "payer";
  status: "self" | "accepted" | "pending";
  invitedISO: string;
}

const MOCK: Member[] = [
  { id: "f1", name: "Margaret Chen", email: "you@silverconnect.com", initials: "MC", role: "admin", status: "self", invitedISO: new Date().toISOString() },
  { id: "f2", name: "Sarah Wang", email: "sarah@example.com", initials: "SW", role: "viewer", status: "accepted", invitedISO: new Date(Date.now() - 86400000 * 7).toISOString() },
  { id: "f3", name: "David Chen", email: "david@example.com", initials: "DC", role: "payer", status: "pending", invitedISO: new Date(Date.now() - 86400000 * 2).toISOString() },
];

async function inviteAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  nextRedirect(`/${locale}/profile/family?invited=1`);
}

export default async function FamilyPage({
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
  if (!session.signedIn) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("family");
  const invited = sp.invited === "1";

  return (
    <>
      <Header country={country} back signedIn={session.signedIn} initials={session.initials} />
      <main id="main-content" className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12">
        <h1 className="text-h2">{t("title")}</h1>
        <p className="mt-1 text-[15px] text-text-secondary">{t("sub")}</p>

        {invited && (
          <div role="status" className="mt-4 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-3 text-[15px] font-semibold text-success">
            <CheckCircle2 size={18} aria-hidden /> {t("inviteSend")}
          </div>
        )}

        <h2 className="mt-6 text-[18px] font-bold">{t("members")}</h2>
        <ul className="mt-3 flex flex-col gap-2">
          {MOCK.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-lg border border-border bg-bg-base p-3">
              <ProviderAvatar size={44} hue={1} initials={m.initials} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold">
                  {m.name}
                  {m.status === "self" && <span className="ml-2 text-[12px] font-semibold text-text-tertiary">· {t("self")}</span>}
                </p>
                <p className="text-[12px] text-text-tertiary tabular-nums">{m.email}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-[12px]">
                  <span className="rounded-sm bg-bg-surface-2 px-2 py-0.5 font-semibold text-text-secondary">
                    {t(m.role === "admin" ? "roleAdmin" : m.role === "payer" ? "rolePayer" : "roleViewer")}
                  </span>
                  <span className={"rounded-sm px-2 py-0.5 font-semibold " + (m.status === "pending" ? "bg-warning-soft text-warning" : "bg-success-soft text-success")}>
                    {t(m.status === "pending" ? "pending" : "accepted")}
                  </span>
                </div>
              </div>
              {m.status !== "self" && (
                <button type="button" aria-label={t("revoke")} className="inline-flex h-10 w-10 items-center justify-center rounded-sm border-[1.5px] border-danger text-danger">
                  <Trash2 size={16} aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>

        <form action={inviteAction} className="mt-6 flex flex-col gap-4 rounded-lg border-2 border-dashed border-border-strong bg-bg-base p-5">
          <input type="hidden" name="locale" value={locale} />
          <h3 className="flex items-center gap-2 text-[16px] font-bold">
            <UserPlus size={18} className="text-brand" aria-hidden />
            {t("inviteCta")}
          </h3>
          <div>
            <Label htmlFor="iname">{t("inviteName")}</Label>
            <Input id="iname" name="name" autoComplete="name" required />
          </div>
          <div>
            <Label htmlFor="iemail">{t("inviteEmail")}</Label>
            <Input id="iemail" name="email" type="email" inputMode="email" autoComplete="email" required />
          </div>
          <Button type="submit" variant="primary" block size="md">{t("inviteSend")}</Button>
        </form>
      </main>
    </>
  );
}
