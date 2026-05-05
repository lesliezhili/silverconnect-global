# 全业务流程 E2E 测试设计

**版本**：v1（2026-05-05）
**作用域**：1 个消费者 + 1 个服务者，走完一笔订单的完整生命周期，覆盖主链路 + 3 条旁支
**目的**：作为可执行的测试基线 — 任何后端改动后跑一遍即可确认核心闭环未坏

---

## 0. 前置条件

| 项 | 要求 |
|---|---|
| 应用运行 | `npm run dev` 在 `http://localhost:3000` |
| 数据库 | Supabase dev project 已 push 全部 4 个 migration（`drizzle/0000`–`0003`）|
| 种子 | [scripts/seed-catalog.ts](../scripts/seed-catalog.ts) 已跑过（5 类目 / 11 service / 33 国家定价）|
| Admin | seed 脚本里已建 `admin.test@example.com` 行（需在 Supabase 手动确认 emailVerifiedAt 非空）|
| 邮件 | 验证码通过 Gmail SMTP 发，需 `.env.local` 里 `GMAIL_*` 配置；测试时也可读 `users.emailVerificationCode` 直接绕过 |
| 文件上传根 | [public/uploads/](../public/uploads/) 目录存在 |

---

## 1. 角色

### 消费者：Mary

| 字段 | 值 |
|---|---|
| 邮箱 | `mary.test@example.com` |
| 密码 | `Test1234!` |
| 角色 | `customer` |
| 国家 | `AU` |
| 地址 | `12 Smith St, Sydney NSW 2000` |
| 紧急联系人 | `Tom Lee, +61400000000` |

### 服务者：Helen

| 字段 | 值 |
|---|---|
| 邮箱 | `helen.test@example.com` |
| 密码 | `Test1234!` |
| 角色 | `provider` |
| 国家 | `AU` |
| 服务地址 | `45 Park Rd, Sydney NSW 2010` |
| 服务半径 | `15 km` |
| 类目 | `cleaning`、`cooking` |
| 文档 | police_check / first_aid / insurance（任意 PDF 即可）|

### 管理员：Admin

| 字段 | 值 |
|---|---|
| 邮箱 | `admin.test@example.com` |
| 密码 | `Test1234!` |
| 用途 | 第 6、A2、B2 步审批 |

---

## 2. 主链路（Happy path）

### Phase 1 — 服务者入驻（步骤 1–6）

| # | 触发动作 | 关键期望 |
|---|---|---|
| 1 | Helen 访问 [/auth/signup](<../app/[locale]/(public)/auth/signup/page.tsx>) 选 role=provider 注册 | `users` +1 行（role=`provider`，emailVerifiedAt=null）。注意：`provider_profiles` 行此时**不**插入，要等步骤 3 走完入驻向导才建 |
| 2 | Helen 输入 6 位验证码（从邮件或 `users.emailVerificationCode` 读出）→ 提交 [/auth/verify](<../app/[locale]/(public)/auth/verify/page.tsx>) | `users.emailVerifiedAt` 非空 |
| 3 | Helen 走 [/provider/register](<../app/[locale]/(provider)/provider/register/page.tsx>) 多步向导：bio → 地址/半径 → 类目（cleaning+cooking）→ 服务定价 | `provider_profiles` +1 行；`provider_categories` +2 行；`services` 至少 +1 行 |
| 4 | Helen 在 [/provider/compliance](<../app/[locale]/(provider)/provider/compliance/page.tsx>) 上传 3 份 PDF（police_check / first_aid / insurance）+ 文档号 + 到期日 | `public/uploads/compliance/{providerId}/` 出现 3 个 UUID 文件；`provider_documents` +3 行（status=`pending`）|
| 5 | Helen 在向导末步点 "Submit for review" | `provider_profiles.submittedAt` 非空；onboardingStatus=`docs_review` |
| 6 | Admin 登录 → [/admin/providers/{id}](<../app/[locale]/(admin)/admin/providers/[id]/page.tsx>) 选 `approve` 提交 | onboardingStatus=`approved`；`approvedAt` 非空；`notifications` +1 行（userId=Helen, kind=`system`, title 含 "approved"）|

### Phase 2 — 消费者注册 + 资料（步骤 7–9）

| # | 触发动作 | 关键期望 |
|---|---|---|
| 7 | Mary 走 [/auth/signup](<../app/[locale]/(public)/auth/signup/page.tsx>)（role=customer）+ [/auth/verify](<../app/[locale]/(public)/auth/verify/page.tsx>) | `users` +1，emailVerifiedAt 非空 |
| 8 | Mary 访问 [/profile/addresses/new](<../app/[locale]/(customer)/profile/addresses/new/page.tsx>) 填地址 | `addresses` +1 行；`isDefault` 自动置 `true`（因这是首条）|
| 9 | Mary 访问 [/profile/emergency](<../app/[locale]/(customer)/profile/emergency/page.tsx>) 加紧急联系人 Tom | `emergency_contacts` +1 行 |

### Phase 3 — 发现 + 下单（步骤 10–14）

| # | 触发动作 | 关键期望 |
|---|---|---|
| 10 | Mary 访问 [/home](<../app/[locale]/(customer)/home/page.tsx>) | 5 个类目卡片可见；cleaning 卡显示 `from $X/h`（来自 services × service_prices 联查）|
| 11 | Mary 访问 [/services/cleaning](<../app/[locale]/(customer)/services/[category]/page.tsx>) | 列表第一位是 Helen（`onboardingStatus=approved` 且类目匹配）；rating 显示 `—`（无评价）|
| 12 | Mary 点 Helen → [/providers/{id}](<../app/[locale]/(customer)/providers/[id]/page.tsx>) | bio、类目、可预订 7 天可见 |
| 13 | Mary 走 [/bookings/new](<../app/[locale]/(customer)/bookings/new/page.tsx>) 多步草稿（iron-session 暂存）：选 service → 时间 → 地址 → 备注 → 提交 | `bookings` +1 行（status=`pending`）；`booking_changes` +1 行（type=`status_change`, toStatus=`pending`）|
| 14 | 渲染等待时 `after()` 钩子触发通知 | `notifications` +1 行（userId=Helen, kind=`booking_update`，title="New booking request"）|

### Phase 4 — 履约（步骤 15–21）

| # | 触发动作 | 关键期望 |
|---|---|---|
| 15 | Helen [/provider/jobs/{id}](<../app/[locale]/(provider)/provider/jobs/[id]/page.tsx>) 点 `confirm` | bookings.status=`confirmed`；`booking_changes` +1；Mary 收通知 |
| 16 | 时间到，Helen 点 `start` | status=`in_progress` |
| 17 | Helen 点 `complete` | status=`completed`；`completedAt` 非空 |
| 18 | Mary [/bookings/{id}](<../app/[locale]/(customer)/bookings/[id]/page.tsx>) 看到 "completed · 待您确认" UI | 渲染正确 |
| 19 | Mary 点 `release` | status=`released`。**wallet 流当前未自动写入** — 生产环境会在 Stripe webhook 里把 `wallets.balancePending` 减、`balanceAvailable` 加；当前 release action 只切 booking 状态，钱包流要等 Stripe Connect 接入。如需在测试中观察钱包变化，需先在 Supabase 手动插入 Helen 的 `wallets` 行（参考 [scripts/smoke-phase2.ts](../scripts/smoke-phase2.ts) 第 223 行附近）|
| 20 | Mary 在订单详情页留 5★ + 评论 | `reviews` +1 行（status=`published`）|
| 21 | Helen [/provider/reviews](<../app/[locale]/(provider)/provider/reviews/page.tsx>) 看到评论 → 回复 | `review_replies` +1 行 |

### Phase 5 — 账户管理（步骤 22–23）

| # | 触发动作 | 关键期望 |
|---|---|---|
| 22 | Mary [/settings/privacy](<../app/[locale]/(customer)/settings/privacy/page.tsx>) 点 "Download my data" | `public/uploads/exports/{userId}/{uuid}.json` 生成；页面顶部出现下载链接 |
| 23 | 下载并解析 JSON | 字段含：user 资料 / 1 笔 booking / 1 个 address / 1 个 emergencyContact / 1 条 reviewWritten / 0 个 disputeRaised |

---

## 3. 旁支 A — 争议（替代步骤 18–19）

| # | 触发动作 | 关键期望 |
|---|---|---|
| A1 | 步骤 17 后，Mary 不点 `release`，改走 [/bookings/{id}/dispute](<../app/[locale]/(customer)/bookings/[id]/dispute/page.tsx>) 选 `incomplete` + 描述（>20 字符）+ 上传 2 张 JPG | `disputes` +1 行（status=`open`, raisedBy=Mary.id）；`dispute_evidence` +2 行（fileUrl 指向 `/uploads/dispute/{bookingId}/...`）；bookings.status=`disputed`；`booking_changes` +1 |
| A2 | Admin [/admin/disputes/{id}](<../app/[locale]/(admin)/admin/disputes/[id]/page.tsx>) 选 `partial refund $40` + note → submit | disputes.status=`decided`；resolution=`refund_partial`；resolutionAmount=`40.00`；bookings.status=`cancelled`；`notifications` +2（Mary + Helen 各一）|

跑完 A1+A2 后跳过步骤 19–21（订单已终态）。

---

## 4. 旁支 B — 安全事件（独立于订单）

| # | 触发动作 | 关键期望 |
|---|---|---|
| B1 | Mary 提交 incident（category=`harassment`，body >10 字符，附 1 张 JPG）— 入口在订单详情页或紧急流程 | `incident_reports` +1 行（reviewedAt=null）|
| B2 | Admin [/admin/safety/{id}](<../app/[locale]/(admin)/admin/safety/[id]/page.tsx>) 选 `ban` + note → submit | reviewedAt 非空；action 文本含 "Banned"；Helen.provider_profiles.onboardingStatus 不变（safety 与 onboarding 独立 — 如需联动需走 `/admin/providers/{id}` 单独 suspend）|
| B3 | Mary 收通知 | `notifications` +1（kind=`safety`, title 含 "reviewed"）|

---

## 5. 旁支 C — 注销账号（最后跑，会毁数据）

| # | 触发动作 | 关键期望 |
|---|---|---|
| C1 | Mary [/settings/privacy](<../app/[locale]/(customer)/settings/privacy/page.tsx>) 输入 `DELETE` → 提交 | `users` 行删除 |
| C2 | 级联清理 | `bookings` / `addresses` / `emergency_contacts` / `family_members` / `payment_methods` / `reviews` / `ai_conversations` / `ai_messages` / `incident_reports` / `notifications` 涉及 Mary 的全部 0 行 |
| C3 | 删除策略 | 用户的所有数据被清空 — 包括其发起的争议（通过 `disputes.bookingId` → `bookings.customerId` → `users.id` 的级联链一并删除）。仅 `review_reports.reporterId` 置 `null`（保留匿名审核历史）。隐私政策已与此一致：[components/domain/helpArticles.ts](../components/domain/helpArticles.ts) 声明 GDPR 第 17 条「被遗忘权」式删除 |
| C4 | session 销毁 | cookie `sc-session` 已清；浏览器跳 [/home](<../app/[locale]/(customer)/home/page.tsx>)`?deleted=1` |

---

## 6. Assertion 矩阵（主链路完成后）

| 表 | 增量 | 备注 |
|---|---|---|
| `users` | +2 | Mary + Helen |
| `provider_profiles` | +1 | Helen, status=approved |
| `provider_documents` | +3 | police_check / first_aid / insurance |
| `provider_categories` | +2 | cleaning + cooking |
| `services` | +1+ | Helen 至少 1 个服务 |
| `addresses` | +1 | Mary, isDefault=true |
| `emergency_contacts` | +1 | Mary, Tom |
| `bookings` | +1 | status=released |
| `booking_changes` | +4 | pending→confirmed→in_progress→completed→released |
| `reviews` | +1 | 5★ |
| `review_replies` | +1 | Helen 回复 |
| `notifications` | +5 | Helen 接 2 行（kind=`system` 的 "approved" + kind=`booking_update` 的 "New booking request"）；Mary 接 3 行（kind=`booking_update`，分别对应 confirm / start / complete）|
| `wallets` | 0 | 当前 release 流不创建钱包行；只有在 Stripe Connect 接入后才会自动写。要观察钱包态需先手动 seed |

---

## 7. 实现形式（建议）

| 形式 | 文件 | 优点 | 缺点 |
|---|---|---|---|
| Playwright UI E2E | `e2e/full-flow.spec.ts` | 真浏览器，验证 UI 与服务端联动；最贴近真实用户 | 慢（约 3–5 分钟）；需要真 SMTP 或 mock；视口/CSS 偶发 flake |
| tsx smoke 脚本 | `scripts/smoke-full-flow.ts` | 直接调 DB + Server Action 等价 helper（如 [lib/notifications/server.ts](../lib/notifications/server.ts) 的 `notify()`、[lib/upload/local.ts](../lib/upload/local.ts) 的 `saveUpload()`）；快（< 30 s）；可在 CI 跑 | 不验证 UI；Server Action 的 redirect/throw 行为需要单独测 |

**建议**：smoke 脚本作为日常回归（CI 每次跑），UI E2E 作为发版前烟雾测试（手动触发 / nightly）。

---

## 8. 数据清理

- **测试前**：删 `mary.test@example.com` 与 `helen.test@example.com` 两个 user 行 — schema 上 cascade 会带走全部相关数据（包括 `provider_profiles`、`provider_documents`、`bookings`、`addresses` 等）。
- **测试后**：默认不清理 — 保留作演示数据；下次跑前再清。
- **争议旁支跑过的**：`disputes` 表会有 raisedBy=null 的孤儿行（合规保留），如要彻底清理需手动 DELETE。

---

## 9. 已知限制

| 项 | 现状 | 影响 |
|---|---|---|
| Stripe | 未接入 | 步骤 19 的 `release` 不会真正动钱，只翻 `wallets` 和 booking 状态；扣款是 Stripe webhook 才会推 |
| 邮件 | Gmail SMTP（个人账户）| 高频跑会被 Google 限流；CI 建议读 `users.emailVerificationCode` 直接绕过 |
| HTTPS | VPS 暂用裸 IP | 生产环境（Stripe webhook 必须 HTTPS）跑前需先上 HTTPS |
| 文件上传 | 本地磁盘 [public/uploads/](../public/uploads/) | 生产应迁到 S3 / Supabase Storage；测试中文件不会自动清理 |
| 5 个 inline 模态 | 当前以 inline form 实现 | UI E2E 中点击位置/选择器与真模态不同，写测试时按现状对照 |

---

## 10. 下一步

如需把本设计落成可跑产物，告知选哪一种或两种：

1. `e2e/full-flow.spec.ts`（Playwright）
2. `scripts/smoke-full-flow.ts`（tsx smoke）

实施时会回到此文档逐条核对断言，确保不偏离设计。
