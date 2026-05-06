# UI 巡检方案

**目标**: 用 `ui-inspector` agent + `chrome-devtools-mcp` 对全部页面执行 UI 质量检查。
**范围**: 67 条路由 × 2 locale (`en` / `zh`) = **134 个 URL**。
**产出**: `test-results/ui-inspection/<timestamp>/` 下每页一个报告 + `summary.md`。

---

## 0. 前置准备

### 0.1 测试目标：PROD 部署
- **baseUrl**: `http://47.236.169.73` （自部署 VPS，已验证 200，`/zh/home` 200）
- 不需要本地 dev server。
- ⚠️ **安全警告**: 巡检会在真实数据库留痕。带认证的批次（B2-B5）**必须使用专用测试账号**，绝不能用真实用户账号；任何"创建预订/提交表单"类交互在 prod 上要二次确认。

### 0.2 登录态 fixture
位置：`test-results/ui-inspection/fixtures.json`（已被 `.gitignore` 覆盖，安全存放凭据）。

模板已生成，需要补齐：
- `accounts.customer / provider / admin` 的测试账号
- `sampleIds` 的 5 个示例 ID（从 prod 数据库挑只读安全的样本）

未填的项会让对应批次跳过，B1（公共页）无需任何账号即可立刻跑。

### 0.3 Chrome 准备
chrome-devtools-mcp 启动时会接管一个 Chrome 实例。**先关闭所有 Chrome 窗口**（或单独跑一个干净 profile），避免污染你的常用浏览器状态。

---

## 1. 路由总清单

> 路径中的 `[id]` / `[slug]` / `[cat]` / `[bookingId]` 在巡检时替换为 `fixtures.sampleIds`。
> 每条路由都需要跑 `en` 和 `zh` 两次。

### 1.1 公共 (public) + 根 — 8 条
（7 条在 `(public)/` 路由组 + 1 条 locale 根 `app/[locale]/page.tsx`）
| 路由 | Auth | 动态参数 | 备注 |
|---|---|---|---|
| `/` | - | - | 首页（locale 根） |
| `/auth/login` | - | - | |
| `/auth/register` | - | - | |
| `/auth/forgot` | - | - | |
| `/auth/reset` | - | - | 通常需要 token query，无则测空态 |
| `/auth/verify` | - | - | 同上 |
| `/help` | - | - | |
| `/help/[slug]` | - | `helpSlug` | sample: `first-booking` (valid slug from `components/domain/helpArticles.ts`) |

### 1.2 客户 (customer) — 27 条
| 路由 | Auth | 动态参数 |
|---|---|---|
| `/home` | customer | - |
| `/search` | customer | - |
| `/services` | customer | - |
| `/services/[cat]` | customer | `categorySlug` |
| `/providers/[id]` | customer | `providerId` |
| `/bookings` | customer | - |
| `/bookings/new` | customer | - |
| `/bookings/recurring` | customer | - |
| `/bookings/[id]` | customer | `bookingId` |
| `/bookings/[id]/success` | customer | `bookingId` |
| `/bookings/[id]/feedback` | customer | `bookingId` |
| `/bookings/[id]/dispute` | customer | `bookingId` |
| `/pay/[bookingId]` | customer | `bookingId` |
| `/chat` | customer | - |
| `/notifications` | customer | - |
| `/profile` | customer | - |
| `/profile/edit` | customer | - |
| `/profile/addresses` | customer | - |
| `/profile/payment` | customer | - |
| `/profile/family` | customer | - |
| `/profile/emergency` | customer | - |
| `/profile/favourites` | customer | - |
| `/profile/notifications` | customer | - |
| `/profile/security` | customer | - |
| `/settings/account` | customer | - |
| `/settings/privacy` | customer | - |
| `/safety/report` | customer | - |

### 1.3 服务方 (provider) — 14 条
| 路由 | Auth | 动态参数 |
|---|---|---|
| `/provider` | provider | - |
| `/provider/register` | - | - |
| `/provider/onboarding-status` | provider | - |
| `/provider/profile` | provider | - |
| `/provider/services` | provider | - |
| `/provider/availability` | provider | - |
| `/provider/blocked-times` | provider | - |
| `/provider/calendar` | provider | - |
| `/provider/jobs` | provider | - |
| `/provider/jobs/[id]` | provider | `bookingId` |
| `/provider/earnings` | provider | - |
| `/provider/payouts` | provider | - |
| `/provider/reviews` | provider | - |
| `/provider/compliance` | provider | - |

### 1.4 管理后台 (admin) — 15 条
| 路由 | Auth | 动态参数 |
|---|---|---|
| `/admin/login` | - | - |
| `/admin` | admin | - |
| `/admin/analytics` | admin | - |
| `/admin/bookings` | admin | - |
| `/admin/customers` | admin | - |
| `/admin/customers/[id]` | admin | `customerId` |
| `/admin/providers` | admin | - |
| `/admin/payments` | admin | - |
| `/admin/refunds` | admin | - |
| `/admin/disputes` | admin | - |
| `/admin/safety` | admin | - |
| `/admin/reports` | admin | - |
| `/admin/settings` | admin | - |
| `/admin/ai/conversations` | admin | - |
| `/admin/ai/kb` | admin | - |

### 1.5 其它 — 3 条
| 路由 | Auth | 备注 |
|---|---|---|
| `/oops` | - | 通用错误页 |
| `/dev/components` | - | 组件预览页（仅 dev 模式，prod build 会 404） |
| `/[...rest]` | - | 404 catch-all（用 `/random-nonexistent-path` 触发） |

---

## 2. 检查矩阵（每个 URL 都跑）

| 维度 | 工具 | 阈值/规则 |
|---|---|---|
| 渲染状态 | `navigate_page` + `wait_for` | HTTP 2xx/3xx，无白屏 |
| Console | `list_console_messages` | 0 error，warn 列出 |
| Network | `list_network_requests` | 无 4xx/5xx |
| 响应式 | `resize_page` × 3 + `take_screenshot` | 375 / 768 / 1440 |
| a11y 语义 | `take_snapshot` | heading 层级、landmark、缺 label |
| Lighthouse | `lighthouse_audit` (desktop only) | a11y ≥ 90, perf ≥ 70 |

可选交互（按页面类型）:
- 表单页: `fill_form` + 提交，验证 success/error 态
- 列表页: 滚动到底，验证分页/无限滚动
- 详情页: 点击主 CTA，验证跳转

---

## 3. 执行策略

### 3.1 分批，避免一次跑爆
按 5 个 group 分批，每批一次会话：

| Batch | 内容 | 路由数 | URL 数 (×2 locale) |
|---|---|---|---|
| B1 | public + 根 + 错误页 (无需登录) | 11 | 22 |
| B2 | customer 主流程 (home/search/services/bookings/pay) | 13 | 26 |
| B3 | customer profile/settings/chat/notifications/safety | 14 | 28 |
| B4 | provider 全部 | 14 | 28 |
| B5 | admin 全部 | 15 | 30 |
| **合计** | | **67** | **134** |

### 3.2 触发方式

```
> 用 ui-inspector 跑 batch B1
> 用 ui-inspector 跑 batch B2
...
```

或者一次性：
```
> 用 ui-inspector 按 docs/UI_INSPECTION_PLAN.md 跑全量巡检
```

### 3.3 输出位置
```
test-results/ui-inspection/
  2026-05-04T1430/
    fixtures.json           # 本次用的 fixture 快照
    B1-public/
      en__root.md
      en__auth-login.md
      ...
      zh__root.md
      ...
    B2-customer-main/
      ...
    summary.md              # 汇总 P0/P1/P2 数量、失败列表
    summary.html            # 可选，便于浏览
```

---

## 4. 报告汇总规则

`summary.md` 必须包含：
- **总览**: 跑了 N 个 URL，PASS X，FAIL Y，SKIPPED Z
- **P0 列表**: 按路由聚合，每条带文件位置链接
- **P1 列表**: 同上
- **P2 列表**: 同上
- **Lighthouse 异常榜**: a11y < 90 或 perf < 70 的页面
- **未覆盖**: 因缺 fixture 跳过的路由清单

---

## 5. 已知限制

1. chrome-devtools-mcp 接管 Chrome，所以**巡检期间无法用浏览器做别的事**。
2. Lighthouse 跑得慢（每页 10–30s），全量巡检 134 URL × 含 lighthouse 大约 40–60 分钟。**建议 lighthouse 只对每条路由的 `en` 跑一次**（zh 跳过 lighthouse，只做截图 + console + network），减半到 ~25 分钟。
3. `/dev/components` 只在 `NODE_ENV=development` 暴露，生产构建会 404。

---

## 6. 待用户确认

1. **fixture 账号是否就绪？** 需要 customer / provider / admin 三个测试号。
2. **sampleIds 用真实数据库 ID 还是 seed 一份？** 推荐用 seed 数据，避免污染真实账户。
3. **是否同意第一次只跑 B1（无需登录）做冒烟？** 建议这样做，先验证 mcp 接通、报告格式可读，再扩到全量。
