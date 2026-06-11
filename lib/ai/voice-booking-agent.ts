/**
 * Voice-First Booking AI Agent
 * Philosophy: "张爷爷说一句话，AI 自动完成下单" — one sentence books a service
 * 
 * Features:
 * - 6-language keyword NLU (no API key, local processing)
 * - Web Speech API (browser-native, free)
 * - TTS at 0.8x speed (elder-friendly)
 * - Auto urgency detection: <4h = emergency (50% surge), <24h = urgent (25%)
 */

export type ServiceCategory = 'domestic' | 'garden' | 'repair' | 'personal' | 'companion' | 'transport';
export type UrgencyLevel = 'normal' | 'urgent' | 'emergency';
export type BookingIntent = {
  category: ServiceCategory | null;
  service: string | null;
  date: Date | null;
  time: string | null;
  urgency: UrgencyLevel;
  confidence: number;
  rawTranscript: string;
  language: string;
};

// 6-language keyword mappings for service detection
const SERVICE_KEYWORDS: Record<string, Record<ServiceCategory, string[]>> = {
  en: {
    domestic: ['clean', 'cleaning', 'house', 'housework', 'tidy', 'vacuum', 'mop', 'laundry'],
    garden: ['garden', 'lawn', 'mow', 'trim', 'hedge', 'weed', 'plant', 'yard'],
    repair: ['fix', 'repair', 'broken', 'plumb', 'electric', 'handyman', 'install', 'paint'],
    personal: ['shower', 'bath', 'dress', 'medication', 'personal care', 'hygiene', 'groom'],
    companion: ['company', 'chat', 'walk', 'companion', 'visit', 'lonely', 'talk', 'friend'],
    transport: ['drive', 'ride', 'hospital', 'doctor', 'appointment', 'pickup', 'transport', 'shop'],
  },
  zh: {
    domestic: ['清洁', '打扫', '家务', '拖地', '吸尘', '洗衣', '擦窗', '整理'],
    garden: ['花园', '草坪', '修剪', '除草', '种植', '浇水', '园艺', '院子'],
    repair: ['修理', '维修', '坏了', '水管', '电工', '安装', '油漆', '换灯'],
    personal: ['洗澡', '穿衣', '吃药', '个人护理', '卫生', '梳洗', '协助'],
    companion: ['陪伴', '聊天', '散步', '看望', '作伴', '说话', '下棋', '看电视'],
    transport: ['接送', '医院', '看病', '买菜', '购物', '出行', '坐车', '去银行'],
  },
  th: {
    domestic: ['ทำความสะอาด', 'บ้าน', 'ถูพื้น', 'ซักผ้า', 'ดูดฝุ่น', 'เช็ด'],
    garden: ['สวน', 'ตัดหญ้า', 'ปลูก', 'รดน้ำ', 'ถอนวัชพืช'],
    repair: ['ซ่อม', 'แก้', 'พัง', 'ประปา', 'ไฟฟ้า', 'ติดตั้ง', 'ทาสี'],
    personal: ['อาบน้ำ', 'แต่งตัว', 'ยา', 'ดูแลตัวเอง', 'สุขอนามัย'],
    companion: ['เป็นเพื่อน', 'พูดคุย', 'เดินเล่น', 'เยี่ยม', 'คุย'],
    transport: ['รับส่ง', 'โรงพยาบาล', 'หมอ', 'ซื้อของ', 'เดินทาง'],
  },
  ko: {
    domestic: ['청소', '집', '걸레', '빨래', '진공', '정리'],
    garden: ['정원', '잔디', '가지치기', '잡초', '심기', '물주기'],
    repair: ['수리', '고치다', '고장', '배관', '전기', '설치', '페인트'],
    personal: ['목욕', '옷', '약', '개인케어', '위생', '돌봄'],
    companion: ['동행', '대화', '산책', '방문', '친구', '이야기'],
    transport: ['픽업', '병원', '의사', '쇼핑', '이동', '차'],
  },
  ja: {
    domestic: ['掃除', '清掃', '家事', '洗濯', '掃く', '拭く', '片付け'],
    garden: ['庭', '芝生', '剪定', '草取り', '水やり', '植える'],
    repair: ['修理', '直す', '壊れた', '水道', '電気', '取付', 'ペンキ'],
    personal: ['入浴', '着替え', '薬', '介護', '衛生', '身支度'],
    companion: ['付き添い', '話す', '散歩', '訪問', '友達', '囲碁'],
    transport: ['送迎', '病院', '医者', '買い物', '移動', '車'],
  },
  zh_tw: {
    domestic: ['清潔', '打掃', '家務', '拖地', '吸塵', '洗衣', '擦窗'],
    garden: ['花園', '草坪', '修剪', '除草', '種植', '澆水', '園藝'],
    repair: ['修理', '維修', '壞了', '水管', '電工', '安裝', '油漆'],
    personal: ['洗澡', '穿衣', '吃藥', '個人護理', '衛生', '梳洗'],
    companion: ['陪伴', '聊天', '散步', '看望', '作伴', '說話'],
    transport: ['接送', '醫院', '看病', '買菜', '購物', '出行'],
  },
};

// Time keywords for each language
const TIME_KEYWORDS: Record<string, Record<string, string>> = {
  en: { morning: '09:00', afternoon: '14:00', evening: '18:00', now: 'now', tonight: '19:00' },
  zh: { 上午: '09:00', 下午: '14:00', 晚上: '18:00', 现在: 'now', 早上: '08:00', 中午: '12:00' },
  th: { เช้า: '09:00', บ่าย: '14:00', เย็น: '18:00', ตอนนี้: 'now' },
  ko: { 아침: '09:00', 오후: '14:00', 저녁: '18:00', 지금: 'now' },
  ja: { 朝: '09:00', 午後: '14:00', 夕方: '18:00', 今: 'now' },
  zh_tw: { 上午: '09:00', 下午: '14:00', 晚上: '18:00', 現在: 'now', 早上: '08:00' },
};

// Date keywords
const DATE_KEYWORDS: Record<string, Record<string, number>> = {
  en: { today: 0, tomorrow: 1, 'day after': 2, 'next week': 7 },
  zh: { 今天: 0, 明天: 1, 后天: 2, 下周: 7 },
  th: { วันนี้: 0, พรุ่งนี้: 1, มะรืน: 2 },
  ko: { 오늘: 0, 내일: 1, 모레: 2 },
  ja: { 今日: 0, 明日: 1, 明後日: 2 },
  zh_tw: { 今天: 0, 明天: 1, 後天: 2, 下週: 7 },
};

/**
 * Parse natural language into booking intent
 * Zero API dependencies — pure keyword matching
 */
export function parseVoiceIntent(transcript: string, detectedLanguage?: string): BookingIntent {
  const text = transcript.toLowerCase().trim();
  const lang = detectedLanguage || detectLanguage(text);
  
  const intent: BookingIntent = {
    category: null,
    service: null,
    date: null,
    time: null,
    urgency: 'normal',
    confidence: 0,
    rawTranscript: transcript,
    language: lang,
  };

  // Detect service category
  const keywords = SERVICE_KEYWORDS[lang] || SERVICE_KEYWORDS.en;
  let maxMatches = 0;
  for (const [cat, words] of Object.entries(keywords)) {
    const matches = words.filter(w => text.includes(w)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      intent.category = cat as ServiceCategory;
    }
  }

  // Detect date
  const dateKw = DATE_KEYWORDS[lang] || DATE_KEYWORDS.en;
  for (const [word, daysOffset] of Object.entries(dateKw)) {
    if (text.includes(word)) {
      const d = new Date();
      d.setDate(d.getDate() + daysOffset);
      d.setHours(0, 0, 0, 0);
      intent.date = d;
      break;
    }
  }

  // Detect time
  const timeKw = TIME_KEYWORDS[lang] || TIME_KEYWORDS.en;
  for (const [word, timeVal] of Object.entries(timeKw)) {
    if (text.includes(word)) {
      intent.time = timeVal;
      break;
    }
  }

  // Calculate urgency based on requested time
  if (intent.date && intent.time) {
    const now = new Date();
    const requestedTime = new Date(intent.date);
    if (intent.time !== 'now') {
      const [h, m] = intent.time.split(':').map(Number);
      requestedTime.setHours(h, m);
    }
    const hoursUntil = (requestedTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntil < 4) intent.urgency = 'emergency';
    else if (hoursUntil < 24) intent.urgency = 'urgent';
  }

  // Calculate confidence
  let confidenceFactors = 0;
  if (intent.category) confidenceFactors++;
  if (intent.date) confidenceFactors++;
  if (intent.time) confidenceFactors++;
  intent.confidence = confidenceFactors / 3;

  return intent;
}

/**
 * Detect language from text using character ranges
 */
function detectLanguage(text: string): string {
  if (/[฀-๿]/.test(text)) return 'th';
  if (/[가-힯]/.test(text)) return 'ko';
  if (/[぀-ゟ゠-ヿ]/.test(text)) return 'ja';
  if (/[一-鿿]/.test(text)) {
    // Distinguish simplified vs traditional (heuristic)
    if (/[後從經過關點說們這進還時會對開過從]/.test(text)) return 'zh_tw';
    return 'zh';
  }
  return 'en';
}

/**
 * Generate confirmation message in user's language
 */
export function generateConfirmation(intent: BookingIntent): string {
  const messages: Record<string, (i: BookingIntent) => string> = {
    en: (i) => `I'll book ${i.category} service for ${i.date?.toLocaleDateString()} at ${i.time}. Confirm?`,
    zh: (i) => `好的，我为您预约${i.date?.toLocaleDateString('zh-CN')}${i.time}的${getCategoryName(i.category, 'zh')}服务。确认吗？`,
    th: (i) => `จองบริการ${getCategoryName(i.category, 'th')} วันที่ ${i.date?.toLocaleDateString('th')} เวลา ${i.time} ยืนยันไหม?`,
    ko: (i) => `${i.date?.toLocaleDateString('ko')} ${i.time}에 ${getCategoryName(i.category, 'ko')} 서비스를 예약할까요?`,
    ja: (i) => `${i.date?.toLocaleDateString('ja')}の${i.time}に${getCategoryName(i.category, 'ja')}サービスを予約します。よろしいですか？`,
    zh_tw: (i) => `好的，我為您預約${i.date?.toLocaleDateString('zh-TW')}${i.time}的${getCategoryName(i.category, 'zh_tw')}服務。確認嗎？`,
  };

  const fn = messages[intent.language] || messages.en;
  return fn(intent);
}

function getCategoryName(cat: ServiceCategory | null, lang: string): string {
  const names: Record<string, Record<ServiceCategory, string>> = {
    en: { domestic: 'cleaning', garden: 'garden', repair: 'repair', personal: 'personal care', companion: 'companionship', transport: 'transport' },
    zh: { domestic: '清洁', garden: '园艺', repair: '维修', personal: '个人护理', companion: '陪伴', transport: '接送' },
    th: { domestic: 'ทำความสะอาด', garden: 'จัดสวน', repair: 'ซ่อมแซม', personal: 'ดูแลส่วนบุคคล', companion: 'เป็นเพื่อน', transport: 'รับส่ง' },
    ko: { domestic: '청소', garden: '정원', repair: '수리', personal: '개인케어', companion: '동행', transport: '이동지원' },
    ja: { domestic: '清掃', garden: '庭園', repair: '修理', personal: '介護', companion: '付き添い', transport: '送迎' },
    zh_tw: { domestic: '清潔', garden: '園藝', repair: '維修', personal: '個人護理', companion: '陪伴', transport: '接送' },
  };
  if (!cat) return '';
  return (names[lang] || names.en)[cat] || cat;
}

/**
 * TTS configuration for elder-friendly speech
 */
export const TTS_CONFIG = {
  rate: 0.8,       // Slower than normal (1.0) for elderly comprehension
  pitch: 1.0,     // Normal pitch
  volume: 1.0,    // Full volume
  langMap: {
    en: 'en-AU',
    zh: 'zh-CN',
    zh_tw: 'zh-TW',
    th: 'th-TH',
    ko: 'ko-KR',
    ja: 'ja-JP',
  } as Record<string, string>,
};

/**
 * Voice booking session state machine
 */
export type VoiceSessionState = 'idle' | 'listening' | 'processing' | 'confirming' | 'booking' | 'complete' | 'error';

export interface VoiceSession {
  state: VoiceSessionState;
  intent: BookingIntent | null;
  transcript: string;
  confirmation: string;
  error: string | null;
  startedAt: Date | null;
}

export function createVoiceSession(): VoiceSession {
  return {
    state: 'idle',
    intent: null,
    transcript: '',
    confirmation: '',
    error: null,
    startedAt: null,
  };
}
