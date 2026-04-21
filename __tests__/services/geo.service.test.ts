/**
 * Unit Tests for Geo Service
 */

import { GeoService } from '@/api/services/geo.service';

describe('GeoService', () => {
  describe('getCountryData', () => {
    it('should return correct data for Australia', () => {
      const data = GeoService.getCountryData('AU');

      expect(data.country).toBe('Australia');
      expect(data.currency).toBe('AUD');
      expect(data.vat).toBe(10);
    });

    it('should return correct data for China', () => {
      const data = GeoService.getCountryData('CN');

      expect(data.country).toBe('China');
      expect(data.currency).toBe('CNY');
      expect(data.vat).toBe(0);
    });

    it('should return correct data for Canada', () => {
      const data = GeoService.getCountryData('CA');

      expect(data.country).toBe('Canada');
      expect(data.currency).toBe('CAD');
      expect(data.vat).toBe(13);
    });

    it('should throw error for unsupported country', () => {
      expect(() => {
        GeoService.getCountryData('INVALID');
      }).toThrow('Unsupported country');
    });
  });

  describe('calculatePriceWithTax', () => {
    it('should calculate Australian price with 10% GST', () => {
      const result = GeoService.calculatePriceWithTax(100, 'AU');

      expect(result.basePrice).toBe(100);
      expect(result.tax).toBe(10);
      expect(result.total).toBe(110);
      expect(result.taxRate).toBe(10);
    });

    it('should calculate Canadian price with 13% HST', () => {
      const result = GeoService.calculatePriceWithTax(100, 'CA');

      expect(result.basePrice).toBe(100);
      expect(result.tax).toBe(13);
      expect(result.total).toBe(113);
    });

    it('should calculate Chinese price with 0% VAT', () => {
      const result = GeoService.calculatePriceWithTax(100, 'CN');

      expect(result.basePrice).toBe(100);
      expect(result.tax).toBe(0);
      expect(result.total).toBe(100);
    });
  });

  describe('formatCurrency', () => {
    it('should format Australian currency', () => {
      const formatted = GeoService.formatCurrency(100, 'AU');

      expect(formatted).toContain('100');
      expect(formatted).toMatch(/\$/); // Contains $ symbol
    });

    it('should format Canadian currency', () => {
      const formatted = GeoService.formatCurrency(100, 'CA');

      expect(formatted).toContain('100');
      expect(formatted).toMatch(/\$/); // Contains $ symbol
    });
  });

  describe('getSupportedCountries', () => {
    it('should return list of supported countries', () => {
      const countries = GeoService.getSupportedCountries();

      expect(countries.length).toBe(3);
      expect(countries.map((c) => c.code)).toContain('AU');
      expect(countries.map((c) => c.code)).toContain('CN');
      expect(countries.map((c) => c.code)).toContain('CA');
    });
  });
});
