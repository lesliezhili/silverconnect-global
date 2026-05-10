# 测试策略

## 测试金字塔

```
         /\
        /E2E\         e2e/*.spec.ts        (Playwright，关键流)
       /----\
      / Integ\        __tests__/...        (Jest + Supabase 测试 schema)
     /--------\
    /   Unit   \      __tests__/services/  (Jest，纯逻辑)
   /------------\
```

目标：

| 层 | 工具 | 阈值 |
|---|---|---|
| Unit + integration | Jest | 70% global（branches / functions / lines / statements）— `jest.config.js` `coverageThreshold` |
| API integration | Jest（+ 测试 DB） | 目标：每条 API 路由至少一个 happy + 一个 auth-fail；config 尚未强制 |
| E2E | Playwright（chromium / firefox / webkit / Mobile Chrome / Mobile Safari） | 标 `@critical` 的关键流必须过 |
| Lighthouse | `lighthouserc.json` URL `/`、`/services`、`/bookings`，每页 3 次 | Performance ≥ 0.9、Accessibility ≥ 0.9、Best Practices ≥ 0.85、SEO ≥ 0.9 |
| Load | k6（`k6/`） | 目标：booking 端点 100 RPS，p95 < 500 ms |

## 运行

```bash
npm test                     # 所有 unit/integration
npm run test:watch
npm run test:coverage
npm run test:e2e
npm run test:e2e:critical    # 仅 @critical
npm run test:e2e:ui          # 交互
npm run test:performance     # 在跑着的 dev server 上跑 Lighthouse
```

配置：`jest.config.js`、`playwright.config.ts`、`lighthouserc.json`。

> **Playwright dev server**：`playwright.config.ts` 中 `webServer` 块当前是注释掉的——`npm run test:e2e` 期望 dev server 已在 `http://localhost:3000` 运行，或设 `PLAYWRIGHT_TEST_BASE_URL`。先在另一个终端 `npm run dev`，或解开注释。

## 现有 E2E 用例

| 文件 | 覆盖 |
|---|---|
| `e2e/critical-flows.spec.ts` | 首页 → 支付流、支付处理、预订取消、性能检查（首页 < 3s、services < 2s） |
| `e2e/booking-flow.spec.ts` | 完整预订 happy path |
| `e2e/uat-signin-flow.spec.ts` | UAT 登录场景 |

> **缺口**：`npm run test:e2e:critical` 跑的是 `playwright test --grep @critical`，但 **当前没有任何用例打了 `@critical` 标签**——该脚本匹配零条。把每个 PR 必过的用例（先从 `critical-flows.spec.ts` 里的 3 条用户旅程开始）打上标，再在 CI 里依赖这道闸。

## 用例编写

### Unit（lib/）
```ts
import { calculatePrice } from '@/lib/pricing'
test('AU price includes 10% GST', () => {
  expect(calculatePrice({ base: 100, countryCode: 'AU' }).total).toBeCloseTo(110)
})
```

### Integration（API 路由）
- 用专门的 Supabase 测试项目，或事务回滚封装。
- 用 `npm run db:seed` 种服务目录数据；需要 demo 服务者时再跑 `npm run db:seed:providers`，然后直接 invoke route handler。

### E2E
- 用 `e2e/` 中的 Playwright fixtures。优先 `data-testid` 选择器，避免文案漂移。
- 每个用例前清空 + 种数据，避免顺序依赖。

## CI 闸门

PR 必须通过：
1. `npm run lint`
2. `npm test`
3. `npm run test:e2e:critical` *（一旦给用例加上 `@critical` 标，目前是 no-op）*
4. `npm run build`

见 [CI_CD.md](../CI_CD.md)。

## 手工 / UAT

见 [`MANUAL_TESTING_GUIDE.md`](../../MANUAL_TESTING_GUIDE.md) 与 [`TESTING_AND_DEPLOYMENT_GUIDE.md`](../../TESTING_AND_DEPLOYMENT_GUIDE.md)。UAT 日志落 `uat-test-results.log`。

## 测试数据卫生

- 永不把真实 PII 写入 fixture。
- Stripe：仅测试 key（`pk_test_`、`sk_test_`）。
- Supabase：`test` 与 `dev` 用各自项目；绝不对 `prod` 跑测试。
