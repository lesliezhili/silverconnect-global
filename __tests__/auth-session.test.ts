import { isSessionSecretConfigured } from "@/lib/auth/session-config";

describe("auth session configuration", () => {
  it("requires at least 32 characters for session secrets", () => {
    expect(isSessionSecretConfigured(undefined)).toBe(false);
    expect(isSessionSecretConfigured("short")).toBe(false);
    expect(isSessionSecretConfigured("x".repeat(31))).toBe(false);
    expect(isSessionSecretConfigured("x".repeat(32))).toBe(true);
  });
});
