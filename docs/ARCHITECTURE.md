# Architecture

## 1. Overview

SilverConnect Global is a multi-country, two-sided marketplace connecting senior customers with vetted service providers (cleaning, cooking, gardening, personal care, maintenance) across **Australia (AU)**, **China (CN)**, and **Canada (CA)**.

The system is a Next.js full-stack application (App Router) backed by Supabase (PostgreSQL + Auth + RLS), with Stripe for payments and a separate FastAPI microservice for AI customer service.

## 2. C4 — Context

```
            ┌─────────────┐         ┌──────────────┐
   Senior ─▶│             │◀─────── │   Provider   │
            │  Web App    │         └──────────────┘
            │  (Next.js)  │
            │             │──▶ Stripe (payments, payouts, escrow)
            │             │──▶ Supabase (DB, Auth, Storage, RLS)
            │             │──▶ AI Agent (FastAPI) ──▶ OpenAI / Azure
   Admin ──▶│             │──▶ Email (Nodemailer/SMTP)
            └─────────────┘
```

## 3. C4 — Containers

| Container | Tech | Responsibility |
|---|---|---|
| Web App | Next.js 16 + React 19 | UI, server components, API routes |
| API Routes | Next.js Route Handlers (`app/api/**`) | REST endpoints (REST/JSON) |
| Database | Supabase Postgres | Source of truth, RLS-enforced authz |
| Auth | Supabase Auth | Email/password, JWT sessions |
| Payments | Stripe | Charges, escrow, Connect payouts, webhooks |
| AI Service | FastAPI (`ai_customer_service.py`) | Chat, intent routing, emergency detection |
| CDN/Edge | Vercel | Static assets, edge functions |

## 4. Module map

Implemented in 7 modules. Migration files are not strictly numbered 1:1 — three files share the `001_` prefix and there is an `008_` for a follow-up status field. See [DATABASE.md § Migrations — apply order](DATABASE.md#migrations--apply-order).

1. **Provider Onboarding** — registration, verification, certifications, KYC.
2. **Customer Profile + Calendar/Pricing** — addresses, payment methods, dynamic pricing tiers.
3. **Booking Engine** — scheduling, recurring bookings, modifications, reminders, blocked times.
4. **Payments & Escrow** — Stripe charges, escrow hold/release, platform fee, Connect payouts, refunds, payment disputes.
5. **Feedback & Ratings** — reviews, responses, reports.
6. **Disputes & Safety** — disputes with evidence, incident reports, safety flags, compliance documents.
7. **AI Automation** — sessions, conversations, intents, knowledge base, templates.

## 5. Key components

| Frontend (`components/`) | Purpose |
|---|---|
| `Header.tsx`, `CountrySelector.tsx`, `LanguageSelector.tsx`, `LocationDetector.tsx` | Global chrome, locale + geolocation |
| `ServiceCard.tsx`, `ProviderCard.tsx` | Catalog display |
| `BookingForm.tsx`, `BookingModal.tsx`, `BookingStatusFlow.tsx` | Booking flow |
| `ProviderRegistration.tsx`, `ProviderAvailability.tsx` | Provider onboarding |
| `CustomerRegistration.tsx`, `AuthModal.tsx`, `SignupModal.tsx` | Auth flows |
| `PaymentHistory.tsx` | Customer payment ledger |
| `FeedbackForm.tsx`, `FeedbackModal.tsx` | Reviews |
| `AIChat.tsx`, `ChatModal.tsx` | AI customer service UI |
| `AdminDashboard.tsx` | Operator console |

| Server libs (`lib/`) | Purpose |
|---|---|
| `supabase.ts` | Supabase client (browser + server) |
| `pricing.ts` | Country-aware pricing calculation |
| `availability.ts`, `matching.ts` | Slot search and provider matching |
| `paymentUtils.ts` | Stripe helpers, fee calculations |
| `providers.ts`, `services.ts` | Domain queries |
| `location.ts`, `locationUtils.ts` | Geolocation, distance |
| `translations.ts` | EN/ZH dictionary |
| `types.ts` | Shared TS types and enums |
| `ai/pricingTemplates.ts` | Pricing-related prompt templates used by the AI agent |

## 6. Request flow — booking creation

```
Customer → POST /api/bookings
  → validate session (Supabase Auth)
  → check provider availability (lib/availability.ts)
  → compute price (lib/pricing.ts, country tax)
  → INSERT booking (status=PENDING, payment_status=UNPAID)
  → POST /api/create-payment-intent → Stripe
  → on stripe webhook (payment_intent.succeeded) → set bookings.payment_status=PAID, status=CONFIRMED, insert payment_transactions row
  → on completion → manual escrow release via DB function `release_escrow(booking_id)` → payout queued (Module 4 tables). Time-based auto-release is **not yet implemented**.
```

## 7. Multi-country handling

- `countries` table: `AU`, `CN`, `CA` with `currency_code`, `tax_rate`.
- All pricing stored per `(service_id, country_code)` in `service_prices`.
- Currency picked from user country; Stripe charge currency must match.
- i18n via `lib/translations.ts` (EN/ZH; FR planned).

## 8. AuthN / AuthZ

- **AuthN**: Supabase Auth (JWT in HTTP-only cookies).
- **AuthZ**: Postgres Row-Level Security on every user-owned table. Server routes additionally verify role for privileged actions (admin, provider-only).
- Service-role key is **server-only**; never shipped to the client.

## 9. Cross-cutting concerns

| Concern | Mechanism |
|---|---|
| Logging | Vercel runtime logs; Supabase logs |
| Analytics | Vercel Analytics |
| Error monitoring | (planned) Sentry |
| Caching | Next.js segment caching; `force-dynamic` on auth-bound routes |
| Rate limiting | (planned) Upstash on `/api/ai/*` and auth |
| Feature flags | (none yet — env vars where needed) |

## 10. Non-functional targets

| Attribute | Target |
|---|---|
| Availability | 99.5% (Vercel + Supabase managed) |
| p95 page load | < 2.5s on 4G |
| API p95 | < 400 ms (excl. Stripe round-trip). Hard upper bound: Vercel function `maxDuration: 30s` (`vercel.json`). |
| RPO / RTO | 24h / 4h (Supabase PITR) |

## 11. Decisions (ADRs, condensed)

- **Next.js App Router over pages router** — server components, streaming.
- **Supabase over self-hosted Postgres** — managed Auth + RLS + Storage in one.
- **Stripe Connect (escrow)** — hold customer funds until service completion.
- **Separate FastAPI for AI** — Python ecosystem for LLM tooling; isolated scaling.
- **No SSR for chat** — AI chat is client-only with streaming via REST.
