import "server-only";
import { mockVendor } from "./vendors/mock";
import { nccVendor } from "./vendors/ncc";

/**
 * Vendor-agnostic background-check interface. The chosen vendor is National
 * Crime Check (NCC); `vendors/ncc.ts` holds the real adapter (stubbed until
 * we have NCC API credentials) and `vendors/mock.ts` simulates it for
 * end-to-end testing. Pick via env `BG_CHECK_VENDOR=mock|ncc`.
 */
export type BgCheckTriggerResult =
  | { ok: true; externalRef: string }
  | { ok: false; error: string };

export interface BgCheckWebhookEvent {
  /** Vendor's own event id, if any — used for webhook idempotency. */
  vendorEventId: string | null;
  externalRef: string | null;
  status: "pending" | "cleared" | "failed";
  clearedAt: Date | null;
  expiresAt: Date | null;
  /** Raw payload, stored for audit/debugging. */
  raw: unknown;
}

export interface BgCheckVendor {
  /** Vendor name as stored on provider_background_checks.vendor. */
  readonly name: string;
  /** Kick off a check; returns the vendor's reference id. */
  triggerCheck(input: {
    providerId: string;
    email: string;
    name: string | null;
  }): Promise<BgCheckTriggerResult>;
  /** Verify + parse an incoming webhook. Returns null if invalid/unrecognised. */
  verifyWebhook(rawBody: string, headers: Headers): Promise<BgCheckWebhookEvent | null>;
}

export function getBgCheckVendor(): BgCheckVendor {
  const name = (process.env.BG_CHECK_VENDOR ?? "mock").toLowerCase();
  return name === "ncc" ? nccVendor : mockVendor;
}
