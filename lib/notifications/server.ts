import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, notificationPrefs } from "@/lib/db/schema/notifications";
import { users } from "@/lib/db/schema/users";
import { sendEmail } from "@/components/domain/email";

type NotificationKind =
  | "booking_update"
  | "payment"
  | "dispute"
  | "safety"
  | "review"
  | "system"
  | "marketing";

export interface NotifyInput {
  userId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  link?: string;
  relatedBookingId?: string | null;
  relatedDisputeId?: string | null;
}

/**
 * Insert a single notification row. Failures are swallowed + logged so
 * a flaky notification path can never roll back the caller's
 * transaction. Caller usually wraps this in `after()` so the
 * notification doesn't add latency to the action's redirect.
 */
export async function notify(input: NotifyInput): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      relatedBookingId: input.relatedBookingId ?? null,
      relatedDisputeId: input.relatedDisputeId ?? null,
    });
  } catch (e) {
     
    console.error(
      "[notify] insert failed:",
      e instanceof Error ? e.message : String(e),
    );
  }
}

/**
 * Inserts the in-app notification AND sends an email if the user has
 * email notifications enabled for this kind. Email failure never
 * breaks the in-app insert. Caller should wrap in `after()` so the
 * SMTP round-trip doesn't block the redirect.
 */
export async function notifyAndEmail(
  input: NotifyInput & {
    email: { subject: string; text: string; html: string };
  },
): Promise<void> {
  await notify({
    userId: input.userId,
    kind: input.kind,
    title: input.title,
    body: input.body,
    link: input.link,
    relatedBookingId: input.relatedBookingId,
    relatedDisputeId: input.relatedDisputeId,
  });
  try {
    const [pref] = await db
      .select({ enabled: notificationPrefs.enabled })
      .from(notificationPrefs)
      .where(
        and(
          eq(notificationPrefs.userId, input.userId),
          eq(notificationPrefs.channel, "email"),
          eq(notificationPrefs.kind, input.kind),
        ),
      )
      .limit(1);
    if (pref && !pref.enabled) return;
    const [u] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, input.userId))
      .limit(1);
    if (!u?.email) return;
    await sendEmail({
      to: u.email,
      subject: input.email.subject,
      text: input.email.text,
      html: input.email.html,
    });
  } catch (e) {
     
    console.error(
      "[notifyAndEmail] email send failed:",
      e instanceof Error ? e.message : String(e),
    );
  }
}

/** Same shape, plural: insert N notifications best-effort. */
export async function notifyMany(inputs: NotifyInput[]): Promise<void> {
  if (inputs.length === 0) return;
  try {
    await db.insert(notifications).values(
      inputs.map((i) => ({
        userId: i.userId,
        kind: i.kind,
        title: i.title,
        body: i.body ?? null,
        link: i.link ?? null,
        relatedBookingId: i.relatedBookingId ?? null,
        relatedDisputeId: i.relatedDisputeId ?? null,
      })),
    );
  } catch (e) {
     
    console.error(
      "[notifyMany] insert failed:",
      e instanceof Error ? e.message : String(e),
    );
  }
}
