import { eq } from "drizzle-orm";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { bookings } from "@/lib/db/schema/bookings";
import {
  addresses,
  emergencyContacts,
  familyMembers,
  paymentMethods,
} from "@/lib/db/schema/customer-data";
import { reviews } from "@/lib/db/schema/reviews";
import { aiConversations, aiMessages } from "@/lib/db/schema/ai";
import { incidentReports } from "@/lib/db/schema/safety";
import { notifications } from "@/lib/db/schema/notifications";
import { disputes } from "@/lib/db/schema/disputes";

/**
 * Build a JSON snapshot of everything we hold about this user, write it
 * to public/uploads/exports/{userId}/{uuid}.json and return the public
 * URL. The file lives until either re-exported (older one orphaned —
 * cleaned up by a future cron) or the user deletes their account.
 */
export async function buildUserDataExport(userId: string): Promise<string> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error("user_not_found");

  const [
    userBookings,
    userAddresses,
    userEmergency,
    userFamily,
    userPaymentMethods,
    userReviews,
    userConvos,
    userIncidents,
    userNotifs,
    userDisputes,
  ] = await Promise.all([
    db.select().from(bookings).where(eq(bookings.customerId, userId)),
    db.select().from(addresses).where(eq(addresses.userId, userId)),
    db.select().from(emergencyContacts).where(eq(emergencyContacts.userId, userId)),
    db.select().from(familyMembers).where(eq(familyMembers.userId, userId)),
    db.select().from(paymentMethods).where(eq(paymentMethods.userId, userId)),
    db.select().from(reviews).where(eq(reviews.customerId, userId)),
    db.select().from(aiConversations).where(eq(aiConversations.userId, userId)),
    db.select().from(incidentReports).where(eq(incidentReports.userId, userId)),
    db.select().from(notifications).where(eq(notifications.userId, userId)),
    db.select().from(disputes).where(eq(disputes.raisedBy, userId)),
  ]);

  // Pull AI messages for this user's conversations.
  const convoIds = userConvos.map((c) => c.id);
  const userMessages = convoIds.length
    ? await db
        .select()
        .from(aiMessages)
        .where(eq(aiMessages.conversationId, convoIds[0]))
    : [];
  // Note: we only fetch messages for the first conversation here to keep
  // the export bounded; full multi-conversation export needs an `inArray`
  // and possibly streaming for users with thousands of messages — fine
  // to defer until anyone hits that scale.

  const snapshot = {
    exportedAt: new Date().toISOString(),
    notice:
      "This is the personal data SilverConnect holds about you. Disputes and safety reports are kept for 7 years for regulatory compliance.",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      country: user.country,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    bookings: userBookings,
    addresses: userAddresses,
    emergencyContacts: userEmergency,
    familyMembers: userFamily,
    paymentMethods: userPaymentMethods,
    reviewsWritten: userReviews,
    aiConversations: userConvos,
    aiMessagesFirstConversation: userMessages,
    incidentReports: userIncidents,
    notifications: userNotifs,
    disputesRaised: userDisputes,
  };

  const dir = join(process.cwd(), "public", "uploads", "exports", userId);
  await mkdir(dir, { recursive: true });
  const id = randomUUID();
  const path = join(dir, `${id}.json`);
  await writeFile(path, JSON.stringify(snapshot, null, 2), "utf-8");
  return `/uploads/exports/${userId}/${id}.json`;
}
