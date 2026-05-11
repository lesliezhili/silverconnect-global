# 公益募资页（Donate）集成方案

> 来源：[demo/donate-demo.html](../../demo/donate-demo.html)（2026-05-10 上午 demo，已与用户确认）
> 状态：待实施
> 集成目标：把 demo 落到 SilverConnect Next.js 主站，作为面向公众的募资入口

---

## 1. 目标与边界

### 1.1 做什么
- 在主站新增一个**公开访问**（无需登录）的捐款落地页 `/[locale]/donate`
- 捐款人可以单次或月捐，走 **Stripe** 真实扣款（live keys），完成后发送**捐款收据 / 感谢信**（不在 DGR 资质和法定字段经法务确认前承诺"可抵税"）
- 后台可见的进度数据（已筹/目标/捐赠人数）从数据库实时拉取，不再 hard-code
- demo 中的故事卡 / 资金分配饼图作为**配置驱动**的内容（先 seed，后续再做后台编辑）

### 1.2 本期不做（明确剔除）
- ❌ PayPal / WeChat Pay / Alipay：demo 仅作为视觉占位，本期只接 Stripe
- ❌ 后台编辑活动 / 故事的 CMS：本期 seed + 改代码即可
- ❌ 公开捐赠人榜单：anonymous 字段先存，但不做展示页
- ❌ 第三方托管账户对接 / 月度资金报告页：先放静态页占位
- ❌ 多 campaign 同时运营：只支持一个"当前活动"

---

## 2. 信息架构与路由

| 路由 | 作用 | 鉴权 |
|---|---|---|
| `/[locale]/donate` | 募资落地页（demo 主体） | 公开 |
| `/[locale]/donate/success?session_id=…` | Stripe 跳回的成功页 | 公开 |
| `/[locale]/donate/cancel` | 取消回退页 | 公开 |
| `POST /api/donate/checkout` | 创建 Stripe Checkout Session | 公开（含速率限制） |
| `POST /api/stripe/webhook` | Stripe webhook（**新建**，仓库当前无 handler） | Stripe 签名校验 |

文件落点：
- 页面：[app/[locale]/(public)/donate/page.tsx](../../app/[locale]/(public)/donate/page.tsx)
- 客户端表单：[app/[locale]/(public)/donate/DonateForm.tsx](../../app/[locale]/(public)/donate/DonateForm.tsx)
- API：[app/api/donate/checkout/route.ts](../../app/api/donate/checkout/route.ts)
- Webhook：[app/api/stripe/webhook/route.ts](../../app/api/stripe/webhook/route.ts)（**新建**——目前 `app/api/` 下只有 `cron/`，仓库内尚无 Stripe webhook handler）
- 业务层：[lib/donations/](../../lib/donations/)（`createCheckoutSession`、`getCampaignProgress`、`recordPayment`、`recordRefund`、`claimEvent` / `finalizeEvent`）

---

## 3. 数据模型

新增**四张表**（Drizzle schema，落到 [lib/db/schema/donations.ts](../../lib/db/schema/donations.ts)）：`campaigns`、`donations`、`donation_payments`、`processed_stripe_events`。与现有 `payments` 表**完全独立**——`payments` 关联 `bookings`，捐款没有 booking。

```ts
// campaigns: 一个募资活动（MVP 只有一行）
campaigns {
  id: uuid PK
  slug: text unique           // 'silverconnect-2026-q2'
  title: text
  goalAmount: decimal(12,2)
  currency: text              // 'AUD'
  startsAt / endsAt: timestamptz
  isActive: boolean
  createdAt / updatedAt
}

// donations: 一次"承诺"——单次捐款 1 行；月捐 1 行（subscription record）
//   donations.amountCents 仅是最初承诺金额，不参与进度求和
donations {
  id: uuid PK
  campaignId: uuid FK -> campaigns.id
  amountCents: integer notnull                  // 最小货币单位（cents），与 Stripe 一致
  currency: text                                // 'aud' (lowercase, 与 Stripe 一致)
  mode: enum('once' | 'monthly')
  // 状态语义按 mode 分：
  //   once    : pending → completed | failed   (一锤子买卖)
  //   monthly : pending → active → cancelled   (订阅生命周期)
  status: enum('pending' | 'completed' | 'active' | 'cancelled' | 'failed')
  stripeSessionId: text unique nullable
  stripeCustomerId: text nullable
  stripeSubscriptionId: text unique nullable    // monthly only
  donorName: text
  donorEmail: text                              // 写库前 lower(trim(...))
  donorPhone: text nullable
  donorMessage: text nullable
  isAnonymous: boolean default false
  createdAt / updatedAt
  // index: campaignId, status, donorEmail
}

// donation_payments: 每一次实际扣款 1 行（单次 1 行；月捐每月 1 行）
//   进度求和的唯一来源
//   ⚠️ 全表金额一律存 cents (integer)，与 Stripe API（amount_paid / amount_refunded / unit_amount）保持单位一致，
//      消除"主单位 vs 最小单位"换算 bug。展示时在 UI 层 / cents/100 → AUD。
donation_payments {
  id: uuid PK
  donationId: uuid FK -> donations.id
  campaignId: uuid FK -> campaigns.id           // denormalized 方便聚合
  amountCents: integer notnull                  // 退款时不改，靠 refundedAmountCents 表达冲减
  refundedAmountCents: integer notnull default 0  // 累计已退；进度计算用 (amountCents - refundedAmountCents)
  currency: text                                // 'aud'
  status: enum('succeeded' | 'partially_refunded' | 'refunded')  // 失败的不进表
  stripePaymentIntentId: text unique nullable   // 单次：session.payment_intent；月捐：invoice.payment_intent
  stripeInvoiceId: text unique nullable         // 月捐用
  stripeChargeId: text nullable                 // refund webhook 通过这个或 PI 反查
  stripeRefundIds: text[] default '{}'          // 多次部分退款都追加进来
  receiptUrl: text nullable                     // charge.receipt_url
  billingReason: text nullable                  // 'manual' | 'subscription_create' | 'subscription_cycle'
  capturedAt: timestamptz notnull
  refundedAt: timestamptz nullable
  createdAt: timestamptz default now
  // index: campaignId+status (for SUM), donationId, stripeInvoiceId, stripeChargeId
}

// processed_stripe_events: webhook 幂等表 + stale lock 接管（见 §4 ① / §7）
processed_stripe_events {
  id: text PK                                   // Stripe event.id
  type: text
  status: enum('processing' | 'succeeded' | 'failed') notnull
  attemptCount: int default 1
  lastError: text nullable
  lockedAt: timestamptz nullable                // 进入 processing 时写入；finalize 时清空
  receivedAt: timestamptz default now
  completedAt: timestamptz nullable
}
// STALE_LOCK_THRESHOLD = 5 minutes (常量，定义在 lib/donations/events.ts)
```

**进度计算**：
- raisedCents = `SUM(amountCents - refundedAmountCents) WHERE campaignId=X AND status IN ('succeeded','partially_refunded')`（每月续费 / 退款都自然反映）
- 展示时除以 100 得到 AUD（仅 2-decimal 货币安全；JPY / KRW 等 0-decimal 货币要按 [Stripe currency table](https://stripe.com/docs/currencies) 单独处理，但本期只有 AUD 不涉及）
- donor count = `COUNT(DISTINCT lower(trim(donations.donorEmail))) WHERE EXISTS(净额 > 0 的 donation_payments)`；全额退款后不再计入捐赠人数
- 60s in-memory cache 避免每次进页面打 DB

迁移命令（项目脚本，[package.json](../../package.json) line 20-23）：`npm run db:generate` 生成 SQL → review → `npm run db:migrate` 在目标环境执行。

---

## 4. 支付流程（Stripe）

采用 **Stripe Checkout（hosted page）**，不是 Elements/PaymentIntent 直连，理由：
1. 公益捐款 PCI 合规要求最低，hosted 最省事
2. 无需在前端加载 Stripe.js + 卡输入组件
3. 月捐用 Stripe Subscription，Checkout 同样支持

### 流程
```
用户点"确认捐款"
  → POST /api/donate/checkout { amountCents, currency, mode, locale, donor: { name, email, phone?, message? }, isAnonymous? }
        - amountCents: integer（必须整数 cents，拒绝小数 / 浮点 / 负数）；范围 100..5000000
        - currency: enum 白名单（MVP 仅 'aud'）
        - mode: 'once' | 'monthly'
        - locale: 'en' | 'zh-CN' | 'zh-TW' | 'ja' | 'ko'
        - donor.email: 写库前 lower(trim)
  → 服务端：
      1. zod 校验 + 速率限制（5 req/min/IP）
      2. 写一行 donations，status='pending'
      3. 计算 appUrl：
            - appUrl = getAppUrl()   ⚠️ **server-only**，内部读取 process.env.APP_URL，不是 NEXT_PUBLIC_APP_URL
              （生产='https://silverconnect.xinxinsoft.org'；本地='http://localhost:3000'）
              理由：NEXT_PUBLIC_* 在 build 时 inline 进 client bundle，旧 bundle 缓存会指向旧域名；
                    server-only env 在 runtime 读，换域名重启即生效，避免历史踩过的坑
              缺失则在 `createCheckoutSession()` / 邮件链接生成等实际需要绝对 URL 的调用点 fail-fast 抛错（部署前必须配，不要做静默 fallback）
              helper 要做尾斜杠规范化：`const appUrl = new URL(process.env.APP_URL)`，后续路径统一用 `new URL(path, appUrl).toString()`
            - 不要从 request headers 推断 origin——可被伪造
         调 stripe.checkout.sessions.create({
           mode: mode === 'monthly' ? 'subscription' : 'payment',
           // 两种 mode 都用 price_data 即时构造（不预建 Stripe Price）
           line_items: [{
             quantity: 1,
             price_data: {
               currency: 'aud',
               unit_amount: amountCents,   // 已是 cents，无需再乘 100
               product_data: { name: 'SilverConnect 公益捐款' },
               ...(mode === 'monthly' ? { recurring: { interval: 'month' } } : {}),
             },
           }],
           // ⚠️ Stripe 要求绝对 URL，且我们要保留 locale 给跳回页
            success_url: new URL(`/${locale}/donate/success?session_id={CHECKOUT_SESSION_ID}`, appUrl).toString(),
            cancel_url:  new URL(`/${locale}/donate/cancel`, appUrl).toString(),
           customer_email: donorEmail,           // payment 模式：仅作收据；subscription 模式：Checkout 会自动 promote 成 Customer
           metadata: { donationId, campaignId },
           // 让两种 mode 都能在 PI 层带上 donationId 方便排查
           ...(mode === 'once'
             ? { payment_intent_data: { metadata: { donationId, campaignId } } }
             : { subscription_data: { metadata: { donationId, campaignId } } }),
         })
      4. 把 session.id 写回那行 donations
      5. return { url: session.url }
  → 前端 window.location = session.url
  → 用户在 Stripe 域名完成支付

Webhook 处理顺序（详见 §7 幂等保证）：
  → /api/stripe/webhook 接收 event
  → ① CLAIM：INSERT processed_stripe_events { id, type, status='processing', lockedAt=now } ON CONFLICT (id) DO UPDATE
        SET status='processing', lockedAt=now, attemptCount=attemptCount+1, lastError=null
        WHERE processed_stripe_events.status='failed'
           OR (processed_stripe_events.status='processing' AND processed_stripe_events.lockedAt < now() - INTERVAL '5 minutes')   -- stale lock 接管
        RETURNING (xmax = 0) AS first_insert, status, lockedAt
       - 用 RETURNING + xmax 区分本次是 INSERT 还是 UPDATE 还是没动
       - 若 RETURNING 空 (=已存在 succeeded 或 active processing 未过期) → 再读一次：
         · succeeded → return 200（重复投递，无操作）
         · processing 且 lockedAt 在 5 min 内 → return 409，让 Stripe 稍后 retry（避免并发）
       - 否则 → 视为 claim 成功，继续 ②

  → ② BUSINESS：在事务里完成业务幂等写入。**只在 donation_payments 上落 PI/charge/invoice 等 Stripe 标识；donations 表只持 sessionId / customerId / subscriptionId 等 subscription-record 字段**：
       · checkout.session.completed (mode=payment)：
            - UPDATE donations SET status='completed' WHERE stripeSessionId=session.id   （单次=completed；PI 不写 donations，只在 donation_payments）
            - retrieve charge via session.payment_intent → 取 charge.id / receipt_url
            - INSERT donation_payments { donationId, campaignId, amountCents=session.amount_total, stripePaymentIntentId=session.payment_intent, stripeChargeId, receiptUrl, billingReason='manual', status='succeeded', capturedAt }
              ON CONFLICT (stripePaymentIntentId) DO NOTHING
              RETURNING id   -- 用 RETURNING 判断是否真的插入
       · checkout.session.completed (mode=subscription)：
            - UPDATE donations SET status='active', stripeCustomerId, stripeSubscriptionId WHERE stripeSessionId=session.id   （月捐=active）
            - 不写 donation_payments（首次扣款由后续 invoice.paid billing_reason='subscription_create' 写）
        · invoice.paid：
            - 通过 invoice.subscription 找 donations 行；若尚未写入 `donations.stripeSubscriptionId`（Stripe 事件乱序：`invoice.paid` 可能早于 `checkout.session.completed` 完成），则 retrieve Subscription，用 `subscription.metadata.donationId` 兜底定位 donation
            - retrieve PaymentIntent via `stripe.paymentIntents.retrieve(invoice.payment_intent, { expand: ['latest_charge'] })`
              → 从 pi.latest_charge 取 charge.id / charge.receipt_url
              （比走 `invoice.charge` 更稳：与单次 payment 路径一致，且 PI 模型是新 Stripe 推荐入口）
            - INSERT donation_payments { donationId, campaignId, amountCents=invoice.amount_paid, stripeInvoiceId, stripePaymentIntentId=invoice.payment_intent, stripeChargeId=charge.id, receiptUrl=charge.receipt_url, billingReason=invoice.billing_reason, status='succeeded', capturedAt }
              （invoice.amount_paid 已是 cents，直接写）
              ON CONFLICT (stripeInvoiceId) DO NOTHING RETURNING id
       · invoice.payment_failed：
            - 月捐 donations.status 不变（仅记日志），Stripe 自身有 retry / dunning
       · refund.created（**主路径**——event 对象就是 Refund，能稳定拿 refund.id）：
            - 通过 refund.payment_intent 或 refund.charge 找 donation_payments 行
            - 幂等检查：if `refund.id = ANY(row.stripeRefundIds)` → no-op return
            - 否则 UPDATE：
                stripeRefundIds = array_append(stripeRefundIds, refund.id),
                refundedAmountCents = refundedAmountCents + refund.amount,    -- refund.amount 已 cents
                status = CASE WHEN (refundedAmountCents + refund.amount) >= amountCents THEN 'refunded' ELSE 'partially_refunded' END,
                refundedAt = now
              WHERE id=row.id

       · charge.refunded（**兜底路径**——charge 对象不带 refund.id；只用来同步 charge.amount_refunded 防 refund.created 漏发）：
            - 通过 charge.payment_intent 或 charge.id 找 donation_payments 行
            - 仅当 `charge.amount_refunded > row.refundedAmountCents` 时才 UPDATE：
                refundedAmountCents = charge.amount_refunded,
                status = CASE WHEN charge.amount_refunded >= amountCents THEN 'refunded' ELSE 'partially_refunded' END,
                refundedAt = COALESCE(refundedAt, now)
              WHERE id=row.id
              ⚠️ **不**追加 stripeRefundIds（拿不到 refund.id；refund.created 会负责追加）
            - 这样兜底与主路径互不干扰：主路径正常工作时此分支总是 no-op；主路径漏发时此分支保证 refundedAmountCents 不掉链
            - 进度查询用 `SUM(amountCents - refundedAmountCents) WHERE status IN ('succeeded','partially_refunded')` 自动反映

       依据：[Stripe Docs — Refund objects & events](https://stripe.com/docs/refunds#listening-for-refund-events) 推荐至少监听 `refund.created`；`charge.refunded` 的 event 对象是 Charge，没有 refund.id 信息。
       · customer.subscription.deleted：
            - UPDATE donations SET status='cancelled', updatedAt=now WHERE stripeSubscriptionId=subscription.id
            - 不动 donation_payments（历史扣款保留）
            - 可选：发一封"订阅已取消"通知邮件

  → ③ POST-COMMIT：仅在 ②真正插入了新 donation_payment（RETURNING id 非空）的情况下，发感谢邮件
       · 退款 / 订阅取消事件**不**走感谢信路径
       · 用 sendEmail() 直发；邮件失败仅 console.error，不回滚

  → ④ FINALIZE：UPDATE processed_stripe_events SET status='succeeded', completedAt=now, lockedAt=null WHERE id=event.id
       · 若 ②③ 任意 throw → CATCH → UPDATE status='failed', lastError=err.message, lockedAt=null → 返回 5xx 让 Stripe retry（下次进 ① 会因 status='failed' 被允许 claim）

  → Stripe 跳回 /donate/success?session_id=… 显示感谢页（基于 donation 行渲染，与 webhook 异步无关）
```

### 月捐定价
不预先在 Stripe 后台建 Price，单次和月捐都用 `price_data` 即时构造（见上方 line_items）。月捐多了 `recurring.interval='month'`。代价：Stripe Dashboard 里 Product 会比较散；收益：不需要在 Dashboard 维护 Price 表。

### 环境变量
项目 [.env.example](../../.env.example) 已声明 `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`（hosted Checkout 跳转只需服务端 secret，前端**不需要** publishable key，故 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` 不在本期必需项）。

**新增**：
- `APP_URL`（**server-only**，必填，无默认；用于 Stripe `success_url` / `cancel_url` / 邮件链接等所有服务端绝对 URL 构造）
  - 生产：`https://silverconnect.xinxinsoft.org`
  - 本地：`http://localhost:3000`
  - **不要**复用 `NEXT_PUBLIC_APP_URL`：后者在 build 时被 inline 进 client bundle，换域名时旧 bundle 缓存仍指向旧地址，仓库历史踩过此坑
  - 缺失时在实际需要绝对 URL 的 helper 内 fail-fast 抛错（例如 `createCheckoutSession()` / 邮件链接生成），不要在整个 `lib/donations/` 模块加载时校验，避免只查进度或跑非支付测试也被 `APP_URL` 卡住
  - 构造跳回链接必须用 `new URL(path, appUrl).toString()` 或等价 helper，避免 `APP_URL` 误带尾斜杠时生成双斜杠
- `NEXT_PUBLIC_DONATE_DEFAULT_CURRENCY`（默认 `AUD`）

> ⚠️ live keys 用于生产，test keys 仍保留供本地 / E2E 使用（参见 §9 验收标准明确分离 test-mode 与 live smoke）。

---

## 5. 页面落地（demo → React）

### 5.1 整体
- 复用 [components/layout/Header.tsx](../../components/layout/Header.tsx)，**不**搬 demo 自己的顶栏
- demo 色板与项目 token 已对齐，**无需修改 [tailwind.config.ts](../../tailwind.config.ts)**（详见 §5A.1 映射表）
- 字体走项目现有方案，不引入 Google Fonts 外链

### 5.2 文案 i18n
所有中文字符串 → `messages/zh-CN.json` 的新 namespace `donate`，同时给出 en / zh-TW / ja / ko 的翻译占位（先用英文做 fallback）。
关键键：`donate.hero.title / hero.subtitle / progress.raised / amounts.25.hint …`

### 5.3 进度卡（Hero 右侧）
- Server Component 直接 `await getCampaignProgress()` 渲染
- 进度条入场动画放进 client wrapper，width 通过 CSS 变量传

### 5.4 故事区
- 3 张静态卡，文案进 i18n，头像用 emoji 占位（与 demo 一致）。后期换真人照片再改

### 5.5 资金分配饼图
- demo 是手写 SVG donut，直接复制
- 数字（45/25/15/10/5）落到 `messages.*.json` 的 `donate.allocation.items` 数组

### 5.6 捐款表单
- 必须是 Client Component（按钮选金额、自定义金额输入、Submit 调 API）
- 字段校验：`zod` schema 与 server action 同源（`lib/donations/schema.ts`）
- 提交按钮 loading 态，失败 inline 报错（不用 alert）

### 5.7 Footer
合并到主站 Footer，不重复实现。demo 的 ABN / contact 信息写进现有 Footer（如需）。

---

## 5A. 视觉设计规范（demo → 现有 design system 映射）

### 5A.1 与现有 token 的对齐情况
demo 的色板**与项目 CSS 变量完全一致**（在 [app/globals.css](../../app/globals.css) 中已定义），可直接复用 Tailwind class，无需新增 token：

| demo 写法（hex / 自定义） | 替换为项目 class | 来源 |
|---|---|---|
| `bg-brand` (#1858C4) | `bg-brand` | `--brand-primary` ✓ 已对齐 |
| `bg-brand-hover` | `bg-brand-hover` | `--brand-primary-hover` ✓ |
| `text-accent` (#F59E0B) | `text-brand-accent` | `--brand-accent` ✓ |
| `bg-surface-1/2` | `bg-bg-surface` / `bg-bg-surface-2` | ✓ |
| `border-line` | `border-border` | `--border` ✓ |
| `text-ink-1/2/3` | `text-text-primary/secondary/tertiary` | ✓ |
| `rounded-md` (14px) | `rounded-md` | `--radius-md` ✓ 像素值一致 |
| `shadow-card` | `shadow-card` | ✓ 已对齐 |
| `min-h-btn` (56px) | `min-h-touch-btn` | ✓ |
| `min-h-touch` (48px) | `min-h-touch` | ✓ |
| `text-success` / `text-danger` | `text-success` / `text-danger` | ✓ |

故事卡上**单点出现的硬编码 hex**（`#FCE7F3`/`#DCFCE7`/`#EDE9FE` 头像底色，`#E8F0FE`/`#FEE2E2`/`#FEF3C7` 标签底色）→ 直接保留为 inline `style={{...}}`，不进 token，理由：一次性装饰色，进 token 是过度抽象。

### 5A.2 ⚠️ 容器宽度冲突（必须先决策）
- demo：`max-w-6xl`（1152px）+ 双列 Hero / 双列 Allocation
- 项目 [UI_DESIGN.md §1.3 L88](../../docs/UI_DESIGN.md#L88)：所有页面最大 720px 单列

**建议决策（已默认采用）**：**捐款页破例使用 1152px**，因为：
1. 它是公众营销落地页，不是老年用户使用的 app shell
2. 双列 Hero 是 demo 视觉重点，强行 720px 单列会损失"已筹/目标"对照感
3. 类比："about / pricing / donate" 这类 marketing page 在大多数 design system 里都被显式排除

**实现**：不改 `tailwind.config.ts` 的 `container.screens`，而是在页面层用 `max-w-6xl mx-auto px-5`，并在 [docs/UI_DESIGN.md](../../docs/UI_DESIGN.md) 的"宽度规范"段落补一条豁免说明（"`/donate` 等公开营销页不受 720px 约束"）。

如果**否决该建议**：方案需重做 5A.3 / 5A.4 / 5A.5 的栅格部分（Hero 改纵向堆叠、Allocation 改纵向、Stories 改 2 列）。

### 5A.3 字号与字重
完全沿用 [tailwind.config.ts L78-84](../../tailwind.config.ts#L78-L84) 定义的 token，但 demo 个别地方写死 px：

| 位置 | demo 写法 | 改用 |
|---|---|---|
| Hero H1 | `text-[36px] md:text-[44px]` | 保留（marketing page 大标题，超出常规 H1=32 是合理破格，已与 5A.2 同理由豁免） |
| Section H2 | `text-[28px] md:text-[32px]` | 改 `text-h2 md:text-h1` |
| Card 标题 | `text-[18px]` / `text-[20px]` / `text-[22px]` | 改 `text-body` / `text-h3` |
| 表单 label | `text-sm` | 沿用 |
| 数字大字 | `text-[28px]` / `text-[32px]` | 保留 inline px（统计数字是品牌视觉，不走 H1/H2 token） |

字体：项目已加载 Inter + Noto Sans SC，**不要**像 demo 那样在 `<head>` 引 Google Fonts；`<html>` 根 `font-size` 也**不**改成 18px（项目默认 16px，body 字号通过 `text-body` 显式 18px 控制）。

### 5A.4 间距与圆角
- 内边距：sections 用 `py-16 md:py-20`（demo 一致），卡片内 `p-6 md:p-8`
- 圆角：所有卡片 `rounded-lg`（20px = `--radius-lg`），按钮 `rounded-md`（14px），药丸切换 `rounded-full`
- 栅格 gap：`gap-3` (12px) 用在金额按钮之间，`gap-4` (16px) 用在表单字段之间，`gap-6 md:gap-10` 用在 section 主栅格

### 5A.5 关键交互组件清单（要写进 [components/donate/](../../components/donate/)）

| 组件 | 文件 | 状态机 / props |
|---|---|---|
| `<ProgressCard>` | `ProgressCard.tsx` server | props: `{ raised, goal, donors, avgAmount, communities, daysLeft }`；进度条入场动画用 client 子组件 `<ProgressBar pct={...} />` |
| `<ImpactStats>` | `ImpactStats.tsx` server | 4 张卡 grid，数据从 i18n 读 |
| `<StoryCard>` | `StoryCard.tsx` server | props: `{ initial, name, age, location, quote, tags: [{label, color}] }` |
| `<AllocationDonut>` | `AllocationDonut.tsx` server | SVG 复制 demo，segments 从 i18n 数组生成 |
| `<DonateForm>` | `DonateForm.tsx` **client** | 内部状态：`mode: 'once' \| 'monthly'`、`amount: number`、`isSubmitting: boolean`、`error: string \| null` |
| `<AmountButton>` | （内联 in DonateForm） | 状态：default / active / hover / focus（focus 必须有 2px outline，参考 globals.css `outline-offset:2`） |
| `<PillToggle>` | `PillToggle.tsx` client | 受控组件，键盘左右切换 |

### 5A.6 状态规范（form）
- **Submit pending**：按钮文本 → spinner + "处理中..."，`disabled`，`opacity-70`
  > 例外说明：项目通用规范 [UI_DESIGN.md L100](../../docs/UI_DESIGN.md#L100) "加载状态使用骨架屏，不用 spinner" 针对的是页面/区块加载；**表单提交按钮内 spinner 是公认例外**（按钮区域太小，骨架屏不适用），不属于规范冲突
- **Submit error**：按钮下方 `<p class="text-danger text-sm mt-2">` 显示错误，按钮恢复
- **Validation**：`zod` 客户端 + 服务端同 schema；email 格式错 → input border 变 `border-danger`，下方红色提示
- **Amount = 0 或空**：Submit 按钮 `disabled`，**inline hint**（按钮下方一行 `text-tertiary text-sm`）"请选择金额"——不要用 tooltip，触摸设备 + 老年用户看不到 hover 提示
- **Custom amount > 50000**：inline 提示 "单笔上限 $50,000，大额捐赠请联系 contact@silverconnect.org"
- **Loading 跳 Stripe**：按钮 spinner 持续到 `window.location` 跳走（可能 1-3s）

### 5A.7 响应式断点
- `<640px`（移动）：所有 grid 单列；金额按钮 `grid-cols-2`；Hero 文案在上、进度卡在下
- `640-768px`：金额按钮 `grid-cols-4`；Hero 仍单列
- `≥768px`（md）：Hero 双列、Allocation 双列、Stories 三列；金额按钮 `md:grid-cols-4`
- 触控区：所有按钮、input 强制 `min-h-touch-btn`（56px），符合老年友好 + WCAG 2.5.5

### 5A.8 a11y / 老年友好
- 所有 `<button>` 必须有可见 focus ring（项目 globals.css 已全局启用 `outline: 2px solid var(--brand-primary)`）
- 颜色对比度：brand on white ≥ 7:1（已满足，AAA）；text-tertiary 仅用于辅助文案，不用于关键信息
- 表单 label 必须用 `<label htmlFor>` 关联 input，不用 placeholder 替代 label
- 金额按钮选中态用 `aria-pressed="true"`
- Donut 图必须有 `<title>` + 文本 fallback（screen reader 朗读"上门陪伴 45%..."）
- 不依赖颜色传达信息（错误态除红色外要带 ⚠ 图标）

### 5A.9 暗色模式
项目支持 `[data-theme="dark"]`。demo 是纯亮色，本期捐款页**强制亮色**。

**实现方式**：`<html>` 在 [app/layout.tsx L44](../../app/layout.tsx#L44) 渲染，page 组件**不能**直接修改 `<html>` 属性。改用：
- 在 `app/[locale]/(public)/donate/page.tsx` 渲染时，最外层 `<div data-theme="light" class="...">` 包裹整个页面，并加 `bg-bg-base text-text-primary` 显式定 token
- 或新增 [app/[locale]/(public)/donate/layout.tsx](../../app/%5Blocale%5D/%28public%29/donate/layout.tsx)，在 layout 根 div 设 `data-theme="light"`
- **不要**用 client `useEffect` 改 `document.documentElement` 属性（会引起首屏闪烁、SSR 不一致、且离开页面时还要恢复）

理由：营销页色彩调性已锁定，暗色饼图 / 渐变进度条需要单独设计，不在本期范围。

### 5A.10 不引入的依赖
- ❌ Google Fonts CDN（项目已自托管 Inter + Noto Sans SC）
- ❌ Tailwind CDN（demo 用 `cdn.tailwindcss.com`，项目用本地构建）
- ❌ 图表库（Recharts/Chart.js）：donut 是 6 段静态 SVG，不值得引一个库

---

## 6. 邮件 / 收据
- **Stripe 自动收据**：在 Stripe Dashboard 开 "Customer emails → Successful payments / Successful subscription renewals" 即可；**不**在 Checkout 调用上传 `receipt_email`（subscription 模式不支持，单次模式与 Dashboard 开关冲突会重复）
- **我方感谢信**：中文/本地化模板放 [lib/notifications/templates/donation-thanks.tsx](../../lib/notifications/templates/donation-thanks.tsx)；调用方为 webhook handler（`sendEmail` 直发，不经 `notify()`，因捐赠人无 user 账号）
- **触发时机**：webhook 流程 ③ POST-COMMIT 中——单次扣款发一次；月捐每次 `invoice.paid`（含首单 `subscription_create` 和续费 `subscription_cycle`）都发一次
- **措辞约束**：邮件文案不出现"可抵税 / tax-deductible"，统一用"感谢您的捐款 / Thank you for your donation"，留税务字段空位等 DGR 资质确认后再补

---

## 7. 安全 / 合规

| 项 | 措施 |
|---|---|
| 表单滥刷 | `/api/donate/checkout` 限流：每 IP 5 次/分钟 |
| 金额操纵 | 服务端必须从请求体重新读 `amountCents`，校验其为整数且范围 `100..5000000`；`currency` 走白名单（MVP 仅 `'aud'`） |
| Webhook 伪造 | 严格 `stripe.webhooks.constructEvent` 签名校验 |
| PII | donorEmail / phone / message 写库前 trim + 长度截断；出现在日志里要脱敏 |
| Idempotency | 五层防护：① `processed_stripe_events` claim-then-finalize（见 §4 webhook 流程）防整个 event 重复；② **stale lock 接管**——超过 5 分钟仍 `processing` 的 event 视为前一进程崩溃，下次 claim 会接管，避免永久卡死；③ `donation_payments` 上 `stripePaymentIntentId` / `stripeInvoiceId` unique + ON CONFLICT DO NOTHING 防业务行重复；④ 退款用 `NOT (refund.id = ANY(stripeRefundIds))` 防同 refund 重复扣减；⑤ 邮件发送只在"真正插入新行"时触发，避免 retry 重复发信 |
| robots | `/donate` 允许收录，`/donate/success` `noindex`（带 session_id） |

---

## 8. 落地步骤（建议顺序）

1. **schema + migration**：建 `campaigns` / `donations` / `donation_payments` / `processed_stripe_events` **四张表**，seed 一条 active campaign
2. **lib 业务层**：`createCheckoutSession`、`getCampaignProgress`、`recordPayment`（return `{ inserted }`）、`recordRefund`、`claimEvent` / `finalizeEvent`，含单元测试（含 stale-lock 接管 / 退款部分退款 / refund 重投递三种边界）
3. **API route**：`/api/donate/checkout`，含 zod 校验 + 限流
4. **Webhook**：新建 Stripe webhook handler（仓库目前没有），处理事件：
   - `checkout.session.completed`（payment / subscription 两分支）
   - `invoice.paid`（subscription_create + subscription_cycle 同分支；用 PI + expand `latest_charge` 取 receipt_url，不走 invoice.charge）
   - `invoice.payment_failed`（仅 log）
   - `refund.created`（**主路径**，幂等追加 stripeRefundIds + 累加 refundedAmountCents）
   - `charge.refunded`（**兜底**，仅同步 charge.amount_refunded，不动 stripeRefundIds）
   - `customer.subscription.deleted`（donations.status='cancelled'）

   ⚠️ **本地开发提醒**：现有 [docs/zh/DEVELOPMENT.md L141](DEVELOPMENT.md#L141) 写的 `stripe listen --forward-to localhost:3000/api/webhooks/stripe` 是旧路径（且仓库当前没有该 handler）。本期新增 `/api/stripe/webhook` 后，**同步更新两份 DEVELOPMENT.md 的 forward-to 为 `/api/stripe/webhook`**（zh + en）；旧路径可删除一并提示。
5. **页面**：`/[locale]/donate` server component（hero + 进度 + 故事 + 饼图）
6. **表单组件**：`DonateForm.tsx` client component
7. **i18n**：`messages/*.json` 补 `donate` namespace
8. **success / cancel 页**
9. **感谢邮件模板**
10. **E2E**：`e2e/donate.spec.ts`——单次 $50 走通到 success 页；月捐走通；`amountCents=0` 被拒
11. **部署**（单一 VPS，已有 HTTPS）：
    - 主站现已有 HTTPS：`https://silverconnect.xinxinsoft.org`（AWS-1 Sydney nginx + Let's Encrypt → HTTP 转 VPS-5，参见 [AGENTS.md L13](../../AGENTS.md)）
    - 因此 `/donate` 页面、`/api/donate/checkout`、`/api/stripe/webhook` **全部走主站 HTTPS**，不再需要 Vercel 分担 webhook
    - 部署：`.\scripts\deploy.ps1`；DB 迁移在 VPS 上执行 `npm run db:migrate`
    - Stripe Dashboard webhook endpoint 填 `https://silverconnect.xinxinsoft.org/api/stripe/webhook`
    - VPS `/opt/silverconnect/.env.local` 已有 `STRIPE_SECRET_KEY`，需补：
      - `STRIPE_WEBHOOK_SECRET`(live mode endpoint signing secret)
      - `APP_URL=https://silverconnect.xinxinsoft.org`（server-only，新增）
      - `NEXT_PUBLIC_DONATE_DEFAULT_CURRENCY=AUD`
    - **注意**：webhook handler 必须读 raw body 验签，Next.js App Router 的 route.ts 用 `await req.text()` 取 raw 后再传 `stripe.webhooks.constructEvent`

---

## 9. 验收标准

### 9.1 Test mode 验收（本地 / preview，使用 sk_test / 测试卡 4242…）
- [ ] 桌面 / 移动两种宽度下 `/zh-CN/donate` 与 demo 视觉一致（误差 < 主观阈值）
- [ ] 选 $50 → Stripe Checkout → 4242 卡成功 → 跳回 success 页 → DB `donations.status='completed'`（单次）且 `donation_payments` 一行 `succeeded` `amountCents=5000` → 进度 +$50 / donor +1
- [ ] 选月捐 $25 → Subscription 创建成功（`donations.mode=monthly, status=active`）→ Stripe CLI 模拟 `invoice.paid billing_reason=subscription_create` → `donation_payments` 多 1 行 `amountCents=2500`；再触发 `invoice.paid billing_reason=subscription_cycle` → 又多 1 行；进度共 +$50
- [ ] 重复投递同一 event.id（用 Stripe CLI 重发）→ DB 不出现重复行、邮件只发一次（验证 §4 ①②③④ 顺序）
- [ ] 自定义金额 0 / 负数 / >50000 被表单 + 服务端拒绝
- [ ] 无网络 / 服务端 5xx 时表单显示错误，按钮恢复可点
- [ ] 五种 locale 切换字符串都有翻译（en/zh-CN/zh-TW/ja/ko）
- [ ] Lighthouse: Performance ≥ 85, Accessibility ≥ 95

### 9.2 Live smoke（生产部署后，使用 sk_live；只跑一次）
- [ ] 在 `https://silverconnect.xinxinsoft.org/zh-CN/donate` 用真实 $1 单次捐款走通 → 邮件、DB、进度都更新
- [ ] **完成后立即在 Stripe Dashboard 退款** $1，确认：
  - `refund.created` webhook 命中，handler 按 `refund.id` 幂等处理并追加 `stripeRefundIds`
  - `charge.refunded` webhook 可选命中；若命中，只作为兜底同步 `charge.amount_refunded`，不追加 `stripeRefundIds`，且 handler 不报错
  - `donation_payments.status='refunded'`、`refundedAmountCents=100`、`stripeRefundIds` 含 refund.id
  - 进度查询返回值减少 $1（验证 `SUM(amountCents - refundedAmountCents)` 生效）
- [ ] 月捐 live smoke 跳过（开订阅就要等真实月度账单，不适合 smoke）

---

## 10. 风险 & 待决策

| # | 风险 | 当前决策 |
|---|---|---|
| R1 | ~~VPS HTTP-only~~ | **已解除**：主站 HTTPS 已在 AWS-1 终止（[AGENTS.md L13](../../AGENTS.md)），webhook 直接走主站 `/api/stripe/webhook` |
| R2 | 多币种（AU/US/CA 三国服务范围）混在一个 campaign 里，进度怎么算 | MVP 只跑 AUD 单币种；US/CA 捐赠人在 Stripe Checkout 看到的也是 AUD（页面文案明示"All amounts in AUD"），后期再按 region 拆 campaign |
| R3 | 月捐取消通道 | 后端已实现：webhook `customer.subscription.deleted` → donations.status='cancelled'（见 §4 / §8 step 4）。**前端**自助取消页本期不做，捐赠人需来邮请求；管理员在 Stripe Dashboard 手动取消订阅即可触发上述 webhook |
| R4 | 税务收据合规 | 本期**不**承诺"可抵税"。文案统一为"捐款收据 / 感谢信"，DGR 资质 + 法定字段（ABN、DGR 编号、收据法定措辞）经法务确认后再升级为正式税务收据 |

---

## 11. 不影响范围
- 不改 `bookings` / `payments` / `payouts` 任何现有表
- 不动现有 booking 支付流程（仓库内目前**没有** Stripe webhook handler，本期是从零新增；与未来 booking 端可能加的 webhook 不冲突，event 路由按 `event.type` 分发即可共用同一个 `/api/stripe/webhook`）
- 不改 auth / 路由守卫
- Header / Footer 仅追加链接，不改结构
