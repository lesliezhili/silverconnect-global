import "server-only";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema/notifications";

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
    // eslint-disable-next-line no-console
    console.error(
      "[notify] insert failed:",
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
    // eslint-disable-next-line no-console
    console.error(
      "[notifyMany] insert failed:",
      e instanceof Error ? e.message : String(e),
    );
  }
}
