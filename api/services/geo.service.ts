import { supabase } from './auth.service';

interface GeoData {
  country: string;
  currency: string;
  locale: string;
  taxRate: number;
  vat: number;
  language: string;
}

/**
 * Geo Service
 * Handles country-specific data, pricing, and localization
 */
export class GeoService {
  private static geoData: Record<string, GeoData> = {
    AU: {
      country: 'Australia',
      currency: 'AUD',
      locale: 'en-AU',
      taxRate: 0.1, // 10% GST
      vat: 10,
      language: 'en',
    },
    CN: {
      country: 'China',
      currency: 'CNY',
      locale: 'zh-CN',
      taxRate: 0,
      vat: 0,
      language: 'zh',
    },
    CA: {
      country: 'Canada',
      currency: 'CAD',
      locale: 'en-CA',
      taxRate: 0.13, // 13% HST
      vat: 13,
      language: 'en',
    },
  };

  /**
   * Get country data
   */
  static getCountryData(countryCode: string): GeoData {
    const data = this.geoData[countryCode.toUpperCase()];
    if (!data) {
      throw new Error(`Unsupported country: ${countryCode}`);
    }
    return data;
  }

  /**
   * Get all supported countries
   */
  static getSupportedCountries() {
    return Object.entries(this.geoData).map(([code, data]) => ({
      code,
      ...data,
    }));
  }

  /**
   * Get service prices for country
   */
  static async getServicePrices(countryCode: string) {
    try {
      const { data, error } = await supabase
        .from('services_pricing')
        .select('*')
        .eq('country_code', countryCode.toUpperCase());

      if (error) throw error;
      return data;
    } catch (error: any) {
      throw new Error(`Failed to get service prices: ${error.message}`);
    }
  }

  /**
   * Calculate price with tax
   */
  static calculatePriceWithTax(
    basePrice: number,
    countryCode: string
  ): {
    basePrice: number;
    tax: number;
    total: number;
    taxRate: number;
  } {
    const geoData = this.getCountryData(countryCode);
    const tax = basePrice * geoData.taxRate;
    const total = basePrice + tax;

    return {
      basePrice,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      taxRate: geoData.vat,
    };
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number, countryCode: string): string {
    const geoData = this.getCountryData(countryCode);
    return new Intl.NumberFormat(geoData.locale, {
      style: 'currency',
      currency: geoData.currency,
    }).format(amount);
  }

  /**
   * Get exchange rates (mock implementation)
   */
  static async getExchangeRates(fromCurrency: string, toCurrency: string) {
    // In production, this would call an external API like exchangerate-api.com
    const rates: Record<string, Record<string, number>> = {
      AUD: { CNY: 4.8, CAD: 0.88, AUD: 1 },
      CNY: { AUD: 0.21, CAD: 0.18, CNY: 1 },
      CAD: { AUD: 1.14, CNY: 5.56, CAD: 1 },
    };

    return {
      from: fromCurrency,
      to: toCurrency,
      rate: rates[fromCurrency]?.[toCurrency] || 1,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Convert currency
   */
  static async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const exchange = await this.getExchangeRates(fromCurrency, toCurrency);
    return Math.round(amount * exchange.rate * 100) / 100;
  }
}
