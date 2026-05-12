import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { notify } from "@/lib/notifications/server";
import { sendEmail } from "@/components/domain/email";

interface NotifyAdminsInput {
  title: string;
  body?: string;
  /** Deep link inside the app, e.g. /admin/providers/<id>. */
  link?: string;
}

/**
 * Fan out a notification to every admin user (in-app + email), plus a copy to
 * `COMPLIANCE_ALERT_EMAIL` if set (a plain ops mailbox not tied to a user
 * account). Failures are swallowed per-recipient so one bad address can't
 * break the caller — wrap in `after()` if you don't want it on the hot path.
 */
export async function notifyAdmins(input: NotifyAdminsInput): Promise<void> {
  const admins = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, "admin"));

  await Promise.allSettled(
    admins.map((a) =>
      notify({
        userId: a.id,
        kind: "system",
        title: input.title,
        body: input.body,
        link: input.link,
      }),
    ),
  );

  const opsEmail = process.env.COMPLIANCE_ALERT_EMAIL?.trim();
  const recipients = [
    ...new Set([...admins.map((a) => a.email), ...(opsEmail ? [opsEmail] : [])]),
  ];
  const text = input.body ? `${input.title}\n\n${input.body}` : input.title;
  await Promise.allSettled(
    recipients.map((to) =>
      sendEmail({ to, subject: input.title, text }).catch(() => {}),
    ),
  );
}
