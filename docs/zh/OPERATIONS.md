# 运维手册

面向运维的操作指南。方案级总览见 [`SOLUTION_DESIGN_AND_OPERATIONS.md`](../../SOLUTION_DESIGN_AND_OPERATIONS.md)。

## 1. 服务地图

| 组件 | 提供方 | Dashboard |
|---|---|---|
| Web app | Vercel（API 路由 `vercel.json` 中限 `maxDuration: 30s`） | vercel.com |
| 数据库 / Auth | Supabase | supabase.com |
| 支付 | Stripe | dashboard.stripe.com |
| AI agent | 容器主机（Fly/Railway/Cloud Run） | 各家 |
| DNS / 域名 | 任选注册商 | — |

## 2. 监控与告警

| 信号 | 来源 | 阈值 |
|---|---|---|
| Web 5xx 比例 | Vercel Analytics / logs | 5 分钟内 > 1% |
| API p95 延迟 | Vercel | 10 分钟内 > 800 ms |
| DB 连接数 | Supabase | > 80% pool |
| 失败支付 | Stripe | 1 小时内 > 5% |
| Webhook 失败 | Stripe | 连续 3 次 |
| AI agent 健康 | `/api/health` | 非 200 |
| 新开争议 | DB（`disputes`） | 单日 > 5 |
| 安全标记/事件 | DB | 任何 `severity = critical` → 呼叫 on-call |

集中告警上线前，on-call 每天检查 Vercel + Stripe + Supabase 三个 dashboard。

## 3. On-call

- **轮值**：每周，周一 09:00 当地时间。
- **呼叫**：WhatsApp/WeChat `+61452409228`（首选），地区备用见 [README](../../README.md#emergency-contacts)。
- **响应 SLA**：
  - Sev1（宕机/支付坏/安全）：15 分钟 ack，1 小时缓解。
  - Sev2（降级）：1 小时 ack，4 小时缓解。
  - Sev3（轻微）：下个工作日。

## 4. 常见 Runbook

### 4.1 Web app 宕
1. 看 Vercel 部署状态。坏发布则 promote 上一版本。
2. 看 Supabase 项目（连接数、是否 paused）。
3. 看 DNS / SSL。

### 4.2 Stripe webhook 失败
1. Stripe → Developers → Webhooks → endpoint logs。
2. 校验 signing secret 与 Vercel 中 `STRIPE_WEBHOOK_SECRET` 一致。
3. 重投递失败事件。**注意**：处理器尚未幂等——`payment_intent.succeeded` 重投递可能向 `payment_transactions` 重复插入。批量重投前先确认。
4. 校对 `bookings.payment_status` 与 `payment_transactions` 是否反映结果；手动去重。

### 4.3 支付卡在托管
- 看 `payment_transactions.escrow_status`。
- T+48h 后仍 `held` 而 `bookings.status = COMPLETED`：通过管理员 API 手动释放。
- 若已申请退款：查 `refund_requests`，走 `/api/refund-payment`。

### 4.4 RLS 拒绝报告
- 用户报"看不到我的预订"：
  1. 校验 `auth.uid()` 是否匹配 `bookings.customer_id` / `provider_id`。
  2. 在 Supabase 列出 RLS 策略确认存在。
  3. **不要**禁 RLS 绕过，修策略。

### 4.5 AI agent 不健康
1. curl `AI_AGENT_URL/api/health`。
2. 看容器日志中的 OpenAI / Azure 认证错。
3. 重启容器；web app 会回退到直接显示联系号码。

### 4.6 数据库慢
1. Supabase → Reports → slow queries。
2. 查缺失的索引（见 [DATABASE.md § 索引策略](DATABASE.md#索引策略)）。
3. 查长事务；必要时 kill。

## 5. 备份与恢复

- **Supabase PITR**（Pro 套餐）：7 天窗口。dashboard 还原到新项目，再 promote。
- **RPO** 24 h / **RTO** 4 h。
- 每季度恢复演练到 scratch 项目。

## 6. 例行维护

| 周期 | 任务 |
|---|---|
| 每天 | 扫一眼 dashboard，看争议/事件队列 |
| 每周 | 审失败支付 + payout；清退款队列 |
| 每月 | `npm audit`、依赖 PR |
| 每季 | 轮换 Stripe + Supabase key；恢复演练 |
| 每年 | 威胁模型评审；渗透测试 |

## 7. 事件响应

1. **发现** — 告警或用户报告。
2. **分诊** — 定级；建事件记录（日期、概要、负责人）。
3. **缓解** — 先恢复服务；再追根因。
4. **沟通** — Sev1/2 给受影响用户发状态更新。
5. **解决** — 跑冒烟确认（见 [DEPLOYMENT § 部署后冒烟](DEPLOYMENT.md#部署后冒烟)）。
6. **复盘** — Sev1/2 在 5 个工作日内：时间线、根因、行动项。无追责。

### 安全事件（数据泄漏 / 入侵）
- 立即轮换暴露的 secret。
- 通过 DB audit / log 圈定影响范围。
- 按法规通知受影响用户（见 [SECURITY.md § 合规](SECURITY.md#4-合规)）。
- 提交披露报告。

## 8. 容量

| 指标 | 行动阈值 |
|---|---|
| Supabase DB CPU 持续 > 70% | 升档 |
| Vercel 函数超时 | 改 Edge 或拆路由 |
| AI agent QPS 饱和 | 横向扩；KB 查询加缓存 |

## 9. 常用命令

```bash
# Tail Vercel logs
vercel logs <deployment> --follow

# Stripe 重投递事件
stripe events resend <evt_xxx>

# 跑紧急修复迁移
psql "$SUPABASE_DB_URL" -f migrations/00X_hotfix.sql
```
