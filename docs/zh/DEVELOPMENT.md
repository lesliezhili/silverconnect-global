# 开发指南

## 1. 前置要求

- **Node.js 20.x** + **npm 10.x**（`package.json#engines` 强制）
- **Python 3.10+**（仅 AI agent 需要）
- **Git**
- 一个 Supabase 项目（Free 即可）
- 一个 Stripe 测试账号
- 可选：Docker（用于 `docker-compose up`）

## 2. 首次搭建

```bash
git clone <repo-url> silverconnect-global
cd silverconnect-global
npm install
cp .env.example .env.local   # 然后填 key
```

必填环境变量（`.env.local`）：

```bash
# Runtime — TS 服务端代码消费
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # 仅服务端
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PLATFORM_FEE_PERCENT=20             # 可选，默认 20

# 维护脚本 — 注意脚本用了不同名（见下方 caveat）
SUPABASE_SERVICE_KEY=               # 与 SUPABASE_SERVICE_ROLE_KEY 同值

# AI agent（本地可选）
AI_AGENT_URL=http://localhost:8000
OPENAI_API_KEY=                     # 仅 ai_customer_service.py 消费

# 已在 .env.example 声明但当前无任何 TS 代码读取：
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 环境变量命名注意

服务端运行时读 `SUPABASE_SERVICE_ROLE_KEY`；旧 Supabase 脚本（如 `scripts/migrate.js`、`scripts/seed-test-data.ts`、`scripts/delete-test-data.ts`）读 `SUPABASE_SERVICE_KEY`。设同一值，或后续清理统一名称。

平台费百分比也有两套来源、默认值不同：
- DB 列 `bookings.platform_fee_percentage` 默认 **15.0**。
- 环境变量 `PLATFORM_FEE_PERCENT`（被 `/api/payouts` 用）默认 **20**。

在它们继续漂移之前选定单一来源。

### `.env.example` 多为意图占位

仓库内 `.env.example` 声明了几十个变量（Twilio、Sentry、Datadog、`JWT_SECRET`、`RATE_LIMIT_*`、`GOOGLE_MAPS_API_KEY`、`DATABASE_URL`、`REDIS_URL`、`EMAIL_*`、`VERCEL_*` 等），**当前 TS 代码均未读取**——它们记录的是预期的未来集成。以上述 runtime 列表为准。

### docker-compose 仅用于本地基础设施探索

`docker-compose.yml` 起本地 Postgres、Redis、Mailhog。运行中的 app 仍走 **Supabase**，不会读本地 Postgres——compose 适合用 Adminer（`:8080`）查 SQL，但不构成自闭环开发环境。

## 3. 数据库初始化

```bash
# 方式 A：将 lib/schema.sql 粘到 Supabase SQL editor，然后按编号顺序粘 migrations/*.sql
# 方式 B：
npm run db:migrate
npm run db:seed
# 可选：种 demo 服务者数据
npm run db:seed:providers
```

## 4. 启动

```bash
npm run dev          # Next.js on :3000
./run-ai-agent.sh    # FastAPI AI agent on :8000（可选）
```

## 5. 常用脚本

| 命令 | 用途 |
|---|---|
| `npm run dev` | Next dev server |
| `npm run build` | 生产构建 |
| `npm run start` | 跑构建产物 |
| `npm run lint` | ESLint 扫 `app components lib api scripts __tests__ types` |
| `npm test` / `npm run test:unit` | Jest |
| `npm run test:watch` | Jest 监听 |
| `npm run test:coverage` | Jest 覆盖率 |
| `npm run test:e2e` | Playwright |
| `npm run test:e2e:ui` | Playwright UI |
| `npm run test:performance` | Lighthouse |
| `npm run db:migrate` | 应用迁移 |
| `npm run db:seed` | 种服务目录和价格 |
| `npm run db:seed:providers` | 种 demo 服务者 |
| `npm run db:seed:all` | 种服务目录、价格和 demo 服务者 |
| `npm run docker:up` / `:down` | Compose 栈（本地基础设施，见 caveat） |

## 6. 项目结构

```
app/                  Next.js App Router
  api/                Route handlers (REST endpoints)
  (pages)/            路由页
components/           客户端/服务端 React 组件
lib/                  领域逻辑、Supabase 客户端、类型
  ai/                 AI 辅助（如 pricingTemplates）
migrations/           带版本的 SQL 迁移
scripts/              维护 / 迁移 / 种子脚本
__tests__/            Jest 单元/集成测试
e2e/                  Playwright 用例
k6/                   负载测试
docs/                 工程文档（本目录）
```

## 7. 编码规范

> ⚠️ 这**不是你熟悉的那套 Next.js**。见 [`AGENTS.md`](../../AGENTS.md)。写 route handler、server action、layout 之前请先读 `node_modules/next/dist/docs/`。

- **TypeScript strict** — 新代码不允许 `any`。
- **服务端 secret** — 客户端组件中绝不引入 `SUPABASE_SERVICE_ROLE_KEY`。
- **外科手术式修改** — 只动任务要求的内容。
- **简单优先** — 解决问题的最少代码；禁止投机性 flag 或抽象。
- **注释**：仅在 *why* 非显而易见时写。不写"做什么"的注释。
- **i18n**：所有客户可见的新字符串入 `lib/translations.ts` 同时给 EN + ZH。
- **价格**：永不内联计算；走 `lib/pricing.ts`。
- **认证**：永不信客户端声明；服务端二次校验身份。
- **RLS**：新建表的 policy 与建表迁移同提交。

## 8. Git 流程

- 分支：`feat/<short>`、`fix/<short>`、`chore/<short>`。
- 提交：祈使句标题，≤ 72 字符；带模块前缀（如 `feat(payments): refund window enforcement`）。
- PR：链接 issue/spec、写测试计划、UI 改动附截图。
- 见 [`CONTRIBUTING.md`](../../CONTRIBUTING.md)。

## 9. 调试小贴士

- **Supabase RLS 拒绝**会以"空数组"返回——以该用户身份在 SQL editor 复盘。
- **本地 Stripe webhook** — `stripe listen --forward-to localhost:3000/api/webhooks/stripe`。
- **AI agent** — 先 `curl localhost:8000/api/health`；查 `OPENAI_API_KEY`。
- **币种不匹配** — Stripe 收款币种必须 = 该 booking 的 `countries.currency_code`。

## 10. IDE

- 推荐 VSCode。装 ESLint + Tailwind IntelliSense + Prettier。
- 用 `Ctrl/Cmd+Click` 跳转相对 markdown 链接。
