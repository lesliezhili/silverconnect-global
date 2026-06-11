import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/devotional/share?type=morning&lang=en&platform=whatsapp|wechat|sms|copy
 * Returns a shareable message formatted for the chosen platform.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") || "en";
  const type = searchParams.get("type") || undefined;
  const holiday = searchParams.get("holiday") || undefined;
  const platform = searchParams.get("platform") || "whatsapp";

  // Fetch devotional
  let url = req.nextUrl.origin + "/api/devotional?lang=" + lang;
  if (type) url += "&type=" + type;
  if (holiday) url += "&holiday=" + holiday;

  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) return NextResponse.json({ error: "Failed to get devotional" }, { status: 500 });

  const d = data.devotional;
  const isZh = lang === "zh";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://silverconnect-global.vercel.app";
  const devotionalUrl = appUrl + "/" + lang + "/devotional";

  // Format message
  let message: string;
  if (isZh) {
    message = [
      "\u271D " + d.title,
      "",
      "\ud83d\udcd6 " + d.reference,
      "\u300c" + d.scripture.substring(0, 120) + (d.scripture.length > 120 ? "...\u300d" : "\u300d"),
      "",
      "\ud83d\ude4f " + d.prayer.substring(0, 100) + "...",
      "",
      d.hymn ? "\ud83c\udfb5 " + d.hymn : "",
      "",
      "\u2014 SilverConnect \u548c\u6da6 \u6bcf\u65e5\u7075\u4fee",
      devotionalUrl,
    ].filter(Boolean).join("\n");
  } else {
    message = [
      "\u271D " + d.title,
      "",
      "\ud83d\udcd6 " + d.reference,
      "\u201c" + d.scripture.substring(0, 150) + (d.scripture.length > 150 ? "...\u201d" : "\u201d"),
      "",
      "\ud83d\ude4f " + d.prayer.substring(0, 120) + "...",
      "",
      d.hymn ? "\ud83c\udfb5 Hymn: " + d.hymn : "",
      "",
      "\u2014 SilverConnect Daily Devotional",
      devotionalUrl,
    ].filter(Boolean).join("\n");
  }

  // Platform-specific share links
  const encoded = encodeURIComponent(message);
  let shareUrl: string;
  switch (platform) {
    case "whatsapp":
      shareUrl = "https://wa.me/?text=" + encoded;
      break;
    case "wechat":
      // WeChat doesn't have a direct share URL — return message for copy
      shareUrl = "";
      break;
    case "sms":
      shareUrl = "sms:?body=" + encoded;
      break;
    case "telegram":
      shareUrl = "https://t.me/share/url?url=" + encodeURIComponent(devotionalUrl) + "&text=" + encoded;
      break;
    default:
      shareUrl = "";
  }

  return NextResponse.json({
    success: true,
    platform,
    message,
    shareUrl,
    devotionalUrl,
    title: d.title,
    // For Web Share API (native mobile sharing)
    webShare: {
      title: d.title,
      text: message,
      url: devotionalUrl,
    },
  });
}
