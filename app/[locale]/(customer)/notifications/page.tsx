import { setRequestLocale, getTranslations } from "next-intl/server";
import { Calendar, MessageCircle, Settings } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/components/ui/cn";
import type { CountryCode } from "@/components/layout";

const TABS = ["all", "bookings", "ai", "system"] as const;
type Tab = (typeof TABS)[number];

const SAMPLE = [
  {
    Icon: Calendar,
    bg: "bg-brand-soft text-brand",
    title: { zh: "李师傅 已接受您的预订", en: "Helen Li accepted your booking" },
    body: { zh: "5 月 8 日 周三 · 14:00", en: "Wed 8 May · 2:00pm" },
    when: { zh: "10 分钟前", en: "10 min ago" },
    unread: true,
  },
  {
    Icon: MessageCircle,
    bg: "bg-brand-accent-soft text-[#92590A] dark:text-[var(--brand-accent)]",
    title: { zh: "AI 助手回复了您的问题", en: "AI assistant replied" },
    body: { zh: "「您的下次预订是…」", en: "“Your next booking is…”" },
    when: { zh: "1 小时前", en: "1 hr ago" },
    unread: true,
  },
  {
    Icon: Settings,
    bg: "bg-bg-surface-2 text-text-secondary",
    title: { zh: "您的资料已更新", en: "Your profile has been updated" },
    body: { zh: "新增地址：12 Park Ave", en: "Added: 12 Park Ave" },
    when: { zh: "昨天", en: "Yesterday" },
    unread: false,
  },
];

export default async function NotificationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("notifications");
  const country = "AU" as CountryCode;
  const lang: "zh" | "en" = locale === "zh" ? "zh" : "en";

  const rawTab = typeof sp.tab === "string" ? sp.tab : "all";
  const tab: Tab = (TABS as readonly string[]).includes(rawTab) ? (rawTab as Tab) : "all";

  return (
    <>
      <Header country={country} />
      <main className="mx-auto w-full max-w-content pb-[120px]">
        <nav
          aria-label="Notification tabs"
          className="flex h-14 items-center justify-between border-b border-border bg-bg-base px-4"
        >
          <div className="flex gap-3">
            {TABS.map((k) => {
              const on = k === tab;
              const labelKey = `tabs${k.charAt(0).toUpperCase() + k.slice(1)}` as Parameters<typeof t>[0];
              return (
                <span
                  key={k}
                  className={cn(
                    "text-[14px]",
                    on ? "font-bold text-brand" : "font-medium text-text-secondary"
                  )}
                >
                  {t(labelKey)}
                </span>
              );
            })}
          </div>
          <button type="button" className="text-[13px] font-semibold text-brand">
            {t("markAllRead")}
          </button>
        </nav>

        <ul className="px-5 py-4">
          {SAMPLE.map((n, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-md p-3.5",
                i > 0 && "border-t border-border",
                n.unread ? "bg-brand-soft/40" : ""
              )}
            >
              <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-md", n.bg)}>
                <n.Icon size={22} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-text-primary">{n.title[lang]}</p>
                <p className="mt-0.5 text-[14px] text-text-secondary">{n.body[lang]}</p>
                <p className="mt-1 text-[12px] text-text-tertiary">{n.when[lang]}</p>
              </div>
              {n.unread && (
                <span aria-hidden className="mt-2 h-2 w-2 shrink-0 rounded-full bg-danger" />
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
