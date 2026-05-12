import { NextResponse, type NextRequest } from "next/server";
import { after } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  providerBackgroundChecks,
  complianceWebhookEvents,
  providerProfiles,
} from "@/lib/db/schema/providers";
import { getBgCheckVendor } from "@/lib/compliance/background-check";
import { tryAutoApproveProvider } from "@/lib/provider/autoApprove";
import { notify } from "@/lib/notifications/server";
import { notifyAdmins } from "@/lib/notifications/admins";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Background-check vendor webhook (National Crime Check, or the mock that
 * stands in for it). Verifies + parses the callback via the active vendor
 * adapter, records it in `complianceWebhookEvents` (dead-letter inbox),
 * updates the matching check row, and — on `cleared` — re-evaluates
 * auto-approval. Callbacks with no matching local row are kept as `orphaned`
 * for an admin to replay rather than dropped.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const raw = await req.text();
  const vendor = getBgCheckVendor();
  const evt = await vendor.verifyWebhook(raw, req.headers);
  if (!evt) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  // 1. Record the event (idempotent on vendorEventId when the vendor gives one).
  let eventRowId: string | null = null;
  if (evt.vendorEventId) {
    const inserted = await db
      .insert(complianceWebhookEvents)
      .values({
        vendor: vendor.name,
        vendorEventId: evt.vendorEventId,
        externalRef: evt.externalRef,
        payload: evt.raw,
        status: "received",
      })
      .onConflictDoNothing({
        target: [complianceWebhookEvents.vendor, complianceWebhookEvents.vendorEventId],
      })
      .returning({ id: complianceWebhookEvents.id });
    if (inserted.length === 0) {
      return NextResponse.json({ received: true, dedup: true });
    }
    eventRowId = inserted[0]!.id;
  } else {
    const [row] = await db
      .insert(complianceWebhookEvents)
      .values({
        vendor: vendor.name,
        externalRef: evt.externalRef,
        payload: evt.raw,
        status: "received",
      })
      .returning({ id: complianceWebhookEvents.id });
    eventRowId = row?.id ?? null;
  }

  // 2. Match the check row by external ref.
  const matched = evt.externalRef
    ? (
        await db
          .select({
            id: providerBackgroundChecks.id,
            providerId: providerBackgroundChecks.providerId,
          })
          .from(providerBackgroundChecks)
          .where(eq(providerBackgroundChecks.externalRef, evt.externalRef))
          .limit(1)
      )[0] ?? null
    : null;

  if (!matched) {
    if (eventRowId) {
      await db
        .update(complianceWebhookEvents)
        .set({
          status: "orphaned",
          error: "no matching background check row",
          processedAt: new Date(),
        })
        .where(eq(complianceWebhookEvents.id, eventRowId));
    }
    after(() =>
      notifyAdmins({
        title: "Orphan background-check webhook",
        body: `Received a "${evt.status}" callback (ref ${evt.externalRef ?? "?"}) with no matching check row. Replay from the provider's admin page once the row exists.`,
      }),
    );
    return NextResponse.json({ received: true, orphaned: true });
  }

  // 3. Apply the status update.
  try {
    await db
      .update(providerBackgroundChecks)
      .set({
        status: evt.status,
        clearedAt: evt.clearedAt,
        expiresAt: evt.expiresAt,
        rawPayload: evt.raw,
        ...(evt.status === "failed" ? { lastError: "vendor reported failed" } : {}),
        updatedAt: new Date(),
      })
      .where(eq(providerBackgroundChecks.id, matched.id));
    if (eventRowId) {
      await db
        .update(complianceWebhookEvents)
        .set({ status: "processed", processedAt: new Date() })
        .where(eq(complianceWebhookEvents.id, eventRowId));
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (eventRowId) {
      await db
        .update(complianceWebhookEvents)
        .set({ status: "failed", error: message, processedAt: new Date() })
        .where(eq(complianceWebhookEvents.id, eventRowId));
    }
    return NextResponse.json({ error: "handler_failed", message }, { status: 500 });
  }

  // 4. Side effects.
  const providerId = matched.providerId;
  if (evt.status === "cleared") {
    after(() => tryAutoApproveProvider(providerId));
  } else if (evt.status === "failed") {
    after(async () => {
      const [p] = await db
        .select({ userId: providerProfiles.userId })
        .from(providerProfiles)
        .where(eq(providerProfiles.id, providerId))
        .limit(1);
      if (p?.userId) {
        await notify({
          userId: p.userId,
          kind: "system",
          title: "Your background check needs attention",
          body: "We couldn't complete your background check. Please retry it from your application status page.",
          link: "/provider/onboarding-status",
        });
      }
      await notifyAdmins({
        title: "Provider background check failed",
        body: `Background check failed for provider ${providerId}.`,
        link: `/admin/providers/${providerId}`,
      });
    });
  }

  return NextResponse.json({ received: true });
}
