import { supabase } from './supabase'

export interface PaymentDetails {
  bookingId: string
  amount: number
  currency: string
  customerEmail: string
  paymentMethodId?: string
}

export interface PaymentResult {
  success: boolean
  paymentIntentId?: string
  clientSecret?: string
  error?: string
}

export async function processPayment(details: PaymentDetails): Promise<PaymentResult> {
  try {
    // Simulate Stripe payment processing
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const clientSecret = `${paymentIntentId}_secret_${Math.random().toString(36).substr(2, 9)}`

    // Record payment in database
    await supabase.from('payment_transactions').insert({
      booking_id: details.bookingId,
      stripe_payment_intent_id: paymentIntentId,
      amount: details.amount,
      currency: details.currency,
      status: 'succeeded',
      customer_email: details.customerEmail
    })

    await supabase
      .from('bookings')
      .update({ payment_status: 'PAID', status: 'CONFIRMED' })
      .eq('id', details.bookingId)

    return {
      success: true,
      paymentIntentId,
      clientSecret
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
}

export async function calculateProviderPayout(bookingId: string): Promise<number> {
  const { data: booking } = await supabase
    .from('bookings')
    .select('total_price')
    .eq('id', bookingId)
    .single()

  if (!booking) return 0

  const platformFeePercentage = 15
  const platformFee = booking.total_price * (platformFeePercentage / 100)
  return booking.total_price - platformFee
}

export async function releasePaymentToProvider(bookingId: string, providerId: string): Promise<boolean> {
  try {
    const payoutAmount = await calculateProviderPayout(bookingId)
    
    await supabase.from('provider_payouts').insert({
      booking_id: bookingId,
      provider_id: providerId,
      amount: payoutAmount,
      platform_fee: booking.total_price - payoutAmount,
      status: 'pending',
      currency: 'AUD'
    })

    return true
  } catch (error) {
    console.error('Error releasing payment:', error)
    return false
  }
}