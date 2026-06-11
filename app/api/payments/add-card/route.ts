import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentMethods } from "@/lib/db/schema/customer-data";
import { getCurrentUser } from "@/lib/auth/server";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/** POST /api/payments/add-card — saves a payment method (simulated Stripe for now) */
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { cardNumber, expMonth, expYear, cvc, setDefault } = await req.json();

    if (!cardNumber || !expMonth || !expYear || !cvc) {
      return NextResponse.json({ error: "All card fields required" }, { status: 400 });
    }

    // Detect brand from card number prefix
    const num = cardNumber.replace(/\s/g, "");
    let brand = "unknown";
    if (num.startsWith("4")) brand = "visa";
    else if (num.startsWith("5") || num.startsWith("2")) brand = "mastercard";
    else if (num.startsWith("3")) brand = "amex";

    const last4 = num.slice(-4);
    const pmId = `pm_sim_${randomUUID().replace(/-/g, "").slice(0, 24)}`;

    // If setting as default, unset other defaults
    if (setDefault) {
      await db.execute(
        db.update(paymentMethods).set({ isDefault: false }).where(eq(paymentMethods.userId, me.id)).getSQL()
      );
    }

    const [card] = await db.insert(paymentMethods).values({
      userId: me.id, stripePaymentMethodId: pmId,
      brand, last4, expMonth: Number(expMonth), expYear: Number(expYear),
      isDefault: setDefault ?? true,
    }).returning();

    return NextResponse.json({ success: true, id: card.id, brand, last4, expMonth, expYear });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
