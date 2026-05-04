# Product Requirements (PRD)

## 1. Vision

Provide seniors in Australia, China, and Canada with a single trusted platform to discover, book, and pay vetted providers for in-home services — with a senior-friendly UX, multi-language support, and 24/7 AI assistance.

## 2. Personas

| Persona | Goals | Pain points |
|---|---|---|
| **Senior customer** (60+) | Book reliable help, simple UI, pay safely | Tech anxiety, language, scams |
| **Family caregiver** | Book on behalf of parent, monitor visits | Coordination, distance |
| **Service provider** | Steady bookings, prompt payouts | Idle time, disputes, payment delay |
| **Operator/Admin** | Resolve disputes, vet providers, monitor safety | Fraud, compliance, scale |

## 3. Scope

### In scope (MVP — shipped)

- 3 countries: AU, CN, CA. Currencies: AUD, CNY, CAD.
- 25+ services across cleaning, cooking, gardening, personal care, maintenance.
- Customer registration, auth, profile, addresses, payment methods, favorites.
- Provider registration, certification upload, availability, blocked times, zones, badges.
- Booking engine: ad-hoc + recurring (weekly/biweekly/monthly), reminders, modifications.
- Stripe payments with escrow, refunds, Connect payouts.
- Reviews, ratings, feedback responses, feedback reports.
- Disputes (with evidence and messaging), incident reports, safety flags.
- Provider compliance documents.
- AI customer service: chat, intents, knowledge base, templates, emergency detection.
- EN + ZH localization.
- Admin dashboard.

### Out of scope (post-MVP)

- Native mobile apps (React Native).
- Video consultations.
- Insurance integration.
- Additional countries beyond AU/CN/CA.
- French language.

## 4. User stories (epics)

### E1 — Discovery & booking
- As a customer, I can browse services in my country with prices in my local currency including tax.
- As a customer, I can search providers by service, location, rating, language.
- As a customer, I can book a one-off or recurring service for a specific date/time.
- As a customer, I can reschedule or cancel within policy limits.

### E2 — Payments
- As a customer, I can pay with card; funds are held in escrow until service completion.
- As a customer, I can request a refund per cancellation policy.
- As a provider, I receive payout to my Stripe Connect account after service completion.

### E3 — Trust & safety
- As a user, I can submit a dispute with evidence.
- As a user, I can flag a safety incident; admin is alerted by severity.
- As a provider, I can upload compliance documents (police check, first aid, etc.).

### E4 — Feedback
- As a customer, I can rate and review a completed booking.
- As a provider, I can respond to a review.

### E5 — AI assistance
- As a user, I can chat with an AI assistant 24/7 in EN or ZH.
- The AI detects emergencies and immediately surfaces emergency contacts.
- The AI can create/modify/cancel bookings and answer pricing/service questions.

### E6 — Admin
- As an admin, I can review disputes, safety flags, and incident reports.
- As an admin, I can verify providers and approve compliance documents.

## 5. Functional requirements (selection)

Status legend: ✅ enforced in code · 🟡 partial / soft-enforced · ⚠️ documented policy, not yet enforced in API.

| ID | Requirement | Status | Notes |
|---|---|---|---|
| FR-01 | Pricing must include local tax (AU 10% GST, CN 0% VAT, CA 13% HST). | ✅ | `service_prices.price_with_tax` + `lib/pricing.ts`. |
| FR-02 | Cancellation > 24h before slot: full refund. ≤ 24h: per policy. | 🟡 | Enforced only in the AI agent (`ai_customer_service.py`). `DELETE /api/bookings/[id]` currently sets status without policy check. |
| FR-03 | Booking modifications must be requested ≥ 2h before start. | ⚠️ | No code enforcement found; KB/help text only. |
| FR-04 | Escrow released on customer-confirmed completion (or auto after T+48h). | 🟡 | DB function `release_escrow(booking_id)` exists; no scheduler triggers it on T+48h. Manual release only. |
| FR-05 | AI must detect emergency keywords and surface country-specific contacts. | ✅ | `components/AIChat.tsx` `EMERGENCY_KEYWORDS` + `checkForEmergency`. |
| FR-06 | RLS must prevent any user from reading another user's bookings, payments, or messages. | ✅ | RLS policies in `lib/schema.sql` and migrations. |
| FR-07 | Provider payout requires verified Stripe Connect account. | 🟡 | `service_providers.stripe_connect_id` column exists; payout endpoint does not yet hard-block on missing/unverified id. |

## 6. Non-functional requirements

| Category | Target |
|---|---|
| Accessibility | WCAG 2.1 AA; large tap targets (≥ 48px); high contrast; screen-reader labels. |
| Performance | Lighthouse Perf ≥ 0.9 on `/`, `/services`, `/bookings` (per `lighthouserc.json`). |
| Availability | 99.5% monthly. |
| Security | OWASP Top 10 compliant; secrets only in env; RLS on all PII tables. |
| Privacy | GDPR-aligned data export & deletion (post-MVP for CN PIPL). |
| Localization | EN + ZH everywhere customer-facing. |

## 7. Success metrics

- Bookings/week (per country).
- Repeat-booking rate (90-day).
- Average rating ≥ 4.5.
- Dispute rate < 2% of completed bookings.
- AI deflection rate (issues resolved without human).
- Payment success rate ≥ 98%.

## 8. Open questions

- French (CA-Quebec) timeline.
- Real-time provider tracking (post-MVP).
- Tip support per country norms.
