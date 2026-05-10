# 多语言扩展 + 服务地区调整 — 实施方案

**需求来源**：用户 2026-05-10 提出
**目标分支**：feat/ui-rebuild
**当前状态**：方案稿，待用户确认后实施

---

## 1. 需求

| 项 | 现状 | 目标 |
|---|---|---|
| 语言 | `en`, `zh` | `en`, `zh-CN`, `zh-TW`, `ja`, `ko` |
| 服务地区 | `AU`, `CN`, `CA` | `AU`, `US`, `CA` |

---

## 2. 现状盘点（已读源码核实）

### 2.1 语言相关
- [i18n/routing.ts](../../i18n/routing.ts#L4)：`locales: ["en", "zh"]`，默认 `en`，`localePrefix: "always"`
- [i18n/request.ts](../../i18n/request.ts#L13)：按 locale 动态 import `messages/${locale}.json`
- [messages/en.json](../../messages/en.json) / [messages/zh.json](../../messages/zh.json)：各 1121 行
- [components/layout/LanguageSelector.tsx](../../components/layout/LanguageSelector.tsx#L11-L19)：`LABELS` / `SHORT` 写死了 en/zh
- [lib/db/schema/enums.ts](../../lib/db/schema/enums.ts#L5)：`localeEnum = pgEnum("locale", ["en", "zh"])`
- messages JSON 内 `language.{en,zh}` 键

### 2.2 地区相关
- [lib/db/schema/enums.ts](../../lib/db/schema/enums.ts#L4)：`countryEnum = pgEnum("country", ["AU", "CN", "CA"])`
- [components/domain/country.ts](../../components/domain/country.ts)：`COUNTRIES`, `CURRENCY_SYMBOL`, `TAX_ABBR`, `TAX_RATE`, `EMERGENCY_NUMBER`，以及 `CN_RATE = 8`（CNY 汇率硬编码）
- [components/domain/countryCookie.ts](../../components/domain/countryCookie.ts)：cookie `sc-country`，默认 `AU`
- [components/domain/pricing.ts](../../components/domain/pricing.ts#L11)：`country === "CN" ? value * 8 : value`
- [components/layout/CountrySwitcher.tsx](../../components/layout/CountrySwitcher.tsx#L11)、[CountrySelector.tsx](../../components/layout/CountrySelector.tsx#L10-L22)：列表与国旗 emoji 写死
- messages JSON 内 `country.{AU,CN,CA}`、`tax.incl.{AU,CN,CA}`、`tax.inclLine.{AU,CN,CA}` 键
- 引用 `"CN"` 字面量的 ts/tsx 共 **24 处**（含 scripts、e2e、components、app pages）

### 2.3 数据库
- 现有 enum 是 Postgres 原生 enum，**不能直接改值**，必须用 `ALTER TYPE ... RENAME VALUE` 或重建
- `users` / `services` / `customer-data` / `ai` schema 都引用了 country / locale enum

---

## 3. 关键决策点（需用户确认）

### D1. `zh` 旧数据如何迁移？
- **建议方案**：将历史 `zh` 视为简体，统一迁移为 `zh-CN`
- 影响：messages 文件 `zh.json` → `zh-CN.json`；DB 里所有 `locale='zh'` 的行 → `'zh-CN'`

### D2. 旧 `CN` 用户/数据如何处理？
- **建议方案**：当前是 staging/前期项目，直接将 `CN` 重命名为 `US`（如果数据库无生产数据）
- 替代方案：保留 CN 数据但不再提供新选项（双 enum 兼容期），实施成本更高
- ⚠️ 需用户确认 staging DB 是否有真实 `CN` 用户/订单

### D3. US 的税率/币种/汇率
- 币种：`US$`（USD）
- 税：美国销售税按州不同，建议**先用通用 "Sales Tax" 标签 + 0 占位率**，后续再做按州拆分
  - 或参考其他税率：示例使用 8%
- 汇率：当前代码用 `CN_RATE = 8` 硬编码 AUD→CNY；US 走 AUD→USD，建议**移除硬编码 FX，价格统一以 AUD 存库**，US/CA 显示时用近似汇率（例：`US_RATE = 0.65`）作为临时显示，标注 "approx."。**真实多币种结算延后到 billing 阶段**（与 [pricing.ts](../../components/domain/pricing.ts#L4-L7) 现有注释一致）
- ⚠️ 需用户拍板：临时汇率用什么数字？是否标 "approx."？

### D4. 紧急电话
- US 用 `911`（与 CA 相同）

### D5. 5 种语言全量翻译还是分阶段？
- en 已有；zh 现存（视为 zh-CN）
- **建议方案**：本次只搭好框架（routing/enum/UI 切换）+ 把 en、zh-CN 完整跑通，**zh-TW / ja / ko 先用 en 兜底（fallback）+ 占位文件**，后续翻译团队补
- 替代方案：本次连同所有翻译一并完成（工作量大、需翻译资源）

### D6. zh-TW 是繁体生成方式
- 短期可用 OpenCC 简→繁批量自动转，再人工校对台湾用语
- 还是直接由人工翻译？

---

## 4. 实施分阶段

### 阶段 A — 路由与配置层（最小 MVP，先合一次）
**目标**：i18n 路由支持 5 种语言；country enum 支持 US；UI 切换器能选所有新值。

A1. 修改 [i18n/routing.ts](../../i18n/routing.ts)：`locales: ["en", "zh-CN", "zh-TW", "ja", "ko"]`
A2. 重命名 `messages/zh.json` → `messages/zh-CN.json`；新增 `zh-TW.json`、`ja.json`、`ko.json`（先复制 en 作占位）
A3. 更新 [LanguageSelector.tsx](../../components/layout/LanguageSelector.tsx) 的 `LABELS` / `SHORT` 表（English / 简体中文 / 繁體中文 / 日本語 / 한국어；EN / 简 / 繁 / 日 / 한）
A4. messages JSON 内 `language` 键扩为 5 项；在每个 locale 文件里写自身语言的本地化名
A5. 更新 [components/domain/country.ts](../../components/domain/country.ts)：`COUNTRIES = ["AU","US","CA"]`，`CURRENCY_SYMBOL.US="US$"`，`TAX_ABBR.US="Sales Tax"`，`TAX_RATE.US=0.08`（待 D3 确认），`EMERGENCY_NUMBER.US="911"`
A6. 删除 `CN_RATE` / `country === "CN"` 分支；新增 `US_RATE` 临时汇率常量（待 D3 确认）
A7. 更新 [CountrySwitcher.tsx](../../components/layout/CountrySwitcher.tsx#L11) 和 [CountrySelector.tsx](../../components/layout/CountrySelector.tsx#L10-L22) 的列表 + 国旗（🇺🇸）
A8. 更新 [countryCookie.ts](../../components/domain/countryCookie.ts) 的 cookie 校验（COUNTRIES 已变即可）
A9. messages JSON 内 `country.US`、`tax.incl.US`、`tax.inclLine.US` 三组键替换 `CN` 对应键
A10. 验证：[proxy.ts](../../proxy.ts#L3) 通过 `import { routing }` 间接使用 locale 列表，**改 routing.ts 自动生效，无需改 proxy**；[next.config.ts](../../next.config.ts) 用 `createNextIntlPlugin` 也无需改

### 阶段 B — 数据库迁移
B1. 新建 drizzle migration：
  - `ALTER TYPE country ADD VALUE 'US'`（若 D2 选保留 CN）；或 `ALTER TYPE country RENAME VALUE 'CN' TO 'US'`（若 D2 选直接替换）
  - `ALTER TYPE locale RENAME VALUE 'zh' TO 'zh-CN'`
  - `ALTER TYPE locale ADD VALUE 'zh-TW'`、`'ja'`、`'ko'`
B2. 更新 [lib/db/schema/enums.ts](../../lib/db/schema/enums.ts#L4-L5) 与 TS 类型
B3. 更新 [lib/schema.sql](../../lib/schema.sql)（如需保持同步）
B4. 跑 `drizzle-kit generate` 校验

### 阶段 C — 全量代码引用替换
C1. grep 全项目 `"CN"` / `'zh'`（非 zh-CN 上下文）字面量，逐个替换或删除：
  - 24 个 ts/tsx 文件（已列出文件清单见 §2.2）
  - scripts/seed-*.ts、e2e/*.spec.ts、smoke-*.ts 中的样例数据
C2. helpArticles、ProviderCard 中如有 CN 文案，调整为 US
C3. 更新所有 messages JSON（5 份）中 country/tax 三组键

### 阶段 D — 翻译占位与 fallback
D1. en 不动；zh-CN 由现 zh.json 改名而来，已完整
D2. zh-TW：用 OpenCC 简→繁批量生成（待 D6 确认）
D3. ja / ko：先复制 en.json 作占位，标记 `__TODO_TRANSLATE__` 前缀，避免上线显示英文导致用户困惑
D4. 决定 fallback 策略：next-intl 默认会按 locale 找不到 key 时报错；建议在 [request.ts](../../i18n/request.ts) 中设置 fallback 到 en
D5. **每份 locale JSON 内的 `language.*` / `country.*` / `tax.incl.*` / `tax.inclLine.*` 标签都要按该语言本地化**（如 `ja.json` 里 `country.AU="オーストラリア"`、`language.ja="日本語"`），不能只复制 en 原文

### 阶段 E — 测试与回归
E1. 跑 `npm run lint` + `tsc --noEmit`
E2. 跑现有 e2e（Playwright）：booking-flow、uat-signin-flow 中含 `"CN"` 字面量需更新
E3. 手测：
  - 切换 5 种语言，URL 前缀正确（`/en`、`/zh-CN`、`/zh-TW`、`/ja`、`/ko`）
  - 切换 3 个国家，价格币种 / 税标签 / 紧急电话正确
  - 老 `/zh/...` URL 自动 redirect 到 `/zh-CN/...`（建议加，避免外链断）
E4. 检查 SEO：sitemap、`<html lang>`、`hreflang` 标签

### 阶段 F — 文档与发布
F1. 更新 [README.md](../../README.md) / [docs/zh/](../../docs/zh/) 中提及 locale / country 列表的部分
F2. CHANGELOG 记录 breaking change（country enum 值变更）
F3. 部署前在 staging 验证 D2 的数据迁移路径

---

## 5. 风险

| 风险 | 缓解 |
|---|---|
| 历史 `CN` 用户/订单数据丢失 | 阶段 B 之前先备份；D2 决定后再写 migration |
| 老链接 `/zh/...` 404 | 阶段 E 增加 redirect 中间件 |
| 翻译占位上线被用户当 bug | 在占位 locale 顶部 banner 提示 "Translation in progress"，或先不开放选项（仅留 en + zh-CN），后续翻译完再开 |
| `next-intl` 对带连字符 locale（zh-CN）需确认行为 | 实施时先做最小 spike，确认 URL/cookie/middleware 都正常 |

---

## 6. 估算

- 阶段 A：~1.5h（路由 + UI 切换器 + 占位文件）
- 阶段 B：~1h（migration + schema + 类型）
- 阶段 C：~1.5h（24 个 ts/tsx 文件 + 5 个 JSON 的 grep-replace + 验证）
- 阶段 D：~1h（OpenCC 转换 + 占位标记）
- 阶段 E：~1h（lint/tsc/e2e + 手测）
- 阶段 F：~0.5h
- **合计：~6.5h**（不含 zh-TW/ja/ko 的真翻译）

---

## 7. 待用户确认清单

- [ ] D1：旧 `zh` → `zh-CN` 映射 OK？
- [ ] D2：staging DB 是否有真实 CN 数据？是否同意 enum 直接 rename `CN`→`US`？
- [ ] D3：US 税率用 8% 占位 OK？AUD→USD 临时汇率取值？
- [ ] D5：本轮只做框架 + en/zh-CN，其余三种用占位？还是要求一次性完整翻译？
- [ ] D6：zh-TW 用 OpenCC 自动转还是人工翻译？
- [ ] 是否需要老 `/zh/...` URL 自动 redirect 到 `/zh-CN/...`？
- [ ] 翻译未完成的 locale 是否先隐藏（不在切换器列出）？

---

**下一步**：用户回复确认上述决策点后，按阶段 A→F 顺序实施，每阶段完成自评审通过后再进入下一阶段。
