# SilverConnect Global — China Deployment Requirements

## Compliance

| Law | Requirement |
|-----|-------------|
| PIPL (个人信息保护法) | All PII stored in mainland China |
| CSL (网络安全法) | Critical data cannot leave China |
| ICP License | Required before website goes live (2-4 weeks) |
| ICP Commercial License | Required for revenue-earning platform |
| Real-name (实名) | Mobile + ID card verification mandatory |

## Infrastructure Swap

| Australia | China |
|-----------|-------|
| Vercel | Alibaba Cloud FC + CDN |
| Supabase PostgreSQL | Alibaba RDS / PolarDB |
| Stripe | Alipay + WeChat Pay |
| Google Maps | Amap (高德地图) GCJ-02 coords |
| Email (SendGrid) | Alibaba DM / WeChat templates |
| SMS (Twilio) | Alibaba SMS |
| Push (FCM) | Huawei Push / JPush |

## Key Decisions

### WeChat Mini Program (Recommended for China)

| Factor | Web App | Mini Program |
|--------|---------|-------------|
| Distribution | URL discovery | In WeChat (1.2B users) |
| Payment | Redirect | Native 1-tap |
| Push notifications | SMS (costly) | Free templates |
| Senior adoption | Teach browser | Already use WeChat |
| Trust | Unknown URL | WeChat verified |

### Authentication Differences

- AU: Email + password → email verification
- CN: Mobile + SMS → real-name → ID card photo → face recognition

### Cost Estimate (Annual, CNY)

| Item | Cost |
|------|------|
| Alibaba Cloud | ¥50K-120K |
| Real-name verification API | ¥0.5-2/call |
| SMS | ¥0.04/msg |
| Amap API | Free (30K/day) |
| Domain (.cn) | ¥50/yr |
| **Year 1 total** | **¥100K-200K** |

## Timeline (9-12 months)

1. Entity setup (Month 1-2)
2. ICP filing (Month 2-3)
3. Infrastructure (Month 3-4)
4. Code fork + adapt (Month 4-5)
5. Real-name system (Month 5-6)
6. PIPL compliance audit (Month 6-7)
7. Beta launch, 1 city (Month 7-8)
8. Public launch (Month 9-12)

## Technical Migration Plan — Alibaba Cloud (module by module)

Grounded in the current codebase (audited 2026-07). This fills in the
*how* under the "Infrastructure Swap" table above — each module's actual
current implementation, target service, and the concrete steps/risks.

### 1. Database — Supabase Postgres → 阿里云 RDS for PostgreSQL

**Current**: plain Postgres reached via `DATABASE_URL` through the
`postgres` npm package (`lib/db/pg-connection.ts`), wrapped by Drizzle
ORM. No Supabase-specific SQL features (RLS policies, `auth.uid()`,
Supabase Realtime/RPC) are used — confirmed via full-repo grep.

**Target**: 阿里云 RDS for PostgreSQL (or PolarDB for PostgreSQL if HA/
read-replica scaling matters later).

**Steps**:
- Provision RDS instance in the same region as the FC/compute deploy
  (co-locate to avoid cross-region latency).
- `pg_dump` from Supabase → restore into RDS (schema + data), or replay
  the same `zz-*.mjs` raw-SQL migration scripts this project already
  uses against the new instance from empty.
- Swap `DATABASE_URL` — this is a pure connection-string change, no
  application code changes needed, *if* step 2 below (Storage) is done
  in the same pass.
- Verify SSL mode (`DATABASE_SSL` env var already exists) matches
  RDS's required SSL cert config.

**Risk**: low — this is the most mechanical of the four modules.

### 2. Object storage / CDN — Supabase Storage → 阿里云 OSS + CDN

**This is not covered by module 1** — Supabase is used for *two*
separate things here, and Storage is the one people forget:
- `app/api/upload/evidence/route.ts` — dispute evidence photos, bucket
  `evidence`, via `@supabase/supabase-js`'s `sb.storage.from("evidence")`.
- `app/api/provider/wwvp-upload/route.ts` — provider compliance docs
  (WWVP, police check, first aid), bucket `documents`.

Both call `.upload()` + `.getPublicUrl()` and fall back to a fake URL if
`NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are unset — so
this fails silently in dev/misconfigured envs, worth tightening when
migrating.

**Target**: 阿里云 OSS (对象存储) + CDN 加速域名.

**Steps**:
- Create OSS buckets mirroring `evidence`/`documents`.
- Rewrite both upload routes' storage calls to the OSS SDK
  (`ali-oss` npm package) — same shape (upload buffer, get public/
  signed URL), so this is a contained, mechanical rewrite of two files,
  not a redesign.
- Bulk-copy existing objects from Supabase Storage to OSS if any China
  users already have evidence/documents on file (unlikely pre-launch,
  but check before cutover).
- Bind a CDN domain to the OSS bucket for the `documents`/`evidence`
  public URLs.

**Risk**: low-medium — contained to 2 files, but don't skip it (easy to
migrate the DB and forget Storage is a separate Supabase product).

### 3. Hosting / deploy — Vercel → 阿里云

**Current**: `.github/workflows/ci.yml` (Deploy to Vercel job) runs
`vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`
via the Vercel CLI, gated to `main`. `vercel.json` just pins
`{"framework": "nextjs", "regions": ["syd1"]}`. `@vercel/analytics` is
also in use (cosmetic — drop or replace with 阿里云 ARMS/自建埋点).

Cron is **already** GitHub-Actions-driven, not Vercel Cron
(`.github/workflows/cron.yml` calls `/api/cron/*` routes directly via
HTTP with a `CRON_SECRET` bearer token) — this part is *already*
platform-agnostic and needs no redesign, just point `BASE_URL` at the
China domain.

**Target options, in order of fit for a Next.js SSR app**:
- **函数计算 FC (Function Compute)** — closest to Vercel's serverless
  model; needs the Next.js standalone output adapter for FC.
- **SAE (Serverless App Engine)** — simpler ops story, runs a
  long-lived Node process (`next start`), less cold-start-sensitive.
- **ACK (容器服务) + ECS** — most control, most ops overhead; only worth
  it if you need it for other reasons (e.g., co-hosting other services).

**Steps**:
- Pick one of the above (SAE is the pragmatic default for a first
  China deployment — least new tooling to learn).
- Replace the "Deploy to Vercel" CI job with the equivalent 阿里云 CLI/
  API deploy step; keep Lint/Build/E2E jobs unchanged (platform-agnostic).
- Remove/replace `vercel.json`, `@vercel/analytics`, `VERCEL_*` env
  vars (`VERCEL_DEPLOY_HOOK`, `VERCEL_OIDC_TOKEN`) for the China
  deployment's config.
- Domain: needs the ICP-registered domain pointed at the 阿里云 deploy,
  not `silverconnect-global.vercel.app`.

**Risk**: medium — mechanical once a target service is chosen, but the
FC-vs-SAE-vs-ACK choice affects how much of the Next.js build output
adapter work is needed; recommend a throwaway spike deploy of the
current app to SAE before committing.

### 4. Payments — Stripe → 支付宝 (Alipay) + 微信支付 (WeChat Pay)

**This is the hard one — budget the most time here.**

**Current Stripe surface** (`app/api/payments/*`, `app/api/donations/
create-intent`, `app/api/webhooks/stripe`):
- `create-intent` — customer booking payment (PaymentIntent)
- `capture` — captures the authorized payment after service completion
- **`connect-onboard`** — creates a Stripe Connect Express account per
  provider (`stripe.accounts.create` with `transfers: {requested: true}`)
  + onboarding link
- **`payout`** — pays providers via `stripe.transfers.create` (Connect
  transfers to their connected account)
- `webhooks/stripe` — handles payment/refund/donation events

The two **bolded** routes are the problem: Stripe Connect is a
marketplace/split-payment primitive with **no direct equivalent** in
Alipay or WeChat Pay. Neither has a "create a sub-account for each of
my providers and transfer funds to them individually" API in the same
shape. The closest analogues are:
- **支付宝分账 (Alipay profit-sharing / `alipay.trade.royalty.relation.bind`
  + `alipay.trade.order.settle`)** — lets you split a single payment
  across multiple accounts at settlement time, but the provider (收款方)
  must be bound in advance and the model is "split this one order,"
  not "hold a running balance and transfer later" the way Stripe Connect
  does.
- **微信支付分账 (WeChat Pay profit-sharing)** — same shape, same
  constraint (receivers must be added/verified via `分账接收方` API
  first, splits happen at order settlement, not arbitrary later transfer).

This means the payout/escrow *model*, not just the SDK calls, needs
redesigning for China: probably a two-phase design (customer pays
platform via Alipay/WeChat → platform holds funds in its own merchant
account → 分账 settlement to the provider's bound account when the
booking releases), replacing the current Stripe-Connect-holds-the-
balance model.

**Good news**: `lib/payments/alipay.ts` and `lib/payments/wechat.ts`
**already exist** as stub adapters (RSA request signing left as `TODO`
in both), and `lib/payments/provider-config.ts` / `lib/payments/
gateway.ts` already implement a `PAYMENT_PROVIDER`-env-driven gateway
abstraction (currently only switching between `stripe_xero` and a
third-party `phledger` HTTP API) — someone started this and stopped.
Neither stub is imported/called anywhere yet (dead code today), but the
seams are already there to build on rather than starting from zero.
Env vars are already documented too: `ALIPAY_APP_ID`, `ALIPAY_GATEWAY`,
`ALIPAY_PRIVATE_KEY`, `ALIPAY_PUBLIC_KEY`, `WECHAT_PAY_APP_ID`,
`WECHAT_PAY_MERCHANT_ID`, `WECHAT_PAY_SERIAL_NO`, `WECHAT_PAY_PRIVATE_KEY`,
`WECHAT_PAY_API_V3_KEY`.

**Steps**:
- Finish `lib/payments/alipay.ts`/`wechat.ts` RSA signing (both
  platforms require signed requests — this is well-documented,
  mechanical crypto work, not a design question).
- Design the 分账 settlement flow to replace Stripe Connect's transfer
  model (see above) — this is the one genuine design decision in this
  whole migration, get it reviewed before building.
- New webhook handlers for Alipay/WeChat async notification callbacks
  (`webhooks/stripe/route.ts`'s equivalent, per provider — they use
  different signature/callback formats from Stripe).
- Real-name verification ties in here too (per the "Authentication
  Differences" section above) — Alipay/WeChat Pay generally require
  the payer's real-name-verified identity to match, so this isn't
  fully separable from the real-name system workstream.

**Risk**: high — the only module here with a genuine architecture
decision, not just an SDK swap. Do this last, after DB/Storage/Hosting
are proven on 阿里云, and get the 分账 settlement design reviewed
(ideally by someone who's shipped an Alipay/WeChat Pay marketplace
integration before) prior to writing code.

### Suggested execution order

1. DB + Storage (module 1+2) — low risk, proves the 阿里云 account/
   network setup end-to-end without touching money or the deploy
   pipeline.
2. Hosting (module 3) — get the existing app running on 阿里云 against
   the migrated DB/Storage, still using Stripe (fine for internal
   testing even though Stripe won't work for real mainland users).
3. Payments (module 4) — last, once 1-3 are stable, because it's the
   only module with real design risk and touches money movement
   directly.

This ordering also lines up with the existing 9-12 month timeline above:
modules 1-3 fit inside "Infrastructure" (Month 3-4) + "Code fork + adapt"
(Month 4-5), and module 4 is the bulk of what "Code fork + adapt" and
part of "Real-name system" (Month 5-6) actually involve.
