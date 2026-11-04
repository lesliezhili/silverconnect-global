# Release 1 — home help for Chinese seniors

**Who:** Chinese-speaking older adults (华人长者) and their families.
**Where:** Australia and Canada. Live first in the Chinese communities of **Melbourne** (Box Hill, Doncaster, Glen Waverley, Balwyn, Kew, Toorak, Clayton, CBD) and **Vancouver** (Richmond, Burnaby, Vancouver, Coquitlam). Sydney, Brisbane, Perth, Adelaide, Toronto, Calgary and Montreal are on the waitlist.
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

## Customer journey (the only booking flow)

1. `/services` → `/services/[cat]` shows standard prices and trusted providers.
2. `/bookings/new`: choose category × effort tier (handyman: pick the job) → provider + time → an address inside a live area → review.
3. `/pay/[id]` (Stripe).
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

## Quality control: proven evidence

| Category | Before & after required for |
| --- | --- |
| Cleaning | Kitchen, bathroom, living area & floors |
| Garden | Front garden / lawn, back garden |
| Handyman | The job area |

- Enforced server-side in the provider job action. The upload modal is just the interface.
- Photos (≤10 MB) or short videos (mp4/mov/webm, ≤100 MB, uploaded directly to storage). Only the booking's assigned provider can add evidence.
- Each tier has its own completion checklist (`QC_CHECKLIST`), and every item must be ticked.
- **Short visit:** on site for less than 60% of the booked time → `qc_flag = short_visit` → payout held.

## Trust: excluding bad providers and customers

Nobody is banned automatically. Paused accounts appear at `/admin/quality` for a person to decide.

| Who | Paused when |
| --- | --- |
| Provider | Average of the last 10 ratings < 3.5★ (with 3+ reviews), **or** 3+ self-cancellations in 90 days, **or** 2+ QC flags in 90 days |
| Customer | Average of the last 10 provider ratings < 3.0★ (with 3+ reviews), **or** 3+ late cancellations / no-shows in 90 days |
| Pair | Either side rated the other ≤2★, so that pair is never matched again |

Cancellation refunds follow `lib/bookings/cancellation.ts`. If the provider cancels, the customer always gets a full refund; a job stopped part-way is charged pro-rata.

## Go-live checklist

- [ ] Apply `drizzle/migrations/0015_release1-tiers-qc-quotes.sql` to the production database **before** deploying (the new code reads `bookings.effort_tier`, `qc_flag`, `service_quotes`, …).
- [ ] Make sure the catalogue rows exist (`npm run db:seed`): `cleaning_basic_2h`, `cleaning_deep_3h`, `cleaning_seasonal_4h`, `garden_lawn_1h`, `garden_full_3h`, `repair_handyman_1h`, `repair_handyman_3h`.
- [ ] Confirm the hourly rates above.
- [ ] Run the E2E journey against a staging database with **Stripe test keys** (`e2e/r1-*.spec.ts`), never against live keys.
- [ ] At least one approved provider per category in each live city.
- [ ] Check the Chinese suburb names in `lib/release.ts`.
