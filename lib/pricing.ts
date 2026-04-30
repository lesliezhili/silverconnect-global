import { supabase } from './supabase'

export interface PricingRequest {
  serviceId: string
  countryCode: string
  providerId?: string
  date?: string
  startTime?: string
  duration?: number
}

export interface PricingResult {
  base_price: number
  price_with_tax: number
  tax_rate: number
  currency_symbol: string
  currency_code: string
  time_multiplier: number
  day_multiplier: number
  total_price: number
  platform_fee: number
  provider_payout: number
}

export async function calculateServicePrice(request: PricingRequest): Promise<PricingResult> {
  const { serviceId, countryCode, providerId, date, startTime } = request

  const { data: servicePrice } = await supabase
    .from('service_prices')
    .select('*, countries(*)')
    .eq('service_id', serviceId)
    .eq('country_code', countryCode)
    .single()

  if (!servicePrice) {
    throw new Error(`Pricing not found for service ${serviceId} in ${countryCode}`)
  }

  let finalPrice = servicePrice.base_price
  let timeMultiplier = 1.0
  let dayMultiplier = 1.0

  if (providerId) {
    const { data: providerPricing } = await supabase
      .from('provider_pricing')
      .select('custom_price')
      .eq('provider_id', providerId)
      .eq('service_id', serviceId)
      .eq('country_code', countryCode)
      .single()

    if (providerPricing?.custom_price) {
      finalPrice = providerPricing.custom_price
    }
  }

  if (date && startTime) {
    const hour = parseInt(startTime.split(':')[0])
    if (hour >= 21 || hour < 6) timeMultiplier = 1.5
    else if (hour >= 17 && hour < 21) timeMultiplier = 1.2
    else if (hour >= 6 && hour < 9) timeMultiplier = 1.1

    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) dayMultiplier = 1.2
  }

  const subtotal = finalPrice * timeMultiplier * dayMultiplier
  const taxRate = servicePrice.countries?.tax_rate || 0
  const totalPrice = subtotal * (1 + taxRate / 100)
  const platformFee = totalPrice * 0.15
  const providerPayout = totalPrice - platformFee

  return {
    base_price: finalPrice,
    price_with_tax: servicePrice.price_with_tax,
    tax_rate: taxRate,
    currency_symbol: servicePrice.countries?.currency_symbol || '$',
    currency_code: servicePrice.countries?.currency_code || 'AUD',
    time_multiplier: timeMultiplier,
    day_multiplier: dayMultiplier,
    total_price: totalPrice,
    platform_fee: platformFee,
    provider_payout: providerPayout
  }
}