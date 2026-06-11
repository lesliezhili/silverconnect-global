/**
 * SilverConnect Global — Billing Configuration
 * 
 * All fees are configurable per country and can be overridden per service category.
 * Designed as a standalone module deployable as a separate billing microservice.
 */

export type CountryCode = "AU" | "CN" | "CA" | "US" | "TW" | "SG" | "HK" | "MY";

export interface BillingConfig {
  /** Platform fee as decimal (0.15 = 15%). Revenue share for SilverConnect. */
  platformFeeRate: number;
  /** Service charge as decimal (0.05 = 5%). Covers insurance, support, safety checks. */
  serviceChargeRate: number;
  /** GST/VAT/tax rate as decimal */
  taxRate: number;
  /** Currency ISO code */
  currency: string;
  /** Minimum platform fee in local currency */
  minPlatformFee: number;
  /** Maximum platform fee cap in local currency (0 = no cap) */
  maxPlatformFee: number;
}

export interface ToolFeeConfig {
  /** Tool/material fee code */
  code: string;
  /** Display name */
  name: string;
  /** Fee amount in local currency */
  amount: number;
  /** Which service categories this applies to */
  categories: string[];
  /** Whether customer can opt-out */
  optional: boolean;
}

/** Default billing config per country */
export const BILLING_CONFIG: Record<CountryCode, BillingConfig> = {
  AU: { platformFeeRate: 0.15, serviceChargeRate: 0.05, taxRate: 0.10, currency: "AUD", minPlatformFee: 5, maxPlatformFee: 50 },
  CN: { platformFeeRate: 0.12, serviceChargeRate: 0.03, taxRate: 0.00, currency: "CNY", minPlatformFee: 10, maxPlatformFee: 200 },
  CA: { platformFeeRate: 0.15, serviceChargeRate: 0.05, taxRate: 0.13, currency: "CAD", minPlatformFee: 5, maxPlatformFee: 50 },
  US: { platformFeeRate: 0.15, serviceChargeRate: 0.05, taxRate: 0.0825, currency: "USD", minPlatformFee: 5, maxPlatformFee: 50 },
  TW: { platformFeeRate: 0.12, serviceChargeRate: 0.04, taxRate: 0.05, currency: "TWD", minPlatformFee: 50, maxPlatformFee: 500 },
  SG: { platformFeeRate: 0.15, serviceChargeRate: 0.05, taxRate: 0.09, currency: "SGD", minPlatformFee: 3, maxPlatformFee: 40 },
  HK: { platformFeeRate: 0.15, serviceChargeRate: 0.05, taxRate: 0.00, currency: "HKD", minPlatformFee: 20, maxPlatformFee: 200 },
  MY: { platformFeeRate: 0.12, serviceChargeRate: 0.04, taxRate: 0.06, currency: "MYR", minPlatformFee: 5, maxPlatformFee: 80 },
};

/** Tool/material fees per service category */
export const TOOL_FEES: Record<CountryCode, ToolFeeConfig[]> = {
  AU: [
    { code: "cleaning_materials", name: "Cleaning Supplies", amount: 15, categories: ["cleaning"], optional: true },
    { code: "garden_tools", name: "Gardening Tools & Fuel", amount: 20, categories: ["garden"], optional: true },
    { code: "repair_materials", name: "Basic Repair Materials", amount: 25, categories: ["repair"], optional: false },
    { code: "personal_care_supplies", name: "Personal Care Supplies", amount: 10, categories: ["personalCare"], optional: true },
  ],
  CN: [
    { code: "cleaning_materials", name: "清洁用品", amount: 30, categories: ["cleaning"], optional: true },
    { code: "garden_tools", name: "园艺工具", amount: 40, categories: ["garden"], optional: true },
    { code: "repair_materials", name: "维修材料", amount: 50, categories: ["repair"], optional: false },
    { code: "personal_care_supplies", name: "护理用品", amount: 20, categories: ["personalCare"], optional: true },
  ],
  CA: [
    { code: "cleaning_materials", name: "Cleaning Supplies", amount: 12, categories: ["cleaning"], optional: true },
    { code: "garden_tools", name: "Gardening Tools & Fuel", amount: 18, categories: ["garden"], optional: true },
    { code: "repair_materials", name: "Basic Repair Materials", amount: 22, categories: ["repair"], optional: false },
    { code: "personal_care_supplies", name: "Personal Care Supplies", amount: 8, categories: ["personalCare"], optional: true },
  ],
  US: [
    { code: "cleaning_materials", name: "Cleaning Supplies", amount: 12, categories: ["cleaning"], optional: true },
    { code: "garden_tools", name: "Gardening Tools & Fuel", amount: 18, categories: ["garden"], optional: true },
    { code: "repair_materials", name: "Basic Repair Materials", amount: 22, categories: ["repair"], optional: false },
    { code: "personal_care_supplies", name: "Personal Care Supplies", amount: 8, categories: ["personalCare"], optional: true },
  ],
  TW: [
    { code: "cleaning_materials", name: "清潔用品", amount: 150, categories: ["cleaning"], optional: true },
    { code: "garden_tools", name: "園藝工具", amount: 200, categories: ["garden"], optional: true },
    { code: "repair_materials", name: "維修材料", amount: 250, categories: ["repair"], optional: false },
  ],
  SG: [
    { code: "cleaning_materials", name: "Cleaning Supplies", amount: 10, categories: ["cleaning"], optional: true },
    { code: "garden_tools", name: "Gardening Tools", amount: 15, categories: ["garden"], optional: true },
    { code: "repair_materials", name: "Repair Materials", amount: 18, categories: ["repair"], optional: false },
  ],
  HK: [
    { code: "cleaning_materials", name: "清潔用品", amount: 60, categories: ["cleaning"], optional: true },
    { code: "garden_tools", name: "園藝工具", amount: 80, categories: ["garden"], optional: true },
    { code: "repair_materials", name: "維修材料", amount: 100, categories: ["repair"], optional: false },
  ],
  MY: [
    { code: "cleaning_materials", name: "Cleaning Supplies", amount: 15, categories: ["cleaning"], optional: true },
    { code: "garden_tools", name: "Gardening Tools", amount: 20, categories: ["garden"], optional: true },
    { code: "repair_materials", name: "Repair Materials", amount: 25, categories: ["repair"], optional: false },
  ],
};


// ──────────────────────────────────────────────
// NEW: PARKING FEE — Travel/Access fee (added 2026-05-27)
// ──────────────────────────────────────────────
// Provider claims AFTER arrival (not at booking time)
// Requires receipt upload for transparency
// Platform does NOT take commission on parking (pass-through)
// ──────────────────────────────────────────────
export interface ParkingFeeConfig {
  /** Maximum claimable parking fee in local currency */
  maxAmount: number;
  /** Currency code */
  currency: string;
  /** Whether receipt photo is required */
  requiresReceipt: boolean;
  /** Description for UI display */
  description: string;
}

export const PARKING_FEES: Record<CountryCode, ParkingFeeConfig> = {
  AU: { maxAmount: 20, currency: "AUD", requiresReceipt: true, description: "Street meter, visitor parking, or paid lot" },
  CN: { maxAmount: 20, currency: "CNY", requiresReceipt: true, description: "Underground or gated community parking" },
  CA: { maxAmount: 18, currency: "CAD", requiresReceipt: true, description: "Street meter or building parking" },
  US: { maxAmount: 15, currency: "USD", requiresReceipt: true, description: "Street meter or garage parking" },
  TW: { maxAmount: 100, currency: "TWD", requiresReceipt: true, description: "Parking lot or building garage" },
  SG: { maxAmount: 10, currency: "SGD", requiresReceipt: true, description: "HDB/condo visitor parking" },
  HK: { maxAmount: 30, currency: "HKD", requiresReceipt: true, description: "Building visitor parking" },
  MY: { maxAmount: 10, currency: "MYR", requiresReceipt: true, description: "Shopping mall or street parking" },
};
