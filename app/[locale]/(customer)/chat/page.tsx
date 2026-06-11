import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect as nextRedirect } from "next/navigation";
import { after } from "next/server";
import { eq, and, asc, isNull, sql } from "drizzle-orm";
import {
  ChevronLeft,
  Plus,
  Send,
  Phone as PhoneIcon,
  AlertTriangle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ChatBubble } from "@/components/domain/ChatBubble";
import { C9AICompanion } from "@/components/illustrations";
import { EMERGENCY_NUMBER } from "@/components/domain/country";
import { COUNTRY_FLAG } from "@/components/layout/CountrySelector";
import { Header } from "@/components/layout/Header";
import { getCountry } from "@/components/domain/countryCookie";
import { db } from "@/lib/db";
import { aiConversations, aiMessages, aiEmergencyKeywords } from "@/lib/db/schema/ai";
import { getCurrentUser } from "@/lib/auth/server";
import { chat, detectEmergencyKeyword, type ChatMessage } from "@/lib/ai/glm";
import { VoiceButton } from "@/components/domain/VoiceButton";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT_EN = `You are SilverConnect's customer service assistant for an elderly home-services platform (cleaning, garden, repair, personal care, companionship, transport) operating across 8 countries: Australia (AU), China (CN), Canada (CA), USA (US), Taiwan (TW), Singapore (SG), Hong Kong (HK), and Malaysia (MY). Be warm, brief, and use plain language. Reply in the user's language (English, Chinese, Japanese, Korean, or Thai). Replies should be 1-3 short sentences unless the user asks for detail. If the user describes a medical, safety, or abuse emergency, immediately recommend they tap the SOS button or call local emergency services (AU:000, CN:120, CA/US:911, TW:119, SG:995, HK/MY:999).`;

const SYSTEM_PROMPT_ZH = `你是 SilverConnect 老年居家服务平台的客服助手（清洁/园艺/维修/个人护理/陪伴/交通，覆盖8个国家：澳大利亚、中国、加拿大、美国、台湾、新加坡、香港、马来西亚）。回答温暖、简短、用通俗中文（或用户使用英文时用英文）。每次回复 1-3 句为宜，除非用户要求更详细。如用户描述医疗、人身安全或被侵害的紧急情况，立刻建议按 SOS 按钮或拨打当地紧急电话（AU:000, CN:120, CA/US:911, TW:119, SG:995, HK/MY:999）。`;

async function ensureConversation(userId: string, locale: string) {
  const [open] = await db
    .select()
    .from(aiConversations)
    .where(
      and(
        eq(aiConversations.userId, userId),
        isNull(aiConversations.closedAt),
      ),
    )
    .orderBy(sql`${aiConversations.createdAt} desc`)
    .limit(1);
  if (open) return open;
  const [created] = await db
    .insert(aiConversations)
    .values({ userId, locale: locale === "zh" ? "zh" : "en" })
    .returning();
  return created!;
}

async function sendMessageAction(formData: FormData) {
  "use server";
  const locale = String(formData.get("locale") ?? "en");
  const text = String(formData.get("message") ?? "").trim();
  const me = await getCurrentUser();
  if (!me) nextRedirect(`/${locale}/auth/login`);
  if (!text) nextRedirect(`/${locale}/chat`);

  const conv = await ensureConversation(me.id, locale);

  // Load short history (last 20 messages) to give the model context.
  const prior = await db
    .select({ role: aiMessages.role, content: aiMessages.content })
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, conv.id))
    .orderBy(asc(aiMessages.createdAt))
    .limit(20);

  // Persist the user message immediately.
  await db.insert(aiMessages).values({
    conversationId: conv.id,
    role: "user",
    content: text,
  });

  // Emergency keyword scan against this user's locale.
  const keywords = await db
    .select({ keyword: aiEmergencyKeywords.keyword })
    .from(aiEmergencyKeywords)
    .where(
      and(
        eq(aiEmergencyKeywords.locale, locale === "zh" ? "zh" : "en"),
        eq(aiEmergencyKeywords.enabled, true),
      ),
    );
  const matched = detectEmergencyKeyword(
    text,
    keywords.map((k) => k.keyword),
  );
  if (matched) {
    await db
      .update(aiConversations)
      .set({ emergencyTriggeredAt: new Date(), updatedAt: new Date() })
      .where(eq(aiConversations.id, conv.id));
    nextRedirect(`/${locale}/chat?emergency=1`);
  }

  // Defer the GLM call to after() so the redirect lands fast and the
  // user sees their message in the feed while the assistant reply
  // streams in on the next render. Tradeoff: user has to refresh /
  // re-navigate to see the reply (a real client component with
  // server-sent events would feel smoother — Wave 4 polish).
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: locale === "zh" ? SYSTEM_PROMPT_ZH : SYSTEM_PROMPT_EN,
    },
    ...(prior as ChatMessage[]),
    { role: "user", content: text },
  ];
  after(async () => {
    const result = await chat(messages, { maxTokens: 600, temperature: 0.6 });
    if (result.ok && result.content) {
      await db.insert(aiMessages).values({
        conversationId: conv.id,
        role: "assistant",
        content: result.content,
        tokens: result.completionTokens ?? null,
      });
    } else {
       
      console.error("[chat] GLM call failed:", result.reason);
      await db.insert(aiMessages).values({
        conversationId: conv.id,
        role: "system",
        content: `(GLM error: ${result.reason ?? "unknown"})`,
      });
    }
  });

  nextRedirect(`/${locale}/chat`);
}

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
  const country = await getCountry();
  const me = await getCurrentUser();
  const emergency = sp.emergency === "1";
  const num = EMERGENCY_NUMBER[country];
  const fromRaw = typeof sp.from === "string" ? sp.from : null;
  const backHref =
    fromRaw && fromRaw.startsWith("/") && !fromRaw.startsWith("//")
      ? fromRaw
      : "/home";

  if (emergency) {
    const subTextMap: Record<string, { en: string; zh: string }> = {
      AU: { en: "Australian Emergency — combined", zh: "澳洲紧急服务 — 综合" },
      CN: { en: "China 120 Medical Emergency", zh: "中国 120 医疗急救" },
      CA: { en: "Canada 911 Combined Emergency", zh: "加拿大 911 综合紧急" },
      US: { en: "US 911 Combined Emergency", zh: "美国 911 综合紧急" },
      TW: { en: "Taiwan 119 Fire & Ambulance", zh: "台灣 119 消防與救護" },
      SG: { en: "Singapore 995 SCDF Emergency", zh: "新加坡 995 民防紧急" },
      HK: { en: "Hong Kong 999 Emergency", zh: "香港 999 紧急服务" },
      MY: { en: "Malaysia 999 Emergency", zh: "马来西亚 999 紧急服务" },
    };
    const subText = isZh
      ? (subTextMap[country]?.zh ?? subTextMap.AU.zh)
      : (subTextMap[country]?.en ?? subTextMap.AU.en);
    return (
      <main
        id="main-content"
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
        <h1 className="text-[30px] font-extrabold text-white">
          {tEm("title")}
        </h1>
        <p className="text-[18px] leading-snug text-[#CBD5E1]">{subText}</p>
        <p className="text-[16px] text-[#94A3B8]">{tEm(`subLine2.${country}`)}</p>
        <a
          href={`tel:${num}`}
          className="flex h-20 w-full max-w-[320px] items-center justify-center gap-3 rounded-md bg-[#DC2626] text-[28px] font-extrabold text-white shadow-[0_8px_24px_rgba(220,38,38,0.5)]"
        >
          <PhoneIcon size={32} aria-hidden />
          {tEm("call", { num })}
        </a>
        <Link href="/chat" className="text-[16px] text-[#94A3B8]" replace>
          {tEm("close")}
        </Link>
      </main>
    );
  }

  try {
  // Load conversation + messages for signed-in users.
  let conversationMessages: { id: string; role: string; content: string }[] = [];
  if (me) {
    const conv = await ensureConversation(me.id, locale);
    conversationMessages = await db
        .select({
          id: aiMessages.id,
          role: aiMessages.role,
          content: aiMessages.content,
        })
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, conv.id))
        .orderBy(asc(aiMessages.createdAt));
  }

    return (
      <>
        <div className="hidden sm:block">
          <Header
            country={country}
            signedIn={!!me}
            initials={me?.initials}
          />
        </div>
        <main
          id="main-content"
          className="flex h-dvh flex-col bg-bg-surface sm:h-[calc(100dvh-80px)]"
        >
          <header
            role="banner"
            className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-bg-base pl-1 pr-3"
          >
            <Link
              href={backHref}
              aria-label={isZh ? "返回" : "Back"}
              className="inline-flex h-12 w-12 items-center justify-center rounded-md text-text-primary hover:bg-bg-surface-2"
            >
              <ChevronLeft size={22} aria-hidden />
            </Link>
            <C9AICompanion size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[17px] font-bold">{t("title")}</p>
              <p className="flex items-center gap-1 text-[16px] text-success">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-success" />
                {t("online")}
              </p>
            </div>
            <span className="inline-flex h-9 items-center gap-1 rounded-pill border-[1.5px] border-border bg-bg-surface px-2.5 text-[16px] font-semibold text-text-primary">
              {COUNTRY_FLAG[country]} {country}
            </span>
          </header>

          <div className="flex flex-1 flex-col gap-3 overflow-auto px-4 pb-2 pt-4">
            {!me ? (
              <>
                <C9AICompanion size={120} className="mx-auto" />
                <h2 className="mt-1 text-center text-[22px] font-bold">
                  {t("emptyTitle")}
                </h2>
                <p className="mx-auto max-w-[280px] text-center text-[17px] text-text-secondary">
                  {isZh ? "请先登录后再开始对话。" : "Please sign in to start a chat."}
                </p>
                <Link
                  href="/auth/login"
                  className="mx-auto mt-3 inline-flex h-12 items-center justify-center rounded-md bg-brand px-5 text-[17px] font-bold text-white"
                >
                  {isZh ? "登录" : "Sign in"}
                </Link>
              </>
            ) : conversationMessages.length === 0 ? (
              <>
                <C9AICompanion size={120} className="mx-auto" />
                <h2 className="mt-1 text-center text-[22px] font-bold">
                  {t("emptyTitle")}
                </h2>
                <p className="mx-auto max-w-[280px] text-center text-[17px] text-text-secondary">
                  {t("emptyHint")}
                </p>
                {/* Country-specific AI hint */}
                <div className="mx-auto mt-4 max-w-[320px] rounded-lg border border-brand/20 bg-brand-primary-soft px-4 py-3 text-center">
                  <p className="text-[16px] text-text-secondary">
                    {t(`countryHints.${country}` as any)}
                  </p>
                </div>
                {/* Quick action pills */}
                <div className="mx-auto mt-3 flex flex-wrap justify-center gap-2">
                  <button type="button" className="rounded-pill bg-bg-surface px-3 py-1.5 text-[15px] font-medium text-text-primary">
                    {t("quickReplies.reschedule")}
                  </button>
                  <button type="button" className="rounded-pill bg-bg-surface px-3 py-1.5 text-[15px] font-medium text-text-primary">
                    {t("quickReplies.pricing")}
                  </button>
                  <button type="button" className="rounded-pill bg-bg-surface px-3 py-1.5 text-[15px] font-medium text-text-primary">
                    {t("quickReplies.human")}
                  </button>
                  <button type="button" className="rounded-pill bg-danger-soft px-3 py-1.5 text-[15px] font-bold text-danger">
                    {t("quickReplies.emergency")}
                  </button>
                </div>
              </>
            ) : (
              conversationMessages.map((m) =>
                m.role === "system" ? (
                  <p
                    key={m.id}
                    role="alert"
                    className="self-center rounded-md bg-warning-soft px-3.5 py-2 text-[17px] font-semibold text-warning"
                  >
                    {m.content}
                  </p>
                ) : (
                  <ChatBubble
                    key={m.id}
                    who={m.role === "assistant" ? "ai" : "me"}
                  >
                    {m.content}
                  </ChatBubble>
                ),
              )
            )}
          </div>

          <form
            action={sendMessageAction}
            className="flex shrink-0 items-center gap-2 border-t border-border bg-bg-base p-2.5"
          >
            <input type="hidden" name="locale" value={locale} />
            <button
              type="button"
              aria-label={t("attach")}
              className="inline-flex h-12 w-12 items-center justify-center rounded-md text-text-primary opacity-50"
              disabled
              title="Attachments wired with file storage"
            >
              <Plus size={22} aria-hidden />
            </button>
            <input
              name="message"
              aria-label={t("composer")}
              placeholder={t("composer")}
              className="h-12 flex-1 rounded-pill border-[1.5px] border-border bg-bg-surface px-4 text-[16px] text-text-primary"
              required
              minLength={1}
              maxLength={2000}
              disabled={!me}
            />
            <VoiceButton locale={locale} />
            <button
              type="submit"
              aria-label={t("send")}
              disabled={!me}
              className="inline-flex h-12 w-12 items-center justify-center rounded-pill bg-brand text-white disabled:opacity-50"
            >
              <Send size={22} aria-hidden />
            </button>
          </form>
          {/* AI disclaimer */}
          <p className="mt-2 text-center text-[13px] text-text-tertiary">
            {t("aiDisclaimer")}
          </p>
        </main>
      </>
    );
  } catch (error) {
    console.error("[chat] DB unavailable", error);
    return (
      <main className="mx-auto w-full max-w-content px-5 py-12 text-center">
        <p className="text-[48px]">⏳</p>
        <h1 className="mt-4 text-[22px] font-bold">Service Temporarily Unavailable</h1>
        <p className="mt-2 text-[17px] text-text-secondary">Please try again shortly.</p>
      </main>
    );
  }
}
