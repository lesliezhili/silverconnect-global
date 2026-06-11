/**
 * SilverConnect Global — Billing Calculator
 * 
 * Standalone billing engine. Can be extracted into its own microservice.
 * Calculates total cost breakdown: base + tool fees + service charge + platform fee + tax
 */

import { BILLING_CONFIG, TOOL_FEES, PARKING_FEES, type CountryCode, type BillingConfig, type ToolFeeConfig, type ParkingFeeConfig } from "./config";

export interface LineItem {
  code: string;
  label: string;
  amount: number;
  type: "base" | "tool_fee" | "service_charge" | "platform_fee" | "tax" | "discount";
}

export interface InvoiceBreakdown {
  /** Service base price (provider rate × duration) */
  basePrice: number;
  /** Tool/material fees */
  toolFees: LineItem[];
  /** Subtotal before platform charges */
  subtotal: number;
  /** Service charge (insurance, support) */
  serviceCharge: number;
  /** Platform fee (SilverConnect commission) */
  platformFee: number;
  /** Tax (GST/VAT/HST) on subtotal + fees */
  taxAmount: number;
  /** Total customer pays */
  totalPrice: number;
  /** Amount provider receives (base + tool fees - platform commission) */
  providerPayout: number;
  /** Platform revenue (platform fee + service charge) */
  platformRevenue: number;
  /** Parking fee (pass-through, not commissionable) */
  parkingFee: number;
  /** Whether parking was capped at country max */
  parkingCapped: boolean;
  /** Currency code */
  currency: string;
  /** All line items for invoice display */
  lineItems: LineItem[];
}

export interface CalculateInput {
  country: CountryCode;
  categoryCode: string;
  basePrice: number;
  /** Which tool fees the customer opted into (by code) */
  selectedToolFees?: string[];
  /** Override platform fee rate (admin configurable) */
  platformFeeOverride?: number;
  /** Discount amount (e.g., promo code) */
  discountAmount?: number;
  /** Custom service charge override */
  serviceChargeOverride?: number;
  /** Provider-claimed parking fee (claimed after arrival, pass-through) */
  parkingFee?: number;
  /** Parking receipt URL (required if parkingFee > 0) */
  parkingReceiptUrl?: string;
}

/**
 * Calculate full invoice breakdown for a booking.
 */
export function calculateInvoice(input: CalculateInput): InvoiceBreakdown {
  const config = BILLING_CONFIG[input.country];
  const countryToolFees = TOOL_FEES[input.country] || [];

  const platformFeeRate = input.platformFeeOverride ?? config.platformFeeRate;
  const serviceChargeRate = input.serviceChargeOverride ?? config.serviceChargeRate;

  // Line items
  const lineItems: LineItem[] = [];

  // 1. Base service price
  lineItems.push({ code: "base_service", label: "Service Fee", amount: input.basePrice, type: "base" });

  // 2. Tool/material fees
  const toolFeeItems: LineItem[] = [];
  const applicableToolFees = countryToolFees.filter(
    (tf) => tf.categories.includes(input.categoryCode)
  );

  for (const tf of applicableToolFees) {
    // Include if: not optional, OR customer selected it
    const included = !tf.optional || (input.selectedToolFees?.includes(tf.code) ?? false);
    if (included) {
      const item: LineItem = { code: tf.code, label: tf.name, amount: tf.amount, type: "tool_fee" };
      toolFeeItems.push(item);
      lineItems.push(item);
    }
  }

  const toolFeesTotal = toolFeeItems.reduce((s, i) => s + i.amount, 0);

  // 3. Subtotal (base + tools)
  const subtotal = input.basePrice + toolFeesTotal;

  // 4. Service charge (on subtotal)
  const serviceCharge = +(subtotal * serviceChargeRate).toFixed(2);
  lineItems.push({ code: "service_charge", label: "Service Charge", amount: serviceCharge, type: "service_charge" });

  // 5. Platform fee (on base price only, capped)
  let platformFee = +(input.basePrice * platformFeeRate).toFixed(2);
  platformFee = Math.max(platformFee, config.minPlatformFee);
  if (config.maxPlatformFee > 0) {
    platformFee = Math.min(platformFee, config.maxPlatformFee);
  }
  lineItems.push({ code: "platform_fee", label: "Platform Fee", amount: platformFee, type: "platform_fee" });

  // 6. Discount
  const discount = input.discountAmount ?? 0;
  if (discount > 0) {
    lineItems.push({ code: "discount", label: "Discount", amount: -discount, type: "discount" });
  }

  // 6.5. Parking fee (pass-through, NOT commissionable)
  const parkingConfig = PARKING_FEES[input.country];
  let parkingFee = input.parkingFee ?? 0;
  let parkingCapped = false;
  if (parkingFee > parkingConfig.maxAmount) {
    parkingFee = parkingConfig.maxAmount;
    parkingCapped = true;
  }
  if (parkingFee > 0) {
    lineItems.push({ code: "parking_fee", label: "Parking Fee", amount: parkingFee, type: "base" });
  }

  // 7. Tax (on subtotal + service charge + platform fee - discount)
  const taxableAmount = subtotal + serviceCharge + platformFee + parkingFee - discount;
  const taxAmount = +(taxableAmount * config.taxRate).toFixed(2);
  if (taxAmount > 0) {
    lineItems.push({ code: "tax", label: "Tax", amount: taxAmount, type: "tax" });
  }

  // 8. Total
  const totalPrice = +(taxableAmount + taxAmount).toFixed(2);

  // 9. Provider payout (base + tool fees - platform commission on base)
  // Provider gets: base + tools + parking - platform commission (parking is pass-through)
  const providerPayout = +(input.basePrice + toolFeesTotal + parkingFee - platformFee).toFixed(2);

  // 10. Platform revenue
  const platformRevenue = +(platformFee + serviceCharge).toFixed(2);

  return {
    basePrice: input.basePrice,
    toolFees: toolFeeItems,
    subtotal,
    serviceCharge,
    platformFee,
    taxAmount,
    totalPrice,
    providerPayout,
    parkingFee,
    parkingCapped,
    platformRevenue,
    currency: config.currency,
    lineItems,
  };
}

/**
 * Get available tool fees for a service category in a country.
 */
export function getAvailableToolFees(country: CountryCode, categoryCode: string): ToolFeeConfig[] {
  return (TOOL_FEES[country] || []).filter((tf) => tf.categories.includes(categoryCode));
}

/**
 * Get billing config for a country (admin can override).
 */
export function getBillingConfig(country: CountryCode): BillingConfig {
  return BILLING_CONFIG[country];
}


/**
 * Get parking fee config for a country
 */
export function getParkingFeeConfig(country: CountryCode): ParkingFeeConfig {
  return PARKING_FEES[country];
}

/**
 * Validate a parking fee claim
 */
export function validateParkingClaim(
  country: CountryCode,
  amount: number,
  receiptUrl?: string
): { valid: boolean; error?: string; cappedAmount?: number } {
  const config = PARKING_FEES[country];

  if (amount <= 0) return { valid: true };

  if (config.requiresReceipt && !receiptUrl) {
    return { valid: false, error: "Please upload a photo of your parking receipt" };
  }

  if (amount > config.maxAmount) {
    return {
      valid: true,
      cappedAmount: config.maxAmount,
      error: `Parking capped at ${config.currency} ${config.maxAmount}`,
    };
  }

  return { valid: true };
}
