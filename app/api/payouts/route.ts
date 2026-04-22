import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const platformFeePercent = parseFloat(process.env.PLATFORM_FEE_PERCENT || '20'); // 20% platform fee

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(request: NextRequest) {
  if (!stripe || !supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        service_providers (
          id,
          full_name,
          stripe_connect_id
        ),
        payment_transactions (
          amount,
          currency
        )
      `)
      .eq('id', bookingId)
      .eq('status', 'COMPLETED')
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found or not completed' },
        { status: 404 }
      );
    }

    if (!booking.service_providers?.stripe_connect_id) {
      return NextResponse.json(
        { error: 'Provider does not have Stripe Connect account set up' },
        { status: 400 }
      );
    }

    // Check if payout already exists
    const { data: existingPayout } = await supabase
      .from('provider_payouts')
      .select('id')
      .eq('booking_id', bookingId)
      .single();

    if (existingPayout) {
      return NextResponse.json(
        { error: 'Payout already processed for this booking' },
        { status: 400 }
      );
    }

    const paymentAmount = booking.payment_transactions?.[0]?.amount || booking.total_price;
    const platformFee = Math.round(paymentAmount * (platformFeePercent / 100) * 100) / 100; // Round to 2 decimal places
    const payoutAmount = paymentAmount - platformFee;

    // Convert to cents for Stripe
    const payoutAmountCents = Math.round(payoutAmount * 100);

    if (payoutAmountCents < 50) { // Minimum payout is $0.50
      return NextResponse.json(
        { error: 'Payout amount too small after platform fees' },
        { status: 400 }
      );
    }

    // Create payout via Stripe Connect
    const payout = await stripe.payouts.create({
      amount: payoutAmountCents,
      currency: booking.payment_transactions?.[0]?.currency?.toLowerCase() || 'usd',
      destination: booking.service_providers.stripe_connect_id,
      description: `Payout for booking ${bookingId}`,
      metadata: {
        bookingId,
        providerId: booking.service_providers.id,
      },
    });

    // Record payout in database
    const { error: payoutError } = await supabase
      .from('provider_payouts')
      .insert({
        booking_id: bookingId,
        provider_id: booking.provider_id,
        amount: payoutAmount,
        platform_fee: platformFee,
        stripe_payout_id: payout.id,
        status: 'pending',
        currency: booking.payment_transactions?.[0]?.currency || 'USD',
      });

    if (payoutError) {
      console.error('Error recording payout:', payoutError);
      // Don't fail the request if database insert fails, but log it
    }

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        amount: payoutAmount,
        platformFee,
        status: payout.status,
      },
    });
  } catch (error) {
    console.error('Payout processing error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payout processing failed' },
      { status: 500 }
    );
  }
}