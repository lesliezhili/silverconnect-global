/**
 * Payment provider abstraction.
 * Routes to Stripe (AU/US/CA/SG/MY/HK/TW) or WeChat Pay + Alipay (CN).
 */

export type PaymentProvider = "stripe" | "wechat_pay" | "alipay";

export interface PaymentIntent {
  id: string;
  provider: PaymentProvider;
  amount: number;          // cents/fen
  currency: string;        // "AUD" | "CNY" etc.
  status: "pending" | "authorized" | "captured" | "failed" | "refunded";
  clientSecret?: string;   // Stripe client secret / WeChat prepay_id / Alipay trade_no
  qrCodeUrl?: string;      // WeChat NATIVE pay QR code URL
  redirectUrl?: string;    // Alipay redirect URL
  metadata?: Record<string, string>;
  createdAt: Date;
}

export interface CreatePaymentParams {
  amount: number;          // in smallest unit (cents/fen)
  currency: string;
  description: string;
  bookingId: string;
  customerEmail: string;
  provider: PaymentProvider;
  /** WeChat-specific: "JSAPI" | "NATIVE" | "H5" | "APP" */
  wechatTradeType?: "JSAPI" | "NATIVE" | "H5" | "APP";
  /** WeChat JSAPI: user openid */
  wechatOpenId?: string;
  returnUrl?: string;
}

export interface RefundParams {
  paymentId: string;
  amount: number;
  reason?: string;
}
