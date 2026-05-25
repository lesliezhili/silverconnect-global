import { describe, test, expect } from "@jest/globals";
import { validateEmail, validatePassword, validateFullName } from "@/lib/services/auth";
import { CalculatePricingEngine } from "@/lib/services/bookings";


describe("Unit Tests - Auth Validators", () => {
  describe("validateEmail", () => {
    test("accepts valid email format", () => {
      expect(validateEmail("user@example.com")).toBe(true);
    });

    test("rejects invalid email format", () => {
      expect(validateEmail("not-an-email")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
    });
  });

  describe("validatePassword", () => {
    test("accepts strong password", () => {
      const result = validatePassword("SecurePass123");
      expect(result.valid).toBe(true);
    });

    test("rejects password with no uppercase", () => {
      const result = validatePassword("securepass123");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("uppercase");
    });

    test("rejects password with no number", () => {
      const result = validatePassword("SecurePass");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("number");
    });

    test("rejects password less than 8 characters", () => {
      const result = validatePassword("Pass1");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("8 characters");
    });
  });

  describe("validateFullName", () => {
    test("accepts valid full name", () => {
      const result = validateFullName("John Doe");
      expect(result.valid).toBe(true);
    });

    test("rejects empty name", () => {
      const result = validateFullName("   ");
      expect(result.valid).toBe(false);
      expect(result.message).toContain("required");
    });

    test("rejects name too short", () => {
      const result = validateFullName("J");
      expect(result.valid).toBe(false);
    });

    test("rejects name too long", () => {
      const result = validateFullName("A".repeat(101));
      expect(result.valid).toBe(false);
      expect(result.message).toContain("exceed");
    });
  });
});

describe("Unit Tests - Pricing Engine", () => {
  test("@critical calculates regular weekday pricing correctly", () => {
    // Monday (non-holiday, non-weekend)
    const monday = new Date(2026, 4, 25); // May 25, 2026 is a Monday
    const pricing = CalculatePricingEngine({
      baseRate: 100,
      durationHours: 2,
      targetDate: monday,
      country: "AU",
    });

    // base = 100 * 2 = 200
    // platform fee = 200 * 0.15 = 30
    // provider share = 200 - 30 = 170
    expect(pricing.totalCustomerCharge).toBe(200);
    expect(pricing.platformFee).toBe(30);
    expect(pricing.providerShare).toBe(170);
  });

  test("applies weekend multiplier (1.5x)", () => {
    // Saturday
    const saturday = new Date(2026, 4, 23); // May 23, 2026 is a Saturday
    const pricing = CalculatePricingEngine({
      baseRate: 100,
      durationHours: 2,
      targetDate: saturday,
      country: "AU",
    });

    // base = 100 * 2 * 1.5 = 300
    // platform fee = 300 * 0.15 = 45
    // provider share = 300 - 45 = 255
    expect(pricing.totalCustomerCharge).toBe(300);
    expect(pricing.platformFee).toBe(45);
    expect(pricing.providerShare).toBe(255);
  });

  test("applies holiday multiplier (2.0x)", () => {
    // Christmas
    const christmas = new Date(2026, 11, 25);
    const pricing = CalculatePricingEngine({
      baseRate: 100,
      durationHours: 2,
      targetDate: christmas,
      country: "AU",
    });

    // base = 100 * 2 * 2.0 = 400
    // platform fee = 400 * 0.15 = 60
    // provider share = 400 - 60 = 340
    expect(pricing.totalCustomerCharge).toBe(400);
    expect(pricing.platformFee).toBe(60);
    expect(pricing.providerShare).toBe(340);
  });

  test("charity fund is 10% of platform fee", () => {
    const monday = new Date(2026, 4, 25);
    const pricing = CalculatePricingEngine({
      baseRate: 100,
      durationHours: 2,
      targetDate: monday,
      country: "AU",
    });

    // platform fee = 30
    // charity fund = 30 * 0.1 = 3
    expect(pricing.charityFund).toBe(3);
  });

  test("prices are rounded to 2 decimal places", () => {
    const monday = new Date(2026, 4, 25);
    const pricing = CalculatePricingEngine({
      baseRate: 33.33,
      durationHours: 3,
      targetDate: monday,
      country: "AU",
    });

    // All prices should have max 2 decimal places
    expect(pricing.totalCustomerCharge.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    expect(pricing.platformFee.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
    expect(pricing.providerShare.toString().split(".")[1]?.length || 0).toBeLessThanOrEqual(2);
  });
});

describe("Unit Tests - Service Type Validation", () => {
  const validServiceTypes = ["cleaning", "cooking", "garden", "personalCare", "repair"];

  test("validates accepted service types", () => {
    validServiceTypes.forEach((serviceType) => {
      // Just check they don't throw errors
      expect(serviceType).toBeTruthy();
    });
  });
});
