import "server-only";
import { randomUUID } from "node:crypto";
import { absoluteUrl } from "@/lib/donations/appUrl";
import type {
  BgCheckVendor,
  BgCheckWebhookEvent,
} from "../background-check";

/**
 * Dev/test stand-in for National Crime Check. `triggerCheck` returns a fake
 * reference and, after a short delay, self-POSTs a "cleared" webhook to our
 * own endpoint so the full provider onboarding flow can be exercised without
 * a real vendor account.
 *
 * NOTE: the delayed self-POST relies on a long-running server (the VPS runs
 * Node under PM2). On a serverless host the timer may be killed — fine for a
 * test helper; the provider can just re-trigger.
 */
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export const mockVendor: BgCheckVendor = {
  name: "mock",

  async triggerCheck() {
    const externalRef = `mock_${randomUUID()}`;
    void scheduleMockClearedWebhook(externalRef);
    return { ok: true, externalRef };
  },

  async verifyWebhook(rawBody: string): Promise<BgCheckWebhookEvent | null> {
    try {
      const j = JSON.parse(rawBody) as {
        externalRef?: string;
        status?: string;
        eventId?: string;
      };
      if (!j.externalRef || !j.status) return null;
      const status =
        j.status === "cleared" ? "cleared" : j.status === "failed" ? "failed" : "pending";
      return {
        vendorEventId: j.eventId ?? null,
        externalRef: j.externalRef,
        status,
        clearedAt: status === "cleared" ? new Date() : null,
        expiresAt: status === "cleared" ? new Date(Date.now() + ONE_YEAR_MS) : null,
        raw: j,
      };
    } catch {
      return null;
    }
  },
};

async function scheduleMockClearedWebhook(externalRef: string): Promise<void> {
  const delayMs = Number(process.env.BG_CHECK_MOCK_DELAY_MS ?? 3000);
  await new Promise((r) => setTimeout(r, Number.isFinite(delayMs) ? delayMs : 3000));
  try {
    await fetch(absoluteUrl("/api/compliance/background-check/webhook"), {
      method: "POST",
      headers: { "content-type": "application/json", "x-mock-bgcheck": "1" },
      body: JSON.stringify({
        externalRef,
        status: "cleared",
        eventId: `mockevt_${randomUUID()}`,
      }),
    });
  } catch {
    // Test helper — swallow. If it fails, the provider can re-trigger.
  }
}
