import "server-only";
import { sendEmail } from "@/components/domain/email";

interface ThanksInput {
  to: string;
  donorName: string;
  amountCents: number;
  currency: string;
  isMonthly: boolean;
  receiptUrl: string | null;
  locale: string;
}

function fmtAmount(cents: number, currency: string): string {
  // 2-decimal currency only — MVP scope. JPY/KRW would need a digit table.
  return `${currency.toUpperCase()} $${(cents / 100).toFixed(2)}`;
}

/**
 * Sends the SilverConnect thank-you email. Stripe also sends its own
 * receipt (configured in Dashboard "Customer emails"); this is the
 * branded follow-up. Wording deliberately avoids "tax-deductible"
 * until DGR registration is confirmed.
 */
export async function sendDonationThanks(input: ThanksInput): Promise<void> {
  const isZh = input.locale.startsWith("zh");
  const amountStr = fmtAmount(input.amountCents, input.currency);
  const recurStr = input.isMonthly
    ? isZh
      ? "（每月）"
      : " (monthly)"
    : "";

  const subject = isZh
    ? `感谢您的 ${amountStr}${recurStr} 捐款 💙`
    : `Thank you for your ${amountStr}${recurStr} donation 💙`;

  const greeting = isZh ? `亲爱的 ${input.donorName}` : `Dear ${input.donorName}`;
  const body = isZh
    ? `感谢您的善意捐款。您的每一笔捐款都将用于为独居与失能长者提供陪伴、健康监测与紧急响应服务。`
    : `Thank you for your generous donation. Every dollar goes toward companionship, health monitoring, and emergency response for older adults living alone.`;
  const receiptLine = input.receiptUrl
    ? isZh
      ? `\n\nStripe 收据：${input.receiptUrl}`
      : `\n\nStripe receipt: ${input.receiptUrl}`
    : "";
  const text = `${greeting}\n\n${body}${receiptLine}\n\n— SilverConnect`;

  const html = `<div style="font-family:system-ui,Helvetica,Arial,sans-serif;line-height:1.6;max-width:560px;margin:0 auto;padding:24px;color:#0F172A">
  <h2 style="margin:0 0 12px;font-size:20px;color:#1858C4">${subject}</h2>
  <p>${greeting},</p>
  <p>${body}</p>
  ${input.receiptUrl ? `<p><a href="${input.receiptUrl}" style="color:#1858C4">${isZh ? "查看 Stripe 收据" : "View Stripe receipt"}</a></p>` : ""}
  <hr style="margin:32px 0;border:none;border-top:1px solid #E2E8F0">
  <p style="font-size:12px;color:#64748B">SilverConnect — trusted home services for older adults.</p>
</div>`;

  const result = await sendEmail({ to: input.to, subject, text, html });
  if (!result.ok) {
    console.error("[donate/thanks-email]", result.reason);
  }
}
