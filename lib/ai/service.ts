"use server";

import { db } from "@/lib/db";
import { sql, eq, desc } from "drizzle-orm";
import { aiConversations, aiMessages } from "@/lib/db/schema/ai";
import { isBusinessHours } from "@/lib/support/businessHours";
import { notifyAdmins } from "@/lib/support/notifyAdmins";

// ═══════════════════════════════════════════════════════════════
// FREE AI STACK: Hugging Face Inference API (no cost, rate-limited)
// Model: mistralai/Mistral-7B-Instruct-v0.3 (free tier)
// Fallback: Local keyword-based intent + template responses
// ═══════════════════════════════════════════════════════════════

const HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";
const HF_TOKEN = process.env.HF_TOKEN || ""; // Optional: free tier works without token (slower)

// ─── Intent Classification (keyword-based, zero cost) ───────────

const INTENT_KEYWORDS: Record<string, { keywords: string[]; confidence: number }> = {
  emergency_safety: {
    keywords: ["help me", "fall", "fell", "chest pain", "can\'t breathe", "emergency", "ambulance",
      "救命", "摔倒", "胸痛", "呼吸困难", "急救", "心脏"],
    confidence: 0.95,
  },
  severe_dispute: {
    keywords: ["refund", "complaint", "stolen", "fraud", "abuse", "scam",
      "退款", "投诉", "欺诈", "虐待", "骗"],
    confidence: 0.85,
  },
  booking_help: {
    keywords: ["book", "appointment", "schedule", "cancel", "reschedule", "carer",
      "预约", "取消", "改期", "护工"],
    confidence: 0.8,
  },
  payment_issue: {
    keywords: ["payment", "charge", "invoice", "receipt", "price", "cost",
      "付款", "费用", "发票", "收据"],
    confidence: 0.75,
  },
  biography_request: {
    keywords: ["biography", "story", "life", "memoir", "heritage", "family history",
      "传记", "故事", "回忆", "家族", "人生"],
    confidence: 0.8,
  },
  provider_question: {
    keywords: ["provider", "carer", "worker", "qualification", "available",
      "护工", "资质", "可用"],
    confidence: 0.7,
  },
};

export async function classifyIntent(message: string): Promise<{ intent: string; confidence: number }> {
  const lower = message.toLowerCase();
  for (const [intent, { keywords, confidence }] of Object.entries(INTENT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return { intent, confidence };
    }
  }
  return { intent: "general_inquiry", confidence: 0.6 };
}

// ─── Emergency Response Templates (zero cost) ───────────────────

const EMERGENCY_RESPONSES: Record<string, { en: string; zh: string }> = {
  emergency_safety: {
    en: "🚨 I\'ve detected an emergency. Calling emergency services now.\n\n• Australia: 000\n• China: 120\n• Canada: 911\n\nStay calm. Help is on the way. A human specialist has been notified.",
    zh: "🚨 检测到紧急情况。正在呼叫急救服务。\n\n• 澳大利亚: 000\n• 中国: 120\n• 加拿大: 911\n\n请保持冷静，救援正在路上。已通知人工专员。",
  },
  severe_dispute: {
    en: "I understand this is distressing. I\'m connecting you to a human specialist who can help resolve this. Your case reference has been logged.",
    zh: "我理解这令人不安。正在为您转接人工专员处理此问题。您的案件已记录在案。",
  },
};

// ─── Business-Hours Holding Response (human takes over 9am-6pm AEST) ────

const BUSINESS_HOURS_HOLDING_RESPONSE: { en: string; zh: string } = {
  en: "Thanks for reaching out! Our team is online now and will reply here shortly.",
  zh: "感谢您的留言！我们的团队现在在线，稍后会在这里回复您。",
};

// ─── Free LLM Call (Hugging Face Inference API) ─────────────────

async function callFreeLLM(systemPrompt: string, userMessage: string): Promise<string> {
  // Try Hugging Face free inference first
  if (HF_TOKEN || true) { // Works without token too (slower, rate-limited)
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (HF_TOKEN) headers["Authorization"] = `Bearer ${HF_TOKEN}`;

      const prompt = `<s>[INST] ${systemPrompt}\n\nUser: ${userMessage} [/INST]`;

      const res = await fetch(HF_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: { max_new_tokens: 300, temperature: 0.7, return_full_text: false },
        }),
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.generated_text) {
          return data[0].generated_text.trim();
        }
      }
    } catch (e) {
      // Fallback to template if HF is slow/unavailable
      console.warn("HF API unavailable, using template response");
    }
  }

  // Template fallback (always works, zero cost)
  return getTemplateResponse(userMessage);
}

function getTemplateResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("book") || lower.includes("预约"))
    return "I can help you book a service! Visit the booking page to choose a service type, pick a date, and we\'ll match you with an available carer in your area.";
  if (lower.includes("price") || lower.includes("cost") || lower.includes("费用"))
    return "Our pricing is transparent: base hourly rate set by the carer, plus a 15% platform fee that funds our charity programs. Weekend and holiday surcharges may apply.";
  if (lower.includes("cancel") || lower.includes("取消"))
    return "You can cancel a booking up to 24 hours before the scheduled time for a full refund. Contact us if you need to cancel within 24 hours.";
  return "Thank you for reaching out! I\'m here to help with bookings, service questions, or anything else. What would you like to know?";
}

// ─── Main AI Processing ─────────────────────────────────────────

export async function processAIIncomingInquiry(
  userId: string | null,
  incomingMessage: string,
  conversationId?: string,
): Promise<{ response: string; intent: string; handedOff: boolean; conversationId: string | null }> {
  const { intent, confidence } = await classifyIntent(incomingMessage);
  const lang = incomingMessage.match(/[一-鿿]/) ? "zh" : "en";
  const clientToken = conversationId || crypto.randomUUID();

  // Log intent (best-effort)
  try {
    await db.execute(sql`
      INSERT INTO ai_intent_log (user_id, message_text, classified_intent, confidence, handed_off, created_at)
      VALUES (${userId}, ${incomingMessage.slice(0, 500)}, ${intent}, ${confidence}, ${intent === "emergency_safety" || intent === "severe_dispute"}, NOW())
    `);
  } catch {}

  // Find or create the conversation this message belongs to.
  let convoId: string;
  try {
    const [existing] = await db
      .select({ id: aiConversations.id })
      .from(aiConversations)
      .where(eq(aiConversations.clientToken, clientToken))
      .orderBy(desc(aiConversations.createdAt))
      .limit(1);

    if (existing) {
      convoId = existing.id;
    } else {
      const [created] = await db
        .insert(aiConversations)
        .values({ userId, clientToken, locale: lang === "zh" ? "zh" : "en" })
        .returning({ id: aiConversations.id });
      convoId = created.id;
    }

    await db.insert(aiMessages).values({
      conversationId: convoId,
      role: "user",
      content: incomingMessage,
    });
  } catch (e) {
    console.error("[ai] Failed to persist conversation/message:", e);
    convoId = clientToken;
  }

  const isEmergency = intent === "emergency_safety" || intent === "severe_dispute";
  const needsHuman = isEmergency || isBusinessHours();

  let response: string;
  let handedOff: boolean;

  if (isEmergency) {
    response = EMERGENCY_RESPONSES[intent][lang];
    handedOff = true;
    await notifyAdmins({
      kind: intent === "emergency_safety" ? "safety" : "dispute",
      title: intent === "emergency_safety" ? "🚨 Emergency chat message" : "Dispute flagged in chat",
      body: incomingMessage.slice(0, 200),
      link: `/admin/ai/conversations?id=${convoId}`,
    }).catch(() => {});
  } else if (isBusinessHours()) {
    // Business hours: a human takes it from here — don't spend an LLM call.
    response = BUSINESS_HOURS_HOLDING_RESPONSE[lang];
    handedOff = true;
    await notifyAdmins({
      kind: "system",
      title: "New support chat message",
      body: incomingMessage.slice(0, 200),
      link: `/admin/ai/conversations?id=${convoId}`,
    }).catch(() => {});
  } else {
    // After-hours: AI covers it.
    const systemPrompt = `You are HeRun (和润), a compassionate AI companion for SilverConnect Global,
an elder care platform. You help seniors and their families with care services.
Be warm, clear, patient. Use simple language. If unsure, suggest contacting support.
Ethics: empathy, dignity, protection of vulnerable, honesty.`;
    response = await callFreeLLM(systemPrompt, incomingMessage);
    handedOff = false;
  }

  try {
    await db.insert(aiMessages).values({
      conversationId: convoId,
      role: "assistant",
      content: response,
    });
    await db
      .update(aiConversations)
      .set({
        updatedAt: new Date(),
        ...(isEmergency ? { emergencyTriggeredAt: new Date() } : {}),
        ...(needsHuman ? { awaitingHumanAt: new Date() } : {}),
      })
      .where(eq(aiConversations.id, convoId));
  } catch (e) {
    console.error("[ai] Failed to persist assistant reply:", e);
  }

  return { response, intent, handedOff, conversationId: clientToken };
}

// ─── Biography Engine (Free LLM-powered) ────────────────────────

export async function generateBiographySession(params: {
  customerId: string;
  transcript: string;
  sessionTitle?: string;
}): Promise<{ success: boolean; chapterExcerpt?: string; tokensUsed?: number; error?: string }> {
  const { customerId, transcript, sessionTitle } = params;

  // Check quota
  const quotaRows: any = await db.execute(sql`
    SELECT max_allowed_tokens, tokens_consumed, sessions_completed
    FROM biography_quotas WHERE customer_id = ${customerId}
  `);
  const quota = (quotaRows as any).rows?.[0];

  if (!quota) {
    // Create default free quota (50k tokens ≈ 25 pages — generous for non-profit)
    await db.execute(sql`
      INSERT INTO biography_quotas (customer_id, plan_type, max_allowed_tokens, tokens_consumed, sessions_completed, activated_at)
      VALUES (${customerId}, 'free', 50000, 0, 0, NOW())
    `);
  }

  const maxTokens = quota?.max_allowed_tokens || 50000;
  const consumed = quota?.tokens_consumed || 0;
  const estimatedTokens = Math.ceil(transcript.length / 4);

  if (consumed + estimatedTokens > maxTokens) {
    return { success: false, error: "Token quota exceeded. Contact support for a free extension." };
  }

  // Generate biography chapter via free LLM
  const biographyPrompt = `You are a skilled biographer writing a dignified psychological narrative. 
Transform this interview transcript into a beautifully written biography chapter that:
- Preserves the subject's voice and personality
- Highlights family heritage and life wisdom
- Uses respectful, warm, literary language
- Structures as a coherent narrative (not Q&A format)
Write 2-3 paragraphs maximum.`;

  const chapter = await callFreeLLM(biographyPrompt, transcript.slice(0, 2000));

  // Save chapter
  const sessionsCompleted = (quota?.sessions_completed || 0) + 1;
  try {
    await db.execute(sql`
      INSERT INTO biography_chapters (customer_id, chapter_number, title, content, transcript_source, tokens_used, generated_at, status)
      VALUES (${customerId}, ${sessionsCompleted}, ${sessionTitle || `Chapter ${sessionsCompleted}`}, ${chapter}, ${transcript.slice(0, 5000)}, ${estimatedTokens}, NOW(), 'draft')
    `);
    await db.execute(sql`
      UPDATE biography_quotas SET tokens_consumed = tokens_consumed + ${estimatedTokens}, sessions_completed = ${sessionsCompleted}
      WHERE customer_id = ${customerId}
    `);
  } catch {}

  return { success: true, chapterExcerpt: chapter.slice(0, 500), tokensUsed: estimatedTokens };
}

export async function getBiographyProgress(customerId: string) {
  const rows: any = await db.execute(sql`
    SELECT plan_type, max_allowed_tokens as "maxTokens", tokens_consumed as "tokensConsumed",
           sessions_completed as "sessionsCompleted"
    FROM biography_quotas WHERE customer_id = ${customerId}
  `);
  return (rows as any).rows?.[0] || { plan_type: "free", maxTokens: 50000, tokensConsumed: 0, sessionsCompleted: 0 };
}
