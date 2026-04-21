import { supabase } from './supabase';

// Initialize Stripe Payment Intent
export const createPaymentIntent = async (
  bookingId: string,
  amount: number,
  currency: string = 'AUD',
  customerEmail: string
) => {
  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId,
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        customerEmail,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.clientSecret;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

// Update booking payment status
export const updateBookingPaymentStatus = async (
  bookingId: string,
  status: 'PAID' | 'UNPAID' | 'FAILED',
  stripePaymentIntentId: string
) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({
        payment_status: status,
        stripe_payment_intent_id: stripePaymentIntentId,
      })
      .eq('id', bookingId);

    if (error) throw error;

    // Log transaction
    await supabase.from('payment_transactions').insert({
      booking_id: bookingId,
      stripe_payment_intent_id: stripePaymentIntentId,
      status: status === 'PAID' ? 'succeeded' : status.toLowerCase(),
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Refund payment
export const refundPayment = async (stripePaymentIntentId: string) => {
  try {
    const response = await fetch('/api/refund-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId: stripePaymentIntentId,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Update transaction status
    await supabase
      .from('payment_transactions')
      .update({ status: 'refunded' })
      .eq('stripe_payment_intent_id', stripePaymentIntentId);

    return data;
  } catch (error) {
    console.error('Error refunding payment:', error);
    throw error;
  }
};
