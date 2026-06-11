import type { CountryCode } from "@/components/domain/country";
import type { PaymentProvider } from "./types";

export type { PaymentProvider, PaymentIntent, CreatePaymentParams, RefundParams } from "./types";

/**
 * Determine the payment provider for a given country.
 * CN = WeChat Pay (primary) + Alipay (secondary)
 * All others = Stripe
 */
export function getPaymentProvider(country: CountryCode): PaymentProvider {
  if (country === "CN") return "wechat_pay";
  return "stripe";
}

/**
 * Get available payment methods for a country.
 */
export function getPaymentMethods(country: CountryCode): PaymentProvider[] {
  if (country === "CN") return ["wechat_pay", "alipay"];
  return ["stripe"];
}

/**
 * Payment provider display names (localized).
 */
export const PROVIDER_LABELS: Record<PaymentProvider, { en: string; zh: string }> = {
  stripe: { en: "Credit/Debit Card", zh: "信用卡/借记卡" },
  wechat_pay: { en: "WeChat Pay", zh: "微信支付" },
  alipay: { en: "Alipay", zh: "支付宝" },
};
