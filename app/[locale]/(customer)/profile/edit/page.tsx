import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ProviderAvatar } from "@/components/domain/ProviderAvatar";
import { getCountry } from "@/components/domain/countryCookie";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function saveProfileAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const lang = String(formData.get("lang") ?? "en");
  const faithPreference = formData.get("faithPref") === "christian" ? "christian" : null;

  if (!name) {
    nextRedirect(`/${locale}/profile/edit?error=name`);
    return;
  }

  await db.update(users).set({
    name,
    name: name,
    phone,
    locale: lang,
    updatedAt: new Date(),
  }).where(eq(users.id, me.id));

  nextRedirect(`/${locale}/profile/edit?saved=1`);
}

export default async function ProfileEditPage({
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
  if (!me) redirect({ href: "/auth/login", locale });
  const country = await getCountry();
  const t = await getTranslations("profileEdit");
  const saved = sp.saved === "1";
  const error = sp.error === "name";
  const initials = me.initials ?? "?";

  // Get full user record for edit form
  const [fullUser] = await db.select().from(users).where(eq(users.id, me.id)).limit(1);

  return (
    <>
      <Header
        country={country}
        back
        signedIn
        initials={me.initials}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-content px-5 pb-[120px] pt-6 sm:pb-12"
      >
        <h1 className="text-h2">{t("title")}</h1>

        {saved && (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 rounded-md bg-success-soft px-3.5 py-3 text-[17px] font-semibold text-success"
          >
            <CheckCircle2 size={18} aria-hidden /> {t("saved")}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-md border border-danger bg-danger-soft px-4 py-3 text-[15px] text-danger">
            Name is required.
          </div>
        )}

        <div className="mt-6 flex justify-center">
          <ProviderAvatar size={96} hue={3} initials={initials} />
        </div>

        <form action={saveProfileAction} className="mt-6 flex flex-col gap-4">
          <input type="hidden" name="locale" value={locale} />

          <div>
            <Label htmlFor="name">{t("name")}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={fullUser?.name || fullUser?.name || ""}
              autoComplete="name"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={fullUser?.email || me.email}
              autoComplete="email"
              disabled
            />
            <p className="mt-1 text-[14px] text-text-tertiary">Email cannot be changed</p>
          </div>
          <div>
            <Label htmlFor="phone">{t("phone")}</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={fullUser?.phone || ""}
              autoComplete="tel"
              inputMode="tel"
              placeholder="+61 400 000 000"
            />
          </div>
          <div>
            <Label htmlFor="lang">{t("language")}</Label>
            <select
              id="lang"
              name="lang"
              defaultValue={fullUser?.locale || locale}
              className="block h-touch-btn w-full rounded-md border-[1.5px] border-border bg-bg-base px-4 text-body text-text-primary focus:border-brand focus:outline-none"
            >
              <option value="en">English</option>
              <option value="zh">中文 (简体)</option>
              <option value="zh_tw">中文 (繁體)</option>
              <option value="ja">日本語</option>
              <option value="ko">한국어</option>
              <option value="vi">Tiếng Việt</option>
              <option value="th">ไทย</option>
            </select>
          </div>
  
        {/* Faith content preference */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="faithPref"
              name="faithPref"
              value="christian"
              defaultChecked={me?.faithPreference === "christian"}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="faithPref" className="text-[16px] text-gray-700 leading-snug">
              {locale === "zh" || locale === "zh_tw"
                ? "我信仰基督教，希望看到祷告和灵修内容"
                : locale === "vi" ? "Tôi theo đạo Cơ đốc và muốn xem nội dung cầu nguyện"
                : locale === "ko" ? "기독교 신자이며 기도/묵상 콘텐츠를 보고 싶습니다"
                : locale === "ja" ? "キリスト教徒で、祈りと黙想のコンテンツを見たい"
                : locale === "th" ? "ฉันเป็นคริสเตียนและต้องการเนื้อหาการอธิษฐาน"
                : "I follow the Christian faith and would like to see prayer & devotional content"}
              <span className="block text-[14px] text-gray-400 mt-0.5">
                {locale === "zh" || locale === "zh_tw" ? "（可选）" : "(Optional)"}
              </span>
            </label>
          </div>
        </div>
        <Button type="submit" variant="primary" block size="md">
            {t("save")}
          </Button>
        </form>
      </main>
    </>
  );
}
