# 架构

## 1. 概览

SilverConnect Global 是一个跨国双边市场，连接老年客户与经过审核的服务提供者（清洁、烹饪、园艺、个人护理、维修），覆盖 **澳大利亚（AU）**、**中国（CN）**、**加拿大（CA）**。

系统是一套 Next.js 全栈应用（App Router），后端使用 Supabase（PostgreSQL + Auth + RLS），Stripe 处理支付，AI 客服为独立的 FastAPI 微服务。

## 2. C4 — Context

```
            ┌─────────────┐         ┌──────────────┐
   老人 ────▶│             │◀────── 服务提供者
            │  Web App    │         └──────────────┘
            │  (Next.js)  │
            │             │──▶ Stripe（支付、payout、托管）
            │             │──▶ Supabase（DB、Auth、Storage、RLS）
            │             │──▶ AI Agent (FastAPI) ──▶ OpenAI / Azure
   管理员 ──▶│             │──▶ Email (Nodemailer/SMTP)
            └─────────────┘
```

## 3. C4 — 容器

| 容器 | 技术 | 职责 |
|---|---|---|
| Web App | Next.js 16 + React 19 | UI、Server Components、API 路由 |
| API 路由 | Next.js Route Handlers (`app/api/**`) | REST 端点（REST/JSON） |
| 数据库 | Supabase Postgres | 真理之源；RLS 强制鉴权 |
| Auth | Supabase Auth | 邮箱密码登录、JWT 会话 |
| 支付 | Stripe | 收款、托管、Connect payout、Webhook |
| AI 服务 | FastAPI（`ai_customer_service.py`） | 聊天、意图路由、紧急检测 |
| CDN/Edge | Vercel | 静态资源、Edge functions |

## 4. 模块划分

实现分 7 个模块。迁移文件不严格 1:1 编号——三个文件共用 `001_` 前缀，且追加了 `008_` 修补字段。详见 [DATABASE.md § 迁移执行顺序](DATABASE.md#迁移执行顺序)。

1. **Provider 入驻** — 注册、审核、资质、KYC。
2. **Customer 资料 + 日历/价格** — 地址、支付方式、动态价格分级。
3. **预订引擎** — 排期、循环预订、变更、提醒、屏蔽时间。
4. **支付与托管** — Stripe 收款、托管 hold/release、平台费、Connect payout、退款、支付争议。
5. **反馈与评分** — 评价、商家回应、举报。
6. **争议与安全** — 含证据的争议、事件报告、安全标记、合规材料。
7. **AI 自动化** — 会话、对话、意图、知识库、模板。

## 5. 关键组件

| 前端（`components/`） | 用途 |
|---|---|
| `Header.tsx`、`CountrySelector.tsx`、`LanguageSelector.tsx`、`LocationDetector.tsx` | 全局壳：语言、定位 |
| `ServiceCard.tsx`、`ProviderCard.tsx` | 目录展示 |
| `BookingForm.tsx`、`BookingModal.tsx`、`BookingStatusFlow.tsx` | 预订流程 |
| `ProviderRegistration.tsx`、`ProviderAvailability.tsx` | Provider 入驻 |
| `CustomerRegistration.tsx`、`AuthModal.tsx`、`SignupModal.tsx` | 认证流程 |
| `PaymentHistory.tsx` | 客户支付明细 |
| `FeedbackForm.tsx`、`FeedbackModal.tsx` | 评价 |
| `AIChat.tsx`、`ChatModal.tsx` | AI 客服 UI |
| `AdminDashboard.tsx` | 运营后台 |

| 服务端 lib（`lib/`） | 用途 |
|---|---|
| `supabase.ts` | Supabase 客户端（浏览器 + 服务端） |
| `pricing.ts` | 国家敏感的价格计算 |
| `availability.ts`、`matching.ts` | 时段查询 + Provider 匹配 |
| `paymentUtils.ts` | Stripe 辅助、费用计算 |
| `providers.ts`、`services.ts` | 领域查询 |
| `location.ts`、`locationUtils.ts` | 地理定位、距离 |
| `translations.ts` | EN/ZH 词典 |
| `types.ts` | 共享 TS 类型与枚举 |
| `ai/pricingTemplates.ts` | AI agent 使用的价格相关 prompt 模板 |

## 6. 请求流——创建预订

```
Customer → POST /api/bookings
  → 校验 session（Supabase Auth）
  → 检查 Provider 可用性（lib/availability.ts）
  → 计算价格（lib/pricing.ts，国别税）
  → INSERT booking（status=PENDING、payment_status=UNPAID）
  → POST /api/create-payment-intent → Stripe
  → Stripe webhook（payment_intent.succeeded）→ 置 bookings.payment_status=PAID、status=CONFIRMED，并写入 payment_transactions
  → 完成时 → 通过 DB 函数 release_escrow(booking_id) 手动释放托管 → 排队 payout（Module 4 表）。**基于时间的自动释放尚未实现**。
```

## 7. 多国处理

- `countries` 表：`AU`、`CN`、`CA`，含 `currency_code`、`tax_rate`。
- 价格按 `(service_id, country_code)` 存于 `service_prices`。
- 货币按用户所在国选择；Stripe 收款币种必须匹配。
- i18n 通过 `lib/translations.ts`（EN/ZH；FR 计划中）。

## 8. 认证 / 鉴权

- **认证**：Supabase Auth（HTTP-only cookie 中的 JWT）。
- **鉴权**：每张用户表上启用 Postgres RLS。特权操作（admin、provider-only）服务端额外校验角色。
- service-role key **仅服务端**；绝不发到客户端。

## 9. 横切关注

| 关注点 | 机制 |
|---|---|
| 日志 | Vercel runtime logs；Supabase logs |
| 分析 | Vercel Analytics |
| 错误监控 | （计划中）Sentry |
| 缓存 | Next.js segment caching；带 auth 的路由 `force-dynamic` |
| 限流 | （计划中）Upstash 用于 `/api/ai/*` 和 auth |
| Feature flag | （目前无——按需用环境变量） |

## 10. 非功能目标

| 维度 | 目标 |
|---|---|
| 可用性 | 99.5%（Vercel + Supabase 托管） |
| 页面 p95 加载 | 4G 下 < 2.5s |
| API p95 | < 400 ms（不含 Stripe 往返）。硬上限：Vercel 函数 `maxDuration: 30s`（`vercel.json`） |
| RPO / RTO | 24h / 4h（Supabase PITR） |

## 11. 决策（ADR 摘要）

- **App Router 优于 Pages Router** — server components、流式。
- **Supabase 优于自建 Postgres** — 一套搞定 Auth + RLS + Storage。
- **Stripe Connect（托管）** — 在服务完成前持有客户资金。
- **AI 用独立 FastAPI** — Python 生态对 LLM 工具链友好；隔离扩缩容。
- **聊天不 SSR** — AI 聊天为客户端组件，REST 流式。
