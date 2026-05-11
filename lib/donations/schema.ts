import { z } from "zod";

export const SUPPORTED_LOCALES = ["en", "zh-CN", "zh-TW", "ja", "ko"] as const;
export type DonateLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Min $1, max $50,000 in a single Checkout. Larger amounts route through
 * "contact us" copy on the form, never the API.
 */
export const MIN_AMOUNT_CENTS = 100;
export const MAX_AMOUNT_CENTS = 5_000_000;

const integerCents = z
  .number()
  .int("amountCents must be an integer (no decimals)")
  .min(MIN_AMOUNT_CENTS, `amountCents must be ≥ ${MIN_AMOUNT_CENTS}`)
  .max(MAX_AMOUNT_CENTS, `amountCents must be ≤ ${MAX_AMOUNT_CENTS}`);

const donor = z.object({
  name: z.string().trim().min(1, "name required").max(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("invalid email")
    .max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const donateRequestSchema = z.object({
  amountCents: integerCents,
  currency: z.literal("aud"),
  mode: z.enum(["once", "monthly"]),
  locale: z.enum(SUPPORTED_LOCALES),
  donor,
  isAnonymous: z.boolean().optional().default(false),
});

export type DonateRequest = z.infer<typeof donateRequestSchema>;
