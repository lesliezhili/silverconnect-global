# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed (Breaking)
- **Service regions**: `CN` removed; replaced by `US`. Supported regions are now AU / US / CA.
  - `country` Postgres enum: `RENAME VALUE 'CN' TO 'US'` (see `drizzle/migrations/0004_country-us-locale-expand.sql`).
  - Currency / tax / emergency-number tables updated; CNY display path removed; US uses approximate AUD→USD rate (0.65) as a display-only placeholder until billing FX lands.
- **Locales**: `en` / `zh` → `en` / `zh-CN` / `zh-TW` / `ja` / `ko`.
  - `locale` Postgres enum: `RENAME VALUE 'zh' TO 'zh-CN'`, plus `ADD VALUE` for `zh-TW`, `ja`, `ko`.
  - `messages/zh.json` renamed to `messages/zh-CN.json`; new placeholder files `zh-TW.json` (copied from zh-CN), `ja.json` and `ko.json` (copied from en, awaiting translation).
  - Legacy `/zh/...` URLs are 308-redirected to `/zh-CN/...` in `proxy.ts`.

## [0.1.0] — 2026-05-01

### Added
- Multi-country platform skeleton: Australia, China, Canada (AUD / CNY / CAD).
- 25+ services across cleaning, cooking, gardening, personal care, maintenance with tax-inclusive pricing.
- Senior-friendly Next.js 16 / React 19 frontend, Tailwind UI, Radix components.
- Supabase auth + Postgres with Row-Level Security on all PII tables.
- Module 1 — Provider onboarding: registration, certifications, verification, zones, badges.
- Module 2 — Customer profile: addresses, payment methods, favorites, calendar, dynamic pricing.
- Module 3 — Booking engine: ad-hoc + recurring (weekly/biweekly/monthly), modifications, reminders, blocked times, status history.
- Module 4 — Payments & escrow: Stripe Payment Intents, escrow hold/release, platform fee, Connect payouts, refunds, payment disputes, provider wallet.
- Module 5 — Feedback & ratings: reviews, provider responses, abuse reports.
- Module 6 — Disputes & safety: disputes with evidence + messaging, incident reports, safety flags, compliance documents.
- Module 7 — AI customer service: sessions, conversations, intents, knowledge base, templates, automations; emergency detection (EN/ZH).
- Admin dashboard.
- E2E test suite (Playwright) and unit tests (Jest).
- Vercel + Supabase + Stripe deployment path.

### Documentation
- Engineering doc set under `docs/`: architecture, requirements, API, database, development, testing, deployment, security, operations.
