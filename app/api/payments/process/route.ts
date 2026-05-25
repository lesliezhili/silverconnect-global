import { NextRequest, NextResponse } from "next/server";
import { ProcessBookingPayment, ReleaseEscrowOnCompletion } from "@/lib/services/payments";

export async function POST(req: NextRequest) {
  try {
    const {
      action,
      bookingId,
      customerId,
      providerId,
      totalAmount,
      platformFee,
      providerShare,
      escrowId,
      charityAllocation,
    } = await req.json();

    // Validate input
    if (!action || !bookingId) {
      return NextResponse.json(
        { error: "action and bookingId are required" },
        { status: 400 },
      );
    }

    let result;

    if (action === "process") {
      // Process payment and hold in escrow
      if (!customerId || !providerId || !totalAmount) {
        return NextResponse.json(
          { error: "customerId, providerId, and totalAmount are required for payment processing" },
          { status: 400 },
        );
      }

      result = await ProcessBookingPayment({
        bookingId,
        customerId,
        providerId,
        totalAmount,
        platformFee: platformFee || 0,
        providerShare: providerShare || 0,
      });
    } else if (action === "release") {
      // Release from escrow and disburse
      if (!escrowId || !providerId || !providerShare) {
        return NextResponse.json(
          { error: "escrowId, providerId, and providerShare are required for escrow release" },
          { status: 400 },
        );
      }

      result = await ReleaseEscrowOnCompletion({
        bookingId,
        escrowId,
        providerId,
        providerShare,
        platformFee: platformFee || 0,
        charityAllocation: charityAllocation || 0,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'process' or 'release'" },
        { status: 400 },
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || result.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: result.message,
        data: result.data,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/payments/process error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
