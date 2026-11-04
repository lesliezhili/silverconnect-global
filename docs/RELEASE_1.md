# Release 1 — home help for Chinese seniors

**Who:** Chinese-speaking older adults (华人长者) and their families.
**Where:** **Melbourne only** — its Chinese communities (Box Hill, Doncaster, Glen Waverley, Balwyn, Kew, Toorak, Clayton, CBD). Vancouver is configured (`VANCOUVER` in `lib/release.ts`, BC 5% GST) but on the waitlist with Sydney, Brisbane, Perth, Adelaide, Toronto, Calgary and Montreal; Canada appears in the country switcher once a Canadian city is in `LIVE_AREAS`.
**What:** home cleaning, garden care, and small handyman jobs that need no trade licence.

Everything else stays in the codebase as reference for later releases: see [FUTURE_RELEASES.md](FUTURE_RELEASES.md).

## Where the rules live

| File | What |
| --- | --- |
| `lib/release.ts` | Countries, categories, live areas (postcodes / Canadian FSAs), handyman job types, future routes |
| `lib/release-pricing.ts` | Standard price model: effort tiers, hourly rates, quote recommendation |
| `lib/release-quality.ts` | Required before/after areas, completion checklists, short-visit flag, trust thresholds |
| `lib/trust.ts` | Provider/customer pause checks used by matching and booking; admin queues |
| `lib/bookings/release-booking.ts` | The single pricing function for a booking |
| `lib/feedback/release.ts` | The single payout release path |
| `lib/quotes/*` | Quote eligibility, send, approve/decline |
| `lib/release-cancellation.ts` | Provider notice tiers and penalties |
| `lib/bookings/providerWithdraw.ts` | Provider decline/cancel: emergency cover → penalty / full refund |
| `lib/bookings/emergencyCover.ts` | Reassigns a job to the emergency cover team (or another free, checked provider) |

## Customer journey (the only booking flow)

1. `/services` → `/services/[cat]` shows standard prices and trusted providers.
2. `/bookings/new`: choose category × effort tier (handyman: pick the job) → provider + time → an address inside a live area → review.
3. `/checkout/[id]`: real Stripe card payment, confirmed by the Stripe webhook. When Stripe isn't configured (local / E2E only), `/pay/[id]` simulates the payment and refuses to run otherwise.
4. Provider accepts, then **starts** (a before photo/video of every required area) and **completes** (after photos of every area + the ticked checklist).
5. Customer sees before/after side by side on `/bookings/[id]/feedback`, rates the job (plus optional aspect ratings and a next-visit tier), and that **releases the payout**. A ≤2★ rating or a QC flag **holds** it for admin review at `/admin/quality`.
6. For medium/high jobs (or a regular job that overran by more than 30 min), the provider may send a **quote** for later visits. The customer approves or declines it on `/bookings/[id]`, and an approved quote prices the next booking with that provider.

`/book` and `/book-service` (older flows that created unpaid bookings) redirect to `/coming-soon`.

## Price model

`price (ex tax) = hourly rate(country, category) × tier multiplier × hours`

| Tier | Multiplier | Hours | Notes |
| --- | --- | --- | --- |
| Regular | 1.0 | 2 (fixed package) | Never re-priced on time |
| Medium effort | 1.2 | 3 minimum | Quote possible after first visit |
| High effort | 1.4 | 4 minimum | Quote possible after first visit |

Base hourly rates (**placeholders, confirm before launch**):

| | Cleaning | Garden | Handyman |
| --- | --- | --- | --- |
| AU (A$, + 10% GST) | 55 | 60 | 65 |
| CA (C$, + 5% GST in BC) | 60 | 65 | 70 |

Quotes change only the tier and hours. Providers never type a rate. A visit is capped at 8 hours.

## Quality control: proven evidence (photos)

| Category | Before & after required for |
| --- | --- |
| Cleaning | Kitchen, bathroom, living area & floors |
| Garden | Front garden / lawn, back garden |
| Handyman | The job area |

- Enforced server-side in the provider job action. The upload modal is just the interface.
- **Photos first:** photos are shrunk on the phone (≤1600 px JPEG, typically 200–400 KB) before upload. The server still accepts short videos, but the app only asks for photos. Only the booking's assigned provider can add before/after evidence.
- **Customer feedback photos:** up to 3 per job, **required for a rating of 2★ or lower**, and shown in the admin quality queue next to the provider's before/after.
- Each tier has its own completion checklist (`QC_CHECKLIST`), and every item must be ticked.
- **Short visit:** on site for less than 60% of the booked time → `qc_flag = short_visit` → payout held.

## Trust: background checks and excluding bad actors

Nobody is banned automatically. Paused accounts appear at `/admin/quality` for a person to decide.

| Who | Paused when |
| --- | --- |
| Provider | **No approved, current police check + ID document** (police checks without an expiry count for 3 years), **or** average of the last 10 ratings < 3.5★ (with 3+ reviews), **or** 3 late-cancellation strikes in 90 days, **or** 2+ QC flags in 90 days |
| Customer | Average of the last 10 provider ratings < 3.0★ (with 3+ reviews), **or** 3+ cancellations < 24 h / no-shows in 90 days |
| Pair | Either side rated the other ≤2★, so that pair is never matched again |

Background check = **police check + photo ID** (Working With Children is optional in Release 1). No SOS button or GPS tracking in Release 1 — customers are told to call 000 (`RELEASE_FEATURES` in `lib/release.ts`).

Providers are only matched within the customer's country.

## Cancellation policy (both sides)

**Customer cancels**, by notice before the start:

| | Australia | Canada |
| --- | --- | --- |
| Long notice | ≥48 h: 100% refund | ≥72 h: 100% refund |
| Medium | 24–48 h: 50% refund (50% to the provider) | 24–72 h: 75% refund |
| Short | <24 h: no refund (90% to the provider) | <24 h: 25% refund |
| No-show | No refund | No refund |

**Provider withdraws.** The customer never loses out:
1. **Emergency cover** reassigns the job (same time, same price). Members of the **emergency cover team** (`/admin/quality`) go first, then any provider who passes the trust gate, offers that service in that country and is free at that time.
2. If nobody is free, the customer gets a **full refund** and every admin gets an "Emergency: no cover found" alert.

| Provider notice | Penalty (from their wallet) | Strike |
| --- | --- | --- |
| ≥48 h | None | No |
| 12–48 h | 10% of the job | Yes |
| <12 h, or after starting | 25% of the job | Yes |
| Declining an unpaid request | None | No |

A job stopped part-way is charged pro-rata. Three strikes in 90 days pause the provider.

## Go-live checklist

- [ ] Apply `drizzle/migrations/0015_release1-tiers-qc-quotes.sql` to the production database **before** deploying (the new code reads `bookings.effort_tier`, `qc_flag`, `service_quotes`, …).
- [ ] Make sure the catalogue rows exist (`npm run db:seed`): `cleaning_basic_2h`, `cleaning_deep_3h`, `cleaning_seasonal_4h`, `garden_lawn_1h`, `garden_full_3h`, `repair_handyman_1h`, `repair_handyman_3h`.
- [ ] Confirm the hourly rates above.
- [ ] Run the E2E suites (below). For the real Stripe checkout, run the staging journey with **test keys** too, never live keys.
- [ ] Mark each existing provider's police check and ID as approved (with expiry) in admin, or they won't be matched.
- [ ] Add at least one provider per city to the **emergency cover team**.
- [ ] At least one approved provider per category in each live city.
- [ ] Check the Chinese suburb names in `lib/release.ts`.

## E2E tests

An isolated environment: a Docker Postgres database with fixtures and an app server with no production credentials.

```bash
./scripts/e2e-local.sh
```

Run the app against that database with **no Stripe or Supabase keys**, for example from a separate checkout whose `.env.local` only has `DATABASE_URL=postgres://postgres:sc_e2e@localhost:55432/sc_e2e`, `DATABASE_SSL=false` and a `SESSION_SECRET`. Then:

```bash
SC_E2E_DB_URL=postgres://postgres:sc_e2e@localhost:55432/sc_e2e PLAYWRIGHT_BASE_URL=http://localhost:3021 CI=1 npx playwright test e2e/r1-journey.spec.ts e2e/r1-release.spec.ts --project=chromium --workers=1
```

`r1-journey.spec.ts` refuses to run against anything but localhost. It covers:
- the trust gate: background check, low rating, paused customer, country;
- the happy path with exact payout amounts, and re-submitted feedback not paying twice;
- completion blocked without evidence and checklist;
- the short-visit hold and admin release;
- a forged admin cookie;
- a 1★ rating that needs photos, then the pair block;
- quotes;
- customer cancellation, provider decline, late provider cancel with emergency cover, and no cover with full refund + admin alert;
- late-cancelling customers being paused;
- Canadian pricing.
