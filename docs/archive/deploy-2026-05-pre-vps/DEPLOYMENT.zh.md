# 部署

主目标：**Vercel**（Next.js）+ **Supabase**（DB/Auth）+ **Stripe**（支付）+ **FastAPI** AI agent（容器主机）。

详细一步步流程见 [`DEPLOYMENT_GUIDE.md`](../../DEPLOYMENT_GUIDE.md) 与 [`TESTING_AND_DEPLOYMENT_GUIDE.md`](../../TESTING_AND_DEPLOYMENT_GUIDE.md)。本页是面向运维的摘要。

## 环境

| 环境 | URL 模式 | 分支 | 数据库 |
|---|---|---|---|
| dev | `localhost:3000` | 本地 | dev Supabase |
| preview | `*-pr-<n>.vercel.app` | feature 分支 PR | dev Supabase |
| staging | `staging.silverconnect-global.vercel.app` | `staging` | staging Supabase |
| prod | `silverconnect-global.vercel.app` | `main` | prod Supabase |

## 构建

```bash
npm run build       # Next.js 生产构建
npm run start       # 启服务（冒烟）
```

`vercel.json` 控 Vercel 路由；`next.config.ts` 控 Next 行为。

## 部署 — Web App（Vercel）

```bash
npx vercel --prod
```

或开 Git 集成后推 `main`。

### Vercel 必填环境变量（Production）

实际被 `process.env.*` 消费的：

| 变量 | 由谁使用 | 必填 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts`、所有服务端路由 | 是 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase.ts` | 是 |
| `SUPABASE_SERVICE_ROLE_KEY` | 需要绕 RLS 的服务端路由 | 是（仅服务端） |
| `STRIPE_SECRET_KEY` | `/api/create-payment-intent`、`/api/refund-payment`、`/api/payouts`、`/api/webhooks/stripe` | 是（secret） |
| `STRIPE_WEBHOOK_SECRET` | `/api/webhooks/stripe` | 是（secret） |
| `PLATFORM_FEE_PERCENT` | `/api/payouts` | 可选，默认 `20` |
| `AI_AGENT_URL` | `/api/ai-customer-service` | 可选，默认 `http://localhost:8000` |

`.env.example` 中声明但**当前 TS 代码无任何引用**（在被引用之前可不设）：

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — 等 Stripe Elements 接入客户端时再用。
- `NEXT_PUBLIC_APP_URL` — 部分 doc/script 引用，当前没有 runtime 消费方。

仅 Python AI agent（`ai_customer_service.py`）使用：

- `OPENAI_API_KEY` *（或 Foundry 等价物）*

仅维护脚本使用（与 runtime 名称不一致——见 [DEVELOPMENT.md § 环境变量命名注意](DEVELOPMENT.md#环境变量命名注意)）：

- `SUPABASE_SERVICE_KEY` — `scripts/seed.js`、`scripts/migrate.js`、`scripts/seed-test-data.ts`、`scripts/delete-test-data.ts`。

## 部署 — 数据库（Supabase）

1. 建项目（地区：AU、CA 或离用户最近的）。
2. 在 SQL editor 跑 `lib/schema.sql`。
3. 按编号顺序应用 `migrations/*.sql`。
4. 每张用户数据表启 RLS；校验策略（见 [DATABASE.md](DATABASE.md)）。
5. 配 auth provider（邮箱密码；OAuth 后续）。
6. 启 Point-in-Time Recovery（Pro 套餐）。

## 部署 — Stripe

1. 建 Stripe 账号；启 Connect（Express）。
2. 按需添加 product/pricing（应用按金额收费；product 可选）。
3. 添加 webhook：`https://<domain>/api/webhooks/stripe`。处理器当前处理：
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`

   其他事件（`transfer.*`、`account.updated` 等）会被记录为"Unhandled"——加好处理器后再在 dashboard 启用。

4. 把 signing secret 拷到 `STRIPE_WEBHOOK_SECRET`。
5. 校验 AUD、CNY、CAD 全部启用。

## 部署 — 容器

仓库内 `Dockerfile` 构建的是 **Next.js Web app**（Node 18 alpine，跑 `next start`，端口 3000）——*不是* FastAPI AI agent。两条路径：

### Web app（Vercel 替代）
```bash
docker build -t silverconnect-web .
docker run -p 3000:3000 --env-file .env.local silverconnect-web
```

### 本地 dev 栈（`docker-compose.yml`）
起 Postgres、Redis、Mailhog、Adminer、Redis Commander 与 Next app。注意：运行中的 TS 代码当前走 **Supabase**，会忽略 compose 注入的 `DATABASE_URL` / `REDIS_URL` / `EMAIL_*`——这些是未来自托管路径的脚手架。compose 适合离线查 DB，不是生产 runtime。

### AI agent（FastAPI）
**仓库未提交 AI agent 的 Dockerfile**。直接用 Python 跑：
```bash
pip install -r requirements.txt
./run-ai-agent.sh                 # 或：python ai_customer_service.py
```
把 web app 的 `AI_AGENT_URL` 指向 AI agent 的公网 URL。健康检查：`GET /api/health`。

## 发布清单

- [ ] 所有迁移按顺序应用到目标 DB
- [ ] Vercel 已配置 env vars（Production scope）
- [ ] Stripe webhook 签名 secret 与部署一致
- [ ] Lighthouse CI 通过（`/`、`/services`、`/bookings`；Perf/A11y/SEO ≥ 0.9，Best Practices ≥ 0.85）
- [ ] `npm run test:e2e:critical` 在 preview URL 上绿（前提：先打 `@critical` 标签）
- [ ] 备份已验证（Supabase PITR 已启）
- [ ] 域名 + SSL 已就绪
- [ ] Analytics 已启（Vercel）
- [ ] 错误监控已对接 *（接 Sentry 后）*
- [ ] 回滚流程已演练

## 回滚

- **Vercel**：`vercel rollback <deployment>` 或在 dashboard "Promote" 之前的 deployment。
- **数据库**：避免破坏性迁移；如必要用 Supabase PITR 还原。
- **Stripe**：webhook 事件幂等；某次部署掉了事件就在 dashboard 重新投递。

## 部署后冒烟

1. `GET /` → 200，国家选择器加载。
2. 登录/注册 → session cookie 已置。
3. 创建测试预订 → `bookings` 有行。
4. Stripe 测试卡 `4242 4242 4242 4242` → `payment_transactions.status = succeeded`。
5. AI 聊天往返 → < 10s 出回复。
