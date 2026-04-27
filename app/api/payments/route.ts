// filepath: app/api/payments/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/payments - Get payment transactions
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const bookingId = searchParams.get('bookingId');
  
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let query = (await import('@/lib/supabase')).supabase
    .from('payment_transactions')
    .select(`
      *,
      bookings (
        id,
        booking_date,
        booking_time,
        services (name),
        service_providers (full_name)
      )
    `)
    .order('created_at', { ascending: false });

  // Check if user is a provider
  const { data: provider } = await (await import('@/lib/supabase')).supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (provider) {
    query = query.eq('provider_id', provider.id);
  } else {
    query = query.eq('user_id', user.id);
  }

  if (bookingId) {
    query = query.eq('booking_id', bookingId);
  }

  const { data: transactions, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ transactions: transactions || [] });
}

// POST /api/payments - Process payment (Stripe)
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { bookingId, paymentMethodId, amount } = body;

    if (!bookingId || !paymentMethodId || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get booking details
    const { data: booking, error: bookingError } = await (await import('@/lib/supabase')).supabase
      .from('bookings')
      .select('*, services (name), service_providers (id, full_name)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Verify ownership
    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // In production, use Stripe SDK to process payment
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100),
    //   currency: booking.country_code.toLowerCase(),
    //   customer: stripeCustomerId,
    //   payment_method: paymentMethodId,
    //   confirm: true,
    //   metadata: { bookingId }
    // });

    // Simulated payment processing
    const stripePaymentId = `pi_simulated_${Date.now()}`;

    // Create payment transaction record
    const { data: transaction, error } = await supabaseAdmin
      .from('payment_transactions')
      .insert({
        user_id: user.id,
        provider_id: booking.service_providers.id,
        booking_id: bookingId,
        stripe_payment_id: stripePaymentId,
        amount: amount,
        currency: booking.country_code === 'AU' ? 'AUD' : booking.country_code,
        status: 'COMPLETED',
        payment_method: 'card',
        escrow_status: 'held', // Hold in escrow until service is completed
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update booking payment status
    await supabaseAdmin
      .from('bookings')
      .update({ payment_status: 'PAID' })
      .eq('id', bookingId);

    return NextResponse.json({ success: true, transaction });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}