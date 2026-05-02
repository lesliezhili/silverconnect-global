import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

export async function POST(request: NextRequest) {
  if (!stripe || !stripeWebhookSecret || !supabaseAdmin) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const payload = await request.text();

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.booking_id;

        if (bookingId) {
          // Update payment status
          await supabaseAdmin!
            .from('payments')
            .update({ status: 'succeeded' })
            .eq('stripe_payment_intent_id', paymentIntent.id);

          // Update booking status
          await supabaseAdmin!
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', bookingId);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const bookingId = paymentIntent.metadata?.booking_id;

        if (bookingId) {
          await supabaseAdmin!
            .from('payments')
            .update({ status: 'failed' })
            .eq('stripe_payment_intent_id', paymentIntent.id);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        // Create refund record
        const { data: payment } = await supabaseAdmin!
          .from('payments')
          .select('id, amount, currency')
          .eq('stripe_payment_intent_id', charge.payment_intent)
          .single();

        if (payment) {
          await supabaseAdmin!
            .from('refunds')
            .insert({
              payment_id: payment.id,
              stripe_refund_id: charge.refunds?.data?.[0]?.id || 'unknown',
              amount: (charge.amount_refunded || 0) / 100,
              currency: payment.currency,
              status: 'succeeded',
            });
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 400 }
    );
  }
}
