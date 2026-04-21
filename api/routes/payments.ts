import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '../services/payment.service';

/**
 * POST /api/payments/intent
 * Create a payment intent
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, currency, customerEmail, metadata } = body;

    if (!amount || !currency) {
      return NextResponse.json(
        { error: 'Missing amount or currency' },
        { status: 400 }
      );
    }

    const intent = await PaymentService.createPaymentIntent({
      amount,
      currency,
      customerEmail,
      metadata,
    });

    return NextResponse.json(intent, { status: 201 });
  } catch (error: any) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/intent?intentId=xxx
 * Get payment intent details
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const intentId = searchParams.get('intentId');

    if (!intentId) {
      return NextResponse.json(
        { error: 'Missing intentId parameter' },
        { status: 400 }
      );
    }

    const intent = await PaymentService.getPaymentIntent(intentId);
    return NextResponse.json(intent);
  } catch (error: any) {
    console.error('Payment retrieval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve payment' },
      { status: 500 }
    );
  }
}
