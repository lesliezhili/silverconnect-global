/**
 * Static knowledge-base content for /help/[slug]. Tiny on purpose —
 * full KB lives in a backend CMS later. Each article has paragraph
 * blocks; lists / images can be added when needed.
 */

type Locale = "en" | "zh";

export interface HelpArticle {
  slug: string;
  category:
    | "gettingStarted"
    | "bookings"
    | "payments"
    | "safety"
    | "account";
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  body: Record<Locale, string[]>;
  updated: string; // ISO date
}

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "first-booking",
    category: "gettingStarted",
    title: {
      en: "Booking your first service",
      zh: "如何预订第一次服务",
    },
    summary: {
      en: "From picking a category to confirming payment in five steps.",
      zh: "五步走完：选服务、挑师傅、选时间、填地址、确认支付。",
    },
    body: {
      en: [
        "Pick a category from the home screen — Cleaning, Cooking, Garden, Personal care or Repair.",
        "Browse providers in your area. Verified, first-aid certified, and Mandarin-speaking helpers are filterable from the chip row at the top.",
        "Tap a provider to see their full bio, services, available next 7 days and reviews. Pick the service package you want.",
        "Pick a time slot, choose an address, and confirm. Payment is held in escrow — your provider only gets paid after the service is completed.",
      ],
      zh: [
        "在首页选一个服务类别 — 清洁、烹饪、园艺、个人护理或维修。",
        "浏览您附近的服务者。顶部的筛选条可以按「已验证」「急救证」「中文」筛选。",
        "点开某位服务者，查看完整简介、服务清单、未来 7 天可预订时段、评价。选定您想要的服务包。",
        "选时段、选地址、确认。款项进入托管 — 服务完成并经您确认后才会释放给服务者。",
      ],
    },
    updated: "2026-04-12",
  },
  {
    slug: "reschedule-booking",
    category: "bookings",
    title: {
      en: "How to reschedule a booking",
      zh: "如何改约一次预订",
    },
    summary: {
      en: "Free reschedule until 24 hours before the service.",
      zh: "服务开始前 24 小时之前可免费改约。",
    },
    body: {
      en: [
        "Open the booking from My bookings → Upcoming, or tap the notification.",
        "Tap Reschedule on the sticky bar. Pick a new time from the available slots.",
        "Confirm — your provider gets a notification and the new time replaces the old one.",
        "Within 24 hours of the original time, rescheduling switches off and you'll need to either keep the booking or cancel (cancellation fee may apply).",
      ],
      zh: [
        "从「我的预订 → 即将进行」打开该预订，或点击通知。",
        "点击底部的「改约」按钮，从可用时段中选一个新时间。",
        "确认即可 — 服务者会收到通知，新时间会替换旧时间。",
        "距服务开始 24 小时之内不再支持改约，只能保留或取消（取消可能产生费用）。",
      ],
    },
    updated: "2026-03-28",
  },
  {
    slug: "cancellation-policy",
    category: "payments",
    title: {
      en: "Cancellation & refund policy",
      zh: "取消与退款政策",
    },
    summary: {
      en: "Full refund up to 24h before, partial after, no refund once started.",
      zh: "24 小时前全额退、24 小时内部分退、服务开始后不退。",
    },
    body: {
      en: [
        "More than 24 hours before service: full refund, no fee.",
        "Less than 24 hours but before service starts: 50% refund — the other half compensates the provider for blocked time.",
        "After service starts: no automatic refund. If something went wrong, open a dispute from the booking detail and an admin will review within 48 hours.",
      ],
      zh: [
        "服务开始前 24 小时以上：全额退款，不收手续费。",
        "服务开始前 24 小时之内：退款 50%，另外 50% 用于补偿服务者已挡住的时段。",
        "服务开始后：不自动退款。如有问题请从预订详情提交「报告问题」，管理员将在 48 小时内审核。",
      ],
    },
    updated: "2026-04-04",
  },
  {
    slug: "emergency-help",
    category: "safety",
    title: {
      en: "Getting emergency help",
      zh: "如何获取紧急帮助",
    },
    summary: {
      en: "AI chat picks up keywords and surfaces the right number for your country.",
      zh: "AI 聊天会识别关键词，按您所在国家显示正确的紧急号码。",
    },
    body: {
      en: [
        "If you say words like 'help', 'fall', 'chest pain' or 'can't breathe' in the AI chat, the assistant immediately switches to an emergency overlay with a single big red button to dial your country's emergency number.",
        "The number is hardcoded by country: 000 in Australia, 120 in China (medical — 119 fire, 110 police on the second line), 911 in Canada.",
        "You can also tap Notify emergency contact to send a text to the family member you've nominated in your profile.",
      ],
      zh: [
        "如果您在 AI 聊天里说出「救命」「摔倒」「胸痛」「喘不上气」等关键词，助手会立刻切到紧急覆盖屏，提供一个红色大按钮直接拨打您所在国家的紧急号码。",
        "号码按国家硬编码：澳洲 000、中国 120（医疗 — 第二行显示 119 火警 / 110 报警）、加拿大 911。",
        "您也可以点击「通知紧急联系人」，给您在资料中设置的家属发短信。",
      ],
    },
    updated: "2026-04-15",
  },
  {
    slug: "change-language-country",
    category: "account",
    title: {
      en: "Changing language or country",
      zh: "切换语言或国家",
    },
    summary: {
      en: "Both live in the header — country drives currency, tax and emergency number.",
      zh: "两个开关都在 Header — 国家决定货币、税率和紧急号码。",
    },
    body: {
      en: [
        "The 🌐 chip in the header switches between English and 中文. Switching keeps you on the same page; only the copy changes.",
        "The 🇦🇺 / 🇨🇳 / 🇨🇦 chip switches country. This drives currency (A$ / ¥ / C$), tax label (GST / VAT / HST) and the emergency number used by the AI chat.",
        "Country and language are independent — you can use English while seeing China prices, or 中文 while seeing Canadian prices.",
      ],
      zh: [
        "Header 的 🌐 按钮切换 English / 中文。切换后停留在当前页面，只换文案。",
        "Header 的 🇦🇺 / 🇨🇳 / 🇨🇦 按钮切换国家。国家决定货币（A$ / ¥ / C$）、税名（GST / VAT / HST）和 AI 聊天里的紧急号码。",
        "国家与语言相互独立 — 可以「英文 + 中国价格」也可以「中文 + 加拿大价格」。",
      ],
    },
    updated: "2026-05-02",
  },
];

export function findArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
