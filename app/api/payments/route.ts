import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin, getServerUserFromRequest } from '@/lib/supabase';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(req: NextRequest) {
  const user = await getServerUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { booking_id, amount, currency } = body;

  if (!booking_id || !amount || !currency) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get booking
  const { data: booking, error: bookingError } = await supabaseAdmin!
    .from('bookings')
    .select('*')
    .eq('id', booking_id)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  // Check if user is customer
  const { data: customer } = await supabaseAdmin!
    .from('customers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!customer || booking.customer_id !== customer.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let paymentIntentId: string | null = null;
  let status = 'pending';

  if (['AU', 'CA', 'US'].includes(booking.country_code) && stripe) {
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      metadata: { booking_id },
    });
    paymentIntentId = paymentIntent.id;
    status = paymentIntent.status;
  } else {
    // Stub for CN or no Stripe
    paymentIntentId = `stub_${Date.now()}`;
    status = 'succeeded'; // Assume success for stub
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabaseAdmin!
    .from('payments')
    .insert({
      booking_id,
      stripe_payment_intent_id: paymentIntentId,
      amount,
      currency,
      status,
    })
    .select()
    .single();

  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  return NextResponse.json({ payment, client_secret: stripe ? (await stripe.paymentIntents.retrieve(paymentIntentId!)).client_secret : null });
}
      booking_id: bookingId,
      stripe_payment_intent_id: paymentRecord.stripe_payment_intent_id,
      amount: paymentRecord.amount,
      currency: paymentRecord.currency,
      status: paymentRecord.status,
      payment_method: paymentRecord.payment_method,
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await supabaseAdmin
    .from('bookings')
    .update({ payment_status: 'PAID', status: 'CONFIRMED' })
    .eq('id', bookingId)

  return NextResponse.json({ success: true, transaction })
}
