# Database

PostgreSQL via Supabase. Source-of-truth schema is [`lib/schema.sql`](../lib/schema.sql) plus incremental files under [`migrations/`](../migrations/). The migration set has organic overlaps (multiple `001_*` files); when in doubt, `IF NOT EXISTS` guards make replays safe.

## Conventions

- Primary keys: `UUID DEFAULT gen_random_uuid()`.
- Timestamps: `TIMESTAMP DEFAULT NOW()` for `created_at`; explicit `updated_at` where mutated.
- Money: `DECIMAL(10,2)` with `currency TEXT` (ISO 4217).
- Status enums modelled as `TEXT` (validated in app code).
- Bilingual columns: `name`, `name_zh`, `description`, `description_zh`.
- All user-data tables have **Row-Level Security**; the service-role key bypasses RLS for server-only operations.

## Migrations — apply order

1. [`lib/schema.sql`](../lib/schema.sql) — base schema (17 tables).
2. [`migrations/001_provider_onboarding.sql`](../migrations/001_provider_onboarding.sql) → [`001_provider_onboarding_complete.sql`](../migrations/001_provider_onboarding_complete.sql) — Module 1 (provider docs, zones).
3. [`migrations/001_add_modules_5_6.sql`](../migrations/001_add_modules_5_6.sql) — supplemental tables for modules 5 & 6.
4. [`migrations/002_customer_profile.sql`](../migrations/002_customer_profile.sql) — Module 2 customer data.
5. [`migrations/002_enhanced_calendar_pricing.sql`](../migrations/002_enhanced_calendar_pricing.sql) — calendar + pricing tiers.
6. [`migrations/003_booking_engine.sql`](../migrations/003_booking_engine.sql) — Module 3.
7. [`migrations/004_payments_escrow.sql`](../migrations/004_payments_escrow.sql) — Module 4.
8. [`migrations/005_feedback_ratings.sql`](../migrations/005_feedback_ratings.sql) — Module 5.
9. [`migrations/006_disputes_safety.sql`](../migrations/006_disputes_safety.sql) — Module 6.
10. [`migrations/007_ai_automation.sql`](../migrations/007_ai_automation.sql) — Module 7.
11. [`migrations/008_add_provider_status.sql`](../migrations/008_add_provider_status.sql) — provider status field.

Apply via `npm run db:migrate` (uses `scripts/migrate.js`) or paste into the Supabase SQL editor.

## Tables — by source file

### Base — `lib/schema.sql`
`countries`, `services`, `service_prices`, `users`, `service_providers`, `provider_availability`, `bookings`, `customer_feedback`, `provider_feedback`, `provider_pricing`, `notifications`, `payment_transactions`, `provider_payouts`, `disputes`, `knowledge_base`, `public_holidays`, `time_of_day_pricing`.

### `migrations/001_provider_onboarding{,_complete}.sql`
`provider_documents`, `provider_zones`.

### `migrations/001_add_modules_5_6.sql` *(supplemental)*
`safety_flags`, `user_preferences`, `emergency_contacts`, `medical_info`, `provider_documents` *(re-declared, idempotent)*, `provider_analytics`, `audit_logs`, `notification_preferences`, `provider_schedule_exceptions`, `service_categories`, `provider_service_areas`, `provider_waitlist`, `referrals`, `promo_codes`, `booking_modifications`, `provider_response_times`, `subscription_plans`, `user_subscriptions`, `provider_badges`, `provider_badge_assignments`, `faqs`, `support_tickets`.

### `migrations/002_customer_profile.sql`
`customer_addresses`, `customer_payment_methods`, `customer_favorites`.

### `migrations/002_enhanced_calendar_pricing.sql`
`public_holidays` *(re-declared)*, `provider_blocked_times`, `pricing_tiers`, `booking_pricing`.

### `migrations/003_booking_engine.sql`
`booking_status_history`, `booking_modifications` *(re-declared)*, `recurring_bookings`, `booking_reminders`, `provider_blocked_times` *(re-declared)*.

### `migrations/004_payments_escrow.sql`
`payouts`, `refund_requests`, `payment_disputes`, `provider_wallets`. Also `ALTER TABLE payment_transactions` to add `escrow_status`, `escrow_released_at`, `platform_fee`, `provider_payout`.

### `migrations/005_feedback_ratings.sql`
`rating_reports`, `rating_responses`, `provider_stats`, `provider_badges` *(re-declared)*.

### `migrations/006_disputes_safety.sql`
`dispute_evidence`, `dispute_messages`, `incident_reports`, `compliance_documents`, `compliance_alerts`. Also `ALTER TABLE disputes` and `ALTER TABLE safety_flags` for additional columns.

### `migrations/007_ai_automation.sql`
`ai_conversations`, `ai_intents`, `ai_knowledge_base`, `ai_automation_rules`, `chatbot_sessions`, `ai_response_templates`.

### `migrations/008_add_provider_status.sql`
`ALTER TABLE service_providers` to add status field.

## Core entities (selected)

### `countries`
`code (UNIQUE)`, `name`, `name_zh`, `currency_code`, `currency_symbol`, `tax_rate`, `is_active`. Seeded with AU / CN / CA.

### `services`
`id`, `category` (cleaning|cooking|gardening|personal|maintenance), `subcategory`, `name`, `name_zh`, `description`, `description_zh`, `duration_minutes`, `requires_material`, `is_active`.

### `service_prices`
Unique `(service_id, country_code)`. `base_price`, `price_with_tax`.

### `users`
`email`, `full_name`, `phone`, `user_type` (`customer`|`provider`), `country_code`, `city`, `address`, `postal_code`, `latitude`, `longitude`, `birth_date`, `emergency_contact_*`, `medical_notes`, `preferred_language`. A separate `role` column is also read by admin-gated endpoints (`profile.role === 'admin'`); the duplication of `user_type` vs `role` is on the schema-debt list.

### `service_providers`
Provider extension. `user_id` FK, `specialties[]`, `bio`, `years_experience`, `certifications[]`, `rating`, `total_ratings`, `is_verified`, `is_christian`, `stripe_connect_id`. Status added in `008`.

### `bookings`
`booking_number`, `provider_id`, `customer_id`, `service_id`, `booking_date`, `start_time`, `end_time`, `duration_minutes`, `address`, `special_instructions`, `total_price`, `status` (PENDING|CONFIRMED|COMPLETED|CANCELLED|DISPUTED), `payment_status` (UNPAID|PAID|REFUNDED|FAILED).

### `provider_availability`
Weekly availability. `provider_id`, `day_of_week (0–6)`, `slot_name`, `start_time`, `end_time`, `is_available`. *(TS interface in `lib/types.ts` is named `AvailabilityWindow`.)*

### Feedback
- `customer_feedback`, `provider_feedback` — base ratings/comments.
- `rating_responses` — provider replies to a rating.
- `rating_reports` — abuse reports.
- `provider_stats` — aggregated stats.

### Payments
- `payment_transactions` — extended in `004` with `escrow_status`, `platform_fee`, `provider_payout`.
- `payouts` — Stripe Connect payout records (Module 4).
- `provider_payouts` — earlier base-schema payout ledger; both currently coexist.
- `refund_requests`, `payment_disputes`, `provider_wallets`.

### Disputes & Safety
- `disputes` (base) — extended by `006` with `priority`, `assigned_to`, `resolution_amount`, `admin_notes`, `customer_agreed`, `provider_agreed`.
- `dispute_evidence`, `dispute_messages`.
- `safety_flags` (in `001_add_modules_5_6`) — extended by `006`.
- `incident_reports`, `compliance_documents`, `compliance_alerts`.

### AI
- `chatbot_sessions` — chat sessions (the TS code refers to "sessions").
- `ai_conversations` — message history per session.
- `ai_intents`, `ai_knowledge_base`, `ai_response_templates`, `ai_automation_rules`.

## Row-Level Security (high level)

| Table | RLS state |
|---|---|
| `countries`, `services`, `service_prices` | RLS not enabled — effectively public read (intentional). |
| `users` | enabled; `auth.uid() = id` |
| `service_providers` | enabled; provider self-manage + public SELECT for verified providers |
| `provider_availability`, `provider_documents`, `provider_zones`, `provider_blocked_times` | enabled; provider self-manage |
| `bookings` | enabled; users see own, can create / update own |
| `customer_addresses`, `customer_payment_methods`, `customer_favorites` | enabled; customer self-manage |
| `disputes`, `dispute_evidence`, `incident_reports` | enabled; parties + (admin via service-role) |
| `compliance_documents` | enabled; provider self-manage |
| `payouts`, `refund_requests`, `payment_disputes`, `provider_wallets` | enabled; owner SELECT |
| `ai_conversations`, `chatbot_sessions` | enabled; user SELECT own |
| `ai_knowledge_base`, `ai_response_templates` | enabled; public SELECT (KB is read-only public) |
| **`payment_transactions`** | **RLS NOT enabled — security gap, see [SECURITY.md § Authorization](SECURITY.md#authorization)** |
| **`compliance_alerts`, `dispute_messages`** | **RLS enabled but no policies — deny-all to anon/auth callers** |

Admin role bypasses via service-role key in server contexts.

## Indexing strategy

Critical indexes (add when not present):
- `bookings (provider_id, booking_date)`
- `bookings (customer_id, created_at DESC)`
- `payment_transactions (booking_id)`
- `provider_availability (provider_id, day_of_week)`
- `service_prices (country_code)`

## Data lifecycle

- **Soft delete** via `is_active` on services / providers.
- **Hard delete** on user request (GDPR) cascades through `ON DELETE CASCADE` FKs; payments retained per accounting requirements (anonymized).
- **Backups**: Supabase PITR (7 days on Pro tier).

## Known schema debt

These should be addressed in a future cleanup migration:

- Three files share the `001_*` prefix (`001_provider_onboarding.sql`, `001_provider_onboarding_complete.sql`, `001_add_modules_5_6.sql`) — apply order is by content not filename. Consider renumbering.
- `provider_documents` declared in three migrations.
- `provider_blocked_times` declared in two migrations.
- `provider_badges` declared twice (`001_add_modules_5_6` and `005`).
- `payouts` (Module 4) and `provider_payouts` (base) coexist; pick one or document the split.
- `booking_modifications` declared in `001_add_modules_5_6` and `003`.
- **`ratings` table is referenced by `005_feedback_ratings.sql` (`ALTER TABLE ratings …`) and by `app/api/feedback/route.ts` but no `CREATE TABLE ratings` exists in tracked migrations** — likely created out-of-band during dev. Add an explicit migration before any prod use that doesn't already have it.
- **`users` has both `user_type` (`customer`|`provider`) and `role` (`'admin'` checked by `/api/ai/*` and `/api/safety-flags`)**; pick one and migrate.

## ER diagram (textual, condensed)

```
countries 1───* service_prices *───1 services
users 1───1 service_providers
users 1───* bookings *───1 service_providers
                       *───1 services
bookings 1───* booking_status_history
bookings 1───* booking_modifications
bookings 1───1 payment_transactions ───* payouts
                                       └───* refund_requests
bookings 1───* customer_feedback / provider_feedback ───* rating_responses
                                                       ───* rating_reports
bookings 1───* disputes ───* dispute_evidence
                          ───* dispute_messages
bookings 1───* incident_reports
service_providers 1───* compliance_documents
service_providers 1───* provider_availability
service_providers 1───* provider_blocked_times
service_providers 1───1 provider_wallets
chatbot_sessions 1───* ai_conversations
```
