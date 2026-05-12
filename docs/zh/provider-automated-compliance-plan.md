# Provider Flow 自动化合规 — 评估 + 修改方案（v4）

> 需求来源：需求文档 §7 "Provider Flow (Updated for Automated Compliance)" — ABN 实时校验、第三方背调自动化、到期预警、防误拒 job。
> 状态：方案待确认（见[第三节](#三待定夺的-7-点)），确认后逐阶段实施。
> 编写日期：2026-05-11
> v2 修订：吸收评审第 1 轮 8 条（job gate 覆盖、自动 approve 重评估、背调失败/幂等、ABN 国家专属、migration 路径、cron 形态、badge upsert、背调授权同意）
> v3 修订：吸收评审第 2 轮 8 条（缺文档审核动作、合规文件存公开目录、到期去重不可靠、admin 收件人未定义、onboarding CTA 指错页、insurance 规则不一致、手动 approve 绕过校验）—— 见[前置项](#零前置项必须先做)与各节 ⚠️ v3 标注
> v4 修订：吸收评审第 3 轮 7 条（过期后下架、verified 来源统一、背调历史保留、旧公开文件迁移、Stripe 条件一致、通知只发一次、webhook dead-letter）—— 见各节 ⚠️ v4 标注
> v5 修订：吸收评审第 4 轮 5 条（**Stripe Connect onboarding 根本未实现**、过期/降级会卡死 in-progress 订单、ProviderCard 的 verified 现为写死、adminActions/auditLog 用法需分清、identity/wwc 文档类型未纳入 matrix）—— 见各节 ⚠️ v5 标注
> v6 决策（2026-05-11，用户拍板）：① 背调 vendor = NCC，先用 **mock 适配器**（模拟 NCC 形状的 triggerCheck + 自调 webhook）；② 私有存储**本期不上 S3/Supabase**，文件移出 `public/` 存测试服务器本地目录 + 走鉴权路由；③ **Stripe Connect onboarding 本期做**（必做前置 P3）。其余 §三 第 4~7 项采用文中默认值。
>
> **v7 实施完成（2026-05-11）—— 全部 stage 已编码并通过 `tsc --noEmit` + `eslint`（0 errors）+ migration 已生成（`0007_remarkable_ender_wiggin.sql`）**。新增/改动文件：schema（enums + providers 7列 + 3表）、`lib/upload/private.ts`、`app/api/compliance/documents/[id]/route.ts`、`scripts/migrate-compliance-uploads.ts`、`lib/stripe/connect.ts`、`lib/compliance/{abr,background-check,country}.ts` + `vendors/{mock,ncc}.ts`、`lib/notifications/admins.ts`、`lib/provider/{backgroundCheck,requireActiveProvider,autoApprove}.ts`、`app/api/compliance/background-check/webhook/route.ts`、`app/api/stripe/connect-webhook/route.ts`、`app/api/cron/check-compliance-expiry/route.ts`、register/compliance/onboarding-status/provider-home/jobs/jobs-[id]/admin-providers-[id] 页面改造、客户侧 home + services/[cat] 的 verified badge、5 个 messages 文件、`.env.example`、`.gitignore`、`DEPLOYMENT.md`、`__tests__/compliance-country.test.ts`（4/4 通过）。
>
> **DB / 验证状态（2026-05-11 已执行）**：① migration `0007` 的 18 条 DDL **已应用到测试库**（3 新表 + 7 新列 + `background_check_status` enum，已查询确认）—— 注意 `npm run db:migrate` 在此库**不可用**（`drizzle.__drizzle_migrations` 为空，库是 `db:push`/手工建的，migrate 会从 `0000` 重跑并冲突），0007 是用一次性脚本直接执行 SQL 应用的；以后改 schema 用 `npm run db:push` 或同样方式直接 apply。② e2e：`e2e/provider-compliance.spec.ts` —— **6/6 通过（chromium）**，认证部分用 `scripts/seed-e2e-provider.ts` 造的 AU provider 账号（`e2e-provider@silverconnect.test` / `E2eTest123!`，状态 `docs_review`）+ `PW_PROVIDER_EMAIL/PW_PROVIDER_PASSWORD` env 跑通。
>
> **仍待运营 / 后续处理**：① ~~deploy.ps1 持久化 `.private-uploads/`~~ —— **非问题**（`tar xzf` 覆盖式解压不删压缩包外文件，`.private-uploads/` 是 VPS 运行时建的，不会被部署清掉）；② Stripe Dashboard 配 connected-account webhook endpoint + 拿 `STRIPE_CONNECT_WEBHOOK_SECRET`；③ 真实 NCC 适配器（`vendors/ncc.ts` 现为 stub，待 NCC API 凭证；测试期用 `BG_CHECK_VENDOR=mock` 默认值）；④ `profile/favourites/page.tsx` 仍是 mock 数据页（`verified: true` 写死，favourites 功能未实现，不在本期范围）；⑤ 私有存储上生产前迁云对象存储（TODO）；⑥ 把上面 0007 同款的 DDL 也 apply 到将来的生产库。

---

## 一、现状核对（基于源码，非推测）

| 需求点 | 当前实现 | 差距 |
|---|---|---|
| ABN 实时校验（PR-001） | ❌ 无。[provider/register/page.tsx](../../app/[locale]/(provider)/provider/register/page.tsx) Step1 只收 name/phone/address/bio；`documentTypeEnum` 无 `abn`；无 ABR API。国家枚举为 `AU / US / CA`（[enums.ts](../../lib/db/schema/enums.ts)），ABN 仅对 AU 实体有效 | 全新（须 country-specific） |
| 自动背调触发（PR-002） | ❌ 无第三方集成。现流程：provider 上传 `police_check` 文档 → admin 在 [admin/providers/[id]](../../app/[locale]/(admin)/admin/providers/[id]/page.tsx) 手动 approve/reject。[onboarding-status/page.tsx](../../app/[locale]/(provider)/provider/onboarding-status/page.tsx) 的 `obBackground` 步骤是**写死的静态数组**，纯展示 | 全新 |
| 背调未 Cleared 前不能看 jobs | ❌ [provider/jobs/page.tsx](../../app/[locale]/(provider)/provider/jobs/page.tsx) 只校验 `role === "provider"` + profile 存在；**[provider/page.tsx](../../app/[locale]/(provider)/provider/page.tsx)（首页）也直接查并展示 `todayJobs`**；[jobs/[id]/page.tsx](../../app/[locale]/(provider)/provider/jobs/[id]/page.tsx) 的 `jobAction`（accept/decline/start/complete）只校验登录+role+ownership，**不看 onboardingStatus** | 新增 gate（覆盖首页 + 列表 + 详情 + 所有 job server actions） |
| 防误拒 job（PR-003） | ✅ **已实现** — [components/domain/DeclineJobModal.tsx](../../components/domain/DeclineJobModal.tsx) 是带 reason 选择的确认弹窗，已接入 [jobs/[id]/page.tsx](../../app/[locale]/(provider)/provider/jobs/[id]/page.tsx) | 无需改（可微调文案） |
| 多语言、不依赖英文 | ✅ next-intl + 5 语言（en / zh-CN / zh-TW / ja / ko），现有 wizard 已 i18n | 新增 UI 串需补 5 份 `messages/*.json`（[AGENTS.md i18n-rules](../../AGENTS.md)） |
| 30 天到期预警 | 🟡 部分 — [provider/compliance/page.tsx](../../app/[locale]/(provider)/provider/compliance/page.tsx) 在 `expiresAt - now < 30d` 时显示黄条，但**仅在 provider 主动访问页面时**；无主动通知；背调到期无存储 | 需定时任务 + 背调到期字段 |
| 背调 webhook 自动更新 Verified | ❌ 无。当前 webhook 只有 [app/api/stripe/webhook](../../app/api/stripe/webhook/) | 全新路由 |
| ABR 用 GUID-based search | ❌ 无 | 需注册 ABR Web Services GUID（仅 AU） |
| 背调授权 / 同意记录 | ❌ 无任何 consent 字段 | 须在提交前显式勾选并落库（合规核心，不后补） |

**结论：PR-003 已满足；其余均需新建。⚠️ 自动合规依赖两个**当前系统不存在**的能力 —— 「文档逐份审核动作」和「私有对象存储」—— 必须作为前置项先做（[第零节](#零前置项必须先做)）。**

---

## 零、前置项（必须先做）

这两项是自动合规的硬依赖，不先做 §二 的自动 approve / 背调扩面会落空或引入数据泄露面。

### P1. 文档逐份审核动作（评审第 2 轮第 1 条）

现状：[compliance/page.tsx](../../app/[locale]/(provider)/provider/compliance/page.tsx) 上传后 `status` 固定 `pending`；[admin/providers/[id]/page.tsx](../../app/[locale]/(admin)/admin/providers/[id]/page.tsx) 的 "Compliance documents" 区块**只展示**，无 approve/reject 按钮。所以"必需文档均 approved"在现系统里永远达不成。

- admin 详情页每份文档加 `Approve` / `Reject(带 note)` 按钮 → 新 server action `reviewDocumentAction`：更新 `providerDocuments.status / reviewedAt / reviewerNote` → 写 `adminActions` 审计 → 调 `tryAutoApproveProvider(providerId)` 重新评估
- `providerDocuments` 已有 `status / reviewedAt / reviewerNote` 列，无需改 schema
- ⚠️ **v4 自评审新增**：现有 `providerDocuments` 对 `(providerId, type)` 是唯一行，provider 续传必需文档会把旧 `approved` 覆盖成 `pending`。本方案先采用保守策略：如果 approved provider 续传 country matrix 中的必需文档，`uploadDocAction` 同事务把 `providerProfiles.onboardingStatus` 改回 `docs_review`、写 `auditLog(action='provider.required_document_reuploaded')`、通知 admin；文档重新 approved 后由 `tryAutoApproveProvider` 恢复上线。若产品要求“提前续期不下架”，需要另建 `providerDocumentVersions` 保留旧 approved 版本，本期不默认引入。

### P2. 合规文件移出公开目录（v6：本地私有目录，不上云）

现状：[lib/upload/local.ts](../../lib/upload/local.ts) 把文件写到 `public/uploads/`，返回**公开 URL**，"靠 UUID 文件名当访问控制"。police check / 身份证明等高敏材料公开可访问。

v6 决策：**本期不引入 S3/Supabase**，仍存测试服务器本地磁盘，但移出 `public/`：

- 新增 `lib/upload/private.ts`：写到 `process.cwd()/.private-uploads/{prefix}/{uuid}{ext}`（不在 `public/`，Next 不会静态托管），DB 存相对 key（如 `compliance/<providerId>/<uuid>.pdf`）而非 URL
- 读取走 `app/api/compliance/documents/[id]/route.ts`：查 `providerDocuments` 行 → 校验 `role==='admin'` 或本人 → `fs` 读文件流式返回（带 `Content-Type`、`Content-Disposition: inline`）
- compliance 上传从 `saveUpload`（local）切到 `savePrivateUpload`；dispute 等其他 `public/uploads` 用途**本期不动**
- 旧文件迁移脚本 `scripts/migrate-compliance-uploads.ts`：把已有 `/uploads/compliance/...` 文件搬到 `.private-uploads/compliance/`，DB 改存 key，删旧文件。测试阶段数据少，可手工跑一次
- `.private-uploads/` 加进 `.gitignore`；部署脚本（`scripts/deploy.ps1` / PM2）需保证该目录在服务器上持久（不随构建清掉）—— 实施时核对
- env：无（本地磁盘）。**TODO**：上生产前迁到云对象存储

### P3. Stripe Connect onboarding（v6：本期必做）

现状（已核实）：`providerProfiles.stripeAccountId` 列存在，但**全代码库无任何地方写它**；注册 Step5 的 "Connect with Stripe" 是 `<button type="button">` 无 handler；`app/api/stripe/webhook` 只服务捐款（`lib/donations/stripe.ts`），没有 Connect account 流程。`lib/donations/stripe.ts` 已初始化 `stripe` SDK（用 `STRIPE_SECRET_KEY`）。

v6 决策：**本期实现**（用户要走通端到端测试）。范围：

- `lib/stripe/connect.ts`：`ensureConnectAccount({existingAccountId,email,country})` → 若无则 Stripe `accounts.create({type:'express'})`，返回 account id；`createConnectOnboardingLink({accountId,returnUrl,refreshUrl})` → onboarding 跳转 URL；`isConnectPayoutsEnabled(accountId)` → `details_submitted && charges_enabled && payouts_enabled` ✅**已实现（P3）**
- Step5 的死按钮接活：`<button formAction={startStripeConnect}>`（复用 wizard form 的 locale）→ 建 account（若无）+ 存 `stripeAccountId` + 生成 account link → redirect 到 Stripe；返回 `?step=5&stripe=done`；Step5 显示已连接状态 ✅**已实现（P3）**
- `app/api/stripe/connect-webhook/route.ts`：监听 `account.updated`，payouts-enabled 时调 `tryAutoApproveProvider` —— ⚠️ **挪到 stage 5**（依赖 `tryAutoApproveProvider`，否则只是 log stub）。需 env `STRIPE_CONNECT_WEBHOOK_SECRET`
- onboarding-status 的 `obStripe` 变回**阻塞步骤**（用 `stripeAccountId` + `isConnectPayoutsEnabled`）—— ⚠️ **挪到 stage 6**（整页 stage 6 从 mock 改 DB 驱动，单独改这一步会与其余 mock 步骤割裂）；`tryAutoApproveProvider` 的硬条件含 `isConnectPayoutsEnabled`（见 §5）
- 测试用 Stripe **test mode** key（不碰真钱）；env 沿用 `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`（如需独立的 connect webhook secret 再加 `STRIPE_CONNECT_WEBHOOK_SECRET`）
- payout 实际触发（completed 订单结算给 provider）—— 若本期也要，另列；否则先只做 onboarding + 状态打通

---

## 二、修改方案

### 1. 数据库（drizzle schema + migration）

[lib/db/schema/enums.ts](../../lib/db/schema/enums.ts) 新增：

```ts
backgroundCheckStatusEnum = pgEnum("background_check_status", [
  "not_started", "pending", "cleared", "failed", "expired",
])
```

[lib/db/schema/providers.ts](../../lib/db/schema/providers.ts)：

- `providerProfiles` 增列：`abn text`、`businessName text`、`abnActive boolean`、`abnValidatedAt timestamp`、`bgCheckConsentAt timestamp`、`bgCheckConsentVersion text`、`bgCheckConsentIp text`
- 新表 `providerBackgroundChecks`（独立表）：
  `id, providerId(fk), vendor text, externalRef text (nullable), status backgroundCheckStatusEnum default 'not_started', requestedAt, clearedAt, expiresAt, rawPayload jsonb, lastError text, isCurrent boolean default true, supersededAt timestamp, createdAt, updatedAt`
  - ⚠️ **v4 修订（评审第 3 轮第 3 条）** 保留历史，不再 `uniqueIndex(providerId)` 只存一行。重试同一轮背调用当前 `isCurrent=true` 行更新；续期/重新背调时先把旧行 `isCurrent=false, supersededAt=now`，再插入新行。
  - 约束：每个 provider 最多一条 current 行（Postgres partial unique index：`unique(providerId) where is_current = true`）；webhook 幂等键为 `unique(vendor, externalRef) where external_ref is not null`
- ⚠️ **v3 新增（评审第 2 轮第 3 条）** 新表 `complianceExpiryAlerts`（专表去重，不靠 notifications 的 title/body）：
  `id, subjectType text ('provider_document' | 'background_check'), subjectId uuid, expiresAt timestamp, alertedAt timestamp, createdAt` + `uniqueIndex(subjectType, subjectId, expiresAt)`
  —— cron 每次跑前查这张表，已发过同一 `(subject, expiresAt)` 就跳过；`expiresAt` 变了（续期）才会再发
- ⚠️ **v4 新增（评审第 3 轮第 7 条）** 新表 `complianceWebhookEvents`：`id, vendor text, vendorEventId text, externalRef text, payload jsonb, status text ('received' | 'processed' | 'orphaned' | 'failed'), error text, receivedAt, processedAt`。唯一约束 `unique(vendor, vendorEventId)`（若 vendor 提供 event id）。用于保存找不到本地背调记录的 orphan 回调和失败回调，支持后台排查/重放。

⚠️ **v2 修订（评审第 5 条）**：新 migration 由 `npm run db:generate` 生成到 **`drizzle/migrations/`**（[drizzle.config.ts](../../drizzle.config.ts) `out: "./drizzle/migrations"`，现有 `0000`~`0005`），**不放根目录 `migrations/`**（那是另一套，不是 Drizzle 输出目标）。不手改已生成的 SQL。

### 2. 外部集成层（新文件）

- `lib/compliance/abr.ts` — ABR ABN Lookup Web Services 客户端：用 `ABR_GUID`（env）调 `SearchByABNv202001`，返回 `{ active, entityName }`。失败/超时 → 返回错误态，不抛。
- `lib/compliance/background-check.ts` — 背调 vendor 客户端，可换 vendor 接口：`triggerCheck(provider) → { externalRef }`；`verifyWebhook(req) → payload`。env：`BG_CHECK_VENDOR`、`BG_CHECK_API_KEY`、`BG_CHECK_WEBHOOK_SECRET`。vendor 选型见[第三节](#三待定夺的-7-点)。
- `lib/provider/autoApprove.ts` — `tryAutoApproveProvider(providerId)`：见 §5。
- `lib/provider/requireActiveProvider.ts` — gate helper：见 §4。
- `lib/compliance/country.ts` — country-specific 合规规则表：见 §3。

新增 env 仅写 VPS `/opt/silverconnect/.env.local`（按 [AGENTS.md](../../AGENTS.md)，不进 Git / GitHub Secrets），`.env.example` 加占位。

### 3. 注册流程改造（country-specific）

⚠️ **v2 修订（评审第 4 条）+ v3 修订（评审第 2 轮第 6 条）**：ABN 是 **AU 专属**；`lib/compliance/country.ts` 作为**单一事实源**导出 required-doc / ABN matrix，注册 wizard Step2、`compliance/page.tsx` 的 `KNOWN_TYPES`、`tryAutoApproveProvider` 的判定**全部从它读**（现状不一致：register Step2 对 US 把 insurance 标 optional，但 `compliance/page.tsx` 的 `KNOWN_TYPES` 对所有 provider 都列 insurance —— 必须统一）：

| country | ABN | 背调 | 必需文档 |
|---|---|---|---|
| AU | 必填，ABR 校验 | 必须 cleared | police_check, first_aid, insurance |
| US | 不要求（字段隐藏） | 必须 cleared | police_check, first_aid（**insurance 可选**，与现 wizard 一致）|
| CA | 不要求（字段隐藏） | 必须 cleared | police_check, first_aid, insurance |

> 注：`insurance` 在 AU/CA 是 required、US 是 optional，三处 UI/判定都以此 matrix 为准。US/CA 的"企业标识符"等价物（US EIN / CA BN）本期不做，留 TODO；非 AU provider 不会因为缺 ABN 而无法注册。
> ⚠️ **v5（评审第 4 轮第 5 条）** `documentTypeEnum` 还有 `identity`、`wwc` 两个类型。本期 matrix **不**把它们列为 required（`wwc`=working-with-children，老年居家服务一般不适用；`identity` 由背调 vendor 的 KYC 覆盖）。如果产品要求强制 ID 文档，加进 country.ts 的 required 列即可，不需改 schema —— 但要同步改 wizard Step2、compliance 页、autoApprove 判定三处。

[provider/register/page.tsx](../../app/[locale]/(provider)/provider/register/page.tsx)：

- Step1：`country === "AU"` 才渲染 ABN 输入框（必填）。新 server action `validateAbn`（或并入 `saveStep1`）：11 位数字本地校验 → 调 `lib/compliance/abr.ts` → 无效/非 active → `?step=1&error=abnInvalid`；有效 → 写 `abn / businessName / abnActive / abnValidatedAt`，UI 回显 Business Name（只读）。非 AU 跳过整段。
- Step5（提交前）：新增 **背调授权勾选框**（必勾），文案说明将发送给第三方 vendor 的 PII 范围；`finishWizard` 写 `bgCheckConsentAt / bgCheckConsentVersion / bgCheckConsentIp`。未勾 → `?step=5&error=consentRequired`。

⚠️ **v2 修订（评审第 3 条）** `finishWizard` 的背调触发改为**先本地后远程**：
1. 同步在事务内查 current 背调行：若已有 `pending`/`cleared` 的 `isCurrent=true` 行则跳过触发；否则把旧 current 行置为 `isCurrent=false, supersededAt=now`，再 `INSERT providerBackgroundChecks (providerId, vendor, status='pending', requestedAt=now, isCurrent=true)`。partial unique index 保证同一 provider 只会有一条 current 行；并捕获唯一冲突，把并发提交视为“已有 current 行”。
2. profile 置 `docs_review`，redirect 到 onboarding-status（用户立刻看到"背调进行中"）
3. `after()` 里调 `vendor.triggerCheck`：成功 → 回填 `externalRef`；失败/超时 → `status='failed'` + `lastError`，onboarding-status 页显示"背调发起失败，请重试"，并提供 retry server action（admin 页也有重试按钮）
4. webhook 用 `(vendor, externalRef)` 幂等更新，可重复投递

### 4. Job 可见性 gate（覆盖完整）

⚠️ **v2 修订（评审第 1 条）**：`lib/provider/requireActiveProvider.ts` 导出：
- `requireActiveProvider(locale)` —— 页面用：查 profile + 最新背调；`onboardingStatus !== "approved"` 或背调 `status !== "cleared"` → `redirect('/provider/onboarding-status')`
- `assertActiveProviderOrThrow(userId)` —— server action 用：不满足则 `redirect` 到 onboarding-status（阻止构造 POST 直接操作 job）

接入点（全部）：
- [provider/page.tsx](../../app/[locale]/(provider)/provider/page.tsx)（首页 —— 在查 `todayJobs` **之前**调用）
- [provider/jobs/page.tsx](../../app/[locale]/(provider)/provider/jobs/page.tsx)
- [provider/jobs/[id]/page.tsx](../../app/[locale]/(provider)/provider/jobs/[id]/page.tsx) 页面 + 其中 `jobAction`（accept/decline/start/complete 前都校验）

**不放在 `(provider)/layout.tsx`** —— register / compliance / onboarding-status / profile 必须仍可访问。`/provider/availability` 等是否也 gate，确认时定（倾向：可访问，只 gate 与接单相关的）。

⚠️ **v5 修订（评审第 4 轮第 2 条）—— 不能卡死 in-progress 订单**：一个曾 `approved`、已接单的 provider，若因合规过期被降级（§8），上面的 gate 会把他挡在 `/provider/jobs/[id]` 外、无法 `start`/`complete` 已确认的订单，客户的 booking 被孤立。所以：
- `requireActiveProvider`（页面 gate）：未 active 时，`/provider`、`/provider/jobs` 列表只显示"账户受限"横幅 + 仍列出 `confirmed`/`in_progress` 的现有订单（不显示新 `pending` 派单）；不直接 `redirect` 掉整页
- `assertActiveProviderOrThrow`（action gate）：未 active 时**拒绝 `accept`**，但**放行 `start` / `complete` / `decline`** 对已是 `confirmed`/`in_progress` 的订单（让人能收尾或退单）
- 合规过期对**已有订单**的处置（继续做完 / 自动取消+退款 / 宽限期）属产品决策 → 见[第三节](#三待定夺的-7-点)；本方案默认"让 provider 做完现有订单，只挡新单"

### 5. 自动 approve —— 抽成可重入函数（多入口调用）

⚠️ **v2 修订（评审第 2、7 条）**：背调 cleared / 文档审核通过 / ABN 状态更新 / Stripe onboarding 完成的**先后顺序不固定**，不能只挂 webhook。

`lib/provider/autoApprove.ts` → `tryAutoApproveProvider(providerId)`：
- 读 profile（含 country、abnActive、stripeAccountId）、文档、当前背调
- ⚠️ **v6 修订**：因 P3（Stripe Connect onboarding）本期实现，自动上线条件统一为：当前背调 `cleared` + 必需文档全 `approved` 且未过期 + AU 时 `abnActive` + **`stripeAccountId` 存在且 `isPayoutsEnabled` 为真**。三处（autoApprove 条件 / onboarding-status 的 `obStripe` 阻塞 / payout 前置）口径一致。
- 满足 `country` 规则的全部条件 → 在事务内：
  - `update providerProfiles set onboardingStatus='approved', approvedAt=now, rejectionReason=null where id=:providerId and onboardingStatus='docs_review'`
  - ⚠️ **v4 修订（评审第 3 轮第 6 条）** 检查 affected rows；只有实际从 `docs_review` 变为 `approved` 时，才 upsert badge 并在事务提交后发通知，避免重复 webhook/重复审核/Stripe 回调重复邮件。
  - **`providerBadges` upsert**：`onConflictDoUpdate(target: providerKindUq)` 授予 `kind='verified'`（评审第 7 条 —— schema 有 `provider_badges_provider_kind_uq`，重复投递/手动后自动会冲突）
  - ⚠️ **v4 修订（评审第 3 轮第 2 条）+ v5 修订（评审第 4 轮第 3 条）** verified UI 的单一来源 = `providerBadges.kind='verified'`。`approved` 控制可见/可预约，`verified` badge 控制标识。注意现状：客户侧可见性已统一靠 `onboardingStatus='approved'`（home / search / services / services/[cat] / bookings/new / providers/[id] 均如此），但 `ProviderCard` 的 `verified` prop 目前是**写死的 mock**（`home/page.tsx`、`profile/favourites/page.tsx` 里硬编码 `verified: true`，`providers/[id]` 已读 `providerBadges`）。本方案：把所有构造 `ProviderCardData` 的地方改为查 `providerBadges` 取真值，删掉硬编码。Force approve 默认不授 `verified` badge，除非 admin 明确勾选并写 audit note。
  - 事务提交后 `after()` 调 `notifyAndEmail`（复用 `buildProviderApprovalEmail`）
- 不满足 → 静默返回（幂等，可任意次调用）

调用入口：① 背调 webhook 收到 `cleared`；② admin 文档审核动作（[第零节 P1](#p1-文档逐份审核动作评审第-2-轮第-1-条)，**该动作目前不存在，本方案前置项新建**）；③ ABN 状态更新后；④ Stripe Connect onboarding 完成回调后。

> ⚠️ **v3（评审第 2 轮第 4 条）admin 通知 fan-out**：现 `notifyAndEmail` 必须给具体 `userId`。新增 `lib/notifications/admins.ts → notifyAdmins(input)`：查 `users where role='admin'` 逐个 `notifyAndEmail`，并额外发一份到 env `COMPLIANCE_ALERT_EMAIL`（运营邮箱，可空）。下文所有"通知 admin"都走这个 helper。

### 6. Webhook（背调 vendor → 状态更新 + 触发自动 approve）

新路由 `app/api/compliance/background-check/webhook/route.ts`（参照 [app/api/stripe/webhook](../../app/api/stripe/webhook/) 的 raw body + 签名校验模式）：
- `vendor.verifyWebhook(req)` 校验签名 → 先 upsert `complianceWebhookEvents`（记录 vendor event id / externalRef / payload）
- 按 `(vendor, externalRef)` 找 `providerBackgroundChecks` 行；找不到时把 webhook event 标为 `orphaned` 并 200 返回，后台可重放，不能只打日志丢弃
- 找到后幂等更新 current 背调 `status / clearedAt / expiresAt / rawPayload`，并把 webhook event 标为 `processed`
- `cleared` → 调 `tryAutoApproveProvider(providerId)`
- `failed` → 通知 provider + 写 `lastError`，留 admin 处理（不自动 reject）

### 7. onboarding-status 页改为 DB 驱动

[onboarding-status/page.tsx](../../app/[locale]/(provider)/provider/onboarding-status/page.tsx)：删掉写死的 `STEPS` 常量，按真实数据算 5 步 —— obSubmitted（`submittedAt`）、obDocs（`providerDocuments` 状态）、obBackground（`providerBackgroundChecks.status`，`failed` 时显示 retry 按钮）、obStripe（`stripeAccountId` + `isPayoutsEnabled`，⚠️ **v6** 因 P3 本期做，是阻塞步骤，未完成显示"连接 Stripe"按钮）、obLive（`onboardingStatus === 'approved'`）。

⚠️ **v3 修订（评审第 2 轮第 5 条）**：现页底部 "上传文件" CTA 指向 `/provider/register?step=2`（错的，文件上传实际在 `/provider/compliance`）—— 改为：缺文档 → `/provider/compliance`；缺 ABN/被打回 → `/provider/register?step=1`；缺 Stripe → Stripe Connect 入口；每个未完成步骤旁显示对应 action 按钮，而不是一个笼统链接。

### 8. 30 天到期预警 —— 走现有 cron API 模式

⚠️ **v2 修订（评审第 6 条）**：项目**已有** cron 基础设施 —— [app/api/cron/](../../app/api/cron/)（`cancel-stale` / `recurring-bookings` / `sla-disputes`）+ [lib/cron/auth.ts](../../lib/cron/auth.ts) `verifyCronAuth`（`Authorization: Bearer ${CRON_SECRET}`）。TS 脚本走 `tsx`（如 `db:seed`），不能 `node xxx.ts`。

- 新路由 `app/api/cron/check-compliance-expiry/route.ts`：`verifyCronAuth` → 扫 `providerBackgroundChecks.expiresAt` 与 `providerDocuments.expiresAt` 落在 `(now, now+30d]` 的记录 → 对每条查 `complianceExpiryAlerts` 是否已有同 `(subjectType, subjectId, expiresAt)` 行；没有才 `notifyAndEmail` 给 provider + `notifyAdmins` 摘要 → 插入 `complianceExpiryAlerts` 行（幂等，cron 重跑不重发；续期后 `expiresAt` 变化会重新提醒）
- ⚠️ **v4 新增（评审第 3 轮第 1 条）** 同路由还处理已过期记录：`expiresAt < now` 时把文档/当前背调标为 `expired`，并对受影响 provider 执行 `suspendForComplianceExpiry(providerId)`：若当前 `onboardingStatus='approved'`，改为 `docs_review`（或产品确认后改 `suspended`）、写 `auditLog(action='provider.compliance_expired')`、通知 provider + admin。客户侧可见/可预约统一依赖 `onboardingStatus='approved'`，所以过期后会从搜索、服务列表、预约 Step2 中下架。
- 调度：VPS crontab 每日 `curl -H "Authorization: Bearer $CRON_SECRET" https://silverconnect.xinxinsoft.org/api/cron/check-compliance-expiry`（与 [DEPLOYMENT.md](../../DEPLOYMENT.md) 现有 cron 调用方式一致）

### 9. Admin 页

[admin/providers/[id]/page.tsx](../../app/[locale]/(admin)/admin/providers/[id]/page.tsx)：
- 只读展示 ABN / Business Name / abnActive、背调状态 / vendor / externalRef / clearedAt / expiresAt、consent 时间与版本
- 每份文档加 `Approve` / `Reject` 按钮（[第零节 P1](#p1-文档逐份审核动作评审第-2-轮第-1-条)）
- `status='failed'` 或 `status='expired'` 时显示"重新发起背调"按钮；历史背调列表只读展示（current 行置顶）
- 新增 webhook dead-letter/orphan 区块：展示 `complianceWebhookEvents.status in ('orphaned','failed')`，提供 admin 重放按钮（重放前再次按 `(vendor, externalRef)` 匹配）
- ⚠️ **v3 修订（评审第 2 轮第 7 条）拆分 approve 路径**（现 `providerDecisionAction` 的 `approve` 直接置 `approved`，不查 ABN/背调/文档）：
  - **`Approve`（常规）**：改为调 `tryAutoApproveProvider`，**只有满足 country matrix 全部条件才成功**；不满足则不变更状态、回显"还缺 X / 背调 Y / ABN Z"
  - **`Force approve`（强制 override）**：单独按钮，**必须填 note**，跳过自动检查直接置 `approved` → 写 `adminActions`（`action='provider.force_approve'`，`targetType='provider_profile'`，记 actor、target、note、当时各检查项快照）；UI 二次确认
  - `reject` / `suspend` / `sendBack` / `hold` 不动

> ⚠️ **v5（评审第 4 轮第 4 条）审计表用法约定**：人触发的操作（admin 文档 approve/reject、Force approve、admin 重放 webhook）→ 写 **`adminActions`**（有 admin actor）；系统/cron/webhook 触发的状态变更（`provider.compliance_expired`、`provider.required_document_reuploaded`、自动 approve）→ 写 **`auditLog`**（`actor` 可为 null）。前文各处按此对齐。

### 10. i18n

`messages/{en,zh-CN,zh-TW,ja,ko}.json`：`provider` / `pCompliance` / `admin` namespace 新增 ABN、Business Name、背调状态各态、consent 文案、"Verification in Progress"、背调失败/重试、到期预警等串。5 文件 key 结构一致（[AGENTS.md i18n-rules](../../AGENTS.md)）。

### 11. 测试（按现有 [__tests__/](../../__tests__/) + [e2e/](../../e2e/) 习惯）

- 单测：`abr.ts`（mock fetch：active / cancelled / 超时）；`background-check.ts`；`tryAutoApproveProvider` 条件矩阵（各 country × 缺背调/缺文档/缺 ABN/缺 Stripe/全齐 × 当前状态 docs_review/suspended/approved）；badge upsert 冲突；Force approve 不授 verified；webhook 幂等和 orphan/dead-letter；`finishWizard` vendor 失败路径；approved provider 续传必需文档会回到 `docs_review`；`check-compliance-expiry` 的预警去重、过期标记、下架状态变更
- e2e：AU 注册填无效 ABN→报错、填有效→回显 Business Name；US 注册不出现 ABN 字段；未勾 consent 不能提交；提交后 onboarding-status 显示 background pending；背调 failed 时显示 retry；**未 cleared 时访问 `/provider`（首页）、`/provider/jobs`、`/provider/jobs/[id]` 均被重定向；构造 jobAction POST 被拒**；合规过期后客户侧搜索/服务列表/预约 Step2 不再出现该 provider；verified badge 由 `providerBadges` 控制

---

## 受影响文件清单

**新增**
- 前置 P2：`lib/upload/private.ts`、`app/api/compliance/documents/[id]/route.ts`、`scripts/migrate-compliance-uploads.ts`
- 前置 P3：`lib/stripe/connect.ts`、`app/api/stripe/connect-webhook/route.ts`（或并入现有 `app/api/stripe/webhook`）
- `lib/compliance/abr.ts`、`lib/compliance/background-check.ts`（含 `vendors/mock.ts` 适配器）、`lib/compliance/country.ts`
- `lib/provider/requireActiveProvider.ts`、`lib/provider/autoApprove.ts`
- `lib/notifications/admins.ts`（`notifyAdmins`）
- `app/api/compliance/background-check/webhook/route.ts`
- `app/api/cron/check-compliance-expiry/route.ts`
- 新 Drizzle migration（**`drizzle/migrations/`**，由 `npm run db:generate` 生成）—— 含 `providerBackgroundChecks`、`complianceExpiryAlerts`、`complianceWebhookEvents`、`providerProfiles` 新列、`backgroundCheckStatusEnum`

**修改**
- `lib/db/schema/enums.ts`、`lib/db/schema/providers.ts`、`lib/db/schema/index.ts`（导出新表）
- `lib/upload/local.ts` 调用点：`compliance/page.tsx` 改用 `private.ts`
- `app/[locale]/(provider)/provider/page.tsx`（首页 gate）
- `app/[locale]/(provider)/provider/register/page.tsx`（ABN country-specific + consent + finishWizard 先本地后远程）
- `app/[locale]/(provider)/provider/compliance/page.tsx`（`KNOWN_TYPES` 改读 `country.ts` matrix；上传切私有存储；approved provider 续传必需文档时改回 `docs_review`）
- `app/[locale]/(provider)/provider/jobs/page.tsx`、`app/[locale]/(provider)/provider/jobs/[id]/page.tsx`（gate + jobAction 校验）
- `app/[locale]/(provider)/provider/onboarding-status/page.tsx`（DB 驱动 + 修 CTA 指向 + per-item action + retry + obStripe 阻塞步骤）
- `app/[locale]/(provider)/provider/register/page.tsx` Step5：死按钮接活（建 Connect account + account link 跳转 + 回跳处理）
- `app/[locale]/(admin)/admin/providers/[id]/page.tsx`（展示 ABN/背调/consent + 文档逐份 approve/reject + Approve 改走 tryAutoApproveProvider + Force approve override + retry 按钮 + webhook dead-letter 区块）
- `app/api/stripe/webhook/route.ts`（如选择并入：按 event type 分流 donation vs connect）
- 客户侧构造 `ProviderCardData` 的页面（`home/page.tsx`、`profile/favourites/page.tsx` 等）：`verified` 改查 `providerBadges`，删硬编码（可见性已统一靠 `onboardingStatus='approved'`，无需改）
- `.gitignore`（加 `.private-uploads/`）、`scripts/deploy.ps1`（保证 `.private-uploads/` 服务器持久）
- `messages/{en,zh-CN,zh-TW,ja,ko}.json`、`.env.example`、[DEPLOYMENT.md](../../DEPLOYMENT.md)（新 cron 条目 + `.private-uploads/` 说明）

**不动 / 不在本方案范围**
- `components/domain/DeclineJobModal.tsx` —— PR-003 已满足
- admin 既有 reject / suspend / sendBack / hold 逻辑
- 真正的 payout 触发（completed 订单结算给 provider）—— P3 只做 onboarding + 状态打通；payout 是否本期做待定（[第三节](#三待定夺的-7-点)第 3 项）

---

## 三、决策状态

**已拍板（v6，2026-05-11）**
1. ✅ **背调 vendor = National Crime Check (NCC)**（实时处理、人脸生物比对、自动状态更新；Uber/DoorDash 在用，适合高量 gig 平台）。**实现策略**：`lib/compliance/background-check.ts` 定义统一接口；`vendors/ncc.ts` 按 NCC API/webhook 形状写真实适配器（凭证未到位前 stub）；`vendors/mock.ts` 模拟 NCC 的请求/回调形状（`triggerCheck` 返回假 `externalRef`，可配延迟后自 POST 一次 webhook 模拟 `cleared`），供端到端测试。`BG_CHECK_VENDOR=mock|ncc` 切换。
2. ✅ **私有存储**：本期**不上 S3/Supabase**，存测试服务器本地 `.private-uploads/` + 鉴权路由（[第零节 P2](#p2-合规文件移出公开目录v6本地私有目录不上云)）。生产前迁云是 TODO。
3. ✅ **Stripe Connect onboarding**：本期**做**（[第零节 P3](#p3-stripe-connect-onboardingv6本期必做)），test mode key。`stripeAccountId` + payouts-enabled 是上线硬条件之一。

**仍按文中默认实施（用户未否决即采纳）**
4. **自动激活边界** → 默认**全自动 approve**（满足 country 全部条件即 `approved`，无需 admin 点确认）；admin 保留 suspend / Force approve override。
5. **gate 范围** → 默认只 gate 接单链路（首页/jobs 列表/详情/job actions）；`/provider/availability`、`/earnings`、`/calendar` 保持可访问。
6. **consent 版本命名** → 默认 `bgCheckConsentVersion = '2026-05-11'`（日期）；授权书文案先用占位文本，等法务给正式版再替换（替换时 bump 日期）。
7. **过期后状态 + 已有订单** → 默认过期后 `approved → docs_review`（可补材料恢复，非 `suspended`）；名下已 `confirmed`/`in_progress` 的订单**让 provider 做完**（§4 gate 放行 `start`/`complete`/`decline`，只挡新 `accept`），不自动取消退款、不设宽限期。

> 上述 4~7 任意一项你想改，说一声即可；否则实施时按默认走。

---

## 实施顺序（确认后，每阶段自评审通过再进下一阶段）

**前置**
- P0. schema（`backgroundCheckStatusEnum` + `providerProfiles` 新列含 abn/consent/businessName + `providerBackgroundChecks` 历史/current 设计 + `complianceExpiryAlerts` + `complianceWebhookEvents`）+ `db:generate` migration → 自评审 ←**先做，后面全依赖它**
- P1. admin 文档逐份 approve/reject 动作（`reviewDocumentAction` + `adminActions` 审计；approved provider 续传必需文档→`docs_review`，但这步要等 stage 2 的 `country.ts` 才完整，先做基础 approve/reject）→ 自评审
- P2. 合规文件移出公开目录（`lib/upload/private.ts` + `api/compliance/documents/[id]` 鉴权读取 + `compliance/page.tsx` 切换 + `scripts/migrate-compliance-uploads.ts` + `.gitignore`/部署目录）→ 自评审
- P3. Stripe Connect onboarding（`lib/stripe/connect.ts` + Step5 死按钮接活 + `connect-webhook` + onboarding-status `obStripe` 阻塞）→ 自评审

**主体**
1.（P0 已前移）
2. `lib/compliance/{abr,background-check（含 vendors/mock.ts）,country}.ts` + `lib/notifications/admins.ts` + `.env.example` → 自评审
3. 注册流程：ABN country-specific 校验 + consent 勾选 + `finishWizard` 先本地后远程 + retry action；`compliance/page.tsx` 的 `KNOWN_TYPES` 改读 matrix；回填 P1 的续传降级逻辑 → 自评审
4. `lib/provider/{autoApprove,requireActiveProvider}.ts`（autoApprove 硬条件含 Stripe payouts-enabled）+ 各 job 入口 gate（首页/列表/详情/actions，含 in-progress carve-out）→ 自评审
5. 背调 webhook 路由 + `complianceWebhookEvents` dead-letter/replay + 接 `tryAutoApproveProvider`；P1 文档审核 & P3 connect-webhook 也接 `tryAutoApproveProvider` → 自评审
6. onboarding-status DB 驱动 + 修 CTA + per-item action + retry UI；admin 页：ABN/背调/consent 展示 + 文档审核按钮 + Approve 改走 tryAutoApproveProvider + Force approve override + webhook dead-letter 区块 → 自评审
7. `api/cron/check-compliance-expiry`（用 `complianceExpiryAlerts` 去重 + 过期后标 expired/下架）+ DEPLOYMENT.md cron 条目 → 自评审
8. 客户侧 verified badge 来源统一为 `providerBadges`，Force approve 默认不授 verified → 自评审
9. i18n 5 文件 + 单测 + e2e → 自评审
10. 总结
