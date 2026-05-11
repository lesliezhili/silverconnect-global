import { NextResponse, type NextRequest } from "next/server";
import { donateRequestSchema } from "@/lib/donations/schema";
import {
  getActiveCampaign,
  createPendingDonation,
  attachSessionId,
} from "@/lib/donations/repository";
import { createCheckoutSession } from "@/lib/donations/stripe";
import { checkRateLimit, clientIp } from "@/lib/donations/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = clientIp(req.headers);
  const rl = checkRateLimit(`donate:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", message: "Too many requests" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Body must be JSON" },
      { status: 400 },
    );
  }

  const parsed = donateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const campaign = await getActiveCampaign();
  if (!campaign) {
    return NextResponse.json(
      { error: "no_active_campaign" },
      { status: 503 },
    );
  }

  try {
    const donation = await createPendingDonation({
      campaignId: campaign.id,
      amountCents: input.amountCents,
      currency: input.currency,
      mode: input.mode,
      locale: input.locale,
      donor: input.donor,
      isAnonymous: input.isAnonymous,
    });

    const { sessionId, url } = await createCheckoutSession({
      donationId: donation.id,
      campaignId: campaign.id,
      amountCents: input.amountCents,
      mode: input.mode,
      locale: input.locale,
      donorEmail: input.donor.email,
    });

    await attachSessionId(donation.id, sessionId);

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[donate/checkout]", message);
    return NextResponse.json(
      { error: "checkout_failed", message },
      { status: 500 },
    );
  }
}
