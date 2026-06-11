import "server-only";

/**
 * Z.AI / Zhipu GLM client.
 *
 * docs: https://docs.z.ai/guides/overview/quick-start
 *
 * The international (overseas) endpoint is api.z.ai. The China endpoint
 * (open.bigmodel.cn) shares the same wire format but routes through a
 * different network. We default to api.z.ai per the configured key.
 */

const baseUrl = process.env.GLM_BASE_URL || "https://api.z.ai/api/paas/v4";
const apiKey = process.env.GLM_API_KEY;
const defaultModel = process.env.GLM_MODEL || "glm-4.5-flash";

export type Role = "system" | "user" | "assistant";
export interface ChatMessage {
  role: Role;
  content: string;
}

export interface ChatOptions {
  model?: string;
  /** Hard ceiling on completion tokens. */
  maxTokens?: number;
  /** 0..1; 0.6 is a reasonable default for elder-care customer service. */
  temperature?: number;
}

export interface ChatResult {
  ok: boolean;
  content?: string;
  reason?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

/** Plain (non-streaming) chat call. Returns assistant content or error. */
export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<ChatResult> {
  if (!apiKey) {
    return { ok: false, reason: "glm-not-configured" };
  }
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: opts.model || defaultModel,
        messages,
        max_tokens: opts.maxTokens ?? 800,
        temperature: opts.temperature ?? 0.6,
      }),
    });
  } catch (e) {
    return {
      ok: false,
      reason: e instanceof Error ? e.message : String(e),
    };
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, reason: `bad-json status=${res.status}` };
  }
  if (!res.ok) {
    const err = (data as { error?: { message?: string; code?: string } })?.error;
    return {
      ok: false,
      reason: err?.message || `http-${res.status}`,
    };
  }
  const choice = (
    data as {
      choices?: { message?: { content?: string } }[];
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    }
  ).choices?.[0]?.message?.content;
  const usage = (
    data as {
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    }
  ).usage;
  return {
    ok: true,
    content: choice ?? "",
    promptTokens: usage?.prompt_tokens,
    completionTokens: usage?.completion_tokens,
    totalTokens: usage?.total_tokens,
  };
}

/**
 * Lower-cased substring scan. Caller passes pre-loaded keyword list to
 * avoid coupling this module to the DB schema.
 */
export function detectEmergencyKeyword(
  text: string,
  keywords: string[],
): string | null {
  const haystack = text.toLowerCase();
  for (const kw of keywords) {
    const k = kw.trim().toLowerCase();
    if (k && haystack.includes(k)) return kw;
  }
  return null;
}
