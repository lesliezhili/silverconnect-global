# Deployment

Primary target: **Vercel** (Next.js) + **Supabase** (DB/Auth) + **Stripe** (payments) + a **FastAPI** AI agent on a container host.

For exhaustive step-by-step instructions see [`DEPLOYMENT_GUIDE.md`](../DEPLOYMENT_GUIDE.md) and [`TESTING_AND_DEPLOYMENT_GUIDE.md`](../TESTING_AND_DEPLOYMENT_GUIDE.md). This page is the operator-facing summary.

## Environments

| Env | URL pattern | Branch | Database |
|---|---|---|---|
| dev | `localhost:3000` | local | dev Supabase project |
| preview | `*-pr-<n>.vercel.app` | feature branch PR | dev Supabase project |
| staging | `staging.silverconnect-global.vercel.app` | `staging` | staging Supabase project |
| prod | `silverconnect-global.vercel.app` | `main` | prod Supabase project |

## Build

```bash
npm run build       # Next.js production build
npm run start       # serve build (smoke test)
```

`vercel.json` controls Vercel routing; `next.config.ts` controls Next behavior.

## Deploy — Web app (Vercel)

```bash
npx vercel --prod
```

Or push to `main` if Git integration is enabled.

### Required Vercel env vars (Production)

Actually consumed by `process.env.*` in TS code:

| Var | Used by | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts`, every server route | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase.ts` | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | server routes that need RLS bypass | yes (server-only) |
| `STRIPE_SECRET_KEY` | `/api/create-payment-intent`, `/api/refund-payment`, `/api/payouts`, `/api/webhooks/stripe` | yes (secret) |
| `STRIPE_WEBHOOK_SECRET` | `/api/webhooks/stripe` | yes (secret) |
| `PLATFORM_FEE_PERCENT` | `/api/payouts` | optional, default `20` |
| `AI_AGENT_URL` | `/api/ai-customer-service` | optional, default `http://localhost:8000` |

Documented in `.env.example` but **not currently read by any TS code** (safe to omit until referenced):

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — needed once Stripe Elements is wired client-side.
- `NEXT_PUBLIC_APP_URL` — referenced in some docs/scripts, no runtime consumer yet.

Used by Python AI agent only (`ai_customer_service.py`):

- `OPENAI_API_KEY` *(or Foundry equivalents)*

Used by maintenance scripts (note name mismatch with runtime — see [DEVELOPMENT.md § Env naming caveat](DEVELOPMENT.md#env-naming-caveat)):

- `SUPABASE_SERVICE_KEY` — `scripts/seed.js`, `scripts/migrate.js`, `scripts/seed-test-data.ts`, `scripts/delete-test-data.ts`.

## Deploy — Database (Supabase)

1. Create the project (regions: AU, CA, or nearest to user base).
2. Run `lib/schema.sql` in the SQL editor.
3. Apply `migrations/*.sql` in numeric order.
4. Enable RLS on every user-data table; verify policies (see [DATABASE.md](DATABASE.md)).
5. Configure auth providers (email/password; add OAuth post-MVP).
6. Enable Point-in-Time Recovery (Pro tier).

## Deploy — Stripe

1. Create a Stripe account; enable Connect (Express).
2. Add product / pricing as needed (the app charges custom amounts; products optional).
3. Add webhook endpoint: `https://<domain>/api/webhooks/stripe`. The handler currently processes:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

   Other events (e.g. `transfer.*`, `account.updated`) are accepted and logged as "Unhandled" — enable them in the dashboard only when handlers are added.
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET`.
5. Verify currencies: AUD, CNY, CAD all enabled.

## Deploy — Containers

The repo's `Dockerfile` builds the **Next.js web app** (Node 18 alpine, runs `next start` on port 3000) — *not* the FastAPI AI agent. Two paths:

### Web app (alternative to Vercel)
```bash
docker build -t silverconnect-web .
docker run -p 3000:3000 --env-file .env.local silverconnect-web
```

### Local dev stack (`docker-compose.yml`)
Stands up Postgres, Redis, Mailhog, Adminer, Redis Commander alongside the Next app. Note: the running TS code currently talks to **Supabase** for DB and ignores `DATABASE_URL` / `REDIS_URL` / `EMAIL_*` from compose — these are scaffolding for a future self-hosted path. Use compose for offline DB exploration, not as the production runtime.

### AI agent (FastAPI)
**No Dockerfile is checked in for the AI agent.** Run it directly with Python:
```bash
pip install -r requirements.txt
./run-ai-agent.sh                 # or: python ai_customer_service.py
```
Set `AI_AGENT_URL` on the web app to the AI agent's public URL. Health check: `GET /api/health`.

## Release checklist

- [ ] All migrations run in order on target DB
- [ ] Env vars set in Vercel (Production scope)
- [ ] Stripe webhook signing secret matches deployment
- [ ] Lighthouse CI passes (`/`, `/services`, `/bookings`; Perf/A11y/SEO ≥ 0.9, Best Practices ≥ 0.85)
- [ ] `npm run test:e2e:critical` green against preview URL
- [ ] Backups verified (Supabase PITR enabled)
- [ ] Domain + SSL active
- [ ] Analytics enabled (Vercel)
- [ ] Error monitoring connected *(when Sentry is added)*
- [ ] Rollback procedure rehearsed

## Rollback

- **Vercel**: `vercel rollback <deployment>` or click "Promote" on a previous deployment.
- **Database**: avoid destructive migrations; if needed, restore via Supabase PITR.
- **Stripe**: webhook events are idempotent; re-deliver from the dashboard if a deployment dropped them.

## Smoke tests post-deploy

1. `GET /` → 200, country selector loads.
2. Sign in / sign up → session cookie set.
3. Create test booking → row exists in `bookings`.
4. Stripe test card `4242 4242 4242 4242` → `payment_transactions.status = succeeded`.
5. AI chat round-trip → response in < 10s.
