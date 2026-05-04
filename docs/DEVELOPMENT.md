# Development Guide

## 1. Prerequisites

- **Node.js 20.x** and **npm 10.x** (enforced via `package.json#engines`)
- **Python 3.10+** (only for the AI agent)
- **Git**
- A Supabase project (free tier OK)
- A Stripe test account
- Optional: Docker (for `docker-compose up`)

## 2. First-time setup

```bash
git clone <repo-url> silverconnect-global
cd silverconnect-global
npm install
cp .env.example .env.local   # then fill in keys
```

Required env vars (`.env.local`):

```bash
# Runtime — consumed by TS server code
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server-only
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PLATFORM_FEE_PERCENT=20             # optional, default 20

# Maintenance scripts — note: scripts use a different name (see caveat below)
SUPABASE_SERVICE_KEY=               # same value as SUPABASE_SERVICE_ROLE_KEY

# AI agent (optional locally)
AI_AGENT_URL=http://localhost:8000
OPENAI_API_KEY=                     # consumed by ai_customer_service.py only

# Declared in .env.example but not currently read by any TS code:
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Env naming caveat

Server runtime reads `SUPABASE_SERVICE_ROLE_KEY` while `scripts/seed.js`, `scripts/migrate.js`, `scripts/seed-test-data.ts`, and `scripts/delete-test-data.ts` read `SUPABASE_SERVICE_KEY`. Set both to the same value, or unify the name in a follow-up cleanup.

### `.env.example` is largely aspirational

The shipped `.env.example` declares dozens of vars (Twilio, Sentry, Datadog, `JWT_SECRET`, `RATE_LIMIT_*`, `GOOGLE_MAPS_API_KEY`, `DATABASE_URL`, `REDIS_URL`, `EMAIL_*`, `VERCEL_*`, etc.) that **no TS code currently reads** — they document intended future integrations. Treat the runtime list above as the authoritative source of what actually has to be set.

### Docker compose is for local infra exploration only

`docker-compose.yml` starts a local Postgres, Redis, and Mailhog. The running app talks to **Supabase**, not the local Postgres, so compose is useful for poking at SQL via Adminer (`:8080`) but does not give you a self-contained dev environment.

There are also two sources for the platform fee percentage that disagree on the default:
- DB column `bookings.platform_fee_percentage` defaults to **15.0**.
- `PLATFORM_FEE_PERCENT` env var (used by `/api/payouts`) defaults to **20**.

Pick one source of truth before this drifts further.

## 3. Database setup

```bash
# Option A: paste lib/schema.sql into Supabase SQL editor, then each migrations/*.sql in order
# Option B:
npm run db:migrate
npm run db:seed
```

## 4. Run

```bash
npm run dev          # Next.js on :3000
./run-ai-agent.sh    # FastAPI AI agent on :8000 (optional)
```

## 5. Common scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Next dev server |
| `npm run build` | Production build |
| `npm run start` | Run built app |
| `npm run lint` | ESLint over `app components lib api scripts __tests__ types` |
| `npm test` / `npm run test:unit` | Jest |
| `npm run test:watch` | Jest watch |
| `npm run test:coverage` | Jest with coverage |
| `npm run test:e2e` | Playwright |
| `npm run test:e2e:ui` | Playwright UI |
| `npm run test:performance` | Lighthouse |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed dev data |
| `npm run docker:up` / `:down` | Compose stack (local Postgres/Redis/Mailhog — see caveat below) |

## 6. Project layout

```
app/                  Next.js App Router
  api/                Route handlers (REST endpoints)
  (pages)/            Routed pages
components/           Client/server React components
lib/                  Domain logic, Supabase client, types
  ai/                 AI helpers (e.g. pricingTemplates)
migrations/           Versioned SQL migrations
scripts/              Maintenance / migrate / seed scripts
__tests__/            Jest unit/integration tests
e2e/                  Playwright specs
k6/                   Load tests
docs/                 Engineering docs (this folder)
```

## 7. Coding conventions

> ⚠️ This is **not stock Next.js**. See [`AGENTS.md`](../AGENTS.md). Read `node_modules/next/dist/docs/` before writing route handlers, server actions, or layout code.

- **TypeScript strict** — no `any` in new code.
- **Server-only secrets** — never import `SUPABASE_SERVICE_ROLE_KEY` in a client component.
- **Surgical edits** — change only what the task demands.
- **Simplicity first** — least code that solves the problem; no speculative flags or abstractions.
- **Comments**: only when the *why* is non-obvious. No what-comments.
- **i18n**: any new customer-facing string lands in `lib/translations.ts` with EN + ZH.
- **Pricing**: never inline-compute; route through `lib/pricing.ts`.
- **Auth**: never trust client claims; re-check user identity on the server.
- **RLS**: when adding a table, ship its policy in the same migration.

## 8. Git workflow

- Branch: `feat/<short>`, `fix/<short>`, `chore/<short>`.
- Commits: imperative subject, ≤ 72 chars; reference the module (e.g. `feat(payments): refund window enforcement`).
- PRs: link the issue/spec, include test plan, screenshots for UI.
- See [`CONTRIBUTING.md`](../CONTRIBUTING.md).

## 9. Debugging tips

- **Supabase RLS denials** show up as empty arrays — inspect with the SQL editor as the user's role.
- **Stripe webhook locally** — `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
- **AI agent** — `curl localhost:8000/api/health` first; check `OPENAI_API_KEY`.
- **Currency mismatches** — Stripe charge currency must equal `countries.currency_code` for the booking.

## 10. IDE

- VSCode recommended. Install ESLint + Tailwind IntelliSense + Prettier.
- Use `Ctrl/Cmd+Click` on relative markdown links to navigate docs.
