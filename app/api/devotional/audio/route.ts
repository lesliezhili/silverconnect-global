import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/devotional/audio?type=morning&lang=en
 * Returns devotional text formatted for text-to-speech narration.
 * Client uses Web Speech API (SpeechSynthesis) — no server-side TTS cost.
 * Provides structured narration script with pauses.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") || "en";
  const type = searchParams.get("type") || undefined;
  const holiday = searchParams.get("holiday") || undefined;

  // Fetch devotional from the main endpoint
  let url = req.nextUrl.origin + "/api/devotional?lang=" + lang;
  if (type) url += "&type=" + type;
  if (holiday) url += "&holiday=" + holiday;

  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) return NextResponse.json({ error: "Failed to get devotional" }, { status: 500 });

  const d = data.devotional;

  // Build narration script with natural pauses (... = 1s pause in SSML-like format)
  const isZh = lang === "zh";
  const pause = "...";

  let script: string;
  if (isZh) {
    script = [
      d.title + "。",
      pause,
      "经文。来自" + d.reference + "。",
      pause,
      d.scripture,
      pause + pause,
      "祷告。",
      pause,
      d.prayer,
      pause + pause,
      "反思。",
      pause,
      d.reflection,
      d.hymn ? pause + "今日诗歌：" + d.hymn + "。" : "",
      pause,
      "愿上帝赐福你今天。阿们。",
    ].filter(Boolean).join(" ");
  } else {
    script = [
      d.title + ".",
      pause,
      "Scripture reading. From " + d.reference + ".",
      pause,
      d.scripture,
      pause + pause,
      "Let us pray.",
      pause,
      d.prayer,
      pause + pause,
      "A thought for reflection.",
      pause,
      d.reflection,
      d.hymn ? pause + "Today's suggested hymn: " + d.hymn + "." : "",
      pause,
      "May God bless you today. Amen.",
    ].filter(Boolean).join(" ");
  }

  return NextResponse.json({
    success: true,
    lang,
    title: d.title,
    script,
    // Speech synthesis config recommendations
    speechConfig: {
      lang: isZh ? "zh-CN" : "en-AU",
      rate: 0.85, // Slower for elderly listeners
      pitch: 1.0,
      volume: 1.0,
    },
    // Alternative: structured segments for more control
    segments: [
      { type: "heading", text: d.title, pause: 1500 },
      { type: "label", text: isZh ? "经文" : "Scripture", pause: 800 },
      { type: "reference", text: d.reference, pause: 500 },
      { type: "scripture", text: d.scripture, pause: 2000 },
      { type: "label", text: isZh ? "祷告" : "Prayer", pause: 1000 },
      { type: "prayer", text: d.prayer, pause: 2000 },
      { type: "label", text: isZh ? "反思" : "Reflection", pause: 1000 },
      { type: "reflection", text: d.reflection, pause: 1500 },
      ...(d.hymn ? [{ type: "hymn", text: (isZh ? "诗歌：" : "Hymn: ") + d.hymn, pause: 1000 }] : []),
      { type: "closing", text: isZh ? "愿上帝赐福你。阿们。" : "May God bless you. Amen.", pause: 0 },
    ],
  });
}
