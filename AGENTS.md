<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:deploy-rules -->
# Deployment

**Authoritative deploy doc**: [DEPLOYMENT.md](DEPLOYMENT.md). Read it before suggesting any deploy-related action.

Key facts:
- **Primary site**: `https://silverconnect.xinxinsoft.org` (HTTPS via AWS-1 Sydney nginx + Let's Encrypt → HTTP to VPS-5 `47.236.169.73` PM2 + nginx + Node 20). VPS-5 itself listens HTTP only; HTTPS terminates on AWS-1 and `X-Forwarded-Proto` is forwarded through.
- **Deploy command**: `.\scripts\deploy.ps1` from local Windows machine. Script builds locally, SCPs artifact to VPS, reloads PM2, health-checks, auto-rollbacks on failure.
- **Vercel is NOT the production target.** It exists only as a future Stripe webhook + payment-page HTTPS endpoint. Anything in `docs/archive/deploy-2026-05-pre-vps/` describing Vercel-as-primary is historical and must not be followed.
- **GitHub Actions** ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)) is `workflow_dispatch`-only — it does not auto-run on push. It's a manual fallback for non-Windows deploys.
- **Server-side env** (DATABASE_URL, SESSION_SECRET, GLM_API_KEY, etc.) lives in `/opt/silverconnect/.env.local` on the VPS. Don't put them in GitHub Secrets or commit them.
- `SESSION_COOKIE_SECURE` on VPS `.env.local` is **commented out** as of 2026-05-10 — HTTPS is now in front of the site (`silverconnect.xinxinsoft.org`), so `lib/auth/session.ts` falls back to `NODE_ENV === 'production'` and Secure cookies are issued. Backup of pre-change env: `/opt/silverconnect/.env.local.bak.1778417125`.

Decision history: [docs/zh/vercel-to-vps-handoff-report.md §10](docs/zh/vercel-to-vps-handoff-report.md).
<!-- END:deploy-rules -->

<!-- BEGIN:i18n-rules -->
# i18n — 新增页面必须同步全部 locale

每新增一个页面（`app/[locale]/**/page.tsx`），必须为它用到的所有 UI 文案在全部 5 个 locale 文件中补齐对应 key：`messages/en.json`、`messages/zh-CN.json`、`messages/zh-TW.json`、`messages/ja.json`、`messages/ko.json`。

- 不允许只加 `en.json` 就提交；不允许在页面里硬编码可见文案
- 5 个文件的 key 结构必须一致（缺 key 会在运行时报错）
- 改动现有页面时若新增了文案 key，同样适用本规则
<!-- END:i18n-rules -->
