/**
 * WeChat Pay V3 API adapter.
 *
 * Docs: https://pay.weixin.qq.com/docs/merchant/apis/native-payment/direct/native-prepay.html
 *
 * Required env vars:
 *   WECHAT_PAY_MERCHANT_ID   — 商户号
 *   WECHAT_PAY_APP_ID        — 应用ID (公众号/小程序)
 *   WECHAT_PAY_SERIAL_NO     — 证书序列号
 *   WECHAT_PAY_PRIVATE_KEY   — API私钥 (PEM)
 *   WECHAT_PAY_API_V3_KEY    — APIv3密钥 (for decryption)
 */

import type { CreatePaymentParams, PaymentIntent } from "./types";

const WECHAT_PAY_BASE = "https://api.mch.weixin.qq.com/v3";

export async function createWechatPayment(params: CreatePaymentParams): Promise<PaymentIntent> {
  const merchantId = process.env.WECHAT_PAY_MERCHANT_ID!;
  const appId = process.env.WECHAT_PAY_APP_ID!;

  const tradeType = params.wechatTradeType ?? "NATIVE";
  const endpoint = tradeType === "NATIVE"
    ? `${WECHAT_PAY_BASE}/pay/transactions/native`
    : tradeType === "JSAPI"
    ? `${WECHAT_PAY_BASE}/pay/transactions/jsapi`
    : `${WECHAT_PAY_BASE}/pay/transactions/h5`;

  const body: Record<string, unknown> = {
    appid: appId,
    mchid: merchantId,
    description: params.description,
    out_trade_no: `SC_${params.bookingId}_${Date.now()}`,
    notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/wechat-pay`,
    amount: {
      total: params.amount, // in fen (分)
      currency: "CNY",
    },
  };

  if (tradeType === "JSAPI" && params.wechatOpenId) {
    body.payer = { openid: params.wechatOpenId };
  }

  // TODO: Sign request with merchant private key (RSA-SHA256)
  // See: https://pay.weixin.qq.com/docs/merchant/development/interface-rules/signature-generation.html
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `WECHATPAY2-SHA256-RSA2048 mchid="${merchantId}",nonce_str="TODO",timestamp="TODO",serial_no="${process.env.WECHAT_PAY_SERIAL_NO}",signature="TODO"`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return {
    id: body.out_trade_no as string,
    provider: "wechat_pay",
    amount: params.amount,
    currency: "CNY",
    status: "pending",
    qrCodeUrl: data.code_url,     // NATIVE pay: QR code URL
    clientSecret: data.prepay_id, // JSAPI: prepay_id for front-end
    createdAt: new Date(),
  };
}
