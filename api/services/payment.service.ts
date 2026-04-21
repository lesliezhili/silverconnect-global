import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

interface PaymentIntent {
  amount: number;
  currency: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

/**
 * Payment Service
 * Handles payment processing with Stripe
 */
export class PaymentService {
  /**
   * Create a payment intent
   */
  static async createPaymentIntent(payload: PaymentIntent) {
    const {
      amount,
      currency,
      customerEmail,
      metadata = {},
    } = payload;

    try {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        receipt_email: customerEmail,
        metadata,
      });

      return {
        clientSecret: intent.client_secret,
        id: intent.id,
      };
    } catch (error: any) {
      throw new Error(`Payment intent creation failed: ${error.message}`);
    }
  }

  /**
   * Retrieve payment intent
   */
  static async getPaymentIntent(intentId: string) {
    try {
      const intent = await stripe.paymentIntents.retrieve(intentId);
      return intent;
    } catch (error: any) {
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Confirm payment intent
   */
  static async confirmPaymentIntent(intentId: string) {
    try {
      const intent = await stripe.paymentIntents.confirm(intentId);
      return intent;
    } catch (error: any) {
      throw new Error(`Payment confirmation failed: ${error.message}`);
    }
  }

  /**
   * Create a refund
   */
  static async createRefund(paymentIntentId: string, amount?: number) {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return refund;
    } catch (error: any) {
      throw new Error(`Refund creation failed: ${error.message}`);
    }
  }

  /**
   * List payment methods for customer
   */
  static async getPaymentMethods(customerId: string) {
    try {
      const methods = await stripe.paymentMethods.list({
        customer: customerId,
      });

      return methods.data;
    } catch (error: any) {
      throw new Error(`Failed to retrieve payment methods: ${error.message}`);
    }
  }
}
