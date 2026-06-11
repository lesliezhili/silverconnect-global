/**
 * Alipay Open Platform adapter.
 *
 * Docs: https://opendocs.alipay.com/open/repo-0038oa
 *
 * Required env vars:
 *   ALIPAY_APP_ID           — 应用ID
 *   ALIPAY_PRIVATE_KEY      — 应用私钥 (RSA2)
 *   ALIPAY_PUBLIC_KEY       — 支付宝公钥 (for verification)
 *   ALIPAY_GATEWAY          — https://openapi.alipay.com/gateway.do (prod)
 */

import type { CreatePaymentParams, PaymentIntent } from "./types";

const ALIPAY_GATEWAY = process.env.ALIPAY_GATEWAY ?? "https://openapi.alipay.com/gateway.do";

export async function createAlipayPayment(params: CreatePaymentParams): Promise<PaymentIntent> {
  const outTradeNo = `SC_${params.bookingId}_${Date.now()}`;

  // alipay.trade.page.pay (PC) or alipay.trade.wap.pay (mobile)
  const bizContent = {
    out_trade_no: outTradeNo,
    total_amount: (params.amount / 100).toFixed(2), // Alipay uses yuan (元), not fen
    subject: params.description,
    product_code: "FAST_INSTANT_TRADE_PAY",
  };

  // TODO: Sign with RSA2 (SHA256WithRSA)
  // SDK: https://github.com/nicegoodcode/alipay-sdk-nodejs
  const redirectUrl = `${ALIPAY_GATEWAY}?app_id=${process.env.ALIPAY_APP_ID}&method=alipay.trade.page.pay&charset=utf-8&sign_type=RSA2&timestamp=${new Date().toISOString()}&version=1.0&biz_content=${encodeURIComponent(JSON.stringify(bizContent))}&notify_url=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL + "/api/webhooks/alipay")}&return_url=${encodeURIComponent(params.returnUrl ?? process.env.NEXT_PUBLIC_APP_URL + "/payment/success")}&sign=TODO`;

  return {
    id: outTradeNo,
    provider: "alipay",
    amount: params.amount,
    currency: "CNY",
    status: "pending",
    redirectUrl,
    createdAt: new Date(),
  };
}
