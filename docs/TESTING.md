# Testing Strategy

## Test pyramid

```
         /\
        /E2E\         e2e/*.spec.ts        (Playwright, critical flows)
       /----\
      / Integ\        __tests__/...        (Jest + Supabase test schema)
     /--------\
    /   Unit   \      __tests__/services/  (Jest, pure logic)
   /------------\
```

Targets:

| Layer | Tool | Threshold |
|---|---|---|
| Unit + integration | Jest | 70% global (branches / functions / lines / statements) — `jest.config.js` `coverageThreshold` |
| API integration | Jest (+ test DB) | Goal: every API route has at least one happy + one auth-fail test (not yet enforced in config) |
| E2E | Playwright (chromium / firefox / webkit / Mobile Chrome / Mobile Safari) | Critical flows tagged `@critical` must pass |
| Lighthouse | `lighthouserc.json` URLs `/`, `/services`, `/bookings`, 3 runs each | Performance ≥ 0.9, Accessibility ≥ 0.9, Best Practices ≥ 0.85, SEO ≥ 0.9 |
| Load | k6 (`k6/`) | Goal: booking endpoint 100 RPS, p95 < 500 ms |

## Running

```bash
npm test                     # all unit/integration
npm run test:watch
npm run test:coverage
npm run test:e2e
npm run test:e2e:critical    # only @critical
npm run test:e2e:ui          # interactive
npm run test:performance     # Lighthouse on running dev server
```

Configs: `jest.config.js`, `playwright.config.ts`, `lighthouserc.json`.

> **Playwright dev server**: the `webServer` block in `playwright.config.ts` is currently commented out — `npm run test:e2e` expects a dev server already running on `http://localhost:3000`, or set `PLAYWRIGHT_TEST_BASE_URL`. Run `npm run dev` in another terminal first, or uncomment the block.

## Existing E2E specs

| File | Coverage |
|---|---|
| `e2e/critical-flows.spec.ts` | Home → payment flow, payment processing, booking cancellation, perf checks (homepage < 3s, services < 2s) |
| `e2e/booking-flow.spec.ts` | Full booking happy path |
| `e2e/uat-signin-flow.spec.ts` | UAT auth scenarios |

> **Gap**: `npm run test:e2e:critical` runs `playwright test --grep @critical`, but **no test currently carries the `@critical` tag** — that script matches zero tests. Tag the must-pass-on-every-PR specs (start with the 3 user-journey tests in `critical-flows.spec.ts`) before relying on this gate in CI.

## Writing tests

### Unit (lib/)
```ts
import { calculatePrice } from '@/lib/pricing'
test('AU price includes 10% GST', () => {
  expect(calculatePrice({ base: 100, countryCode: 'AU' }).total).toBeCloseTo(110)
})
```

### Integration (API routes)
- Use a dedicated Supabase project for test, or a transactional rollback wrapper.
- Seed catalog data via `npm run db:seed`; add `npm run db:seed:providers` when tests need demo providers, then invoke route handlers directly.

### E2E
- Use Playwright fixtures in `e2e/`. Prefer `data-testid` selectors over text where copy churns.
- Reset state per test (delete-then-seed) to avoid order-dependence.

## CI gates

PRs must pass:
1. `npm run lint`
2. `npm test`
3. `npm run test:e2e:critical` *(once `@critical` tags are added to specs — currently a no-op)*
4. `npm run build`

See [CI_CD.md](CI_CD.md).

## Manual / UAT

See [`MANUAL_TESTING_GUIDE.md`](../MANUAL_TESTING_GUIDE.md) and [`TESTING_AND_DEPLOYMENT_GUIDE.md`](../TESTING_AND_DEPLOYMENT_GUIDE.md). UAT logs land in `uat-test-results.log`.

## Test data hygiene

- Never use real PII in fixtures.
- Stripe: only test keys (`pk_test_`, `sk_test_`).
- Supabase: separate project for `test` and `dev`; never test against `prod`.
