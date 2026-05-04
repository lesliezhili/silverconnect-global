# Security

## 1. Reporting a vulnerability

Email **yanhaoau@gmail.com** with subject `SECURITY: <summary>`. Do not file a public GitHub issue.
Include: affected area, reproduction steps, impact, and any PoC. We will acknowledge within 72 hours.

Please do not test against production accounts that are not yours, and do not access data beyond what is required to demonstrate the issue.

## 2. Threat model (summary)

| Asset | Threat | Mitigation |
|---|---|---|
| User PII (name, address, medical notes) | Unauthorized read | Postgres RLS; admin-only service-role key on server |
| Payment info | Card data theft | Never stored — Stripe Elements + Payment Intents only |
| Auth tokens | Session hijack | HTTP-only cookies, Secure + SameSite=Lax, short expiry |
| Webhooks | Forgery | Stripe signature verification (`STRIPE_WEBHOOK_SECRET`) |
| Provider docs (police checks etc.) | Leak | Supabase Storage with signed URLs, RLS |
| AI chat | Prompt injection / data exfil | Server-side intent allow-list, no tool that reads other users |
| Disputes evidence | Tampering | Append-only `dispute_messages`; `is_internal` for staff notes |

## 3. Controls

### Authentication
- Supabase Auth (email/password). Password policy: ≥ 8 chars, complexity enforced by Supabase.
- Sessions: JWT in HTTP-only, Secure cookie. No localStorage tokens.
- Rate limit auth endpoints (planned: Upstash).

### Authorization
- Row-Level Security on most PII tables (`users`, `service_providers`, `bookings`, `customer_*`, `disputes`, `incident_reports`, `compliance_documents`, etc.). Policy: `auth.uid()` matches owner column.
- **Known RLS gaps to fix before production:**
  - `payment_transactions` — no `ENABLE ROW LEVEL SECURITY` in any tracked migration. Currently any authenticated client using the anon key could read all rows. Add an owner-scoped policy.
  - `compliance_alerts`, `dispute_messages` — RLS enabled but no explicit `CREATE POLICY`, so they are deny-all to non-service-role callers. Either add policies or stop enabling RLS without one.
- Service-role key used only in server route handlers.
- Admin role checked via `users.role = 'admin'` (separate from `users.user_type`, which is `customer | provider`). Schema has two parallel role-ish columns — consolidate when convenient.

### Transport & secrets
- HTTPS-only (Vercel default).
- Secrets in environment variables; never committed. `.env*` in `.gitignore`.
- Rotate Stripe and Supabase keys quarterly and on any suspected leak.

### Input validation
- All API route inputs validated server-side (length, type, enum).
- SQL injection: parameterized queries via Supabase client / `postgres` lib only.
- XSS: React's escaping by default; never `dangerouslySetInnerHTML` with user input.

### Output / data exposure
- Never return another user's records — RLS is the backstop, application code the first line.
- Logs must not contain card numbers, CVCs, or full tokens.

### Payments
- Use Stripe Elements; the card never touches our servers.
- Webhook handler: signature-verify on every request. Idempotency-by-event-id is not yet enforced — tracked tech debt.
- Refund logic: server-side only; never trust client-supplied amount.

### File uploads (compliance docs, dispute evidence)
- Store via Supabase Storage with signed URLs.
- Limit MIME types and size at upload.
- Scan for malware *(planned)*.

### AI safety
- The agent has an allow-list of tools; it cannot run arbitrary SQL.
- Emergency keywords trigger contact disclosure, not action.
- Never include service-role secrets in prompts.

## 4. Compliance

- **Australia**: Privacy Act 1988 — collect minimum PII; allow data export & deletion.
- **Canada**: PIPEDA — same.
- **China**: PIPL — pending review for cross-border data transfer; CN tenant data should reside in CN region.
- **PCI-DSS**: out of scope (Stripe handles cardholder data).

## 5. OWASP Top 10 — quick map

| Risk | Status |
|---|---|
| A01 Broken access control | RLS + server checks |
| A02 Crypto failures | TLS, hashed passwords (Supabase), no plaintext secrets |
| A03 Injection | Parameterized queries; no raw SQL with user input |
| A04 Insecure design | RLS-first, escrow-by-default |
| A05 Security misconfig | Secrets in env, RLS enforced, CORS scoped |
| A06 Vulnerable components | `npm audit` in CI; renovate / dependabot *(planned)* |
| A07 Auth failures | Supabase Auth, rate limit *(planned)* |
| A08 Data integrity | Webhook signatures, append-only audit tables |
| A09 Logging/monitoring | Vercel + Supabase logs; Sentry *(planned)* |
| A10 SSRF | No user-controlled outbound URLs in server routes |

## 6. Incident response

See [OPERATIONS.md § Incident response](OPERATIONS.md#7-incident-response).
