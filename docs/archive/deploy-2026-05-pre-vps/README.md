# Archive: pre-VPS deploy docs (≤ 2026-05-09)

These documents describe the **Vercel-as-primary** deployment model that was in effect before 2026-05-10. They are kept for history only and should **not** be followed for current deploys.

For current deployment instructions see **[/DEPLOYMENT.md](../../../DEPLOYMENT.md)** at the repo root.

## Why archived

On 2026-05-10 the project switched primary hosting from Vercel back to a single VPS at `http://47.236.169.73` (PM2 + nginx + Node 20). Build moved out of GitHub Actions to a local PowerShell script (`scripts/deploy.ps1`). The Vercel project is retained only as a future HTTPS landing point for Stripe webhook + payment pages.

Decision rationale: [docs/zh/vercel-to-vps-handoff-report.md §10](../../zh/vercel-to-vps-handoff-report.md).

## Contents

| File | Original location | Era |
|---|---|---|
| `DEPLOYMENT.md` | `docs/DEPLOYMENT.md` | Vercel + Supabase + Stripe summary (English) |
| `DEPLOYMENT.zh.md` | `docs/zh/DEPLOYMENT.md` | Same, Chinese |
| `DEPLOYMENT.root.md` | `/DEPLOYMENT.md` | CC-facing repo root quickstart, Vercel push-to-deploy |
| `DEPLOY.sh` | `/DEPLOY.sh` | Echo-only Vercel deploy guide script |
| `DEPLOYMENT_GUIDE.md` | `/DEPLOYMENT_GUIDE.md` | Long-form deployment guide (Node + Vercel + Supabase) |
| `TESTING_AND_DEPLOYMENT_GUIDE.md` | `/TESTING_AND_DEPLOYMENT_GUIDE.md` | Test harness + deployment combined |
| `backup-cicd-plan.md` | `docs/zh/backup-cicd-plan.md` | Dual-Vercel "163 backup account" CI/CD plan |
| `backup-repo-DEPLOYMENT.md` | `docs/zh/backup-repo-DEPLOYMENT.md` | Backup repo's Vercel deploy guide |
| `cicd-onboarding.md` | `docs/zh/cicd-onboarding.md` | New-dev onboarding for the dual-Vercel CI/CD |
| `deploy-to-staging.md` | `docs/zh/deploy-to-staging.md` | Vercel staging (silverconnect-one) deploy procedure |

## Do not

- Follow these for current deploys
- Resurrect these as canonical without explicit decision reversal
- Reference Vercel as the production target unless it's the future Stripe-pay subset specifically described in [docs/zh/migrate-vercel-to-vps.md §3.3](../../zh/migrate-vercel-to-vps.md)
