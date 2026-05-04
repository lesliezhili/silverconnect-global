# 数据库

PostgreSQL，托管于 Supabase。真理之源是 [`lib/schema.sql`](../../lib/schema.sql) 加 [`migrations/`](../../migrations/) 下的增量文件。迁移集合存在自然重叠（多个 `001_*` 文件），但 `IF NOT EXISTS` 守护让重放安全。

## 约定

- 主键：`UUID DEFAULT gen_random_uuid()`。
- 时间戳：`created_at` 用 `TIMESTAMP DEFAULT NOW()`；变更字段显式 `updated_at`。
- 金额：`DECIMAL(10,2)` 配 `currency TEXT`（ISO 4217）。
- 状态枚举存为 `TEXT`（应用层校验）。
- 双语列：`name`、`name_zh`、`description`、`description_zh`。
- 用户数据表均启用 **Row-Level Security**；service-role key 用于服务端绕过 RLS。

## 迁移执行顺序

1. [`lib/schema.sql`](../../lib/schema.sql) — 基础 schema（17 表）。
2. [`migrations/001_provider_onboarding.sql`](../../migrations/001_provider_onboarding.sql) → [`001_provider_onboarding_complete.sql`](../../migrations/001_provider_onboarding_complete.sql) — 模块 1（Provider 文档、区域）。
3. [`migrations/001_add_modules_5_6.sql`](../../migrations/001_add_modules_5_6.sql) — 模块 5/6 补充表。
4. [`migrations/002_customer_profile.sql`](../../migrations/002_customer_profile.sql) — 模块 2 客户数据。
5. [`migrations/002_enhanced_calendar_pricing.sql`](../../migrations/002_enhanced_calendar_pricing.sql) — 日历 + 价格分级。
6. [`migrations/003_booking_engine.sql`](../../migrations/003_booking_engine.sql) — 模块 3。
7. [`migrations/004_payments_escrow.sql`](../../migrations/004_payments_escrow.sql) — 模块 4。
8. [`migrations/005_feedback_ratings.sql`](../../migrations/005_feedback_ratings.sql) — 模块 5。
9. [`migrations/006_disputes_safety.sql`](../../migrations/006_disputes_safety.sql) — 模块 6。
10. [`migrations/007_ai_automation.sql`](../../migrations/007_ai_automation.sql) — 模块 7。
11. [`migrations/008_add_provider_status.sql`](../../migrations/008_add_provider_status.sql) — Provider 状态字段。

执行：`npm run db:migrate`（用 `scripts/migrate.js`）或粘到 Supabase SQL editor。

## 各文件创建的表

### 基础 — `lib/schema.sql`
`countries`、`services`、`service_prices`、`users`、`service_providers`、`provider_availability`、`bookings`、`customer_feedback`、`provider_feedback`、`provider_pricing`、`notifications`、`payment_transactions`、`provider_payouts`、`disputes`、`knowledge_base`、`public_holidays`、`time_of_day_pricing`。

### `migrations/001_provider_onboarding{,_complete}.sql`
`provider_documents`、`provider_zones`。

### `migrations/001_add_modules_5_6.sql`（补充）
`safety_flags`、`user_preferences`、`emergency_contacts`、`medical_info`、`provider_documents`*（重复声明，幂等）*、`provider_analytics`、`audit_logs`、`notification_preferences`、`provider_schedule_exceptions`、`service_categories`、`provider_service_areas`、`provider_waitlist`、`referrals`、`promo_codes`、`booking_modifications`、`provider_response_times`、`subscription_plans`、`user_subscriptions`、`provider_badges`、`provider_badge_assignments`、`faqs`、`support_tickets`。

### `migrations/002_customer_profile.sql`
`customer_addresses`、`customer_payment_methods`、`customer_favorites`。

### `migrations/002_enhanced_calendar_pricing.sql`
`public_holidays`*（重复）*、`provider_blocked_times`、`pricing_tiers`、`booking_pricing`。

### `migrations/003_booking_engine.sql`
`booking_status_history`、`booking_modifications`*（重复）*、`recurring_bookings`、`booking_reminders`、`provider_blocked_times`*（重复）*。

### `migrations/004_payments_escrow.sql`
`payouts`、`refund_requests`、`payment_disputes`、`provider_wallets`。同时 `ALTER TABLE payment_transactions` 添加 `escrow_status`、`escrow_released_at`、`platform_fee`、`provider_payout`。

### `migrations/005_feedback_ratings.sql`
`rating_reports`、`rating_responses`、`provider_stats`、`provider_badges`*（重复）*。

### `migrations/006_disputes_safety.sql`
`dispute_evidence`、`dispute_messages`、`incident_reports`、`compliance_documents`、`compliance_alerts`。同时 `ALTER TABLE disputes` 与 `ALTER TABLE safety_flags` 加列。

### `migrations/007_ai_automation.sql`
`ai_conversations`、`ai_intents`、`ai_knowledge_base`、`ai_automation_rules`、`chatbot_sessions`、`ai_response_templates`。

### `migrations/008_add_provider_status.sql`
`ALTER TABLE service_providers` 加状态字段。

## 核心实体（节选）

### `countries`
`code (UNIQUE)`、`name`、`name_zh`、`currency_code`、`currency_symbol`、`tax_rate`、`is_active`。已种子化 AU / CN / CA。

### `services`
`id`、`category`（cleaning|cooking|gardening|personal|maintenance）、`subcategory`、`name`、`name_zh`、`description`、`description_zh`、`duration_minutes`、`requires_material`、`is_active`。

### `service_prices`
`(service_id, country_code)` 唯一。`base_price`、`price_with_tax`。

### `users`
`email`、`full_name`、`phone`、`user_type`（`customer`|`provider`）、`country_code`、`city`、`address`、`postal_code`、`latitude`、`longitude`、`birth_date`、`emergency_contact_*`、`medical_notes`、`preferred_language`。另有 `role` 列被 admin 校验端点读取（`profile.role === 'admin'`）；`user_type` 与 `role` 双列重复，列入 schema 债。

### `service_providers`
Provider 扩展。`user_id` FK、`specialties[]`、`bio`、`years_experience`、`certifications[]`、`rating`、`total_ratings`、`is_verified`、`is_christian`、`stripe_connect_id`。状态字段在 `008` 添加。

### `bookings`
`booking_number`、`provider_id`、`customer_id`、`service_id`、`booking_date`、`start_time`、`end_time`、`duration_minutes`、`address`、`special_instructions`、`total_price`、`status`（PENDING|CONFIRMED|COMPLETED|CANCELLED|DISPUTED）、`payment_status`（UNPAID|PAID|REFUNDED|FAILED）。

### `provider_availability`
每周可用时段。`provider_id`、`day_of_week (0–6)`、`slot_name`、`start_time`、`end_time`、`is_available`。*（`lib/types.ts` 中的 TS 接口名为 `AvailabilityWindow`。）*

### 反馈
- `customer_feedback`、`provider_feedback` — 基础评分/评论。
- `rating_responses` — 商家回复。
- `rating_reports` — 举报。
- `provider_stats` — 聚合统计。

### 支付
- `payment_transactions` — `004` 中加 `escrow_status`、`platform_fee`、`provider_payout`。
- `payouts` — Stripe Connect payout 记录（模块 4）。
- `provider_payouts` — 早期基础 schema 中的 payout 账本；目前两者并存。
- `refund_requests`、`payment_disputes`、`provider_wallets`。

### 争议与安全
- `disputes`（基础）— `006` 加 `priority`、`assigned_to`、`resolution_amount`、`admin_notes`、`customer_agreed`、`provider_agreed`。
- `dispute_evidence`、`dispute_messages`。
- `safety_flags`（在 `001_add_modules_5_6`）— 由 `006` 扩展。
- `incident_reports`、`compliance_documents`、`compliance_alerts`。

### AI
- `chatbot_sessions` — 聊天会话（TS 代码以 "sessions" 称呼）。
- `ai_conversations` — 单会话消息历史。
- `ai_intents`、`ai_knowledge_base`、`ai_response_templates`、`ai_automation_rules`。

## Row-Level Security（按真实迁移）

| 表 | RLS 状态 |
|---|---|
| `countries`、`services`、`service_prices` | 未启用 RLS — 实际公开可读（按设计）。 |
| `users` | 启用；`auth.uid() = id` |
| `service_providers` | 启用；Provider 自管 + verified Provider 公开 SELECT |
| `provider_availability`、`provider_documents`、`provider_zones`、`provider_blocked_times` | 启用；Provider 自管 |
| `bookings` | 启用；用户看自己、自己创建/更新 |
| `customer_addresses`、`customer_payment_methods`、`customer_favorites` | 启用；客户自管 |
| `disputes`、`dispute_evidence`、`incident_reports` | 启用；当事方 + 管理员（service-role） |
| `compliance_documents` | 启用；Provider 自管 |
| `payouts`、`refund_requests`、`payment_disputes`、`provider_wallets` | 启用；所有者 SELECT |
| `ai_conversations`、`chatbot_sessions` | 启用；用户 SELECT 自己 |
| `ai_knowledge_base`、`ai_response_templates` | 启用；公开 SELECT（KB 公开只读） |
| **`payment_transactions`** | **未启用 RLS — 安全缺陷，见 [SECURITY.md § 鉴权](SECURITY.md#鉴权)** |
| **`compliance_alerts`、`dispute_messages`** | **启用了 RLS 但未建策略 — 对 anon/auth 调用方实际 deny-all** |

管理员通过服务端 service-role key 绕过。

## 索引策略

关键索引（缺则补）：
- `bookings (provider_id, booking_date)`
- `bookings (customer_id, created_at DESC)`
- `payment_transactions (booking_id)`
- `provider_availability (provider_id, day_of_week)`
- `service_prices (country_code)`

## 数据生命周期

- **软删**：`services` / `providers` 用 `is_active`。
- **硬删**：用户请求（GDPR）经 `ON DELETE CASCADE` 级联；按会计要求保留支付（匿名化）。
- **备份**：Supabase PITR（Pro 套餐 7 天）。

## 已知 schema 债

未来清理迁移要解决：

- 三个文件共 `001_*` 前缀（`001_provider_onboarding.sql`、`001_provider_onboarding_complete.sql`、`001_add_modules_5_6.sql`）— 顺序按内容判断而非文件名。考虑重编号。
- `provider_documents` 在三个迁移中声明。
- `provider_blocked_times` 在两个迁移中声明。
- `provider_badges` 重复（`001_add_modules_5_6` 与 `005`）。
- `payouts`（模块 4）与 `provider_payouts`（基础）共存；选其一或文档化分工。
- `booking_modifications` 在 `001_add_modules_5_6` 与 `003` 中均声明。
- **`ratings` 表被 `005_feedback_ratings.sql` `ALTER TABLE ratings …` 与 `app/api/feedback/route.ts` 引用，但跟踪的迁移中无 `CREATE TABLE ratings`** — 极可能是开发期外带建立。投产前补显式迁移。
- **`users` 同时有 `user_type`（`customer`|`provider`）与 `role`（`/api/ai/*` 与 `/api/safety-flags` 检查 `'admin'`）**——选其一并迁移。

## ER 图（文本简版）

```
countries 1───* service_prices *───1 services
users 1───1 service_providers
users 1───* bookings *───1 service_providers
                       *───1 services
bookings 1───* booking_status_history
bookings 1───* booking_modifications
bookings 1───1 payment_transactions ───* payouts
                                       └───* refund_requests
bookings 1───* customer_feedback / provider_feedback ───* rating_responses
                                                       ───* rating_reports
bookings 1───* disputes ───* dispute_evidence
                          ───* dispute_messages
bookings 1───* incident_reports
service_providers 1───* compliance_documents
service_providers 1───* provider_availability
service_providers 1───* provider_blocked_times
service_providers 1───1 provider_wallets
chatbot_sessions 1───* ai_conversations
```
