import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://silverconnect-global.vercel.app";

function html(title: string, body: string, cta?: string, label?: string): string {
  let s = "<!DOCTYPE html><html><body style=\"font-family:sans-serif;background:#f8faf9;padding:20px\">";
  s += "<div style=\"max-width:480px;margin:0 auto;background:white;border-radius:16px;overflow:hidden\">";
  s += "<div style=\"background:#065f46;padding:24px;text-align:center\"><h1 style=\"color:white;margin:0\">SilverConnect</h1></div>";
  s += "<div style=\"padding:32px 24px\"><h2>" + title + "</h2><div style=\"font-size:18px;line-height:1.6\">" + body + "</div>";
  if (cta) s += "<div style=\"text-align:center;margin:32px 0\"><a href=\"" + cta + "\" style=\"background:#059669;color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-size:20px;font-weight:bold;display:inline-block\">" + (label || "View") + "</a></div>";
  s += "</div></div></body></html>";
  return s;
}

export async function POST(req: NextRequest) {
  const { to, type, data: d } = await req.json();
  if (!to || !type) return NextResponse.json({ error: "to and type required" }, { status: 400 });

  let subject = ""; let body = "";
  switch (type) {
    case "booking_confirmed":
      subject = "Booking Confirmed"; body = html("Confirmed!", "<p>Hi " + (d?.name || "") + ", your booking is confirmed for " + (d?.time || "") + ".</p>", BASE + "/en/bookings/" + (d?.bookingId || ""), "View Booking"); break;
    case "service_started":
      subject = "Helper Arrived!"; body = html("Started", "<p>" + (d?.providerName || "Helper") + " has arrived.</p>", BASE + "/en/bookings/" + (d?.bookingId || ""), "Track"); break;
    case "service_completed":
      subject = "Service Complete"; body = html("Complete!", "<p>Please leave a review.</p>", BASE + "/en/bookings/" + (d?.bookingId || "") + "/review", "Review"); break;
    case "payment_released":
      subject = "Payment: " + (d?.amount || ""); body = html("Released!", "<p>Payment of " + (d?.amount || "") + " on the way.</p>", BASE + "/en/provider/earnings", "Earnings"); break;
    case "reminder":
      subject = "Service Tomorrow"; body = html("Reminder", "<p>Your service is scheduled for tomorrow.</p>", BASE + "/en/bookings/" + (d?.bookingId || ""), "View"); break;
    default: return NextResponse.json({ error: "Unknown: " + type }, { status: 400 });
  }

  if (process.env.SMTP_USER) {
    const nm = (await import("nodemailer")).default;
    const t = nm.createTransport({ host: process.env.SMTP_HOST || "smtp.ethereal.email", port: Number(process.env.SMTP_PORT || 587), auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || "" } });
    await t.sendMail({ from: process.env.EMAIL_FROM || "SilverConnect <hello@silverconnect.app>", to, subject, html: body });
    return NextResponse.json({ success: true, sent: true });
  }
  console.log("[email]", subject, "->", to);
  return NextResponse.json({ success: true, sent: false, reason: "SMTP not configured" });
}
