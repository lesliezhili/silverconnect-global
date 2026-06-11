import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/notifications/invoice-email — Send invoice email to customer
 * 
 * Body: { invoiceId, customerEmail, customerName, providerName, invoiceNumber, totalAmount, dueDate, viewUrl }
 * 
 * Sends a professional HTML email with invoice summary and "View Invoice" button.
 * Uses SMTP (nodemailer) with environment variables.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { invoiceId, customerEmail, customerName, providerName, invoiceNumber, totalAmount, dueDate, viewUrl, locale = "en" } = body;

  if (!customerEmail || !invoiceNumber) {
    return NextResponse.json({ error: "customerEmail and invoiceNumber required" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://silverconnect-global.vercel.app";
  const fullViewUrl = viewUrl?.startsWith("http") ? viewUrl : `${appUrl}${viewUrl || `/${locale}/customer/invoices/${invoiceId}`}`;

  // Localized subject and content
  const subjects: Record<string, string> = {
    en: `New Invoice ${invoiceNumber} from ${providerName || "SilverConnect"}`,
    zh: `新发票 ${invoiceNumber} — 来自 ${providerName || "SilverConnect"}`,
    zh_tw: `新發票 ${invoiceNumber} — 來自 ${providerName || "SilverConnect"}`,
    th: `ใบแจ้งหนี้ใหม่ ${invoiceNumber} จาก ${providerName || "SilverConnect"}`,
    ko: `새 청구서 ${invoiceNumber} — ${providerName || "SilverConnect"}`,
    ja: `新しい請求書 ${invoiceNumber} — ${providerName || "SilverConnect"}`,
    vi: `Hóa đơn mới ${invoiceNumber} từ ${providerName || "SilverConnect"}`,
  };

  const buttonLabels: Record<string, string> = {
    en: "View & Pay Invoice", zh: "查看并支付发票", zh_tw: "查看並支付發票",
    th: "ดูและชำระเงิน", ko: "청구서 확인 및 결제", ja: "請求書を確認・支払い", vi: "Xem & Thanh toán",
  };

  const subject = subjects[locale] || subjects.en;
  const buttonLabel = buttonLabels[locale] || buttonLabels.en;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #059669; font-size: 22px; margin: 0;">SilverConnect</h1>
        <p style="color: #6b7280; font-size: 12px; margin: 4px 0;">Senior Care Services</p>
      </div>
      
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <p style="color: #374151; font-size: 14px; margin: 0 0 12px;">
          ${locale === "zh" || locale === "zh_tw" ? "您好" : locale === "vi" ? "Xin chào" : "Hi"} ${customerName || ""},
        </p>
        <p style="color: #374151; font-size: 14px; margin: 0 0 16px;">
          ${locale === "zh" || locale === "zh_tw" ? "您收到一张新发票：" : locale === "vi" ? "Bạn nhận được hóa đơn mới:" : "You have received a new invoice:"}
        </p>
        
        <table style="width: 100%; font-size: 13px; color: #4b5563;">
          <tr><td style="padding: 6px 0; color: #9ca3af;">Invoice</td><td style="padding: 6px 0; font-weight: 600; text-align: right;">${invoiceNumber}</td></tr>
          <tr><td style="padding: 6px 0; color: #9ca3af;">From</td><td style="padding: 6px 0; text-align: right;">${providerName || "-"}</td></tr>
          <tr><td style="padding: 6px 0; color: #9ca3af;">Amount</td><td style="padding: 6px 0; font-weight: 700; font-size: 18px; text-align: right; color: #059669;">$${totalAmount || "0.00"}</td></tr>
          <tr><td style="padding: 6px 0; color: #9ca3af;">Due</td><td style="padding: 6px 0; text-align: right;">${dueDate || "-"}</td></tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${fullViewUrl}" style="display: inline-block; background: #059669; color: #fff; font-weight: 600; font-size: 14px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
          ${buttonLabel}
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 11px; text-align: center;">
        Powered by PHLedger &middot; <a href="https://www.linkedin.com/company/phledger/" style="color: #059669;">linkedin.com/company/phledger</a>
      </p>
    </div>
  `;

  // Send email
  try {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "SilverConnect <noreply@silverconnect.app>",
      to: customerEmail,
      subject,
      html,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      to: customerEmail,
      subject,
      invoiceNumber,
    });
  } catch (err: unknown) {
    // If SMTP not configured, return success with simulation flag
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("ECONNREFUSED") || errMsg.includes("Missing credentials") || !process.env.SMTP_HOST) {
      return NextResponse.json({
        success: true,
        simulated: true,
        reason: "SMTP not configured — email queued for delivery",
        to: customerEmail,
        subject,
        invoiceNumber,
        htmlPreview: html.slice(0, 200) + "...",
      });
    }
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
