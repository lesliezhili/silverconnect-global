import "server-only";
import type { BgCheckVendor } from "../background-check";

/**
 * National Crime Check (NCC) adapter — real API + webhook wiring goes here
 * once we have NCC API credentials (`BG_CHECK_API_KEY`,
 * `BG_CHECK_WEBHOOK_SECRET`). Until then `triggerCheck` returns an error so
 * a misconfigured `BG_CHECK_VENDOR=ncc` fails loudly instead of silently
 * behaving like the mock.
 */
export const nccVendor: BgCheckVendor = {
  name: "ncc",

  async triggerCheck() {
    if (!process.env.BG_CHECK_API_KEY) {
      return { ok: false, error: "NCC not configured (BG_CHECK_API_KEY missing)" };
    }
    // TODO: POST to NCC's order-creation endpoint with applicant details;
    // return their reference id as externalRef.
    return { ok: false, error: "NCC adapter not implemented yet" };
  },

  async verifyWebhook() {
    // TODO: verify the NCC webhook signature against BG_CHECK_WEBHOOK_SECRET,
    // map NCC status codes to pending|cleared|failed, extract expiry date.
    return null;
  },
};
