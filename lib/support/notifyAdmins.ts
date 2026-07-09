import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { notifications } from "@/lib/db/schema/notifications";
import { eq } from "drizzle-orm";

/** Notifies every isAdmin=true user — used when a conversation needs a human reply. */
export async function notifyAdmins(params: {
  kind: "system" | "safety" | "dispute";
  title: string;
  body: string;
  link: string;
}): Promise<void> {
  const admins = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.isAdmin, true));

  if (admins.length === 0) return;

  await db.insert(notifications).values(
    admins.map((a) => ({
      userId: a.id,
      kind: params.kind as never,
      title: params.title,
      body: params.body,
      link: params.link,
    })),
  );
}
