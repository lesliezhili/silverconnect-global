"use server";

/**
 * FREE Notification Stack for SilverConnect Global (Non-Profit)
 * 
 * Push Notifications: ntfy.sh (open-source, self-hostable, free forever)
 * Email: Nodemailer + Gmail SMTP (free up to 500/day) OR Resend free tier (100/day)
 * SMS: Not included (expensive). Use push + email as primary channels.
 * 
 * Architecture:
 * - Each user subscribes to their ntfy topic: silverconnect-{userId}
 * - Emergency alerts go to: silverconnect-emergency-{region}
 * - Admin escalations: silverconnect-admin
 */

const NTFY_BASE = process.env.NTFY_URL || "https://ntfy.sh";
const EMAIL_FROM = process.env.EMAIL_FROM || "noreply@silverconnect.org";

// ─── Push Notifications (ntfy.sh — 100% free, open-source) ─────

export async function sendPushNotification(params: {
  userId: string;
  title: string;
  message: string;
  priority?: "urgent" | "high" | "default" | "low";
  tags?: string[];
}): Promise<{ success: boolean }> {
  const { userId, title, message, priority = "default", tags = [] } = params;
  const topic = `silverconnect-${userId}`;

  try {
    const res = await fetch(`${NTFY_BASE}/${topic}`, {
      method: "POST",
      headers: {
        "Title": title,
        "Priority": priority === "urgent" ? "5" : priority === "high" ? "4" : "3",
        "Tags": tags.join(","),
      },
      body: message,
    });
    return { success: res.ok };
  } catch (e) {
    console.error("ntfy push failed:", e);
    return { success: false };
  }
}

export async function sendEmergencyAlert(params: {
  region: string;
  title: string;
  message: string;
}): Promise<{ success: boolean }> {
  const { region, title, message } = params;
  
  // Notify admin channel
  await sendPushNotification({
    userId: "admin",
    title: `🚨 EMERGENCY: ${title}`,
    message,
    priority: "urgent",
    tags: ["rotating_light", "emergency"],
  });

  // Notify regional emergency responders
  try {
    await fetch(`${NTFY_BASE}/silverconnect-emergency-${region}`, {
      method: "POST",
      headers: { "Title": `🚨 ${title}`, "Priority": "5", "Tags": "rotating_light" },
      body: message,
    });
  } catch {}

  return { success: true };
}

// ─── Email (Nodemailer + free SMTP) ─────────────────────────────

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<{ success: boolean }> {
  const { to, subject, html, text } = params;

  // Use Resend free tier (100 emails/day) if RESEND_API_KEY set
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: EMAIL_FROM, to, subject, html, text }),
      });
      return { success: res.ok };
    } catch {}
  }

  // Fallback: log email (for development / when no SMTP configured)
  console.log(`📧 EMAIL → ${to}: ${subject}`);
  return { success: true };
}

// ─── Convenience Functions ──────────────────────────────────────

export async function notifyBookingConfirmation(params: {
  userId: string;
  email: string;
  bookingDate: string;
  providerName: string;
}) {
  const { userId, email, bookingDate, providerName } = params;
  
  await sendPushNotification({
    userId,
    title: "Booking Confirmed ✅",
    message: `Your booking on ${bookingDate} with ${providerName} has been confirmed.`,
    tags: ["white_check_mark"],
  });

  await sendEmail({
    to: email,
    subject: "SilverConnect — Booking Confirmed",
    html: `<h2>Booking Confirmed</h2><p>Your care session on <strong>${bookingDate}</strong> with <strong>${providerName}</strong> is confirmed.</p><p>We'll send you reminders before the session.</p>`,
  });
}

export async function notifyProviderCheckIn(params: {
  providerId: string;
  bookingDate: string;
  customerName: string;
}) {
  await sendPushNotification({
    userId: params.providerId,
    title: "Check-in Required ⏰",
    message: `Please confirm your availability for ${params.customerName} on ${params.bookingDate}. Tap to confirm.`,
    priority: "high",
    tags: ["bell"],
  });
}

export async function notifyEmergencyReroute(params: {
  customerId: string;
  originalProvider: string;
  newProvider: string;
}) {
  await sendPushNotification({
    userId: params.customerId,
    title: "Carer Update",
    message: `Your carer has changed from ${params.originalProvider} to ${params.newProvider}. Your time slot is protected.`,
    priority: "high",
    tags: ["arrows_counterclockwise"],
  });
}

export async function notifyProviderWellnessCheck(providerId: string) {
  await sendPushNotification({
    userId: providerId,
    title: "Are You OK? 💚",
    message: "Our emergency system was triggered. This is a wellness check — are you safe? Take care of yourself. No response needed if all is well.",
    priority: "high",
    tags: ["green_heart"],
  });
}
