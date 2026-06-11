import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { redirect } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { getCountry } from "@/components/domain/countryCookie";
import { getCurrentUser } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { notificationPrefs } from "@/lib/db/schema/notifications";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

const CHANNELS = [
  { key: "channelEmail", name: "email", defaultOn: true },
  { key: "channelSms", name: "sms", defaultOn: true },
  { key: "channelPush", name: "push", defaultOn: false },
] as const;

const TOPICS = [
  { key: "topicBookings", hintKey: "topicBookingsHint", name: "bookings", defaultOn: true },
  { key: "topicReminders", hintKey: "topicRemindersHint", name: "reminders", defaultOn: true },
  { key: "topicPayments", hintKey: "topicPaymentsHint", name: "payments", defaultOn: true },
  { key: "topicMarketing", hintKey: "topicMarketingHint", name: "marketing", defaultOn: false },
] as const;

async function saveNotifPrefs(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const { getCurrentUser } = await import("@/lib/auth/server");
  const { db } = await import("@/lib/db");
  const { notificationPrefs } = await import("@/lib/db/schema/notifications");
  const { eq } = await import("drizzle-orm");
  const { sql } = await import("drizzle-orm");

  const me = await getCurrentUser();
  if (!me) { nextRedirect(`/${locale}/auth/login`); return; }

  // Delete existing prefs and re-insert based on form
  await db.delete(notificationPrefs).where(eq(notificationPrefs.userId, me.id));

  const inserts: { userId: string; channel: string; kind: string; enabled: boolean }[] = [];

  for (const ch of CHANNELS) {
    const enabled = formData.get(`channel_${ch.name}`) === "on";
    for (const topic of TOPICS) {
      inserts.push({
        userId: me.id,
        channel: ch.name as any,
        kind: topic.name as any,
        enabled: enabled && formData.get(`topic_${topic.name}`) === "on",
      });
    }
  }

  if (inserts.length > 0) {
    await db.insert(notificationPrefs).values(inserts as any);
  }

  nextRedirect(`/${locale}/profile/notifications?saved=1`);
}

export default async function NotifPrefsPage({
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
  const t = await getTranslations("notifPrefs");
  const saved = sp.saved === "1";

  // Load current prefs from DB
  const prefs = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, me.id));
  
  // Build lookup: channel_name -> enabled, topic_name -> enabled
  const channelEnabled = new Map<string, boolean>();
  const topicEnabled = new Map<string, boolean>();
  
  for (const ch of CHANNELS) {
    const channelPrefs = prefs.filter(p => p.channel === ch.name);
    channelEnabled.set(ch.name, channelPrefs.length > 0 ? channelPrefs.some(p => p.enabled) : ch.defaultOn);
  }
  for (const topic of TOPICS) {
    const topicPrefs = prefs.filter(p => p.kind === topic.name);
    topicEnabled.set(topic.name, topicPrefs.length > 0 ? topicPrefs.some(p => p.enabled) : topic.defaultOn);
  }

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

        <form action={saveNotifPrefs} className="mt-6 flex flex-col gap-6">
          <input type="hidden" name="locale" value={locale} />

          <fieldset>
            <legend className="text-[18px] font-bold">{t("channels")}</legend>
            <ul className="mt-3 overflow-hidden rounded-lg border border-border bg-bg-base">
              {CHANNELS.map((c, i) => (
                <li
                  key={c.name}
                  className={
                    i > 0
                      ? "flex items-center justify-between gap-3 border-t border-border px-4 py-3"
                      : "flex items-center justify-between gap-3 px-4 py-3"
                  }
                >
                  <span className="text-[16px] font-semibold">{t(c.key)}</span>
                  <Switch name={`channel_${c.name}`} defaultChecked={channelEnabled.get(c.name)} />
                </li>
              ))}
            </ul>
          </fieldset>

          <fieldset>
            <legend className="text-[18px] font-bold">{t("topics")}</legend>
            <ul className="mt-3 overflow-hidden rounded-lg border border-border bg-bg-base">
              {TOPICS.map((c, i) => (
                <li
                  key={c.name}
                  className={
                    i > 0
                      ? "flex items-start justify-between gap-3 border-t border-border px-4 py-3"
                      : "flex items-start justify-between gap-3 px-4 py-3"
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-semibold">{t(c.key)}</p>
                    <p className="mt-0.5 text-[17px] text-text-secondary">{t(c.hintKey)}</p>
                  </div>
                  <Switch name={`topic_${c.name}`} defaultChecked={topicEnabled.get(c.name)} />
                </li>
              ))}
            </ul>
          </fieldset>

          <Button type="submit" variant="primary" block size="md">
            {t("save")}
          </Button>
        </form>
      </main>
    </>
  );
}
