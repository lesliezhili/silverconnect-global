import { NextResponse } from "next/server";
import { calculateInvoice, getAvailableToolFees, type CalculateInput } from "@/lib/billing";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/calculate
 * Body: { country, categoryCode, basePrice, selectedToolFees?, platformFeeOverride?, discountAmount? }
 * Returns: full invoice breakdown
 */
export async function POST(req: Request) {
  try {
    const body: CalculateInput = await req.json();
    if (!body.country || !body.categoryCode || !body.basePrice) {
      return NextResponse.json({ error: "country, categoryCode, basePrice required" }, { status: 400 });
    }
    const invoice = calculateInvoice(body);
    return NextResponse.json(invoice);
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

/**
 * GET /api/billing/calculate?country=AU&category=cleaning
 * Returns: available tool fees for selection UI
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const country = (searchParams.get("country") || "AU") as any;
  const category = searchParams.get("category") || "cleaning";
  const toolFees = getAvailableToolFees(country, category);
  return NextResponse.json({ toolFees, country, category });
}
