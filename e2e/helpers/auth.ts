/** Test provider credentials for e2e specs that exercise an authenticated flow.
 * Unset in CI/local by default — specs must check `if (!PROVIDER_PASS) test.skip()`
 * before using these, since no seeded test provider account is guaranteed to exist. */
export const PROVIDER_EMAIL = process.env.TEST_PROVIDER_EMAIL || ''
export const PROVIDER_PASS = process.env.TEST_PROVIDER_PASS || ''
