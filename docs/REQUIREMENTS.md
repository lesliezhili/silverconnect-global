# Product Requirements (PRD)

## 1. Vision

Provide seniors in Australia, China, and Canada with a single trusted platform to discover, book, and pay vetted providers for in-home services — with a senior-friendly UX, multi-language support, and 24/7 AI assistance.

SilverConnect Global must operate as an **Asia-Pacific Multilingual Elder Support Platform**. The mandatory product and implementation baseline is defined in [Multilingual & Elder-First Specification](MULTILINGUAL_ELDER_FIRST_SPEC.md).

## 2. Personas

| Persona | Goals | Pain points |
|---|---|---|
| **Senior customer** (65+) | Book reliable help, use voice, understand updates, pay safely | Tech anxiety, low literacy, vision impairment, cognitive fatigue, language, scams |
| **Family caregiver** | Book on behalf of parent, monitor visits, receive translated summaries | Coordination, distance, timezone differences, mixed family languages |
| **Service provider / worker** | Steady bookings, prompt payouts, simple translated workflows | Idle time, disputes, payment delay, low-tech tools, language barriers |
| **Migrant worker / international student caregiver** | Participate with minimal training, use voice/photo workflows, communicate across languages | Local language confidence, form complexity, cultural context |
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
- Multilingual UI baseline per [Multilingual & Elder-First Specification](MULTILINGUAL_ELDER_FIRST_SPEC.md): English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Thai.
- Elder accessibility baseline: large text mode, high contrast mode, simplified UI mode, large touch targets, persistent emergency action, wellness check-in.
- Voice-first baseline: speech-to-text, text-to-speech, voice booking, voice reminders, multilingual voice support, slow speech mode.
- Worker simple mode: checklist workflow, photo-first completion, translated messaging, voice summaries.
- Family portal multilingual support: translated notifications, timezone-aware updates, concise AI summaries.
- Admin dashboard.

### Out of scope (post-MVP)

- Native mobile apps (React Native).
- Video consultations.
- Insurance integration.
- Additional countries beyond AU/CN/CA.
- Any new language that bypasses the mandatory locale architecture.

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

### E5 — AI assistance and translation
- As a user, I can chat with an AI assistant 24/7 in all mandatory languages.
- The AI detects emergencies and immediately surfaces emergency contacts.
- The AI can create/modify/cancel bookings and answer pricing/service questions.
- Thai worker voice notes can be translated into English family summaries and Chinese elder voice playback.
- Worker notes, family summaries, and notifications are localized through AI translation middleware.

### E6 — Elder-first accessibility
- As a senior, I can enable 150%, 200%, or 300% large text mode.
- As a senior, I can use Grandparent Mode with minimal screens and one primary action per screen.
- As a senior, I can use voice navigation instead of typing.
- As a senior, I can tap a persistent emergency button to call family, emergency contacts, or request help.
- As a senior, I can complete wellness check-ins with Good / Okay / Need Help choices and no typing.

### E7 — Worker simple mode
- As a worker, I can accept a job, navigate, take before/after photos, record a voice summary, and let AI generate a translated report.
- As a worker, I can receive auto-translated service instructions and family messages.
- As a migrant or international student worker, I can complete onboarding in my preferred language with minimal training.

### E8 — Admin
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
| FR-08 | Mandatory locales must include EN, zh-Hans, zh-Hant, JA, KO, TH. | ⚠️ | EN/ZH currently exist; expansion required. |
| FR-09 | Elder accessibility mode must support 150%, 200%, and 300% text scaling. | ⚠️ | Required by mandate. |
| FR-10 | Grandparent Mode must provide simplified, voice-first, one-action-per-screen flows. | ⚠️ | Required by mandate. |
| FR-11 | Translation middleware must support chat, requests, voice notes, family communication, AI summaries, and notifications. | ⚠️ | Required by mandate. |
| FR-12 | Worker simple mode must support checklist, photo-first completion, voice summaries, and translated messaging. | ⚠️ | Required by mandate. |
| FR-13 | Family portal must support translated summaries, localized notifications, and timezone-aware updates. | ⚠️ | Required by mandate. |

## 6. Non-functional requirements

| Category | Target |
|---|---|
| Accessibility | WCAG 2.1 AA minimum plus elder-first usability: large tap targets, high contrast, screen-reader labels, 150%/200%/300% text scaling, simplified mode. |
| Performance | Lighthouse Perf ≥ 0.9 on `/`, `/services`, `/bookings` (per `lighthouserc.json`). |
| Availability | 99.5% monthly. |
| Security | OWASP Top 10 compliant; secrets only in env; RLS on all PII tables. |
| Privacy | GDPR-aligned data export & deletion (post-MVP for CN PIPL). |
| Localization | English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Thai everywhere customer-, worker-, and family-facing. |
| Voice | Multilingual STT/TTS, slow speech mode, and voice navigation for critical elder flows. |
| Cultural inclusion | Naming conventions, cultural matching, family structures, and communication style preferences must be modeled explicitly. |

## 7. Success metrics

- Bookings/week (per country).
- Repeat-booking rate (90-day).
- Average rating ≥ 4.5.
- Dispute rate < 2% of completed bookings.
- AI deflection rate (issues resolved without human).
- Payment success rate ≥ 98%.

## 8. Open questions

- Rollout order for Traditional Chinese, Japanese, Korean, and Thai locale QA.
- Real-time provider tracking (post-MVP).
- Tip support per country norms.
- Translation provider selection by language pair and privacy constraints.
