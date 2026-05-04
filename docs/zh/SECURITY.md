# 安全

## 1. 漏洞上报

发邮件到 **yanhaoau@gmail.com**，主题 `SECURITY: <概要>`。**不要**在 GitHub 公开 issue 里提。
请包括：影响面、复现步骤、影响、PoC（如有）。72 小时内会确认收到。

请勿对非自己的生产账号测试，复现所需以外的数据请勿访问。

## 2. 威胁模型（摘要）

| 资产 | 威胁 | 缓解 |
|---|---|---|
| 用户 PII（姓名、地址、医疗备注） | 未授权读取 | Postgres RLS；service-role key 仅服务端 |
| 支付信息 | 卡数据被窃 | 不存储——仅用 Stripe Elements + Payment Intents |
| Auth token | 会话劫持 | HTTP-only cookie，Secure + SameSite=Lax，短过期 |
| Webhook | 伪造 | Stripe 签名校验（`STRIPE_WEBHOOK_SECRET`） |
| Provider 文档（无犯罪等） | 泄漏 | Supabase Storage + 签名 URL + RLS |
| AI 聊天 | Prompt 注入/数据外泄 | 服务端意图白名单；无可读他人数据的工具 |
| 争议证据 | 篡改 | `dispute_messages` 仅追加；员工内部备注用 `is_internal` |

## 3. 控制

### 认证
- Supabase Auth（邮箱密码）。密码策略：≥ 8 字符，复杂度由 Supabase 强制。
- Session：HTTP-only Secure cookie 中的 JWT。无 localStorage token。
- 限流 auth 端点（计划：Upstash）。

### 鉴权
- 多数 PII 表启用 Row-Level Security（`users`、`service_providers`、`bookings`、`customer_*`、`disputes`、`incident_reports`、`compliance_documents` 等）。策略：`auth.uid()` 匹配所有者列。
- **投产前需修的 RLS 缺口：**
  - `payment_transactions` — 任何跟踪的迁移中都没 `ENABLE ROW LEVEL SECURITY`。当前任意拿着 anon key 的认证客户端理论可读全表。需加 owner 范围策略。
  - `compliance_alerts`、`dispute_messages` — RLS 已启但没显式 `CREATE POLICY`，对非 service-role 调用者实际为 deny-all。要么补策略，要么取消 RLS。
- service-role key 仅在服务端 route handler 中使用。
- Admin 角色通过 `users.role = 'admin'` 校验（与 `users.user_type` 分开，后者为 `customer | provider`）。schema 中并存两套角色相关列——后续合并。

### 传输与 secret
- 仅 HTTPS（Vercel 默认）。
- secret 进环境变量；绝不入库。`.env*` 在 `.gitignore`。
- Stripe 与 Supabase key 每季轮换；疑似泄露立即换。

### 输入校验
- 所有 API 路由输入服务端校验（长度、类型、枚举）。
- SQL 注入：仅用 Supabase client / `postgres` lib 的参数化查询。
- XSS：React 默认转义；用户输入永不 `dangerouslySetInnerHTML`。

### 输出 / 数据暴露
- 永不返回他人记录——RLS 是兜底，应用代码是第一道。
- 日志不能含卡号、CVC、完整 token。

### 支付
- 用 Stripe Elements；卡数据不经我们的服务器。
- Webhook 处理器：每次校验签名。**按 event id 的幂等尚未强制——已记录技术债。**
- 退款逻辑：仅服务端；绝不信任客户端传的金额。

### 文件上传（合规材料、争议证据）
- 经 Supabase Storage 用签名 URL 存。
- 上传时限制 MIME 与大小。
- 反病毒扫描 *（计划中）*。

### AI 安全
- agent 持工具白名单；无法跑任意 SQL。
- 紧急关键字触发显示联系，而非自动操作。
- service-role secret 永不进 prompt。

## 4. 合规

- **澳大利亚**：Privacy Act 1988 — 收集最少 PII；允许导出与删除。
- **加拿大**：PIPEDA — 同上。
- **中国**：PIPL — 跨境数据传输待评估；CN 租户数据应留在 CN 区域。
- **PCI-DSS**：范围之外（卡持有人数据由 Stripe 处理）。

## 5. OWASP Top 10 — 速查映射

| 风险 | 状态 |
|---|---|
| A01 失效访问控制 | RLS + 服务端检查 |
| A02 加密失败 | TLS、密码哈希（Supabase）、无明文 secret |
| A03 注入 | 参数化查询；用户输入不拼裸 SQL |
| A04 不安全设计 | RLS 优先、托管默认 |
| A05 安全配置错误 | secret 走 env、RLS 已启、CORS 收窄 |
| A06 易受攻击的组件 | CI 跑 `npm audit`；renovate / dependabot *（计划）* |
| A07 认证失败 | Supabase Auth、限流 *（计划）* |
| A08 数据完整性 | Webhook 签名、追加型审计表 |
| A09 日志/监控 | Vercel + Supabase logs；Sentry *（计划）* |
| A10 SSRF | 服务端路由无用户可控的对外 URL |

## 6. 事件响应

见 [OPERATIONS.md § 事件响应](OPERATIONS.md#7-事件响应)。
