# API Reference

All routes are Next.js Route Handlers under `app/api/**/route.ts`. Base URL: same origin as the app.

- **Format**: JSON in / JSON out. **Body field casing is inconsistent across routes** — most newer endpoints use camelCase (`bookingId`, `providerId`), while some (notably `/api/feedback`) still expect snake_case (`booking_id`). Per-endpoint examples below state the actual key names; when in doubt the route handler is authoritative.
- **Auth**: Supabase session cookie. Two role-ish columns currently coexist on `users`: `user_type` (`customer` | `provider`, set on signup) and `role` (admin checks read `profile.role === 'admin'` in `/api/ai/*` and `/api/safety-flags`). Treat them as one logical "role" until the schema is consolidated.
- **Errors**: `{ "error": "<message>" }` with HTTP status (400 / 401 / 403 / 404 / 409 / 422 / 500).

> Methods listed here mirror what is actually `export`ed from each `route.ts`. When in doubt, the source is authoritative.

## Conventions

| HTTP | Meaning |
|---|---|
| `GET` | List or retrieve |
| `POST` | Create |
| `PUT` / `PATCH` | Update (see per-route below) |
| `DELETE` | Remove |

Pagination (where supported): `?limit=<n>&offset=<n>`.

---

## Bookings

### `/api/bookings` — `GET, POST, PATCH`
- `GET` — list caller's bookings. Filters: `?status=`, `?from=`, `?to=`, `?role=customer|provider`.
- `POST` — create. Body (camelCase): `{ providerId, serviceId, bookingDate, startTime, duration, address, specialInstructions? }`. `duration` is in minutes. Returns the inserted `bookings` row (status=`PENDING`, payment_status=`UNPAID`).
- `PATCH` — bulk status / reassignment update.

### `/api/bookings/[id]` — `GET, PUT, DELETE`
- `GET` — retrieve one (RLS-checked).
- `PUT` — update (status, reschedule). Body uses camelCase: `{ status?, bookingDate?, startTime?, reason? }`.
- `DELETE` — cancel; refund eligibility computed server-side per FR-02.

### `/api/bookings/recurring` — `GET, POST, PUT, DELETE`
Recurring rule (`weekly | biweekly | monthly`).

### `/api/bookings/reminders` — `GET, POST, PUT, DELETE`
Reminders for upcoming bookings.

### `/api/booking` — `GET, POST, PATCH, DELETE`
*Legacy single-resource endpoint kept for backward compatibility.* Body shape: `{ action: "create"|"cancel"|"modify"|"status", booking_id?, details? }`.

---

## Customer

### `/api/customer` — `GET, POST, PUT`
Caller's profile (read / create / update).

### `/api/customer/addresses` — `GET, POST, PUT, DELETE`
Saved addresses.

### `/api/customer/favorites` — `GET, POST, DELETE`
Favorited providers.

### `/api/customer/payment-methods` — `GET, POST, PUT, DELETE`
Stored Stripe payment methods (token references only — no card data).

---

## Provider

### `/api/provider` — `GET, POST`
Authenticated provider profile (`POST` for onboarding-time create).

### `/api/provider/availability` — `GET, POST, DELETE`
Weekly availability windows.

### `/api/provider/blocked` — `GET, POST, DELETE`
### `/api/provider/blocked-times` — `GET, POST, PUT, DELETE`
Blocked dates / time ranges (two endpoints; `blocked-times` is the newer detailed model).

### `/api/provider/pricing` — `GET, POST, PATCH, DELETE`
Provider-specific pricing overrides.

### `/api/provider/zones` — `GET, POST, PUT, DELETE`
Service zones (geographic coverage).

### `/api/provider/stats` — `GET`
Earnings, bookings, rating aggregates.

### `/api/provider/wallet` — `GET, POST`
Wallet balance and pending payouts; `POST` requests a payout.

### `/api/provider/documents` — `GET, POST, PUT, DELETE`
Compliance documents upload metadata.

### `/api/provider/compliance` — `GET, POST, PUT, DELETE`
Compliance dashboard / records.

### `/api/provider/verify` — `GET, POST`
Verification status (`GET`) / trigger verification (`POST`).

### `/api/provider/badges` — `GET, POST, DELETE`
Earned badges (e.g. 100 bookings, 5★ streak). `POST` is admin-only award.

---

## Pricing

### `/api/pricing` — `GET, POST`
- `GET ?service_id=&country_code=&hours=` → `{ base_price, tax, total, currency, tier }`.
- `POST` — admin upsert of `service_prices`.

---

## Payments

### `/api/create-payment-intent` — `POST`
Body: `{ bookingId, amount, currency, customerEmail }`. `amount` is in the smallest currency unit (cents). Returns `{ clientSecret }` for the Stripe PaymentIntent.

### `/api/refund-payment` — `POST`
Body: `{ paymentIntentId }`. Calls Stripe `refunds.create` for the full amount; returns `{ success, refundId }`. Partial-amount and reason fields are not yet supported by this endpoint.

### `/api/payments` — `GET, POST`
Caller's payment history; `POST` records / reconciles a transaction (server-side use).

### `/api/payments/payouts` — `GET, POST`
### `/api/payouts` — `POST`
Provider payout history (`payments/payouts GET`) and ad-hoc payout trigger (`payouts POST`).

### `/api/payments/refunds` — `GET, POST`
Refund history / requests.

### `/api/webhooks/stripe` — `POST`
Stripe webhook receiver. Validates signature using `STRIPE_WEBHOOK_SECRET`. Handles `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`. Other event types are logged and ignored. **Idempotency note**: the handler does not yet dedupe by `event.id`; redelivery may insert duplicate `payment_transactions` rows — adding `UNIQUE(stripe_event_id)` is tracked tech debt.

---

## Feedback

### `/api/feedback` — `GET, POST, PUT`
Reviews. `POST ?type=rating` body uses **snake_case**: `{ booking_id, provider_id?, rating, review_text }`. Caller must own the booking and `bookings.status` must be `completed`. Inserted into a `ratings` table (see [DATABASE.md § Known schema debt](DATABASE.md#known-schema-debt)).

### `/api/feedback/responses` — `GET, POST`
Provider responses to a review.

### `/api/feedback/reports` — `GET, POST`
Abuse reports against a review.

---

## Disputes & Safety

### `/api/disputes` — `GET, POST`
List / create disputes. `POST` body: `{ bookingId, reason, description? }`. Caller must be the booking's customer; the dispute amount is auto-set from `booking.total_price`.

### `/api/disputes/[id]` — `GET, PUT`
View / update a dispute (admin or party).

### `/api/incidents` — `GET, POST`
Incident reports. `POST` body (camelCase): `{ bookingId, incidentType, severity, description, location?, witnesses?, evidenceUrls? }`. All four required fields validated server-side; caller must be the booking's customer or provider.

### `/api/safety-flags` — `GET, POST, PUT`
Safety flags (`PUT` is admin status update).

---

## AI

### `/api/ai/chat` — `POST`
Body: `{ message, session_id?, language?, region? }`. Returns assistant reply.

### `/api/ai/sessions` — `GET, POST, PUT`
Caller's AI sessions.

### `/api/ai/conversations` — `GET, POST, PUT, DELETE`
Per-session conversation messages.

### `/api/ai/intents` — `GET, POST, PUT, DELETE`
Intent definitions (admin-managed).

### `/api/ai/knowledge-base` — `GET, POST, PUT, DELETE`
KB articles. `GET` is public-readable (no auth required for published articles).

### `/api/ai/templates` — `GET, POST, PUT, DELETE`
Reply templates used by automations.

### `/api/ai/automation` — `GET, POST, PUT, DELETE`
Automation rules (admin / system).

### `/api/ai-customer-service` — `GET, POST`
Legacy proxy to the FastAPI agent. `POST`: `{ message, user_id?, language, region, contact_method }`. `GET` is health/info.

---

## Status codes

| Code | Use |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Forbidden / RLS violation |
| 404 | Not found |
| 409 | Conflict (e.g., slot taken) |
| 422 | Business rule violation (e.g., refund window) |
| 500 | Internal error |

## Webhook security

`/api/webhooks/stripe` verifies the signature using `STRIPE_WEBHOOK_SECRET` and rejects unsigned / bad-signature requests with 400. Idempotency is not yet enforced at the handler level — see endpoint note above.

## Rate limits *(planned)*

- `/api/ai/*`: 30 req/min/user.
- Auth-bound mutations: 60 req/min/user.

## Endpoint count

44 route files; methods per route are listed above. To regenerate this list:

```bash
find app/api -name route.ts -print
```
