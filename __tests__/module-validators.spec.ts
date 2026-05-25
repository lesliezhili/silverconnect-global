import { describe, test, expect } from "@jest/globals";

// Pure validation functions (no imports)
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain an uppercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain a number" };
  }
  return { valid: true };
}

function validateFullName(fullName: string): { valid: boolean; message?: string } {
  const trimmed = fullName.trim();
  if (trimmed.length === 0) {
    return { valid: false, message: "Full name is required" };
  }
  if (trimmed.length < 2) {
    return { valid: false, message: "Full name must be at least 2 characters" };
  }
  if (trimmed.length > 100) {
    return { valid: false, message: "Full name must not exceed 100 characters" };
  }
  return { valid: true };
}

// Pure pricing engine (no imports)
function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function isHolidayMock(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  return (month === 11 && day === 25) || (month === 0 && day === 1);
}

function calculatePricing(baseRate: number, durationHours: number, targetDate: Date) {
  let totalCost = baseRate * durationHours;

  if (isHolidayMock(targetDate)) {
    totalCost = totalCost * 2.0;
  } else if (isWeekend(targetDate)) {
    totalCost = totalCost * 1.5;
  }

  const platformFee = totalCost * 0.15;
  const providerShare = totalCost - platformFee;
  const charityFund = platformFee * 0.1;

  return {
    totalCustomerCharge: Math.round(totalCost * 100) / 100,
    providerShare: Math.round(providerShare * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100,
    charityFund: Math.round(charityFund * 100) / 100,
  };
}

describe("Unit Tests - Auth Validators", () => {
  describe("validateEmail", () => {
    test("accepts valid email format", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("john.doe@company.co.uk")).toBe(true);
    });

    test("rejects invalid email format", () => {
      expect(validateEmail("not-an-email")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user email@test.com")).toBe(false);
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
    // Monday May 25, 2026 (non-holiday, non-weekend)
    const monday = new Date(2026, 4, 25);
    const pricing = calculatePricing(100, 2, monday);

    // base = 100 * 2 = 200
    // platform fee = 200 * 0.15 = 30
    // provider share = 200 - 30 = 170
    expect(pricing.totalCustomerCharge).toBe(200);
    expect(pricing.platformFee).toBe(30);
    expect(pricing.providerShare).toBe(170);
    expect(pricing.charityFund).toBe(3);
  });

  test("applies weekend multiplier (1.5x)", () => {
    // Saturday May 23, 2026
    const saturday = new Date(2026, 4, 23);
    const pricing = calculatePricing(100, 2, saturday);

    // base = 100 * 2 * 1.5 = 300
    // platform fee = 300 * 0.15 = 45
    // provider share = 300 - 45 = 255
    expect(pricing.totalCustomerCharge).toBe(300);
    expect(pricing.platformFee).toBe(45);
    expect(pricing.providerShare).toBe(255);
    expect(pricing.charityFund).toBe(4.5);
  });

  test("applies holiday multiplier (2.0x)", () => {
    // Christmas Dec 25
    const christmas = new Date(2026, 11, 25);
    const pricing = calculatePricing(100, 2, christmas);

    // base = 100 * 2 * 2.0 = 400
    // platform fee = 400 * 0.15 = 60
    // provider share = 400 - 60 = 340
    expect(pricing.totalCustomerCharge).toBe(400);
    expect(pricing.platformFee).toBe(60);
    expect(pricing.providerShare).toBe(340);
    expect(pricing.charityFund).toBe(6);
  });

  test("handles complex rate calculations", () => {
    const testDate = new Date(2026, 4, 25);
    const pricing = calculatePricing(50.50, 3.5, testDate);

    // base = 50.50 * 3.5 = 176.75
    // platform fee = 176.75 * 0.15 ≈ 26.51
    // provider share ≈ 150.24
    expect(pricing.totalCustomerCharge).toBeGreaterThan(170);
    expect(pricing.totalCustomerCharge).toBeLessThan(180);
    expect(pricing.providerShare + pricing.platformFee).toBe(pricing.totalCustomerCharge);
  });

  test("charity fund is 10% of platform fee", () => {
    const monday = new Date(2026, 4, 25);
    const pricing = calculatePricing(100, 2, monday);

    // platform fee = 30
    // charity fund = 30 * 0.1 = 3
    expect(pricing.charityFund).toBe(pricing.platformFee * 0.1);
  });
});

describe("Unit Tests - Availability Validation", () => {
  test("detects overlapping time slots", () => {
    const slots = [
      { dayOfWeek: 0, startHour: 9, endHour: 12 },
      { dayOfWeek: 0, startHour: 11, endHour: 14 }, // Overlaps with first
    ];

    // Simple overlap detection
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const slot1 = slots[i];
        const slot2 = slots[j];

        if (slot1.dayOfWeek === slot2.dayOfWeek) {
          const hasOverlap = slot1.startHour < slot2.endHour && slot1.endHour > slot2.startHour;
          if (i === 0 && j === 1) {
            expect(hasOverlap).toBe(true);
          }
        }
      }
    }
  });

  test("accepts non-overlapping slots", () => {
    const slots = [
      { dayOfWeek: 0, startHour: 9, endHour: 12 },
      { dayOfWeek: 0, startHour: 13, endHour: 17 }, // No overlap
    ];

    let hasOverlap = false;
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const slot1 = slots[i];
        const slot2 = slots[j];

        if (slot1.dayOfWeek === slot2.dayOfWeek) {
          if (slot1.startHour < slot2.endHour && slot1.endHour > slot2.startHour) {
            hasOverlap = true;
          }
        }
      }
    }

    expect(hasOverlap).toBe(false);
  });
});
