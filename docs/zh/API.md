# API 参考

所有路由位于 `app/api/**/route.ts` 的 Next.js Route Handlers。Base URL：与应用同源。

- **格式**：JSON in / JSON out。**Body 字段命名跨路由不一致**——较新的端点用 camelCase（`bookingId`、`providerId`），少数（如 `/api/feedback`）仍用 snake_case（`booking_id`）。具体以下方各端点为准；不确定时以路由代码为准。
- **认证**：Supabase session cookie。`users` 表上现有两个角色相关列：`user_type`（`customer`|`provider`，注册时设置）和 `role`（admin 检查读 `profile.role === 'admin'`，用于 `/api/ai/*` 与 `/api/safety-flags`）。在 schema 合并前请视为同一逻辑"角色"。
- **错误**：`{ "error": "<message>" }` 配合 HTTP 状态码（400 / 401 / 403 / 404 / 409 / 422 / 500）。

> 此处方法与 `route.ts` 真实 `export` 一致。有疑义以源码为准。

## 约定

| HTTP | 含义 |
|---|---|
| `GET` | 列出 / 取详情 |
| `POST` | 创建 |
| `PUT` / `PATCH` | 更新（按端点） |
| `DELETE` | 删除 |

分页（如支持）：`?limit=<n>&offset=<n>`。

---

## Bookings

### `/api/bookings` — `GET, POST, PATCH`
- `GET` — 列出调用者的预订。过滤：`?status=`、`?from=`、`?to=`、`?role=customer|provider`。
- `POST` — 创建。Body（camelCase）：`{ providerId, serviceId, bookingDate, startTime, duration, address, specialInstructions? }`，`duration` 单位分钟。返回插入的 `bookings` 行（status=`PENDING`、payment_status=`UNPAID`）。
- `PATCH` — 批量状态/重新分派。

### `/api/bookings/[id]` — `GET, PUT, DELETE`
- `GET` — 取一条（RLS 校验）。
- `PUT` — 更新（状态、改约）。Body camelCase：`{ status?, bookingDate?, startTime?, reason? }`。
- `DELETE` — 取消；按 FR-02 服务端计算退款资格。

### `/api/bookings/recurring` — `GET, POST, PUT, DELETE`
循环规则（`weekly | biweekly | monthly`）。

### `/api/bookings/reminders` — `GET, POST, PUT, DELETE`
即将到来的预订提醒。

### `/api/booking` — `GET, POST, PATCH, DELETE`
*遗留单资源端点，向后兼容。* Body 形如 `{ action: "create"|"cancel"|"modify"|"status", booking_id?, details? }`。

---

## Customer

### `/api/customer` — `GET, POST, PUT`
调用者资料（读/创建/更新）。

### `/api/customer/addresses` — `GET, POST, PUT, DELETE`
保存地址。

### `/api/customer/favorites` — `GET, POST, DELETE`
已收藏的 Provider。

### `/api/customer/payment-methods` — `GET, POST, PUT, DELETE`
存储的 Stripe 支付方式（仅 token 引用，不存卡号）。

---

## Provider

### `/api/provider` — `GET, POST`
认证后的 Provider 资料（`POST` 用于入驻时创建）。

### `/api/provider/availability` — `GET, POST, DELETE`
每周可用时段。

### `/api/provider/blocked` — `GET, POST, DELETE`
### `/api/provider/blocked-times` — `GET, POST, PUT, DELETE`
屏蔽日期 / 时段（两个端点；`blocked-times` 是更新的细粒度模型）。

### `/api/provider/pricing` — `GET, POST, PATCH, DELETE`
Provider 自身的价格覆盖。

### `/api/provider/zones` — `GET, POST, PUT, DELETE`
服务区域（地理覆盖）。

### `/api/provider/stats` — `GET`
收入、订单、评分聚合。

### `/api/provider/wallet` — `GET, POST`
钱包余额与待 payout；`POST` 发起 payout。

### `/api/provider/documents` — `GET, POST, PUT, DELETE`
合规材料上传元数据。

### `/api/provider/compliance` — `GET, POST, PUT, DELETE`
合规面板/记录。

### `/api/provider/verify` — `GET, POST`
验证状态（`GET`） / 触发验证（`POST`）。

### `/api/provider/badges` — `GET, POST, DELETE`
徽章（如 100 单、5★ 连胜）。`POST` 仅管理员授予。

---

## Pricing

### `/api/pricing` — `GET, POST`
- `GET ?service_id=&country_code=&hours=` → `{ base_price, tax, total, currency, tier }`。
- `POST` — 管理员 upsert `service_prices`。

---

## Payments

### `/api/create-payment-intent` — `POST`
Body：`{ bookingId, amount, currency, customerEmail }`。`amount` 为最小单位（分）。返回 Stripe PaymentIntent 的 `{ clientSecret }`。

### `/api/refund-payment` — `POST`
Body：`{ paymentIntentId }`。调用 Stripe `refunds.create` 全额退款；返回 `{ success, refundId }`。该端点暂不支持指定金额或原因。

### `/api/payments` — `GET, POST`
调用者支付历史；`POST` 用于服务端核账。

### `/api/payments/payouts` — `GET, POST`
### `/api/payouts` — `POST`
Provider payout 历史（`payments/payouts GET`）与即时触发 payout（`payouts POST`）。

### `/api/payments/refunds` — `GET, POST`
退款历史 / 申请。

### `/api/webhooks/stripe` — `POST`
Stripe webhook 接收。用 `STRIPE_WEBHOOK_SECRET` 校验签名。处理 `payment_intent.succeeded`、`payment_intent.payment_failed`、`charge.refunded`，其他事件仅记录日志后忽略。**幂等性说明**：处理器尚未按 `event.id` 去重，重投递可能向 `payment_transactions` 重复插入——加 `UNIQUE(stripe_event_id)` 是已记录的技术债。

---

## Feedback

### `/api/feedback` — `GET, POST, PUT`
评价。`POST ?type=rating` Body 用 **snake_case**：`{ booking_id, provider_id?, rating, review_text }`。调用者必须是预订所有者，且 `bookings.status` 必须为 `completed`。写入 `ratings` 表（见 [DATABASE.md § 已知 schema 债](DATABASE.md#已知-schema-债)）。

### `/api/feedback/responses` — `GET, POST`
Provider 对评价的回应。

### `/api/feedback/reports` — `GET, POST`
针对评价的举报。

---

## Disputes & Safety

### `/api/disputes` — `GET, POST`
列出/创建争议。`POST` Body：`{ bookingId, reason, description? }`。调用者必须是预订客户；争议金额自动取自 `booking.total_price`。

### `/api/disputes/[id]` — `GET, PUT`
查看/更新争议（管理员或当事方）。

### `/api/incidents` — `GET, POST`
事件报告。`POST` Body（camelCase）：`{ bookingId, incidentType, severity, description, location?, witnesses?, evidenceUrls? }`。四个必填字段服务端校验；调用者必须是该预订的客户或 Provider。

### `/api/safety-flags` — `GET, POST, PUT`
安全标记（`PUT` 是管理员状态更新）。

---

## AI

### `/api/ai/chat` — `POST`
Body：`{ message, session_id?, language?, region? }`。返回助手回复。

### `/api/ai/sessions` — `GET, POST, PUT`
调用者的 AI 会话。

### `/api/ai/conversations` — `GET, POST, PUT, DELETE`
单会话内的对话消息。

### `/api/ai/intents` — `GET, POST, PUT, DELETE`
意图定义（管理员维护）。

### `/api/ai/knowledge-base` — `GET, POST, PUT, DELETE`
KB 文章。`GET` 公开可读（已发布文章无需登录）。

### `/api/ai/templates` — `GET, POST, PUT, DELETE`
自动化使用的回复模板。

### `/api/ai/automation` — `GET, POST, PUT, DELETE`
自动化规则（管理员/系统）。

### `/api/ai-customer-service` — `GET, POST`
对 FastAPI agent 的遗留代理。`POST`：`{ message, user_id?, language, region, contact_method }`。`GET` 是健康/信息。

---

## 状态码

| 码 | 用途 |
|---|---|
| 200 | OK |
| 201 | 创建成功 |
| 400 | 校验错误 |
| 401 | 未认证 |
| 403 | 禁止/RLS 违规 |
| 404 | 找不到 |
| 409 | 冲突（如时段被占） |
| 422 | 业务规则违反（如退款窗口） |
| 500 | 内部错误 |

## Webhook 安全

`/api/webhooks/stripe` 用 `STRIPE_WEBHOOK_SECRET` 校验签名，未签或签名错的请求 400 拒收。处理器层尚未强制幂等——见上述端点说明。

## 限流（计划中）

- `/api/ai/*`：30 req/min/user。
- 带 auth 的写操作：60 req/min/user。

## 端点数量

44 个路由文件；每个路由的方法见上。重生成清单：

```bash
find app/api -name route.ts -print
```
