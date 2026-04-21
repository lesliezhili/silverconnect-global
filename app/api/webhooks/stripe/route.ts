import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(request: NextRequest) {
  if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey || !stripeWebhookSecret || !stripe) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  try {
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    const body = await request.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;

        // Update booking status to CONFIRMED
        await supabase
          .from('bookings')
          .update({
            payment_status: 'PAID',
            status: 'CONFIRMED',
            stripe_payment_intent_id: paymentIntent.id,
          })
          .eq('id', bookingId);

        // Create payment transaction record
        await supabase.from('payment_transactions').insert({
          booking_id: bookingId,
          stripe_payment_intent_id: paymentIntent.id,
          amount: (paymentIntent.amount || 0) / 100, // Convert from cents
          currency: paymentIntent.currency.toUpperCase(),
          status: 'succeeded',
          customer_email: paymentIntent.receipt_email,
        });

        console.log('✅ Payment succeeded for booking:', bookingId);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata.bookingId;

        // Update booking status to FAILED
        await supabase
          .from('bookings')
          .update({
            payment_status: 'FAILED',
            stripe_payment_intent_id: paymentIntent.id,
          })
          .eq('id', bookingId);

        console.log('❌ Payment failed for booking:', bookingId);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;

        // Update payment transaction
        await supabase
          .from('payment_transactions')
          .update({ status: 'refunded' })
          .eq('stripe_payment_intent_id', charge.payment_intent);

        console.log('💰 Refund processed:', charge.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook failed' },
      { status: 400 }
    );
  }
}
