/**
 * Server-only SMTP send helper. Uses Gmail SMTP by default.
 *
 * Credentials are read from env (set in `/opt/silverconnect/.env.local` on
 * the VPS — never committed). The Gmail account must have an "App
 * password" generated under https://myaccount.google.com/apppasswords;
 * regular passwords no longer work for SMTP since 2022.
 *
 * Reads either the `EMAIL_*` (existing .env.example convention) or
 * `SMTP_*` (alternate) keys, prefering the former. Required env keys:
 *   EMAIL_HOST   (or SMTP_HOST)   = smtp.gmail.com
 *   EMAIL_PORT   (or SMTP_PORT)   = 587
 *   EMAIL_USER   (or SMTP_USER)   = xinxinsoft.cn@gmail.com
 *   EMAIL_PASSWORD (or SMTP_PASS) = <google app password, no spaces>
 *   EMAIL_FROM   (or SMTP_FROM)   = "SilverConnect <xinxinsoft.cn@gmail.com>"
 *
 * If any required field is missing, sendEmail() resolves to
 * { ok:false, reason:"smtp-not-configured" } so the caller can show a
 * graceful error instead of crashing.
 */
import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

const env = (...names: string[]) => {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim().length > 0) return v;
  }
  return undefined;
};

let cachedTransport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (cachedTransport) return cachedTransport;
  const host = env("EMAIL_HOST", "SMTP_HOST");
  const user = env("EMAIL_USER", "SMTP_USER");
  const pass = env("EMAIL_PASSWORD", "SMTP_PASS");
  if (!host || !user || !pass) return null;
  const port = Number(env("EMAIL_PORT", "SMTP_PORT") || 587);
  cachedTransport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransport;
}

export interface SendResult {
  ok: boolean;
  messageId?: string;
  reason?: string;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<SendResult> {
  const t = getTransport();
  if (!t) {
    return { ok: false, reason: "smtp-not-configured" };
  }
  const from =
    env("EMAIL_FROM", "SMTP_FROM") ||
    `SilverConnect <${env("EMAIL_USER", "SMTP_USER")}>`;
  try {
    const info = await t.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    const reason =
      err instanceof Error ? err.message : String(err);
    return { ok: false, reason };
  }
}

export function buildVerifyEmail(
  code: string,
  locale: string,
): { subject: string; text: string; html: string } {
  const isZh = locale === "zh";
  const subject = isZh
    ? `SilverConnect 验证码：${code}`
    : `SilverConnect verification code: ${code}`;
  const text = isZh
    ? `您的 SilverConnect 验证码是 ${code}。10 分钟内有效。如果不是您本人操作请忽略此邮件。`
    : `Your SilverConnect verification code is ${code}. It expires in 10 minutes. Ignore this email if you didn't request it.`;
  const html = isZh
    ? `<div style="font-family:system-ui,Helvetica,Arial,sans-serif;line-height:1.6">
<h2 style="margin:0 0 12px">SilverConnect 验证码</h2>
<p>您的验证码是：</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px;background:#E8F0FE;color:#1858C4;padding:12px 16px;border-radius:6px;display:inline-block;font-family:ui-monospace,monospace">${code}</p>
<p>10 分钟内有效。如果不是您本人操作，请忽略此邮件。</p>
</div>`
    : `<div style="font-family:system-ui,Helvetica,Arial,sans-serif;line-height:1.6">
<h2 style="margin:0 0 12px">Your verification code</h2>
<p>Use this code to finish signing in to SilverConnect:</p>
<p style="font-size:28px;font-weight:bold;letter-spacing:6px;background:#E8F0FE;color:#1858C4;padding:12px 16px;border-radius:6px;display:inline-block;font-family:ui-monospace,monospace">${code}</p>
<p>The code expires in 10 minutes. Ignore this email if you didn't request it.</p>
</div>`;
  return { subject, text, html };
}
