import { test, expect } from "@playwright/test";

const API_BASE = process.env.API_BASE || "http://localhost:3000/api";

test.describe("Module E2E Tests - Auth & User Profiles", () => {
  test("@critical SignUp with valid input creates user with default Customer role", async ({
    request,
  }) => {
    const response = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: "SecurePass123",
        fullName: "John Doe",
        selectedLanguage: "en",
        country: "AU",
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.message).toContain("successfully");
    expect(body.data?.userId).toBeDefined();
    expect(body.data?.email).toBeDefined();
    expect(body.data?.preferredLanguage).toBe("en");
  });

  test("SignUp with unsupported language falls back to English", async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: "SecurePass123",
        fullName: "Jane Smith",
        selectedLanguage: "fr",
        country: "AU",
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data?.preferredLanguage).toBe("en");
  });

  test("SignUp rejects duplicate email", async ({ request }) => {
    const email = `duplicate-${Date.now()}@example.com`;

    // First signup
    await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email,
        password: "SecurePass123",
        fullName: "First User",
        selectedLanguage: "en",
        country: "AU",
      },
    });

    // Attempt duplicate
    const response = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email,
        password: "SecurePass456",
        fullName: "Second User",
        selectedLanguage: "en",
        country: "AU",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("already registered");
  });

  test("SignUp rejects empty full name", async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: "SecurePass123",
        fullName: "   ",
        selectedLanguage: "en",
        country: "AU",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("required");
  });

  test("SignUp rejects weak password", async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: "weak",
        fullName: "Test User",
        selectedLanguage: "en",
        country: "AU",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.toLowerCase()).toContain("password");
  });

  test("SignUp rejects invalid email", async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email: "not-an-email",
        password: "SecurePass123",
        fullName: "Test User",
        selectedLanguage: "en",
        country: "AU",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.toLowerCase()).toContain("email");
  });

  test("@critical Role switch updates user's active role", async ({ request }) => {
    // First create a user
    const signupResponse = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email: `role-switch-${Date.now()}@example.com`,
        password: "SecurePass123",
        fullName: "Role Test User",
        selectedLanguage: "en",
        country: "AU",
      },
    });

    const userId = (await signupResponse.json()).data?.userId;
    expect(userId).toBeDefined();

    // Switch to provider role
    const switchResponse = await request.post(`${API_BASE}/auth/role/switch`, {
      data: {
        userId,
        targetRole: "provider",
      },
    });

    expect(switchResponse.status()).toBe(200);
    const body = await switchResponse.json();
    expect(body.currentRole).toBe("provider");
    expect(body.message).toContain("provider");
  });

  test("Role switch rejects invalid target role", async ({ request }) => {
    const response = await request.post(`${API_BASE}/auth/role/switch`, {
      data: {
        userId: "00000000-0000-0000-0000-000000000000",
        targetRole: "invalid",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.toLowerCase()).toContain("invalid");
  });
});

test.describe("Module E2E Tests - Provider Onboarding", () => {
  test("@critical Provider onboarding with valid ABN initializes verification", async ({
    request,
  }) => {
    // Create provider user first
    const signupResponse = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email: `provider-${Date.now()}@example.com`,
        password: "SecurePass123",
        fullName: "Provider Name",
        selectedLanguage: "en",
        country: "AU",
      },
    });

    const userId = (await signupResponse.json()).data?.userId;

    // Onboard provider
    const response = await request.post(`${API_BASE}/providers/onboard`, {
      data: {
        userId,
        serviceTypes: ["cleaning", "cooking"],
        baseRate: 50,
        servicePostcodes: ["2000", "2001"],
        abn: "12345678901",
        country: "AU",
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data?.providerId).toBeDefined();
    expect(body.data?.status).toBe("pending");
    expect(body.data?.abnVerificationRequired).toBe(true);
    expect(body.data?.backgroundCheckRequired).toBe(true);
  });

  test("Provider onboarding rejects invalid ABN format", async ({ request }) => {
    const signupResponse = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email: `provider-bad-abn-${Date.now()}@example.com`,
        password: "SecurePass123",
        fullName: "Bad ABN Provider",
        selectedLanguage: "en",
        country: "AU",
      },
    });

    const userId = (await signupResponse.json()).data?.userId;

    const response = await request.post(`${API_BASE}/providers/onboard`, {
      data: {
        userId,
        serviceTypes: ["cleaning"],
        baseRate: 50,
        servicePostcodes: ["2000"],
        abn: "invalid-abn",
        country: "AU",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.toLowerCase()).toContain("abn");
  });
});

test.describe("Module E2E Tests - Customer Onboarding", () => {
  test("@critical Customer onboarding with valid address succeeds", async ({ request }) => {
    // Create customer user first
    const signupResponse = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email: `customer-${Date.now()}@example.com`,
        password: "SecurePass123",
        fullName: "Customer Name",
        selectedLanguage: "en",
        country: "AU",
      },
    });

    const userId = (await signupResponse.json()).data?.userId;

    // Onboard customer
    const response = await request.post(`${API_BASE}/customers/onboard`, {
      data: {
        userId,
        flatAddress: "123 Main St, Sydney NSW 2000",
        coordinates: { lat: -33.8688, lng: 151.2093 },
        emergencyContact: { name: "Jane Doe", phone: "+61400000000" },
        languagePreference: "en",
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.message).toContain("complete");
    expect(body.data?.customerId).toBeDefined();
  });

  test("Customer onboarding rejects invalid coordinates", async ({ request }) => {
    const signupResponse = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email: `customer-bad-coords-${Date.now()}@example.com`,
        password: "SecurePass123",
        fullName: "Bad Coords Customer",
        selectedLanguage: "en",
        country: "AU",
      },
    });

    const userId = (await signupResponse.json()).data?.userId;

    const response = await request.post(`${API_BASE}/customers/onboard`, {
      data: {
        userId,
        flatAddress: "123 Main St",
        coordinates: { lat: 999, lng: 999 }, // Invalid coordinates
        emergencyContact: { name: "Jane Doe", phone: "+61400000000" },
        languagePreference: "en",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.toLowerCase()).toContain("coordinates");
  });

  test("Customer onboarding requires emergency contact", async ({ request }) => {
    const signupResponse = await request.post(`${API_BASE}/auth/signup`, {
      data: {
        email: `customer-no-contact-${Date.now()}@example.com`,
        password: "SecurePass123",
        fullName: "No Contact Customer",
        selectedLanguage: "en",
        country: "AU",
      },
    });

    const userId = (await signupResponse.json()).data?.userId;

    const response = await request.post(`${API_BASE}/customers/onboard`, {
      data: {
        userId,
        flatAddress: "123 Main St",
        coordinates: { lat: -33.8688, lng: 151.2093 },
        emergencyContact: { name: "", phone: "" }, // Missing contact
        languagePreference: "en",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.toLowerCase()).toContain("emergency");
  });
});

test.describe("Module E2E Tests - Booking Engine", () => {
  test("@critical Create booking calculates pricing correctly", async ({ request }) => {
    const response = await request.post(`${API_BASE}/bookings/create`, {
      data: {
        customerId: "test-customer-id",
        serviceType: "cleaning",
        targetDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        durationHours: 2,
        customerPostcode: "2000",
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data?.bookingId).toBeDefined();
    expect(body.data?.providerId).toBeDefined();
    expect(body.data?.pricing?.totalCustomerCharge).toBeGreaterThan(0);
    expect(body.data?.pricing?.providerShare).toBeGreaterThan(0);
    expect(body.data?.pricing?.platformFee).toBeGreaterThan(0);
  });

  test("Booking rejects invalid date format", async ({ request }) => {
    const response = await request.post(`${API_BASE}/bookings/create`, {
      data: {
        customerId: "test-customer-id",
        serviceType: "cleaning",
        targetDateTime: "invalid-date",
        durationHours: 2,
        customerPostcode: "2000",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error.toLowerCase()).toContain("date");
  });
});

test.describe("Module E2E Tests - Payments & Escrow", () => {
  test("@critical Payment processing holds funds in escrow", async ({ request }) => {
    const response = await request.post(`${API_BASE}/payments/process`, {
      data: {
        action: "process",
        bookingId: "test-booking-id",
        customerId: "test-customer-id",
        providerId: "test-provider-id",
        totalAmount: 100,
        platformFee: 15,
        providerShare: 85,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data?.escrowId).toBeDefined();
    expect(body.data?.status).toBe("confirmed_paid");
    expect(body.message).toContain("escrow");
  });

  test("Escrow release disburses funds correctly", async ({ request }) => {
    const response = await request.post(`${API_BASE}/payments/process`, {
      data: {
        action: "release",
        bookingId: "test-booking-id",
        escrowId: "test-escrow-id",
        providerId: "test-provider-id",
        providerShare: 85,
        platformFee: 15,
        charityAllocation: 1.5,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data?.providerPayout).toBe(85);
    expect(body.data?.charityFund).toBe(1.5);
  });
});

test.describe("Module E2E Tests - AI Services", () => {
  test("@critical AI inquiry routes emergency requests to human", async ({ request }) => {
    const response = await request.post(`${API_BASE}/ai/inquiry`, {
      data: {
        userId: "test-user-id",
        message: "This is an emergency! I need help immediately!",
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.routedToHuman).toBe(true);
    expect(body.intent).toBe("emergency_safety_issue");
  });

  test("AI inquiry returns response for routine requests", async ({ request }) => {
    const response = await request.post(`${API_BASE}/ai/inquiry`, {
      data: {
        userId: "test-user-id",
        message: "How do I schedule an appointment?",
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.response).toBeDefined();
    expect(body.routedToHuman).toBe(false);
  });

  test("@critical Biography generation consumes tokens", async ({ request }) => {
    const response = await request.post(`${API_BASE}/ai/biography`, {
      data: {
        customerId: "test-customer-id",
        audioTranscript: "I was born in a small village. My childhood was filled with laughter.",
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.data?.chapterId).toBeDefined();
    expect(body.data?.narrativeExcerpt).toBeDefined();
    expect(body.data?.tokensUsed).toBeGreaterThan(0);
  });
});

test.describe("Module E2E Tests - Dispatch & Emergency", () => {
  test("@critical Periodic check-in confirms provider", async ({ request }) => {
    const response = await request.post(`${API_BASE}/dispatch/check-in`, {
      data: {
        bookingId: "test-booking-id",
        providerId: "test-provider-id",
        hoursRemaining: 24,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(["confirmed", "unconfirmed", "emergency_triggered"]).toContain(body.confirmationStatus);
  });

  test("Emergency reroute searches for backup providers", async ({ request }) => {
    const response = await request.post(`${API_BASE}/dispatch/emergency-reroute`, {
      data: {
        bookingId: "test-booking-id",
        originalProviderId: "test-provider-id",
        customerId: "test-customer-id",
        customerPostcode: "2000",
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.data?.backupFound).toBeDefined();
    expect(body.data?.escalatedToHuman).toBeDefined();
  });
});
