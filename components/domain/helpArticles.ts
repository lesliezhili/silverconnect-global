/**
 * Static knowledge-base content for /help/[slug]. Tiny on purpose —
 * full KB lives in a backend CMS later. Each article has paragraph
 * blocks; lists / images can be added when needed.
 */

type Locale = "en" | "zh-CN" | "zh-TW" | "ja" | "ko";

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
      "zh-CN": "如何预订第一次服务",
      "zh-TW": "如何預約第一次服務",
      ja: "初めてのサービス予約",
      ko: "첫 서비스 예약하기",
    },
    summary: {
      en: "From picking a category to confirming payment in five steps.",
      "zh-CN": "五步走完：选服务、挑师傅、选时间、填地址、确认支付。",
      "zh-TW": "五步完成：選服務、挑服務人員、選時間、填地址、確認付款。",
      ja: "カテゴリ選びから支払い確認まで、5つのステップでご案内します。",
      ko: "카테고리 선택부터 결제 확인까지 다섯 단계로 안내해드려요.",
    },
    body: {
      en: [
        "Pick a category from the home screen — Cleaning, Cooking, Garden, Personal care or Repair.",
        "Browse providers in your area. Verified, first-aid certified, and Mandarin-speaking helpers are filterable from the chip row at the top.",
        "Tap a provider to see their full bio, services, available next 7 days and reviews. Pick the service package you want.",
        "Pick a time slot, choose an address, and confirm. Payment is held in escrow — your provider only gets paid after the service is completed.",
      ],
      "zh-CN": [
        "在首页选一个服务类别 — 清洁、烹饪、园艺、个人护理或维修。",
        "浏览您附近的服务者。顶部的筛选条可以按「已验证」「急救证」「中文」筛选。",
        "点开某位服务者，查看完整简介、服务清单、未来 7 天可预订时段、评价。选定您想要的服务包。",
        "选时段、选地址、确认。款项进入托管 — 服务完成并经您确认后才会释放给服务者。",
      ],
      "zh-TW": [
        "在首頁選一個服務類別 — 清潔、烹飪、園藝、個人照護或維修。",
        "瀏覽您附近的服務人員。頂端的篩選列可以按「已驗證」「急救證」「中文」篩選。",
        "點開某位服務人員，檢視完整簡介、服務清單、未來 7 天可預約時段、評價。選定您想要的服務方案。",
        "選時段、選地址、確認。款項進入託管 — 服務完成並經您確認後才會釋放給服務人員。",
      ],
      ja: [
        "ホーム画面からカテゴリを選んでください — 清掃、料理、ガーデニング、身の回りのケア、または修理。",
        "お近くのスタッフをご覧いただけます。画面上部のチップから「認証済み」「応急処置認定」「中国語対応」で絞り込めます。",
        "スタッフをタップすると、詳しいプロフィール、提供サービス、今後7日間の空き状況、レビューが表示されます。ご希望のサービスパッケージをお選びください。",
        "時間帯と住所を選んで確定します。お支払いはエスクローで保管され、サービス完了後にスタッフへ送金されます。",
      ],
      ko: [
        "홈 화면에서 카테고리를 선택하세요 — 청소, 요리, 정원, 개인 돌봄, 또는 수리.",
        "내 지역의 도우미를 둘러보세요. 상단 칩 행에서 인증됨, 응급처치 자격, 중국어 가능 도우미로 필터링할 수 있어요.",
        "도우미를 탭하면 전체 소개, 제공 서비스, 향후 7일 예약 가능 시간, 리뷰를 볼 수 있어요. 원하시는 서비스 패키지를 선택하세요.",
        "시간대와 주소를 선택하고 확인해주세요. 결제는 에스크로에 보관되며 서비스 완료 후에만 도우미에게 지급돼요.",
      ],
    },
    updated: "2026-04-12",
  },
  {
    slug: "reschedule-booking",
    category: "bookings",
    title: {
      en: "How to reschedule a booking",
      "zh-CN": "如何改约一次预订",
      "zh-TW": "如何改約一次預約",
      ja: "予約の変更方法",
      ko: "예약 일정 변경하는 방법",
    },
    summary: {
      en: "Free reschedule until 24 hours before the service.",
      "zh-CN": "服务开始前 24 小时之前可免费改约。",
      "zh-TW": "服務開始前 24 小時之前可免費改約。",
      ja: "サービス開始の24時間前までは無料で変更できます。",
      ko: "서비스 시작 24시간 전까지는 무료로 변경할 수 있어요.",
    },
    body: {
      en: [
        "Open the booking from My bookings → Upcoming, or tap the notification.",
        "Tap Reschedule on the sticky bar. Pick a new time from the available slots.",
        "Confirm — your provider gets a notification and the new time replaces the old one.",
        "Within 24 hours of the original time, rescheduling switches off and you'll need to either keep the booking or cancel (cancellation fee may apply).",
      ],
      "zh-CN": [
        "从「我的预订 → 即将进行」打开该预订，或点击通知。",
        "点击底部的「改约」按钮，从可用时段中选一个新时间。",
        "确认即可 — 服务者会收到通知，新时间会替换旧时间。",
        "距服务开始 24 小时之内不再支持改约，只能保留或取消（取消可能产生费用）。",
      ],
      "zh-TW": [
        "從「我的預約 → 即將進行」開啟該預約，或點擊通知。",
        "點擊底部的「改約」按鈕，從可用時段中選一個新時間。",
        "確認即可 — 服務人員會收到通知，新時間會取代舊時間。",
        "距服務開始 24 小時之內不再支援改約，只能保留或取消（取消可能產生費用）。",
      ],
      ja: [
        "「マイ予約 → 予定」から該当の予約を開くか、通知をタップしてください。",
        "下部バーの「変更」をタップし、空き時間から新しい時間帯を選びます。",
        "確定するとスタッフへ通知が届き、新しい時間に更新されます。",
        "予約開始の24時間以内は変更できなくなります。そのまま実施するかキャンセル（キャンセル料が発生する場合があります）をお選びください。",
      ],
      ko: [
        "「내 예약 → 예정」에서 해당 예약을 열거나 알림을 탭하세요.",
        "하단 바에서 「일정 변경」을 탭하고 가능한 시간 중에서 새 시간을 선택하세요.",
        "확인하시면 도우미에게 알림이 가고 새 시간으로 변경돼요.",
        "예약 시작 24시간 이내에는 변경이 불가능해요. 그대로 진행하시거나 취소(취소 수수료가 발생할 수 있어요)하실 수 있어요.",
      ],
    },
    updated: "2026-03-28",
  },
  {
    slug: "cancellation-policy",
    category: "payments",
    title: {
      en: "Cancellation & refund policy",
      "zh-CN": "取消与退款政策",
      "zh-TW": "取消與退款政策",
      ja: "キャンセル・返金ポリシー",
      ko: "취소 및 환불 정책",
    },
    summary: {
      en: "Full refund up to 24h before, partial after, no refund once started.",
      "zh-CN": "24 小时前全额退、24 小时内部分退、服务开始后不退。",
      "zh-TW": "24 小時前全額退、24 小時內部分退、服務開始後不退。",
      ja: "24時間前までは全額返金、それ以降は一部返金、開始後は返金なし。",
      ko: "24시간 전 전액 환불, 그 이후 일부 환불, 시작 후 환불 불가.",
    },
    body: {
      en: [
        "More than 24 hours before service: full refund, no fee.",
        "Less than 24 hours but before service starts: 50% refund — the other half compensates the provider for blocked time.",
        "After service starts: no automatic refund. If something went wrong, open a dispute from the booking detail and an admin will review within 48 hours.",
      ],
      "zh-CN": [
        "服务开始前 24 小时以上：全额退款，不收手续费。",
        "服务开始前 24 小时之内：退款 50%，另外 50% 用于补偿服务者已挡住的时段。",
        "服务开始后：不自动退款。如有问题请从预订详情提交「报告问题」，管理员将在 48 小时内审核。",
      ],
      "zh-TW": [
        "服務開始前 24 小時以上：全額退款，不收手續費。",
        "服務開始前 24 小時之內：退款 50%，另外 50% 用於補償服務人員已預留的時段。",
        "服務開始後：不自動退款。如有問題請從預約詳情提交「回報問題」，管理員將在 48 小時內審核。",
      ],
      ja: [
        "サービス開始の24時間以上前：全額返金、手数料なし。",
        "24時間以内、サービス開始前：50%返金 — 残り半額は、スタッフが空けていた時間への補償です。",
        "サービス開始後：自動返金はありません。問題があった場合は予約詳細から「問題を報告」してください。管理者が48時間以内に確認します。",
      ],
      ko: [
        "서비스 시작 24시간 이전: 전액 환불, 수수료 없음.",
        "24시간 이내 서비스 시작 전: 50% 환불 — 나머지 절반은 도우미가 시간을 비워둔 데 대한 보상이에요.",
        "서비스 시작 후: 자동 환불은 없어요. 문제가 있으면 예약 상세에서 「문제 신고」를 해주세요. 관리자가 48시간 이내에 검토해요.",
      ],
    },
    updated: "2026-04-04",
  },
  {
    slug: "emergency-help",
    category: "safety",
    title: {
      en: "Getting emergency help",
      "zh-CN": "如何获取紧急帮助",
      "zh-TW": "如何獲取緊急協助",
      ja: "緊急時のサポートを受ける",
      ko: "긴급 도움 받기",
    },
    summary: {
      en: "AI chat picks up keywords and surfaces the right number for your country.",
      "zh-CN": "AI 聊天会识别关键词，按您所在国家显示正确的紧急号码。",
      "zh-TW": "AI 聊天會辨識關鍵字，按您所在國家顯示正確的緊急號碼。",
      ja: "AIチャットがキーワードを検知し、お住まいの国に合わせた緊急連絡先を表示します。",
      ko: "AI 채팅이 키워드를 인식해서 거주 국가에 맞는 긴급 번호를 보여드려요.",
    },
    body: {
      en: [
        "If you say words like 'help', 'fall', 'chest pain' or 'can't breathe' in the AI chat, the assistant immediately switches to an emergency overlay with a single big red button to dial your country's emergency number.",
        "The number is hardcoded by country: 000 in Australia, 911 in the United States, 911 in Canada.",
        "You can also tap Notify emergency contact to send a text to the family member you've nominated in your profile.",
      ],
      "zh-CN": [
        "如果您在 AI 聊天里说出「救命」「摔倒」「胸痛」「喘不上气」等关键词，助手会立刻切到紧急覆盖屏，提供一个红色大按钮直接拨打您所在国家的紧急号码。",
        "号码按国家硬编码：澳洲 000、美国 911、加拿大 911。",
        "您也可以点击「通知紧急联系人」，给您在资料中设置的家属发短信。",
      ],
      "zh-TW": [
        "如果您在 AI 聊天裡說出「救命」「跌倒」「胸痛」「喘不過氣」等關鍵字，助理會立刻切換到緊急覆蓋畫面，提供一個紅色大按鈕直接撥打您所在國家的緊急號碼。",
        "號碼按國家硬編碼：澳洲 000、美國 911、加拿大 911。",
        "您也可以點擊「通知緊急聯絡人」，給您在個人資料中設定的家屬傳送簡訊。",
      ],
      ja: [
        "AIチャットで「助けて」「転倒」「胸が痛い」「息ができない」などの言葉を入力すると、アシスタントが直ちに緊急オーバーレイに切り替わり、お住まいの国の緊急番号にかける大きな赤いボタンを表示します。",
        "番号は国ごとに固定されています：オーストラリア 000、アメリカ合衆国 911、カナダ 911。",
        "「緊急連絡先に通知」をタップすると、プロフィールに登録されたご家族へショートメッセージを送ることもできます。",
      ],
      ko: [
        "AI 채팅에서 「살려주세요」「넘어졌어요」「가슴 통증」「숨을 못 쉬어요」 같은 단어를 말하시면, 어시스턴트가 즉시 긴급 오버레이로 전환되며 거주 국가의 긴급 번호로 연결되는 큰 빨간 버튼이 표시돼요.",
        "번호는 국가별로 고정돼 있어요: 호주 000, 미국 911, 캐나다 911.",
        "「긴급 연락처에 알리기」를 탭하시면 프로필에 등록한 가족에게 문자 메시지를 보낼 수도 있어요.",
      ],
    },
    updated: "2026-05-10",
  },
  {
    slug: "change-language-country",
    category: "account",
    title: {
      en: "Changing language or country",
      "zh-CN": "切换语言或国家",
      "zh-TW": "切換語言或國家",
      ja: "言語や国の切り替え",
      ko: "언어 또는 국가 변경",
    },
    summary: {
      en: "Both live in the header — country drives currency, tax and emergency number.",
      "zh-CN": "两个开关都在 Header — 国家决定货币、税率和紧急号码。",
      "zh-TW": "兩個開關都在 Header — 國家決定貨幣、稅率和緊急號碼。",
      ja: "どちらもヘッダーにあります — 国によって通貨、税、緊急番号が変わります。",
      ko: "둘 다 헤더에 있어요 — 국가가 통화, 세금, 긴급 번호를 결정해요.",
    },
    body: {
      en: [
        "The 🌐 chip in the header switches between English, 简体中文, 繁體中文, 日本語 and 한국어. Switching keeps you on the same page; only the copy changes.",
        "The 🇦🇺 / 🇺🇸 / 🇨🇦 chip switches country. This drives currency (A$ / US$ / C$), tax label (GST / Sales Tax / HST) and the emergency number used by the AI chat.",
        "Country and language are independent — you can use English while seeing US prices, or 中文 while seeing Canadian prices.",
      ],
      "zh-CN": [
        "Header 的 🌐 按钮切换 English / 简体中文 / 繁體中文 / 日本語 / 한국어。切换后停留在当前页面，只换文案。",
        "Header 的 🇦🇺 / 🇺🇸 / 🇨🇦 按钮切换国家。国家决定货币（A$ / US$ / C$）、税名（GST / 销售税 / HST）和 AI 聊天里的紧急号码。",
        "国家与语言相互独立 — 可以「英文 + 美国价格」也可以「中文 + 加拿大价格」。",
      ],
      "zh-TW": [
        "Header 的 🌐 按鈕切換 English / 简体中文 / 繁體中文 / 日本語 / 한국어。切換後停留在目前頁面，只換文案。",
        "Header 的 🇦🇺 / 🇺🇸 / 🇨🇦 按鈕切換國家。國家決定貨幣（A$ / US$ / C$）、稅名（GST / 銷售稅 / HST）和 AI 聊天裡的緊急號碼。",
        "國家與語言相互獨立 — 可以「英文 + 美國價格」也可以「中文 + 加拿大價格」。",
      ],
      ja: [
        "ヘッダーの 🌐 チップで English / 简体中文 / 繁體中文 / 日本語 / 한국어 を切り替えます。切り替えても同じページに留まり、表示文言だけが変わります。",
        "🇦🇺 / 🇺🇸 / 🇨🇦 チップで国を切り替えます。国によって通貨（A$ / US$ / C$）、税の表記（GST / 売上税 / HST）、AIチャットで使う緊急番号が変わります。",
        "国と言語は独立しています — 「英語＋米国価格」でも「日本語＋カナダ価格」でも自由に組み合わせられます。",
      ],
      ko: [
        "헤더의 🌐 칩으로 English / 简体中文 / 繁體中文 / 日本語 / 한국어 를 전환할 수 있어요. 전환해도 같은 페이지에 머물고 문구만 바뀌어요.",
        "🇦🇺 / 🇺🇸 / 🇨🇦 칩으로 국가를 전환해요. 국가에 따라 통화(A$ / US$ / C$), 세금 표기(GST / 판매세 / HST), AI 채팅의 긴급 번호가 달라져요.",
        "국가와 언어는 독립적이에요 — 「영어 + 미국 가격」도 가능하고 「한국어 + 캐나다 가격」도 가능해요.",
      ],
    },
    updated: "2026-05-10",
  },
  {
    slug: "privacy",
    category: "account",
    title: {
      en: "Privacy policy",
      "zh-CN": "隐私政策",
      "zh-TW": "隱私政策",
      ja: "プライバシーポリシー",
      ko: "개인정보 처리방침",
    },
    summary: {
      en: "What we collect, why we collect it, and how to access or delete your data.",
      "zh-CN": "我们收集什么、为什么收集、以及如何查看或删除您的数据。",
      "zh-TW": "我們收集什麼、為什麼收集、以及如何檢視或刪除您的資料。",
      ja: "収集する情報、収集理由、データの確認・削除方法について説明します。",
      ko: "어떤 정보를 수집하는지, 왜 수집하는지, 데이터를 어떻게 확인하거나 삭제하는지 알려드려요.",
    },
    body: {
      en: [
        "Last updated: 2026-05-10. SilverConnect is operated by SilverConnect Pty Ltd in Australia. This page tells you what personal data we hold and what choices you have.",
        "Data we collect from you directly: your name, email, phone, country, address(es), emergency contacts, family members, and any photos or notes you attach to bookings or disputes. Providers also upload identity, police-check, first-aid and insurance documents.",
        "Data we generate as you use the service: bookings, reviews, AI-chat transcripts, safety reports, payment records (amount + status; we never see card numbers because Stripe handles that), notification preferences, and login timestamps.",
        "Why we hold this: to match you with vetted providers, hold money in escrow until a service is completed, surface emergency contacts during safety incidents, and meet our legal obligations around aged-care services in AU / US / CA.",
        "Who sees it: SilverConnect staff with a need-to-know basis, the provider you book (your name, address, phone, and the booking notes — but not other bookings or unrelated data), and Stripe (for payments). We do not sell your data, ever.",
        "Where it lives: AU customer data is hosted on AU-region Supabase. US customer data is hosted on US-region Supabase. CA customer data is hosted on US-region Supabase under standard contractual clauses; we will move CA to its own region during 2026 H2.",
        "Your rights: You can download a JSON archive of everything we hold about you from Settings → Privacy → 'Download my data'. You can permanently delete your account from the same page; this is irreversible and removes your profile, bookings, addresses, payment methods, family/emergency contacts, reviews you wrote, AI history, safety reports you filed, notifications and any disputes you raised — we retain nothing tied to your identity (GDPR Art. 17 / CCPA equivalent). One exception: review reports you may have filed against other users' reviews are kept anonymously (reporter ID blanked) so platform-moderation history isn't lost.",
        "Cookies: we use one essential cookie ('sc-session') to keep you signed in, one for country/language preference, and an admin cookie when an admin signs in. We don't use any third-party tracking or advertising cookies.",
        "Questions or complaints: privacy@silverconnect.com.au — we respond within 30 days. AU residents can also lodge a complaint with the OAIC at oaic.gov.au. US residents in California can exercise CCPA rights through the same address.",
      ],
      "zh-CN": [
        "最近更新：2026-05-10。SilverConnect 由 SilverConnect Pty Ltd（澳洲）运营。本页说明我们持有哪些您的个人信息，以及您有哪些选择。",
        "您直接提供给我们的数据：姓名、邮箱、电话、国家、地址、紧急联系人、家属、以及您在订单或争议中附上的照片和备注。服务者还会上传身份证、警察检查、急救证书和保险等文件。",
        "您使用过程中生成的数据：订单、评价、AI 聊天记录、安全报告、支付记录（仅金额和状态——卡号由 Stripe 直接处理，我们不接触）、通知偏好、登录时间。",
        "为什么保留这些数据：为您匹配经审核的服务者；在服务完成前以托管方式保管款项；安全事件中调用紧急联系人；以及遵守澳洲、美国和加拿大的养老服务行业法规。",
        "谁能看到：SilverConnect 出于必要的工作人员、您所预订的服务者（仅看到您的姓名、地址、电话和订单备注——看不到其他订单或无关数据）、以及 Stripe（用于支付）。我们从不出售您的数据。",
        "数据存放位置：澳洲客户数据存放于澳洲区 Supabase；美国客户数据存放于美国区 Supabase；加拿大客户数据目前存于美国区 Supabase（适用标准合同条款），我们将在 2026 下半年迁移至加拿大区。",
        "您的权利：可在「设置 → 隐私」中点击「下载我的数据」，导出一份 JSON 存档；也可在同一页面永久注销账号 — 此操作不可撤销，将删除您的资料、订单、地址、支付方式、家属/紧急联系人、您写过的评价、AI 历史、提交过的安全报告、通知以及您发起过的所有争议。我们不保留与您身份关联的任何记录（依 GDPR 第 17 条「被遗忘权」/ CCPA 同类规定）。唯一例外：您对他人评价提交过的举报记录会以匿名形式（举报人 ID 置空）保留，以维持平台审核历史的完整性。",
        "Cookie：我们仅使用一个必要会话 cookie（sc-session）保持登录，一个国家/语言偏好 cookie，以及管理员登录时的 admin cookie。不使用任何第三方追踪或广告 cookie。",
        "如有疑问或投诉：privacy@silverconnect.com.au — 我们在 30 天内回复。澳洲居民可向 OAIC（oaic.gov.au）投诉；加州居民可通过同一邮箱行使 CCPA 权利。",
      ],
      "zh-TW": [
        "最近更新：2026-05-10。SilverConnect 由 SilverConnect Pty Ltd（澳洲）營運。本頁說明我們持有哪些您的個人資訊，以及您有哪些選擇。",
        "您直接提供給我們的資料：姓名、信件地址、電話、國家、地址、緊急聯絡人、家屬、以及您在預約或爭議中附上的照片和備註。服務人員還會上傳身分證、警察查核、急救證書和保險等檔案。",
        "您使用過程中產生的資料：預約、評價、AI 聊天紀錄、安全報告、付款紀錄（僅金額和狀態 — 卡號由 Stripe 直接處理，我們不接觸）、通知偏好、登入時間。",
        "為什麼保留這些資料：為您媒合經審核的服務人員；在服務完成前以託管方式保管款項；安全事件中呼叫緊急聯絡人；以及遵守澳洲、美國和加拿大的長照服務行業法規。",
        "誰能檢視：SilverConnect 基於必要的工作人員、您所預約的服務人員（僅看到您的姓名、地址、電話和預約備註 — 看不到其他預約或無關資料）、以及 Stripe（用於付款）。我們從不出售您的資料。",
        "資料存放位置：澳洲使用者資料存放於澳洲區 Supabase；美國使用者資料存放於美國區 Supabase；加拿大使用者資料目前存於美國區 Supabase（適用標準合約條款），我們將在 2026 下半年遷移至加拿大區。",
        "您的權利：可在「設定 → 隱私」中點擊「下載我的資料」，匯出一份 JSON 封存檔；也可在同一頁面永久註銷帳號 — 此操作無法復原，將刪除您的個人資料、預約、地址、付款方式、家屬/緊急聯絡人、您寫過的評價、AI 紀錄、提交過的安全報告、通知以及您發起過的所有爭議。我們不保留與您身分關聯的任何紀錄（依 GDPR 第 17 條「被遺忘權」/ CCPA 同類規定）。唯一例外：您對他人評價提交過的檢舉紀錄會以匿名形式（檢舉人 ID 置空）保留，以維持平台審核歷史的完整性。",
        "Cookie：我們僅使用一個必要的工作階段 cookie（sc-session）保持登入，一個國家/語言偏好 cookie，以及管理員登入時的 admin cookie。不使用任何第三方追蹤或廣告 cookie。",
        "如有疑問或投訴：privacy@silverconnect.com.au — 我們在 30 天內回覆。澳洲居民可向 OAIC（oaic.gov.au）投訴；加州居民可透過同一信箱行使 CCPA 權利。",
      ],
      ja: [
        "最終更新：2026-05-10。SilverConnect は SilverConnect Pty Ltd（オーストラリア）が運営しています。本ページでは保管している個人データの内容と、お客様の選択肢についてご説明します。",
        "お客様から直接お預かりするデータ：氏名、メールアドレス、電話番号、国、住所、緊急連絡先、ご家族、予約や紛争に添付された写真・メモ。スタッフは身元確認書類、無犯罪証明、応急処置認定、保険証券もアップロードします。",
        "ご利用に伴い生成されるデータ：予約、レビュー、AIチャット履歴、安全報告、支払い記録（金額とステータスのみ — カード番号は Stripe が処理し、当社は取得しません）、通知設定、ログイン日時。",
        "保管理由：認定済みスタッフとのマッチング、サービス完了までの代金のエスクロー保管、安全事案発生時の緊急連絡先呼び出し、AU / US / CA における高齢者向けサービスに関する法令遵守のためです。",
        "閲覧者：必要に応じて閲覧する SilverConnect スタッフ、ご予約のスタッフ（お名前、住所、電話番号、予約メモのみ — 他の予約や無関係なデータは閲覧不可）、決済処理を行う Stripe。お客様のデータを販売することは一切ありません。",
        "保管場所：AU のお客様データは AU リージョンの Supabase、US のお客様データは US リージョンの Supabase に保管されます。CA のお客様データは標準契約条項に基づき現在 US リージョンの Supabase に保管されており、2026年下半期に CA 専用リージョンへ移行する予定です。",
        "お客様の権利：「設定 → プライバシー → データをダウンロード」から、当社が保有するすべてのデータの JSON アーカイブをダウンロードできます。同じ画面からアカウントを完全に削除することも可能です。これは取り消しできず、プロフィール、予約、住所、支払い方法、家族・緊急連絡先、書いたレビュー、AI履歴、提出した安全報告、通知、提起したすべての紛争が削除されます。お客様の身元に紐づく記録は一切保持しません（GDPR 第17条「忘れられる権利」/ CCPA 同等規定に準拠）。例外：他のユーザーのレビューに対して通報した場合、その通報記録は匿名（通報者IDを空白）として保管され、プラットフォームのモデレーション履歴が維持されます。",
        "Cookie：ログイン状態維持のための必須Cookie（sc-session）、国・言語設定用のCookie、管理者ログイン時の管理者Cookieのみを使用しています。第三者のトラッキング・広告Cookieは一切使用していません。",
        "ご質問・苦情：privacy@silverconnect.com.au — 30日以内に返信いたします。AU 在住の方は OAIC（oaic.gov.au）にも申し立てできます。カリフォルニア州在住の方は同じアドレスから CCPA に基づく権利行使ができます。",
      ],
      ko: [
        "최종 업데이트: 2026-05-10. SilverConnect는 호주의 SilverConnect Pty Ltd가 운영해요. 이 페이지에서는 보관 중인 개인정보와 사용자가 선택할 수 있는 권리를 안내해드려요.",
        "사용자가 직접 제공하는 데이터: 이름, 이메일, 전화번호, 국가, 주소, 긴급 연락처, 가족 구성원, 예약이나 분쟁에 첨부한 사진 및 메모. 도우미는 신원, 신원조회, 응급처치, 보험 서류도 업로드해요.",
        "서비스 이용 중 생성되는 데이터: 예약, 리뷰, AI 채팅 기록, 안전 신고, 결제 기록(금액 및 상태만 — 카드 번호는 Stripe가 처리하므로 저희는 보지 않아요), 알림 설정, 로그인 시간.",
        "이 데이터를 보관하는 이유: 검증된 도우미와의 매칭, 서비스 완료 시까지 에스크로 보관, 안전 사고 발생 시 긴급 연락처 호출, 그리고 AU / US / CA 노인 돌봄 서비스 관련 법규 준수를 위해서예요.",
        "열람 권한: 알아야 할 필요가 있는 SilverConnect 직원, 예약하신 도우미(이름, 주소, 전화번호, 예약 메모만 — 다른 예약이나 무관한 데이터는 볼 수 없어요), 결제 처리용 Stripe. 사용자 데이터를 판매하지 않아요.",
        "데이터 저장 위치: AU 사용자 데이터는 AU 지역 Supabase에, US 사용자 데이터는 US 지역 Supabase에 저장돼요. CA 사용자 데이터는 표준 계약 조항에 따라 현재 US 지역 Supabase에 저장되며, 2026년 하반기에 CA 전용 지역으로 이전할 예정이에요.",
        "사용자 권리: 「설정 → 개인정보 → 내 데이터 다운로드」에서 보관 중인 모든 데이터의 JSON 아카이브를 다운로드할 수 있어요. 같은 페이지에서 계정을 영구 삭제할 수도 있어요. 이는 되돌릴 수 없으며 프로필, 예약, 주소, 결제 수단, 가족/긴급 연락처, 작성한 리뷰, AI 기록, 제출한 안전 신고, 알림, 제기한 모든 분쟁이 삭제돼요. 신원과 연결된 어떤 기록도 보관하지 않아요(GDPR 제17조 「잊혀질 권리」/ CCPA 동등 규정 준수). 예외: 다른 사용자의 리뷰에 대해 신고한 기록은 익명(신고자 ID 공란)으로 보관되어 플랫폼 모더레이션 기록이 유지돼요.",
        "쿠키: 로그인 유지용 필수 쿠키(sc-session) 1개, 국가/언어 설정 쿠키 1개, 관리자 로그인 시 관리자 쿠키만 사용해요. 제3자 추적이나 광고 쿠키는 사용하지 않아요.",
        "문의 또는 불만: privacy@silverconnect.com.au — 30일 이내에 답변드려요. AU 거주자는 OAIC(oaic.gov.au)에도 진정할 수 있어요. 캘리포니아 거주자는 같은 주소로 CCPA 권리를 행사할 수 있어요.",
      ],
    },
    updated: "2026-05-10",
  },
  {
    slug: "terms",
    category: "account",
    title: {
      en: "Terms of service",
      "zh-CN": "服务条款",
      "zh-TW": "服務條款",
      ja: "利用規約",
      ko: "서비스 이용약관",
    },
    summary: {
      en: "The agreement between you and SilverConnect when you use the platform.",
      "zh-CN": "您使用 SilverConnect 平台时，您与我们之间的协议。",
      "zh-TW": "您使用 SilverConnect 平台時，您與我們之間的協議。",
      ja: "SilverConnectをご利用いただく際の、お客様と当社との合意事項です。",
      ko: "SilverConnect 플랫폼을 이용하실 때 사용자와 저희 사이의 약속이에요.",
    },
    body: {
      en: [
        "Last updated: 2026-05-10. By creating an account or booking a service through SilverConnect you agree to these terms. If you do not agree, please don't use the platform.",
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
        "Governing law: AU customers — New South Wales law. US customers — Delaware law (state and federal courts of Delaware). CA customers — Ontario law. Disputes go to the courts of the relevant jurisdiction.",
        "Contact: legal@silverconnect.com.au.",
      ],
      "zh-CN": [
        "最近更新：2026-05-10。当您创建账号或通过 SilverConnect 预订服务时，即表示同意以下条款。如不同意，请不要使用本平台。",
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
        "管辖法律：澳洲客户 — 新南威尔士州法律；美国客户 — 特拉华州法律（特拉华州州法院与联邦法院）；加拿大客户 — 安大略省法律。争议由相应辖区法院管辖。",
        "联系：legal@silverconnect.com.au。",
      ],
      "zh-TW": [
        "最近更新：2026-05-10。當您建立帳號或透過 SilverConnect 預約服務時，即表示同意以下條款。如不同意，請不要使用本平台。",
        "我們是誰：SilverConnect 是一個連接長者及其家屬與經審核到府服務人員的媒合平台。我們不是服務人員的雇主，他們是獨立經營者。我們對其進行背景審核（警察查核、身分核驗、必要時的急救證），但每次服務的合約關係是在您與服務人員之間。",
        "預約與付款：您確認預約時，帳戶金額由 Stripe 暫扣。服務完成後由您確認（或預約時間過後 48 小時未操作系統自動），款項才會釋放給服務人員。服務開始前 24 小時之前可免費取消；之後取消可能會向服務人員支付 50% 的預留時段費。",
        "爭議：發生問題時，請在服務結束 14 天內從預約詳情頁發起爭議。我方團隊會在 7 個工作天內審核證據並做出全額退款/部分退款/不退款的決定。決定結果會同時通知雙方。",
        "安全：如遇騷擾、竊盜、損壞或其他安全事件，請立即提交安全報告。我們嚴肅處理 — 經核實的報告將導致服務人員被暫停或永久封禁；情節嚴重的我們會配合警方處理。",
        "評價：服務完成後您可對服務人員寫評價。評價必須基於真實經歷。如有辱罵、洩露他人隱私或惡意評價，我們可能刪除。服務人員有一次公開回覆機會。",
        "服務人員義務：服務人員必須保持身分、警察查核、必要的急救證和保險檔案有效。檔案失效將導致帳號暫停。服務人員承諾履行已確認的預約，不得引導客戶脫離平台交易。",
        "智慧財產權：SilverConnect 名稱、Logo、設計和平台程式碼屬 SilverConnect Pty Ltd。您提交的評價和照片授予我們非獨占性授權在平台展示；所有權仍歸您。",
        "責任：我們盡合理努力審核服務人員並營運平台，但無法保證服務人員的具體行為。任何單一事件，我方責任以您為該預約已支付的金額為上限；澳洲消費者法賦予的不可排除的更強權利除外。",
        "終止：您可隨時在「設定 → 隱私」中關閉帳號。如有違反本條款的情況，我們可暫停或關閉帳號；我們會告知原因並給予回應機會，但安全緊急情況除外。",
        "條款變更：重大變更將在此頁面發布，並提前 30 天透過信件通知活躍使用者。",
        "管轄法律：澳洲使用者 — 新南威爾斯州法律；美國使用者 — 德拉瓦州法律（德拉瓦州州法院與聯邦法院）；加拿大使用者 — 安大略省法律。爭議由相應轄區法院管轄。",
        "聯絡：legal@silverconnect.com.au。",
      ],
      ja: [
        "最終更新：2026-05-10。SilverConnect でアカウントを作成またはサービスを予約することにより、本規約に同意したものとみなされます。同意されない場合は本プラットフォームをご利用にならないでください。",
        "当社について：SilverConnect は高齢者およびそのご家族と、審査を経た訪問サービススタッフをつなぐマーケットプレイスです。当社はスタッフの雇用主ではなく、スタッフは独立した事業者です。当社は審査（無犯罪証明、身元確認、必要な場合は応急処置認定）を行いますが、各サービスの契約はお客様とスタッフの間で成立します。",
        "予約と決済：予約を確定すると、表示金額が Stripe を通じてお客様のカードに保留されます。サービス完了をお客様が確認した時点（または予定完了から48時間後の自動確定）でスタッフへ送金します。サービス開始の24時間前まで無料でキャンセルできます。それ以降のキャンセルでは、スタッフが空けていた時間への補償として50%の手数料が発生する場合があります。",
        "紛争：問題が発生した場合、サービス後14日以内に予約詳細ページから紛争を提起してください。当チームが証拠を確認し、7営業日以内に全額返金／一部返金／返金なしを決定します。両当事者に決定が通知されます。",
        "安全：嫌がらせ、窃盗、損害その他の安全事案が発生した場合は、ただちに安全報告を提出してください。当社は厳正に対応します — 信頼性のある報告はスタッフの停止または永久利用停止につながり、必要な場合は警察と連携します。",
        "レビュー：サービス完了後にスタッフを評価できます。レビューは正直で実際のサービスに基づいたものでなければなりません。誹謗中傷、他者の個人情報の含有、悪意のある投稿は削除する場合があります。スタッフは1度だけ公開で返信できます。",
        "スタッフの義務：身元確認書類、無犯罪証明、必要な応急処置認定、保険証券を有効な状態に保つ必要があります。書類失効はアカウント停止につながります。確定済みの予約を遵守し、プラットフォーム外への顧客誘導を行わないことを約束します。",
        "知的財産権：SilverConnect の名称、ロゴ、デザイン、プラットフォームコードは SilverConnect Pty Ltd に帰属します。お客様が投稿するレビュー・写真について、プラットフォームでの表示を目的とする非独占的ライセンスを当社に付与いただきます。所有権はお客様に残ります。",
        "責任：スタッフ審査およびプラットフォーム運営において合理的な注意を払いますが、スタッフの行動を保証することはできません。単一事案に対する当社の責任の上限は、当該予約に対してお客様が支払った合計額とします。ただしオーストラリア消費者法により排除できないより強い権利が与えられる場合を除きます。",
        "解除：「設定 → プライバシー」からいつでもアカウントを閉鎖できます。本規約に違反したアカウントは停止または閉鎖する場合があります。安全上の緊急対応が必要な場合を除き、理由をお伝えし、ご回答の機会を設けます。",
        "変更：重要な変更は本ページに掲載し、施行の30日前までにアクティブユーザーへメールで通知します。",
        "準拠法：AU のお客様 — ニューサウスウェールズ州法。US のお客様 — デラウェア州法（デラウェア州州裁判所および連邦裁判所）。CA のお客様 — オンタリオ州法。紛争は該当する管轄区域の裁判所で扱います。",
        "お問い合わせ：legal@silverconnect.com.au。",
      ],
      ko: [
        "최종 업데이트: 2026-05-10. SilverConnect에서 계정을 생성하거나 서비스를 예약하시면 본 약관에 동의하시는 것으로 간주돼요. 동의하지 않으시면 플랫폼을 이용하지 말아주세요.",
        "저희에 대해: SilverConnect는 어르신과 그 가족을 검증된 방문 서비스 도우미와 연결하는 마켓플레이스예요. 저희는 도우미의 고용주가 아니며, 도우미는 독립 사업자예요. 저희는 도우미를 심사(신원조회, 신원 확인, 필요시 응급처치 자격)하지만, 각 서비스의 계약은 사용자와 도우미 사이에서 체결돼요.",
        "예약 및 결제: 예약을 확정하시면 표시된 금액이 Stripe를 통해 카드에 보류돼요. 서비스 완료를 표시하시면(또는 예정 완료 48시간 후 자동 확정) 도우미에게 결제가 전달돼요. 서비스 시작 24시간 전까지는 무료로 취소할 수 있어요. 이후 취소 시 도우미가 비워둔 시간에 대한 보상으로 50% 수수료가 발생할 수 있어요.",
        "분쟁: 문제가 발생하면 서비스 후 14일 이내에 예약 상세 페이지에서 분쟁을 제기해주세요. 저희 팀이 증거를 검토하고 7영업일 이내에 전액 환불 / 부분 환불 / 환불 불가를 결정해요. 양 당사자에게 결정이 통지돼요.",
        "안전: 괴롭힘, 절도, 손해 또는 기타 안전 사고를 겪으시면 즉시 안전 신고를 제출해주세요. 저희는 이를 심각하게 다뤄요 — 신뢰할 만한 신고는 도우미의 정지 또는 영구 이용정지로 이어지며, 필요시 경찰과 협력해요.",
        "리뷰: 서비스 완료 후 도우미에 대한 리뷰를 작성할 수 있어요. 리뷰는 정직하고 실제 서비스에 기반해야 해요. 폭언, 타인의 개인정보 포함, 악의적 게시는 삭제될 수 있어요. 도우미는 한 번 공개적으로 답변할 수 있어요.",
        "도우미의 의무: 신원, 신원조회, 필요한 응급처치 자격, 보험 서류를 유효하게 유지해야 해요. 서류가 만료되면 계정이 정지돼요. 확정된 예약을 이행하고 플랫폼 외에서 고객을 유치하지 않을 것을 약속해요.",
        "지식재산권: SilverConnect 이름, 로고, 디자인, 플랫폼 코드는 SilverConnect Pty Ltd에 속해요. 사용자가 제출하는 리뷰와 사진에 대해 플랫폼에서 표시할 수 있는 비독점적 라이선스를 부여하시며, 소유권은 사용자에게 남아요.",
        "책임: 저희는 도우미 심사와 플랫폼 운영에 합리적인 주의를 기울이지만 도우미의 행동을 보장할 수는 없어요. 단일 사고에 대한 저희의 최대 책임은 해당 예약에 대해 지불하신 총액으로 제한돼요. 호주 소비자법이 배제할 수 없는 더 강한 권리를 부여하는 경우는 예외예요.",
        "해지: 「설정 → 개인정보」에서 언제든 계정을 닫을 수 있어요. 본 약관을 위반한 계정은 정지 또는 폐쇄될 수 있어요. 안전상 즉각적인 조치가 필요한 경우를 제외하고는 이유를 알려드리고 답변할 기회를 드려요.",
        "변경: 중요한 변경 사항은 이 페이지에 게시하고, 시행 30일 전까지 활성 사용자에게 이메일로 알려드려요.",
        "준거법: AU 사용자 — 뉴사우스웨일스주 법. US 사용자 — 델라웨어주 법(델라웨어주 주법원 및 연방법원). CA 사용자 — 온타리오주 법. 분쟁은 해당 관할 법원에서 다뤄져요.",
        "문의: legal@silverconnect.com.au.",
      ],
    },
    updated: "2026-05-10",
  },
];

export function findArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
