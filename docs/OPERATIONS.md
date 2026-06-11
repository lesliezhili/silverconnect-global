# Operations Runbook

Operator-facing playbook. For solution-level overview see [`SOLUTION_DESIGN_AND_OPERATIONS.md`](../SOLUTION_DESIGN_AND_OPERATIONS.md).

## 1. Service map

| Component | Provider | Dashboard |
|---|---|---|
| Web app | Vercel (API routes capped at `maxDuration: 30s` in `vercel.json`) | vercel.com |
| Database / Auth | Supabase | supabase.com |
| Payments | Stripe | dashboard.stripe.com |
| AI agent | Container host (Fly/Railway/Cloud Run) | host-specific |
| DNS / domain | Registrar of choice | — |

## 2. Monitoring & alerting

| Signal | Source | Threshold |
|---|---|---|
| Web 5xx rate | Vercel Analytics / logs | > 1% over 5 min |
| API p95 latency | Vercel | > 800 ms over 10 min |
| DB connections | Supabase | > 80% pool |
| Failed payments | Stripe | > 5% over 1 hour |
| Webhook failures | Stripe | any consecutive 3 |
| AI agent health | `/api/health` | non-200 |
| Disputes opened | DB (`disputes`) | > 5 / day |
| Safety flags / incidents | DB | any `severity = critical` → page on-call |

Until centralized alerting is wired, on-call should check the Vercel + Stripe + Supabase dashboards daily.

## 3. On-call

- **Rotation**: weekly, Mon 09:00 local.
- **Pager**: WhatsApp/WeChat `+61452409228` (primary), regional fallbacks per [README](../README.md#emergency-contacts).
- **Response SLAs**:
  - Sev1 (outage / payment broken / safety): 15 min ack, 1 h mitigation.
  - Sev2 (degraded): 1 h ack, 4 h mitigation.
  - Sev3 (minor): next business day.

## 4. Common runbooks

### 4.1 Web app down
1. Check Vercel deployment status. Promote previous deployment if a bad release.
2. Check Supabase project status (connection limits, paused project).
3. Check DNS / SSL.

### 4.2 Stripe webhooks failing
1. Open Stripe → Developers → Webhooks → endpoint logs.
2. Verify signing secret matches `STRIPE_WEBHOOK_SECRET` in Vercel.
3. Re-deliver failed events. **Caveat:** the handler is not yet idempotent — re-delivery of `payment_intent.succeeded` may insert duplicate `payment_transactions` rows. Check before bulk-redelivering.
4. Confirm `bookings.payment_status` and `payment_transactions` reflect the result; deduplicate any duplicate rows manually.

### 4.3 Payment stuck in escrow
- Inspect `payment_transactions.escrow_status`.
- If `held` past T+48h with `bookings.status = COMPLETED`: run manual release via admin API.
- If a refund was requested: check `refund_requests` and process via `/api/refund-payment`.

### 4.4 RLS denial reports
- A user reports "cannot see my booking":
  1. Check `auth.uid()` matches `bookings.customer_id` / `provider_id`.
  2. Verify the relevant RLS policy exists (run policy listing in Supabase).
  3. Never disable RLS as a workaround; fix policy.

### 4.5 AI agent unhealthy
1. Curl `AI_AGENT_URL/api/health`.
2. Check container logs for OpenAI / Azure auth errors.
3. Restart container; web app falls back to direct contact numbers gracefully.

### 4.6 Slow database
1. Supabase → Reports → slow queries.
2. Check missing indexes (see [DATABASE.md § indexing](DATABASE.md#indexing-strategy)).
3. Check long-running transactions; kill if necessary.

## 5. Backups & recovery

- **Supabase PITR** (Pro tier): 7-day window. Restore via the dashboard to a new project, then promote.
- **RPO** 24 h / **RTO** 4 h.
- Test restore quarterly to a scratch project.

## 6. Routine maintenance

| Cadence | Task |
|---|---|
| Daily | Glance dashboards, check disputes/incidents queue |
| Weekly | Review failed payments + payouts; clear refund queue |
| Monthly | `npm audit`, dependency PRs |
| Quarterly | Rotate Stripe + Supabase keys; restore-test backups |
| Annually | Threat model review; pen test |

## 7. Incident response

1. **Detect** — alert or user report.
2. **Triage** — assign severity; open an incident note (date, summary, owner).
3. **Mitigate** — restore service first; root-cause second.
4. **Communicate** — status update to affected users for Sev1/2.
5. **Resolve** — confirm with smoke tests (see [DEPLOYMENT § Smoke tests](DEPLOYMENT.md#smoke-tests-post-deploy)).
6. **Postmortem** — within 5 business days for Sev1/2: timeline, root cause, action items. Blameless.

### Security incident (data leak / breach)
- Rotate exposed secrets immediately.
- Identify scope via DB audit / logs.
- Notify affected users per applicable law (see [SECURITY.md § Compliance](SECURITY.md#4-compliance)).
- File a disclosure report.

## 8. Capacity

| Metric | Action threshold |
|---|---|
| Supabase DB CPU > 70% sustained | Upsize tier |
| Vercel function timeouts | Move to Edge or split route |
| AI agent QPS saturating | Horizontal scale, add cache for KB lookups |

## 9. Useful commands

```bash
# Tail Vercel logs
vercel logs <deployment> --follow

# Stripe re-deliver event
stripe events resend <evt_xxx>

# Apply a hotfix migration
psql "$SUPABASE_DB_URL" -f migrations/00X_hotfix.sql
```
