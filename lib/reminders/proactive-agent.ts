/**
 * Proactive Reminder System
 * Philosophy: "2026年的养老AI不再是等老人提问，而是主动提醒"
 * AI anticipates needs, doesn't wait to be asked.
 * 
 * 12 reminder types with 4-level escalation chain
 */

export type ReminderType =
  | 'medication'
  | 'weather_dress'
  | 'weather_alert'
  | 'social_checkin'
  | 'safety_no_activity'
  | 'booking_reminder'
  | 'document_expiry'
  | 'ndis_plan_renewal'
  | 'hydration'
  | 'exercise'
  | 'birthday'
  | 'admin_notification';

export type EscalationLevel = 1 | 2 | 3 | 4;
export type DeliveryChannel = 'push' | 'sms' | 'voice' | 'email';
export type ReminderStatus = 'pending' | 'delivered' | 'acknowledged' | 'escalated' | 'expired';

export interface ReminderConfig {
  type: ReminderType;
  userId: string;
  scheduledAt: Date;
  content: Record<string, string>; // locale -> message
  voiceContent?: Record<string, string>; // locale -> voice script
  channel: DeliveryChannel;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recurringConfig?: RecurringConfig;
  quietHoursRespect: boolean;
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  times?: string[]; // HH:MM format
  daysOfWeek?: number[]; // 0=Sun, 6=Sat
  dayOfMonth?: number;
}

export interface EscalationChain {
  level: EscalationLevel;
  action: string;
  waitSeconds: number;
  channel: DeliveryChannel;
  target: 'user' | 'family' | 'emergency_contact' | 'emergency_services';
}

// 4-level escalation protocol
export const ESCALATION_CHAIN: EscalationChain[] = [
  { level: 1, action: 'notify_user', waitSeconds: 30, channel: 'push', target: 'user' },
  { level: 2, action: 'alert_family', waitSeconds: 120, channel: 'sms', target: 'family' },
  { level: 3, action: 'contact_emergency', waitSeconds: 30, channel: 'voice', target: 'emergency_contact' },
  { level: 4, action: 'call_emergency_services', waitSeconds: 0, channel: 'voice', target: 'emergency_services' },
];

// Emergency numbers by country
const EMERGENCY_NUMBERS: Record<string, string> = {
  AU: '000',
  CN: '110',
  CA: '911',
};

/**
 * Generate reminder content in 6 languages
 */
export function generateReminderContent(type: ReminderType, params: Record<string, string> = {}): Record<string, string> {
  const templates: Record<ReminderType, Record<string, string>> = {
    medication: {
      en: `Time to take your ${params.medication || 'medication'}. Stay healthy! 💊`,
      zh: `该吃${params.medication || '药'}了。保重身体！💊`,
      zh_tw: `該吃${params.medication || '藥'}了。保重身體！💊`,
      th: `ถึงเวลากิน${params.medication || 'ยา'}แล้ว ดูแลสุขภาพด้วยนะ 💊`,
      ko: `${params.medication || '약'} 드실 시간이에요. 건강하세요! 💊`,
      ja: `${params.medication || 'お薬'}の時間です。お体に気をつけて！💊`,
    },
    weather_dress: {
      en: `It's ${params.temp || 'cool'} outside today. ${params.advice || 'Bring a jacket!'} Don't forget your blood pressure medication.`,
      zh: `今天外面${params.temp || '有点凉'}。${params.advice || '出门要加件外套'}，别忘了吃降压药。`,
      zh_tw: `今天外面${params.temp || '有點涼'}。${params.advice || '出門要加件外套'}，別忘了吃降壓藥。`,
      th: `วันนี้ข้างนอก${params.temp || 'เย็น'} ${params.advice || 'อย่าลืมเสื้อแจ็คเก็ต'} อย่าลืมกินยาด้วยนะ`,
      ko: `오늘 밖이 ${params.temp || '쌀쌀'}해요. ${params.advice || '겉옷 챙기세요!'} 혈압약 드세요.`,
      ja: `今日は外が${params.temp || '涼しい'}です。${params.advice || '上着をお持ちください。'}血圧のお薬もお忘れなく。`,
    },
    weather_alert: {
      en: `⚠️ Weather warning: ${params.alert || 'Severe weather expected'}. Please stay indoors and stay safe.`,
      zh: `⚠️ 天气预警：${params.alert || '恶劣天气'}。请待在室内，注意安全。`,
      zh_tw: `⚠️ 天氣預警：${params.alert || '惡劣天氣'}。請待在室內，注意安全。`,
      th: `⚠️ เตือนภัยสภาพอากาศ: ${params.alert || 'สภาพอากาศรุนแรง'} กรุณาอยู่ในบ้าน`,
      ko: `⚠️ 기상특보: ${params.alert || '악천후 예상'}. 실내에 계세요.`,
      ja: `⚠️ 気象警報：${params.alert || '悪天候予報'}。室内にいてください。`,
    },
    social_checkin: {
      en: `Hi! Just checking in 😊 How are you feeling today? Tap to let us know you're well.`,
      zh: `你好！今天过得怎么样？😊 点一下让我们知道您一切都好。`,
      zh_tw: `你好！今天過得怎麼樣？😊 點一下讓我們知道您一切都好。`,
      th: `สวัสดี! มาเช็คอินนะ 😊 วันนี้เป็นอย่างไรบ้าง? แตะเพื่อให้เรารู้ว่าคุณสบายดี`,
      ko: `안녕하세요! 안부 확인이에요 😊 오늘 기분이 어떠세요?`,
      ja: `こんにちは！お元気ですか？😊 タップして無事をお知らせください。`,
    },
    safety_no_activity: {
      en: `We haven't detected any activity for a while. Are you okay? Please tap "I'm fine" or we'll check on you.`,
      zh: `有一段时间没检测到活动了。您还好吗？请点"我没事"，否则我们会联系您。`,
      zh_tw: `有一段時間沒偵測到活動了。您還好嗎？請點「我沒事」，否則我們會聯繫您。`,
      th: `ไม่ตรวจพบกิจกรรมมาสักพักแล้ว คุณสบายดีไหม? กรุณาแตะ "ฉันสบายดี"`,
      ko: `한동안 활동이 감지되지 않았어요. 괜찮으세요? "괜찮아요"를 눌러주세요.`,
      ja: `しばらく動きが確認できません。大丈夫ですか？「大丈夫です」をタップしてください。`,
    },
    booking_reminder: {
      en: `Reminder: Your ${params.service || 'service'} is ${params.when || 'coming up soon'}. ${params.carer || 'Your carer'} will arrive at ${params.time || 'the scheduled time'}.`,
      zh: `提醒：您的${params.service || '服务'}${params.when || '即将开始'}。${params.carer || '护理员'}将在${params.time || '预定时间'}到达。`,
      zh_tw: `提醒：您的${params.service || '服務'}${params.when || '即將開始'}。${params.carer || '護理員'}將在${params.time || '預定時間'}到達。`,
      th: `เตือน: ${params.service || 'บริการ'}ของคุณ${params.when || 'ใกล้ถึงแล้ว'} ${params.carer || 'ผู้ดูแล'}จะมาถึงเวลา ${params.time || 'ตามกำหนด'}`,
      ko: `알림: ${params.service || '서비스'}가 ${params.when || '곧 시작'}됩니다. ${params.carer || '케어러'}가 ${params.time || '예정 시간'}에 도착합니다.`,
      ja: `リマインダー：${params.service || 'サービス'}が${params.when || 'もうすぐ'}です。${params.carer || 'ケアラー'}が${params.time || '予定時刻'}に到着します。`,
    },
    document_expiry: {
      en: `Your ${params.document || 'document'} expires on ${params.date || 'soon'}. Please renew to continue providing services.`,
      zh: `您的${params.document || '证件'}将于${params.date || '近期'}到期。请及时续期。`,
      zh_tw: `您的${params.document || '證件'}將於${params.date || '近期'}到期。請及時續期。`,
      th: `${params.document || 'เอกสาร'}ของคุณจะหมดอายุ${params.date || 'เร็วๆนี้'} กรุณาต่ออายุ`,
      ko: `${params.document || '서류'}가 ${params.date || '곧'} 만료됩니다. 갱신해주세요.`,
      ja: `${params.document || '書類'}が${params.date || '間もなく'}期限切れです。更新してください。`,
    },
    ndis_plan_renewal: {
      en: `Your NDIS plan is due for renewal in ${params.days || '30'} days. Would you like help scheduling a plan review?`,
      zh: `您的NDIS计划将在${params.days || '30'}天后到期续期。需要帮您安排计划审核吗？`,
      zh_tw: `您的NDIS計畫將在${params.days || '30'}天後到期續期。需要幫您安排計畫審核嗎？`,
      th: `แผน NDIS ของคุณจะครบกำหนดต่ออายุใน ${params.days || '30'} วัน ต้องการช่วยนัดรีวิวแผนไหม?`,
      ko: `NDIS 플랜이 ${params.days || '30'}일 후 갱신 예정입니다.`,
      ja: `NDISプランが${params.days || '30'}日後に更新期限です。プランレビューの予約をお手伝いしましょうか？`,
    },
    hydration: {
      en: `💧 Time for a glass of water! Staying hydrated helps you feel your best.`,
      zh: `💧 该喝水了！保持水分有助于身体健康。`,
      zh_tw: `💧 該喝水了！保持水分有助於身體健康。`,
      th: `💧 ถึงเวลาดื่มน้ำแล้ว! การดื่มน้ำช่วยให้ร่างกายแข็งแรง`,
      ko: `💧 물 한잔 드세요! 수분 보충은 건강에 좋아요.`,
      ja: `💧 お水を飲む時間です！水分補給で元気に過ごしましょう。`,
    },
    exercise: {
      en: `🚶 Time for a gentle stretch or short walk. Even 5 minutes helps!`,
      zh: `🚶 该做做伸展运动或短距离散步了。即使5分钟也有帮助！`,
      zh_tw: `🚶 該做做伸展運動或短距離散步了。即使5分鐘也有幫助！`,
      th: `🚶 ถึงเวลายืดเส้นยืดสายหรือเดินสั้นๆ แม้แค่ 5 นาทีก็ช่วยได้!`,
      ko: `🚶 가벼운 스트레칭이나 산책 시간이에요. 5분이라도 좋아요!`,
      ja: `🚶 軽いストレッチや散歩の時間です。5分でも効果がありますよ！`,
    },
    birthday: {
      en: `🎂 It's ${params.name || 'someone special'}'s birthday today! Would you like to send a message?`,
      zh: `🎂 今天是${params.name || '特别的人'}的生日！要发送祝福吗？`,
      zh_tw: `🎂 今天是${params.name || '特別的人'}的生日！要發送祝福嗎？`,
      th: `🎂 วันนี้เป็นวันเกิดของ${params.name || 'คนพิเศษ'}! อยากส่งข้อความไหม?`,
      ko: `🎂 오늘 ${params.name || '소중한 분'}의 생일이에요! 축하 메시지를 보낼까요?`,
      ja: `🎂 今日は${params.name || '大切な方'}のお誕生日です！メッセージを送りますか？`,
    },
    admin_notification: {
      en: params.message || 'You have a new notification.',
      zh: params.message || '您有一条新通知。',
      zh_tw: params.message || '您有一條新通知。',
      th: params.message || 'คุณมีการแจ้งเตือนใหม่',
      ko: params.message || '새로운 알림이 있습니다.',
      ja: params.message || '新しいお知らせがあります。',
    },
  };

  return templates[type] || templates.admin_notification;
}

/**
 * Check if current time is within quiet hours
 */
export function isQuietHours(userTimezone: string, wakeTime: string = '07:00', sleepTime: string = '21:00'): boolean {
  const now = new Date();
  const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
  const hours = userTime.getHours();
  const minutes = userTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const [wakeH, wakeM] = wakeTime.split(':').map(Number);
  const [sleepH, sleepM] = sleepTime.split(':').map(Number);
  const wakeMinutes = wakeH * 60 + wakeM;
  const sleepMinutes = sleepH * 60 + sleepM;

  return currentMinutes < wakeMinutes || currentMinutes > sleepMinutes;
}

/**
 * Process due reminders — called by cron every 15 minutes
 */
export async function processReminders(db: any): Promise<{ processed: number; escalated: number; delivered: number }> {
  const now = new Date();
  let processed = 0, escalated = 0, delivered = 0;

  // Fetch pending reminders due now
  // In production: SELECT * FROM reminders WHERE scheduled_at <= now AND status = 'pending'
  const dueReminders = await db.query(`
    SELECT * FROM reminders 
    WHERE scheduled_at <= $1 AND status = 'pending'
    ORDER BY priority DESC, scheduled_at ASC
  `, [now]);

  for (const reminder of dueReminders?.rows || []) {
    processed++;

    // Check quiet hours (skip non-critical during quiet)
    if (reminder.quiet_hours_respect && reminder.priority !== 'critical') {
      if (isQuietHours(reminder.timezone || 'Australia/Sydney')) {
        continue; // Defer to next wake time
      }
    }

    // Deliver notification
    const success = await deliverReminder(reminder);
    if (success) {
      delivered++;
      await db.query(`UPDATE reminders SET status = 'delivered', delivered_at = $1 WHERE id = $2`, [now, reminder.id]);
    }
  }

  // Check for unacknowledged reminders needing escalation
  const unacked = await db.query(`
    SELECT * FROM reminders 
    WHERE status = 'delivered' 
    AND acknowledged_at IS NULL
    AND delivered_at < $1
    AND escalation_level < 4
  `, [new Date(now.getTime() - 30000)]); // 30s timeout

  for (const reminder of unacked?.rows || []) {
    const nextLevel = (reminder.escalation_level || 1) + 1 as EscalationLevel;
    const chain = ESCALATION_CHAIN.find(c => c.level === nextLevel);
    
    if (chain) {
      await escalateReminder(reminder, chain);
      escalated++;
      await db.query(`UPDATE reminders SET escalation_level = $1 WHERE id = $2`, [nextLevel, reminder.id]);
    }
  }

  return { processed, escalated, delivered };
}

async function deliverReminder(reminder: any): Promise<boolean> {
  // In production: integrate with push notification service, SMS gateway, voice call API
  console.log(`[Reminder] Delivering ${reminder.type} to user ${reminder.user_id} via ${reminder.channel}`);
  return true;
}

async function escalateReminder(reminder: any, chain: EscalationChain): Promise<void> {
  console.log(`[Escalation] Level ${chain.level}: ${chain.action} for reminder ${reminder.id}`);
  
  if (chain.level === 4) {
    // Auto-call emergency services
    const country = reminder.country || 'AU';
    const number = EMERGENCY_NUMBERS[country] || '000';
    console.log(`[EMERGENCY] Auto-calling ${number} for user ${reminder.user_id}`);
  }
}
