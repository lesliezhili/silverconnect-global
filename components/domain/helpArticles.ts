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
  {
    slug: "privacy",
    category: "account",
    title: {
      en: "Privacy policy",
      zh: "隐私政策",
    },
    summary: {
      en: "What we collect, why we collect it, and how to access or delete your data.",
      zh: "我们收集什么、为什么收集、以及如何查看或删除您的数据。",
    },
    body: {
      en: [
        "Last updated: 2026-05-05. SilverConnect is operated by SilverConnect Pty Ltd in Australia. This page tells you what personal data we hold and what choices you have.",
        "Data we collect from you directly: your name, email, phone, country, address(es), emergency contacts, family members, and any photos or notes you attach to bookings or disputes. Providers also upload identity, police-check, first-aid and insurance documents.",
        "Data we generate as you use the service: bookings, reviews, AI-chat transcripts, safety reports, payment records (amount + status; we never see card numbers because Stripe handles that), notification preferences, and login timestamps.",
        "Why we hold this: to match you with vetted providers, hold money in escrow until a service is completed, surface emergency contacts during safety incidents, and meet our legal obligations around aged-care services in AU / CN / CA.",
        "Who sees it: SilverConnect staff with a need-to-know basis, the provider you book (your name, address, phone, and the booking notes — but not other bookings or unrelated data), and Stripe (for payments). We do not sell your data, ever.",
        "Where it lives: AU customer data is hosted on AU-region Supabase. CN customer data lives on a CN-region instance to comply with PIPL data-localisation rules. CA customer data is hosted on US-region Supabase under standard contractual clauses; we will move CA to its own region during 2026 H2.",
        "Your rights: You can download a JSON archive of everything we hold about you from Settings → Privacy → 'Download my data'. You can permanently delete your account from the same page; this is irreversible and removes your profile, bookings, addresses, payment methods, family/emergency contacts, reviews you wrote, AI history, safety reports you filed, notifications and any disputes you raised — we retain nothing tied to your identity (GDPR Art. 17). One exception: review reports you may have filed against other users' reviews are kept anonymously (reporter ID blanked) so platform-moderation history isn't lost.",
        "Cookies: we use one essential cookie ('sc-session') to keep you signed in, one for country/language preference, and an admin cookie when an admin signs in. We don't use any third-party tracking or advertising cookies.",
        "Questions or complaints: privacy@silverconnect.com.au — we respond within 30 days. AU residents can also lodge a complaint with the OAIC at oaic.gov.au.",
      ],
      zh: [
        "最近更新：2026-05-05。SilverConnect 由 SilverConnect Pty Ltd（澳洲）运营。本页说明我们持有哪些您的个人信息，以及您有哪些选择。",
        "您直接提供给我们的数据：姓名、邮箱、电话、国家、地址、紧急联系人、家属、以及您在订单或争议中附上的照片和备注。服务者还会上传身份证、警察检查、急救证书和保险等文件。",
        "您使用过程中生成的数据：订单、评价、AI 聊天记录、安全报告、支付记录（仅金额和状态——卡号由 Stripe 直接处理，我们不接触）、通知偏好、登录时间。",
        "为什么保留这些数据：为您匹配经审核的服务者；在服务完成前以托管方式保管款项；安全事件中调用紧急联系人；以及遵守澳洲、中国和加拿大的养老服务行业法规。",
        "谁能看到：SilverConnect 出于必要的工作人员、您所预订的服务者（仅看到您的姓名、地址、电话和订单备注——看不到其他订单或无关数据）、以及 Stripe（用于支付）。我们从不出售您的数据。",
        "数据存放位置：澳洲客户数据存放于澳洲区 Supabase；中国客户数据存放于中国境内服务器以符合《个人信息保护法》的本地化要求；加拿大客户数据目前存于美国区 Supabase（适用标准合同条款），我们将在 2026 下半年迁移至加拿大区。",
        "您的权利：可在「设置 → 隐私」中点击「下载我的数据」，导出一份 JSON 存档；也可在同一页面永久注销账号 — 此操作不可撤销，将删除您的资料、订单、地址、支付方式、家属/紧急联系人、您写过的评价、AI 历史、提交过的安全报告、通知以及您发起过的所有争议。我们不保留与您身份关联的任何记录（依 GDPR 第 17 条「被遗忘权」）。唯一例外：您对他人评价提交过的举报记录会以匿名形式（举报人 ID 置空）保留，以维持平台审核历史的完整性。",
        "Cookie：我们仅使用一个必要会话 cookie（sc-session）保持登录，一个国家/语言偏好 cookie，以及管理员登录时的 admin cookie。不使用任何第三方追踪或广告 cookie。",
        "如有疑问或投诉：privacy@silverconnect.com.au — 我们在 30 天内回复。澳洲居民也可向 OAIC（oaic.gov.au）投诉。",
      ],
    },
    updated: "2026-05-05",
  },
  {
    slug: "terms",
    category: "account",
    title: {
      en: "Terms of service",
      zh: "服务条款",
    },
    summary: {
      en: "The agreement between you and SilverConnect when you use the platform.",
      zh: "您使用 SilverConnect 平台时，您与我们之间的协议。",
    },
    body: {
      en: [
        "Last updated: 2026-05-05. By creating an account or booking a service through SilverConnect you agree to these terms. If you do not agree, please don't use the platform.",
        "Who we are: SilverConnect is a marketplace that connects elders and their families with vetted in-home service providers. We are not the employer of providers — they are independent operators. We screen them (police check, identity, first aid where relevant) but the contract for each service is between you and the provider.",
        "Booking and payment: when you confirm a booking, the price shown is held against your card via Stripe. We release payment to the provider after you mark the service complete (or automatically 48 hours after the scheduled completion if you don't act). You can cancel free of charge up to 24 hours before the service; later cancellations may incur a 50% fee that goes to the provider for blocked time.",
        "Disputes: if something goes wrong, raise a dispute from the booking detail page within 14 days of the service. Our team reviews the evidence and decides full refund / partial refund / no refund within 7 working days. Both parties are notified of the decision.",
        "Safety: if you experience harassment, theft, damage or any other safety incident, file a safety report immediately. We take these seriously — credible reports lead to provider suspension or permanent ban, and we cooperate with police when escalated.",
        "Reviews: you can review a provider after a completed service. Reviews must be honest and based on the actual service. We may remove reviews that are abusive, contain personal data of others, or are submitted in bad faith. Providers may publicly reply once.",
        "Provider obligations: providers must keep their identity, police-check, first-aid (where required) and insurance documents current. Failure to keep documents valid leads to account suspension. Providers commit to honouring confirmed bookings and not soliciting customers off-platform.",
        "Intellectual property: the SilverConnect name, logo, design and platform code belong to SilverConnect Pty Ltd. Reviews and photos you submit grant us a non-exclusive licence to display them on the platform; you keep ownership.",
        "Liability: we use reasonable care in vetting providers and operating the platform but we cannot guarantee provider conduct. Our maximum liability for any single incident is limited to the total amount you paid for the affected booking, except where Australian Consumer Law gives you stronger rights that cannot be excluded.",
        "Termination: you can close your account at any time from Settings → Privacy. We can suspend or close accounts that violate these terms; we'll tell you why and give you a chance to respond unless safety requires immediate action.",
        "Changes: we'll post material changes here and notify active users by email at least 30 days before they take effect.",
        "Governing law: AU customers — New South Wales law. CN customers — Mainland China law (Shanghai courts). CA customers — Ontario law. Disputes go to the courts of the relevant jurisdiction.",
        "Contact: legal@silverconnect.com.au.",
      ],
      zh: [
        "最近更新：2026-05-05。当您创建账号或通过 SilverConnect 预订服务时，即表示同意以下条款。如不同意，请不要使用本平台。",
        "我们是谁：SilverConnect 是一个连接长者及其家属与经审核上门服务者的撮合平台。我们不是服务者的雇主，他们是独立经营者。我们对其进行背景审核（警察检查、身份核验、必要时的急救证），但每次服务的合同关系是在您与服务者之间。",
        "预订与支付：您确认订单时，账户金额由 Stripe 暂扣。服务完成后由您确认（或预约时间过后 48 小时未操作系统自动），款项才会释放给服务者。服务开始前 24 小时之前可免费取消；之后取消可能会向服务者支付 50% 的占位费。",
        "争议：发生问题时，请在服务结束 14 天内从订单详情页发起争议。我方团队会在 7 个工作日内审核证据并做出全额退款/部分退款/不退款的决定。决定结果会同时通知双方。",
        "安全：如遇骚扰、盗窃、损坏或其他安全事件，请立即提交安全报告。我们严肃处理 — 经核实的报告将导致服务者被暂停或永久封禁；情节严重的我们会配合警方处理。",
        "评价：服务完成后您可对服务者写评价。评价必须基于真实经历。如有辱骂、泄露他人隐私或恶意评价，我们可能删除。服务者有一次公开回复机会。",
        "服务者义务：服务者必须保持身份、警察检查、必要的急救证和保险文件有效。文件失效将导致账号暂停。服务者承诺履行已确认的订单，不得引导客户脱离平台交易。",
        "知识产权：SilverConnect 名称、Logo、设计和平台代码属 SilverConnect Pty Ltd。您提交的评价和照片授予我们非独占性许可在平台展示；所有权仍归您。",
        "责任：我们尽合理努力审核服务者并运营平台，但无法保证服务者的具体行为。任何单一事件，我方责任以您为该订单已支付的金额为上限；澳洲消费者法赋予的不可排除的更强权利除外。",
        "终止：您可随时在「设置 → 隐私」中关闭账号。如有违反本条款的情况，我们可暂停或关闭账号；我们会告知原因并给予回应机会，但安全紧急情况除外。",
        "条款变更：重大变更将在此页面发布，并提前 30 天通过邮件通知活跃用户。",
        "管辖法律：澳洲客户 — 新南威尔士州法律；中国客户 — 中国大陆法律（上海法院管辖）；加拿大客户 — 安大略省法律。争议由相应辖区法院管辖。",
        "联系：legal@silverconnect.com.au。",
      ],
    },
    updated: "2026-05-05",
  },
];

export function findArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
