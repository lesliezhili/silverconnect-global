import { setRequestLocale, getTranslations } from "next-intl/server";
import {
  ChevronLeft,
  Plus,
  Mic,
  Send,
  Phone as PhoneIcon,
  AlertTriangle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ChatBubble } from "@/components/domain/ChatBubble";
import { C9AICompanion } from "@/components/illustrations";
import { EMERGENCY_NUMBER } from "@/components/domain/country";
import { COUNTRY_FLAG } from "@/components/layout/CountrySelector";
import { cn } from "@/components/ui/cn";
import type { CountryCode } from "@/components/layout";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("chat");
  const tEm = await getTranslations("emergency");
  const isZh = locale === "zh";
  const country = "AU" as CountryCode;
  const emergency = sp.emergency === "1";
  const num = EMERGENCY_NUMBER[country];

  if (emergency) {
    const subText = isZh
      ? country === "AU"
        ? "澳洲紧急服务 — 综合"
        : country === "CN"
        ? "中国 120 医疗急救"
        : "加拿大 911 综合紧急"
      : country === "AU"
      ? "Australian Emergency — combined"
      : country === "CN"
      ? "China 120 Medical Emergency"
      : "Canada 911 Combined Emergency";
    return (
      <main
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 bg-[#0F1729] px-8 text-center text-white"
        role="dialog"
        aria-modal="true"
        aria-label={tEm("title")}
      >
        <div
          className="flex h-[120px] w-[120px] items-center justify-center rounded-full bg-[rgba(220,38,38,0.18)] text-[#FCA5A5]"
          style={{ animation: "sc-pulse 1.5s ease-in-out infinite" }}
          aria-hidden
        >
          <AlertTriangle size={68} />
        </div>
        <h1 className="text-[30px] font-extrabold text-white">{tEm("title")}</h1>
        <p className="text-[18px] leading-snug text-[#CBD5E1]">{subText}</p>
        {country === "CN" && (
          <p className="text-[14px] text-[#94A3B8]">{tEm("subLine2.CN")}</p>
        )}
        <a
          href={`tel:${num}`}
          className="flex h-20 w-full max-w-[320px] items-center justify-center gap-3 rounded-md bg-[#DC2626] text-[28px] font-extrabold text-white shadow-[0_8px_24px_rgba(220,38,38,0.5)]"
        >
          <PhoneIcon size={32} aria-hidden />
          {tEm("call", { num })}
        </a>
        <button
          type="button"
          className="h-14 w-full max-w-[320px] rounded-md border-[1.5px] border-white/30 bg-white/10 text-[16px] font-semibold text-white"
        >
          {tEm("notify")}{" · "}
          {isZh ? "女儿 Sarah" : "Sarah"}
        </button>
        <Link
          href="/chat"
          className="text-[14px] text-[#94A3B8]"
          replace
        >
          {tEm("close")}
        </Link>
      </main>
    );
  }

  // Default chat
  const quick = isZh
    ? ["改约", "取消政策", "联系真人客服", "紧急帮助"]
    : ["Reschedule", "Cancel policy", "Talk to human", "Emergency"];

  return (
    <main className="flex h-dvh flex-col bg-bg-surface">
      {/* Chat header */}
      <header
        role="banner"
        className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-bg-base pl-1 pr-3"
      >
        <Link
          href="/home"
          aria-label={isZh ? "返回" : "Back"}
          className="inline-flex h-12 w-12 items-center justify-center rounded-md text-text-primary hover:bg-bg-surface-2"
        >
          <ChevronLeft size={22} aria-hidden />
        </Link>
        <C9AICompanion size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-bold">{t("title")}</p>
          <p className="flex items-center gap-1 text-[12px] text-success">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
            {t("online")}
          </p>
        </div>
        <span className="inline-flex h-9 items-center gap-1 rounded-pill border-[1.5px] border-border bg-bg-surface px-2.5 text-[14px] font-semibold text-text-primary">
          {COUNTRY_FLAG[country]} {country}
        </span>
      </header>

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-3 overflow-auto px-4 pb-2 pt-4">
        <ChatBubble who="ai">
          {isZh
            ? "您好王阿姨 👋 我是 SilverConnect 助手，需要什么帮助？"
            : "Hello Margaret 👋 I'm the SilverConnect assistant, how can I help?"}
        </ChatBubble>
        <ChatBubble who="me">
          {isZh ? "我下次预订是什么时候？" : "When is my next booking?"}
        </ChatBubble>
        <ChatBubble who="ai">
          {isZh
            ? "您下次预订是 5 月 8 日 周三 14:00 — 李师傅来做 3 小时深度清洁。需要改约吗？"
            : "Your next booking is Wed 8 May 2:00pm — Helen Li for a 3h deep clean. Want to reschedule?"}
        </ChatBubble>
      </div>

      {/* Quick replies */}
      <div className="flex gap-2 overflow-x-auto px-4 py-2">
        {quick.map((q, i) => {
          const danger = i === 3;
          return danger ? (
            <Link
              key={q}
              href="/chat?emergency=1"
              className="inline-flex h-10 shrink-0 items-center rounded-pill border-[1.5px] border-danger bg-danger-soft px-3.5 text-[14px] font-semibold text-danger"
            >
              🆘 {q}
            </Link>
          ) : (
            <button
              key={q}
              type="button"
              className={cn(
                "inline-flex h-10 shrink-0 items-center rounded-pill border-[1.5px] border-brand bg-brand-soft px-3.5 text-[14px] font-semibold text-brand"
              )}
            >
              {q}
            </button>
          );
        })}
      </div>

      {/* Composer */}
      <div className="flex shrink-0 items-center gap-2 border-t border-border bg-bg-base p-2.5">
        <button
          type="button"
          aria-label={t("attach")}
          className="inline-flex h-12 w-12 items-center justify-center rounded-md text-text-primary"
        >
          <Plus size={22} aria-hidden />
        </button>
        <input
          aria-label={t("composer")}
          placeholder={t("composer")}
          className="h-12 flex-1 rounded-pill border-[1.5px] border-border bg-bg-surface px-4 text-[16px] text-text-primary"
        />
        <button
          type="button"
          aria-label={t("voice")}
          className="inline-flex h-12 w-12 items-center justify-center rounded-md text-text-primary"
        >
          <Mic size={22} aria-hidden />
        </button>
        <button
          type="submit"
          aria-label={t("send")}
          className="inline-flex h-12 w-12 items-center justify-center rounded-pill bg-brand text-white"
        >
          <Send size={22} aria-hidden />
        </button>
      </div>
    </main>
  );
}
