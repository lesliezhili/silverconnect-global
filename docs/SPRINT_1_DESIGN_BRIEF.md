# Sprint 1 设计 Brief — 客户黄金路径 14 屏

> 本文档是 **Claude Design 出 Sprint 1 高保真稿的提示词输入**。
> 每屏交付 **浅色 EN + 浅色 ZH** 两版（除明示外）。
> 出稿前必须读完 [UI_DESIGN.md](UI_DESIGN.md) §0 / §1 / §10。
> 本文不重复 token 与组件规格 — 直接引用 UI_DESIGN.md 的章节号即可。

---

## 0. 用户与产品定位

**用户画像**：60+ 老年人，分布在 **AU（澳洲）/ CN（中国大陆）/ CA（加拿大）** 三国，多数对智能手机不熟，看小字困难，按错按钮容易回不去。子女有时代下单（家属共管路径见 P5）。
**产品**：本地化上门服务平台，老人在 SilverConnect 找清洁/烹饪/园艺/护理/维修服务者上门。
**品牌名 `SilverConnect` 在所有 locale 下保持原样，永不翻译**。曾被误译为"银联"/UnionPay 造成事故，禁止再发生。
**强制基线**（每屏每变体都要满足）：
- 对比度 **WCAG AAA**（正文 ≥ 7:1，大字 ≥ 4.5:1）
- 触控目标 **≥ 48×48px**，主按钮 / 输入框 **56px** 高
- 基准字号 **18px**（不是 14/16）
- 行高 1.6
- 焦点环 2px 主色 + 4px 同色 20% 光晕，键盘 Tab 必现
- 单列布局，最大内容宽 **720px**，居中

## Reading order（出稿前必读）

1. [UI_DESIGN.md](UI_DESIGN.md) **§0 设计原则** — 老年友好、温暖克制、看得见的信任、多国多语、AI 永远在场
2. [UI_DESIGN.md](UI_DESIGN.md) **§1 设计 token** — 色板（§1.1 含前景-背景配色契约⚠️）、字体（§1.2）、尺寸（§1.3）、状态徽章（§1.5）、断点（§1.6）、动效（§1.7）、插画系统（§1.8）
2.5. [UI_DESIGN.md](UI_DESIGN.md) **§10 多语言适配** — EN/ZH 永不并排、品牌名不译、A$/¥/C$ 语义、§10.1 关键术语对照表
3. [UI_DESIGN.md](UI_DESIGN.md) **§2 全局组件** — Header §2.1 / BottomTabBar §2.2 / AIFloatButton §2.3 / Button §2.4
4. [UI_DESIGN.md](UI_DESIGN.md) **§7.4 紧急模式** + **§11 无障碍清单**

## 5 条出稿铁律（违反任意一条 = 退稿）

1. **不允许双语并排**。同一张图内只渲染一种语言。EN 变体里不能出现 `Hi, Helen 你好` 这类拼接；ZH 变体里不能出现 `Map 地图`。每屏出 EN 与 ZH 两个**独立**变体。
2. **`SilverConnect` 永不翻译**。Header / footer / hero / 邮件签名等任何位置出现都保持英文原样。
3. **货币符号语义**：`A$` = 澳元 AUD（不是美元 USD），`¥` = 人民币 CNY，`C$` = 加元 CAD。中文 locale **保留符号**，不替换为"澳元/元/加元"。金额格式 `A$1,240.00`，半角千分位逗号。
4. **国别紧急号码硬编码 3 套**（仅在涉及紧急的 #29 chat 出现）：AU `000`，CN `120`（医疗）+ 副行 `火警 119 / 报警 110`，CA `911`。**不让用户选**，根据 Header 当前国家自动切。
5. **浅色为默认主稿**。深色仅作系统跟随能力示意，**只对 #14 支付成功 / #29 AI 聊天紧急模式 两屏额外出深色变体**，其余 12 屏不出深色。

---

## 出稿清单与变体矩阵

| 序 | 屏 | 路由 | 浅 EN | 浅 ZH | 深 EN | 深 ZH |
|---|---|---|---|---|---|---|
| 1 | #7 客户首页 | `/home` | ✓ | ✓ | — | — |
| 2 | #8 服务大类列表 | `/services` | ✓ | ✓ | — | — |
| 3 | #9 单类 Provider 列表 | `/services/[cat]` | ✓ | ✓ | — | — |
| 4 | #10 Provider 详情 | `/providers/[id]` | ✓ | ✓ | — | — |
| 5 | #12-S1 预订 Step 1 选服务包 | `/bookings/new` | ✓ | ✓ | — | — |
| 6 | #12-S2 预订 Step 2 选时间 | `/bookings/new` | ✓ | ✓ | — | — |
| 7 | #12-S3 预订 Step 3 选地址 | `/bookings/new` | ✓ | ✓ | — | — |
| 8 | #12-S4 预订 Step 4 确认 | `/bookings/new` | ✓ | ✓ | — | — |
| 9 | #13 支付页 | `/pay/[bookingId]` | ✓ | ✓ | — | — |
| 10 | #14 支付成功 | `/bookings/[id]/success` | ✓ | ✓ | ✓ | ✓ |
| 11 | #15 我的预订列表 | `/bookings` | ✓ | ✓ | — | — |
| 12 | #16 预订详情 | `/bookings/[id]` | ✓ | ✓ | — | — |
| 13 | #28 通知中心 | `/notifications` | ✓ | ✓ | — | — |
| 14 | #29 AI 聊天 + 紧急模式 | `/chat` | ✓ | ✓ | ✓ | ✓ |

**额外要求**：每屏出 **移动端 (375×812 iPhone 14)** 主稿，再补 **桌面端 (1280×800 居中 720px 内容)** 一稿。
**状态稿**：在主稿之外，每屏附一张 *合稿*（同一画板拼贴）展示 **default / loading skeleton / empty / error / 屏特有状态**。

---

## #7 · `/home` · 客户首页 / Customer home

**Goal**：3 秒内让登录的老年用户找到「订一次清洁」类入口，并感到温暖、被记得。

**Layout (mobile, top→bottom)**:
- **Header §2.1**（80px 吸顶）：Logo `SilverConnect` / 国家 chip 88×56 / 语言 chip 88×56 / 头像（已登录态）
- **Hero 区**（背景 `--bg-base`，内边距 24px）：
  - 第一行 H1 32px：`你好，Margaret 👋` / `Hello, Margaret 👋`
  - 第二行 Body 18px `--text-secondary`：`今天需要什么帮助？` / `What do you need help with today?`
  - 右侧（移动端是顶部右）放 **场景插画 `S1-tea-time`**（高 200px，居右），王阿姨喝茶，杯口热气循环上升 2.5s loop
- **大搜索框**（高 56px、圆角 12px、1.5px 边框）：占位 `🔍 搜索服务或地址` / `🔍 Search services or address`。点击跳 `/search`
- **章节标题 H2 26px**：`选择服务类别` / `Choose a service`
- **5 张大类卡**（2 列网格，单卡高严格 160px，最后一张占满整行；卡内左 96×96 角色插画 + 右标题 22px + 价格 16px）：
  - `清洁 · A$55/小时起` / `Cleaning · from A$55/h` — 角色 `C3-helper-mei`
  - `烹饪 · A$40/小时起` / `Cooking · from A$40/h` — 角色 `C4-cook-zhang`
  - `园艺 · A$50/小时起` / `Garden · from A$50/h` — 角色 `C5-gardener-tom`
  - `个人护理 · A$70/小时起` / `Personal care · from A$70/h` — 角色 `C6-nurse-anna`
  - `维修 · A$60/小时起` / `Repair · from A$60/h` — 角色 `C7-fixer-bob`
- **横滑组**（带"我最近订过"标题；ZH `我最近订过` / EN `Recently booked`）：
  - 横滑卡片 240×120：Provider 头像 64 + 姓 + 上次服务 + `再订一次` / `Book again`
  - 空数据时整组隐藏
- **推荐区**（标题 `推荐 Provider` / `Recommended providers`）：
  - 单列 Provider 卡（同 #9 卡片样式简化版）3 张
- **AIFloatButton §2.3**（右下，距底 24px）：圆形 64×64，`问一下` / `Ask AI` 文字 + 图标
- **BottomTabBar §2.2**（5 Tabs：首页/服务/预订/消息/我的，当前 Tab `首页` 主色高亮）

**Layout (desktop, ≥1024px)**：同移动端单列居中，最大内容宽 720px，左右大量留白；移除 BottomTabBar；Header 显示完整。

**Required content (ZH 与 EN copy)**:
| 元素 | ZH | EN |
|---|---|---|
| Hero 主标 | `你好，Margaret 👋` | `Hello, Margaret 👋` |
| Hero 副标 | `今天需要什么帮助？` | `What do you need help with today?` |
| 搜索占位 | `🔍 搜索服务或地址` | `🔍 Search services or address` |
| 章节 1 标题 | `选择服务类别` | `Choose a service` |
| 服务大类（5） | `清洁` `烹饪` `园艺` `个人护理` `维修` | `Cleaning` `Cooking` `Garden` `Personal care` `Repair` |
| 起价行 | `A$55/小时起` | `from A$55/h` |
| 章节 2 标题 | `我最近订过` | `Recently booked` |
| 横滑卡 CTA | `再订一次` | `Book again` |
| 章节 3 标题 | `推荐 Provider` | `Recommended providers` |
| AI 浮按 | `问一下` | `Ask AI` |
| Tab 5 项 | `首页 · 服务 · 预订 · 消息 · 我的` | `Home · Services · Bookings · Messages · Profile` |

> CN 区：货币显示 `¥120/小时起`；AU 区 `A$55/小时起`；CA 区 `C$58/h`。每个币种符号保留拉丁原样。

**States to render（合稿）**：
1. **Default** — 上方主稿
2. **Loading** — Hero 区保留问候骨架（占位灰块 height 32+18），大类网格 5 张骨架卡（同尺寸灰块），推荐 Provider 3 张骨架卡。横滑组在加载时隐藏（不闪）。
3. **Empty (新用户、无最近订单)** — 整个"我最近订过"组消失（不展示空状态文案）；Hero 副标改写为 `欢迎使用 SilverConnect，先订一次试试 →` / `Welcome — book your first service →`。
4. **Error (服务列表 API 失败)** — 大类网格区替换为插画 `S7-network-error` 高 160px + `加载服务时出错，请重试` / `Couldn't load services. Try again` + 主按钮 `重试` / `Retry`；其他区段照常渲染。

**Interactions**:
- 搜索框点击 → `/search`
- 大类卡点击 → `/services/[category]`（由 Header 当前国家决定 cat 国别价）
- 横滑卡 → `/providers/[id]`（带预填上次服务的查询参数）
- 推荐 Provider 卡 → `/providers/[id]`
- AIFloatButton → `/chat`
- 头像 → `/profile`
- 国家/语言 chip → 下拉选择，**切语言不刷新页面（hot-swap）**，切国家会刷新价格
- 任意位置上滑超过 200px → 显示一个返回顶部的小箭头按钮（48×48）

**Edge cases / gotchas**:
- 国家=CN 时，价格符号一律 `¥`；价格区间相应：`¥120/小时起` / `from ¥120/h`
- 国家=CA 时，符号 `C$`，含 `incl. HST` / `含 HST`
- 国家=AU 时，含 `incl. GST` / `含 GST`（含税提示在 #8 章节出现，#7 不写税）
- 用户名超过 8 中文 / 16 拉丁字符时，问候改为 `你好 👋` / `Hello 👋`，不裁人名
- 无网络 → 整页用 `S7` 兜底（见 §11.11 of UI_DESIGN.md），不只换大类网格
- 60+ 用户：所有图标按钮必须配字（不允许只放图标）

**API contract (informational)**:
- `GET /api/services` （按 Header 当前国家返回大类与起价）
- `GET /api/customer/recent` （我最近订过；空数组时整组隐藏）
- `GET /api/providers/recommended?country=` （推荐 Provider）

**Variants to deliver**：浅 EN + 浅 ZH（移动 + 桌面 + 状态合稿，共 6 张）。无深色。

**Illustrations needed**：
- Hero：`S1-tea-time`（200px，含 2.5s loop 茶杯热气）
- 大类卡：`C3 / C4 / C5 / C6 / C7` 各 96×96
- Loading 状态：用骨架屏，不放插画
- Error 状态：`S7-network-error` 160px

---

## #8 · `/services` · 服务大类列表 / Service categories

**Goal**：让用户在了解"哪些服务、价多少、含什么税"之后选定一个大类。

**Layout (mobile, top→bottom)**:
- **Header §2.1**（吸顶）
- **页面标题 H1 32px**：`选择服务类别` / `Choose a service`
- **国别税信息条**（高 48px，`--bg-surface` 浅灰底，圆角 12，含图标）：
  - AU：`所有价格已含 GST` / `All prices include GST`
  - CN：`所有价格已含 VAT` / `All prices include VAT`
  - CA：`所有价格已含 HST` / `All prices include HST`
- **5 张大类卡**（同 #7 样式，但卡更高 200px，多一行说明文字，单列垂直堆叠）：
  - 卡内：左 120×120 角色 + 右上标题 22 + 右中说明 16 `--text-secondary` + 右下价格区间 18
  - 价格区间：`A$45–80/小时` / `A$45–80/h`
  - 说明文字：见下表
- **AIFloatButton §2.3**
- **BottomTabBar §2.2**（当前 Tab `服务` 高亮）

**Layout (desktop)**：同移动端单列居中。

**Required content**:
| 大类 | ZH 标题 | ZH 说明 | EN 标题 | EN 说明 | 价格区间（AU） |
|---|---|---|---|---|---|
| Cleaning | `清洁` | `常规清洁、深度清洁、全屋整理` | `Cleaning` | `Regular, deep, whole-home tidy` | `A$45–80/h` |
| Cooking | `烹饪` | `三餐准备、营养餐、份饭备餐` | `Cooking` | `Daily meals, nutritionist menus, batch cook` | `A$40–70/h` |
| Garden | `园艺` | `修剪、浇水、季节整理` | `Garden` | `Mowing, watering, seasonal tidy` | `A$50–90/h` |
| Personal care | `个人护理` | `沐浴、协助、陪伴` | `Personal care` | `Bathing, mobility help, companionship` | `A$70–120/h` |
| Repair | `维修` | `小家电、灯具、漏水` | `Repair` | `Small appliance, lights, leaks` | `A$60–110/h` |

| 元素 | ZH | EN |
|---|---|---|
| 页标题 | `选择服务类别` | `Choose a service` |
| AU 含税条 | `所有价格已含 GST` | `All prices include GST` |
| CN 含税条 | `所有价格已含 VAT` | `All prices include VAT` |
| CA 含税条 | `所有价格已含 HST` | `All prices include HST` |
| 卡 CTA（隐式整卡可点） | — | — |

**States to render**：
1. **Default**
2. **Loading** — 5 张卡骨架（200px 高灰块），含税条不渲染（避免文案闪）
3. **Empty** — 不会出现（5 大类是产品基线，永远存在）
4. **Error** — 全页 `S7-network-error` 160px + `无法加载服务列表` / `Couldn't load services` + `重试` / `Retry`

**Interactions**:
- 整张大类卡可点 → `/services/[category]?country=`
- Header 切国家 → 含税条文案与价格区间随之刷新
- BottomTabBar `服务` 高亮，其他 Tab 跳对应路由

**Edge cases / gotchas**:
- 切到 CN 区时部分大类（个人护理、维修）若不开放，相应卡 `--text-secondary` 灰显 + `即将开通` / `Coming soon`，不可点
- 价格区间里始终用 `–`（en dash），不用 `-`
- 数字与货币符号保持西文字符；ZH 不译"澳元 / 元 / 加元"

**API contract**:
- `GET /api/services?country=AU|CN|CA` — 返回大类、起价、税信息

**Variants to deliver**：浅 EN + 浅 ZH（移动 + 桌面 + 状态合稿，共 6 张）。

**Illustrations needed**：5 大类各自配 `C3 / C4 / C5 / C6 / C7` 120×120；Error 用 `S7-network-error` 160px。

---

## #9 · `/services/[category]` · 单类 Provider 列表 / Providers by category

**Goal**：让用户在某一大类（如清洁）下，按筛选/排序找到合适的 Provider。

**Layout (mobile, top→bottom)**:
- **Header §2.1**
- **顶部子区**（高 ~ 96px）：
  - 返回按钮 + 类别名 H2 26px：`清洁服务（AU）` / `Cleaning (AU)`
  - 价格区间提示 16px `--text-secondary`：`A$45–80/小时（含 GST）` / `A$45–80/h (incl. GST)`
- **筛选 chip 横滑**（每 chip 高 48，间距 12）：
  - `评分 4.5+` / `Rating 4.5+`
  - `距离 5km` / `Within 5km`
  - `中文` / `Mandarin`（CN 区或语言筛选）
  - `周末可用` / `Weekends`
  - `女性服务者` / `Female`
  - `急救资质` / `First-aid`
  - 已选 chip 用 `--brand-primary` 填充 + 白字
- **排序按钮**（与筛选 chip 同行，最右；`排序：推荐 ▾` / `Sort: Recommended ▾`，下拉项：推荐 / 距离最近 / 评分最高 / 价格最低）
- **Provider 卡片列表**（单列，每卡 ≥200px 高，整卡可点）：
  - 卡内左 80×80 圆形头像（默认 `C3-helper-mei` 等）
  - 卡内右上：姓名 H3 22 + 评分 16（`⭐ 4.9 (132)` 即"评分 (评价数)"）
  - 卡内右中：徽章组（线条图标 + 文字 14px）：`✅ 验证` / `✅ Verified`、`✅ 急救` / `✅ First-aid`、`🌐 中文` / `🌐 Mandarin`、`📍 3km` / `📍 3km`
  - 卡内底部：价格 18 + 含税：`A$55/小时（含 GST）` / `A$55/h (incl. GST)`
  - 卡底部右：双 CTA `查看 →` / `View →`（次按钮）+ `立即预订 →` / `Book now →`（主按钮）
- **AIFloatButton §2.3**
- **BottomTabBar §2.2**

**Layout (desktop)**：同移动端单列居中（720px）。

**Required content**:
| 元素 | ZH | EN |
|---|---|---|
| 类别页标题 | `清洁服务（AU）` | `Cleaning (AU)` |
| 价格区间提示 | `A$45–80/小时（含 GST）` | `A$45–80/h (incl. GST)` |
| 筛选 chip 1 | `评分 4.5+` | `Rating 4.5+` |
| 筛选 chip 2 | `距离 5km` | `Within 5km` |
| 筛选 chip 3 | `中文` / `English` | `Mandarin` / `English` |
| 筛选 chip 4 | `周末可用` | `Weekends` |
| 筛选 chip 5 | `女性服务者` | `Female` |
| 筛选 chip 6 | `急救资质` | `First-aid` |
| 排序触发 | `排序：推荐 ▾` | `Sort: Recommended ▾` |
| 排序选项 | `推荐 / 距离最近 / 评分最高 / 价格最低` | `Recommended / Nearest / Top rated / Lowest price` |
| 卡片次 CTA | `查看 →` | `View →` |
| 卡片主 CTA | `立即预订 →` | `Book now →` |
| 含税后缀 | `（含 GST）` | `(incl. GST)` |
| 加载更多触发（IntersectionObserver） | `加载更多…` | `Loading more…` |

**States to render**：
1. **Default**（10 张 Provider 卡，分页 20）
2. **Loading** — 8 张卡骨架（同 200px 灰块）；筛选 chip 区已渲染
3. **Empty** — 插画 `S3-empty-bookings`（160px）+ `没找到符合条件的服务者` / `No providers match your filters` + 次按钮 `调整筛选条件` / `Adjust filters` + 主按钮 `清除筛选` / `Clear filters`
4. **Error** — 全页 `S7-network-error` 160px + `加载失败` / `Couldn't load` + `重试` / `Retry`
5. **筛选已激活态** — 已选 chip 用主色填充 + 白字；右下角浮一个小 ✖ 清除按钮（48×48）`清除筛选` / `Clear filters`

**Interactions**:
- 筛选 chip 单击 切换；多选累加
- 排序按钮 → 弹下拉，选项点击关闭
- Provider 卡整卡点击 = `查看` 跳 `/providers/[id]`
- `立即预订 →` 主按钮 → `/bookings/new?provider=[id]&service=[catId]`（跳过详情）
- 滚动到底部自动加载下一页（带 `加载更多…` skeleton）
- 顶部返回按钮 → `/services`

**Edge cases / gotchas**:
- 距离计算依赖用户当前地址（`lib/locationUtils.ts`）；用户未授权地理位置时，距离 chip 隐藏，卡片不显示距离
- CN 区要求显示「中文」筛选默认开启；AU/CA 默认关闭
- 评分 chip 无 4.5+ Provider 时，自动放宽至 4.0+ 并在结果上方加注 `没找到 4.5+，已显示 4.0+` / `No 4.5+ found, showing 4.0+`
- 价格永远显示「含税」三字 / `(incl. GST/VAT/HST)`，不允许出现裸价
- 卡片整卡可点 = 跳详情，但卡内的「立即预订」按钮拦截事件不冒泡
- ZH 中"4.5+"保留西文字符与加号

**API contract**:
- `POST /api/provider/search`（参数：`category`、`filters`、`sort`、`page`、`country`、`coord`）
- 距离：来自 `lib/locationUtils.ts` haversine

**Variants to deliver**：浅 EN + 浅 ZH（移动 + 桌面 + 状态合稿，共 6 张）。

**Illustrations needed**：Provider 头像默认 `C3 / C6` 等（按服务类型）；Empty 用 `S3-empty-bookings` 160px；Error 用 `S7-network-error` 160px。

---

## #10 · `/providers/[id]` · Provider 详情 / Provider detail

**Goal**：让用户基于资质、评价、可用时段、价格做出预订决定。

**Layout (mobile, top→bottom)**:
- **Header §2.1**
- **Provider 头部**（高 200px，背景 `--bg-surface`，圆角 16）：
  - 圆形头像 96px（左居中）
  - 姓名 H1 32 + 副标 16 `--text-secondary`：`清洁服务者 · 3 年经验` / `Cleaning provider · 3 yrs`
  - 评分行：`⭐ 4.9 (132 评价)` / `⭐ 4.9 (132 reviews)`
  - 完成单量：`已完成 320 单` / `320 jobs done`
  - 语言徽章：`🌐 中文 · English`
- **资质徽章组**（4 张小卡，2×2 网格，每卡 88px 高，圆角 12，浅灰底；图标 + 中粗 14 字）：
  - `✅ 已验证` / `✅ Verified`
  - `🩺 急救资质` / `🩺 First-aid certified`
  - `🛡️ 无犯罪` / `🛡️ Clean record`
  - `🏥 已投保` / `🏥 Insured`
- **服务范围**（高 160px）：地图迷你视图（圆形覆盖范围渲染）+ 距离 `距您 3.2km` / `3.2km from you`
- **提供的服务清单**（标题 H2 26 `提供的服务` / `Services offered`）：
  - 列表项每行 64：服务名 + 时长 + 价格（含税）+ `选这个` 单选圆按钮
  - 例：`基础清洁 · 2 小时 · A$110（含 GST）` / `Basic clean · 2 hrs · A$110 (incl. GST)`
- **可用时段预览**（标题 `最近可用` / `Next available`）：
  - 横滑日期 chip 7 张（每 chip 88×80，显示日期 + 月/日 + 可用槽数）：`周三 4/8 · 3 个时段` / `Wed Apr 8 · 3 slots`
  - chip 点击 = 跳 #12 Step 2 并预选该日
- **评价列表**（标题 H2 `评价 (132)` / `Reviews (132)`）：
  - 顶部分布柱状图：5 星 80% / 4 星 15% / 其他 5%
  - 5 条评价卡（更多展开 `查看全部 132 条 →` / `See all 132 →`）：每条含头像 48 + 用户首字 + 星 + 1 行评论 + Provider 一次性回复（如有，缩进 + `--bg-surface` 底）
  - 评价右上角 `…` 按钮 → 举报（弹 ⊞ ReportReviewModal，本 Sprint 不实现，仅占位入口）
- **底部 sticky 区**（高 80px，白底 + 上边框）：主按钮全宽 56 高 `立即预订 →` / `Book now →`

**Layout (desktop)**：同移动端单列 720px 居中；底部 sticky 改为页内同位置（不悬浮）。

**Required content**:
| 元素 | ZH | EN |
|---|---|---|
| 副标 | `清洁服务者 · 3 年经验` | `Cleaning provider · 3 yrs` |
| 评分行 | `⭐ 4.9 (132 评价)` | `⭐ 4.9 (132 reviews)` |
| 完成单量 | `已完成 320 单` | `320 jobs done` |
| 资质徽章 | `已验证 / 急救资质 / 无犯罪 / 已投保` | `Verified / First-aid certified / Clean record / Insured` |
| 距离 | `距您 3.2km` | `3.2km from you` |
| 服务清单标题 | `提供的服务` | `Services offered` |
| 含税后缀 | `（含 GST）` | `(incl. GST)` |
| 可用时段标题 | `最近可用` | `Next available` |
| 时段 chip 范例 | `周三 4/8 · 3 个时段` | `Wed Apr 8 · 3 slots` |
| 评价标题 | `评价 (132)` | `Reviews (132)` |
| 全部评价链接 | `查看全部 132 条 →` | `See all 132 →` |
| 主 CTA | `立即预订 →` | `Book now →` |

**States to render**：
1. **Default**
2. **Loading** — 头部 + 资质徽章 + 服务清单 + 评价均用骨架屏；底部 sticky 主按钮 disabled 灰显
3. **Empty (新 Provider 无评价)** — 评价区改为 `还没有评价` / `No reviews yet` + 副标 `成为第一个评价的人` / `Be the first to review`；可用时段照常
4. **Empty (短期内无可用时段)** — 时段 chip 替换为 `近 7 天无可用时段` / `No slots in next 7 days` + 次按钮 `查看下周` / `View next week`
5. **Error** — 整页 `S7-network-error` 160px
6. **Provider 已下线/暂停** — 顶部红色横幅 `这位服务者暂不接单` / `This provider is currently unavailable` + 主 CTA 变灰 disabled，文案改 `不可预订` / `Unavailable`

**Interactions**:
- 资质徽章点击 → 弹 tooltip 解释资质（Sprint 1 仅静态文案，不调 API）
- 服务清单单选 → 选中态高亮，主按钮文案变 `立即预订 · A$110 →` / `Book now · A$110 →`
- 时段 chip 点击 → `/bookings/new?provider=[id]&service=[serviceId]&date=[YYYY-MM-DD]`（带预选服务与日期）
- 评价 `…` → 举报弹窗（占位）
- 主 CTA → `/bookings/new?provider=[id]&service=[selectedServiceId]`；未选服务时按钮 disabled

**Edge cases / gotchas**:
- 价格永远含税 + 后缀
- 评价文本超过 3 行截断 + `查看更多 →` / `Read more →` 展开
- Provider 个人简介支持双语；只渲染当前 locale 的版本，找不到时回退 EN
- 用户已收藏过该 Provider 时，头部右上角心形图标实心；否则线条
- AU 数据保护：评价中如包含个人识别信息（电话、地址），后端已脱敏；前端不再处理
- CN 区 Provider 的 `中文` 徽章必现；AU/CA 区按 Provider 实际填写

**API contract**:
- `GET /api/provider/[id]` — 基础信息 + 资质徽章
- `GET /api/provider/[id]/availability?from=&to=` — 7 日可用时段（与 #12 Step 2 共用 Calendar 组件）
- `GET /api/provider/[id]/reviews?page=` — 评价分页

**Variants to deliver**：浅 EN + 浅 ZH（移动 + 桌面 + 状态合稿，共 6 张）。

**Illustrations needed**：Provider 头像默认用 `C3-helper-mei`（清洁）/ `C4-cook-zhang`（烹饪）等，按实际 Provider 类型；Error `S7-network-error`。

---

## #12-S1 · `/bookings/new` Step 1 · 选服务包 / Choose service

**Goal**：让用户在已选 Provider 下选择具体服务包（基础/深度/全屋）。

**Layout (mobile, top→bottom)**:
- **Header §2.1**（左替换为返回 `←`）
- **进度条**（高 48px，居中 4 段）：`①服务` `②时间` `③地址` `④确认`，当前 `①` 用 `--brand-primary` 圆形填充 + 白字，其他段灰圆 + 灰字 + 灰连线
- **页面标题 H1 32px**：`选择服务` / `Choose a service`
- **副标 18px `--text-secondary`**：Provider 名 + 头像 32 + `· 共 3 个套餐` / `· 3 packages`
- **3 张大单选卡**（每卡 144px 高，圆角 16，间距 16）：
  - 卡左：圆形单选按钮 24px（未选灰边、已选 `--brand-primary` 填充 + 白勾）
  - 卡中：服务名 H3 22 + 一行说明 16 `--text-secondary` + 时长 16 + 价格 18
  - 已选卡：边框 2px `--brand-primary` + `--bg-surface` 浅蓝底
- **底部 sticky CTA 区**（高 80）：单按钮全宽 `下一步：选时间` / `Next: pick time`，未选服务包时 disabled

**Required content**:
| 元素 | ZH | EN |
|---|---|---|
| 进度条 | `①服务 ②时间 ③地址 ④确认` | `①Service ②Time ③Address ④Confirm` |
| 页标题 | `选择服务` | `Choose a service` |
| 服务卡 1 | `2 小时基础清洁 · 厨房+卫生间+客厅 · 2 小时 · A$110（含 GST）` | `2-hour basic clean · Kitchen+bath+living · 2 hrs · A$110 (incl. GST)` |
| 服务卡 2 | `4 小时深度清洁 · 全屋 + 窗框 + 油烟机 · 4 小时 · A$210（含 GST）` | `4-hour deep clean · Whole home + windows + range hood · 4 hrs · A$210 (incl. GST)` |
| 服务卡 3 | `全屋整理 · 收纳 + 旧物分类 · 6 小时 · A$330（含 GST）` | `Full tidy · Decluttering + sorting · 6 hrs · A$330 (incl. GST)` |
| 主 CTA | `下一步：选时间` | `Next: pick time` |
| 主 CTA disabled hint（小字）| `请先选择服务` | `Select a service first` |

**States**：
1. Default（无选中）
2. 已选第 1 张
3. Loading（进入页时拉 Provider 服务清单）— 3 张骨架卡
4. Error（API 失败）— 全页 `S7` + 重试

**Interactions**:
- 单击大卡 = 选中（互斥）
- 顶部 `←` → 返回 `/providers/[id]`，弹二次确认 `离开会丢失输入吗？这一步还没填东西，可以离开。` / `Leave? Nothing entered yet — safe to leave.`（实际只有第 1 步无输入时不弹，第 2 步起才弹）
- `下一步` → 推进到 Step 2，URL 不变（SPA 内步骤切换）

**Edge cases**:
- 服务包数 < 3 时单列；> 3 时也保持单列（不堆 2 列，老人扫描成本高）
- 价格永含税
- 服务名超长 ZH 12 字 / EN 28 字符截断 + Tooltip
- 用户从 #10 服务清单单选 → 进入 #12 已自动预选；进度按钮 enabled

**API contract**：
- `GET /api/provider/[id]/services`（第 1 步初始化时拉）
- 注：完整向导 `POST /api/booking/quote`（Step 4 调）/ `POST /api/bookings`（Step 4 提交）

**Variants to deliver**：浅 EN + 浅 ZH（移动 + 桌面 + 状态合稿）。

**Illustrations needed**：无场景插画（表单页保持专注，UI_DESIGN.md §1.8.5 克制规则）；进度条段落用线条圆 + 数字。

---

## #12-S2 · `/bookings/new` Step 2 · 选时间 / Pick time

**Goal**：让用户在月历上找一个可用的日 + 时段，决定单次或循环。

**Layout (mobile, top→bottom)**:
- **Header §2.1**（左 `←`）
- **进度条**（同 S1，当前 `②`）
- **页面标题 H1 32**：`选择时间` / `Pick a time`
- **频次切换 Tab**（4 个，全宽分配，每个高 56；当前主色填充 + 白字）：
  - `单次` `每周` `每两周` `每月` / `One-off` `Weekly` `Fortnightly` `Monthly`
- **月历视图**（不下拉，整月一览）：
  - 上方月份切换 `← 4 月 / April →`
  - 7 列 6 行；可用日 `--badge-completed-bg`（浅绿）+ `--badge-completed-fg` 字；不可用日 `--badge-cancelled-bg` + `--badge-cancelled-fg`；今日日期外加 `--brand-primary` 描边 2px；选中日填充 `--brand-primary` + 白字
  - 每个日期格 48×48
- **可用时段网格**（选定日后下方出现，3 列大按钮 96×56）：
  - 例：`09:00` `11:00` `14:00` `16:00`；不可用槽变灰 disabled
- **当前选中显示**（只读卡片 64 高，背景 `--bg-surface` 浅蓝）：`已选：周三 4/8 14:00（2 小时）` / `Selected: Wed Apr 8, 2:00 PM (2 hrs)`
- **循环周期附加说明**（仅当频次 ≠ 单次）：64 高浅黄底卡 `--bg-surface` 变体，含 `S9-recurring-booking` 缩略图 32 + 文字：`将每周三 14:00 重复 · 共 12 次` / `Repeats every Wed at 2 PM · 12 times total`
- **底部 sticky CTA**：`下一步：选地址` / `Next: pick address`，未选时段时 disabled

**Required content**:
| 元素 | ZH | EN |
|---|---|---|
| 页标题 | `选择时间` | `Pick a time` |
| 频次 Tab | `单次 / 每周 / 每两周 / 每月` | `One-off / Weekly / Fortnightly / Monthly` |
| 月份切换 | `← 4 月 / April →` | `← April →` |
| 已选只读卡 | `已选：周三 4/8 14:00（2 小时）` | `Selected: Wed Apr 8, 2:00 PM (2 hrs)` |
| 循环说明 | `将每周三 14:00 重复 · 共 12 次` | `Repeats every Wed at 2 PM · 12 times total` |
| 主 CTA | `下一步：选地址` | `Next: pick address` |
| disabled hint | `请先选择日期与时段` | `Pick a date and time first` |

**States**：
1. Default（无日期、无时段选中）
2. 已选日，未选时段
3. 已选日 + 时段
4. **No-slots**（选中日无可用时段）— 时段网格替换为 `这一天没有可用时段` / `No slots on this day` + 次按钮 `推荐附近 Provider` / `Find nearby providers`
5. Loading（拉可用性）— 月历日格骨架灰显
6. Error — 月历区 `S7` 160 + `重试`
7. 频次 ≠ 单次 — 多一张循环说明卡

**Interactions**:
- 日格点击 = 选中，下方时段网格刷新
- 时段按钮点击 = 选中（互斥）
- Tab 切换 = 重新拉可用性（不同频次的可用性可能不同）
- 月份切换 = 拉新月可用性
- 顶部 `←` 返回 Step 1，**弹二次确认**：`离开会丢失你刚才填的时间。确认离开？` / `Leave? You'll lose what you've entered.` 主按钮 `离开` / `Leave`、次 `留下` / `Stay`
- `下一步` → Step 3

**Edge cases**:
- 日期 < 今天 全部 disabled 灰显
- 24 小时内的日 不可订（业务规则；显示 `请提前 24 小时预订` / `Bookings need 24h lead time`）
- 用户切换频次后、日期与时段会保留（不清空），但若新频次下该时段不可用，自动清空时段并提示
- 月历跨月日（4 月最后一周显示 5 月 1-3）灰显 + 不可点
- ZH 月份显示 `4 月` 不译为 "Sì 月"；星期显示 `周三` 简写 `三`
- EN 月份显示 `April`，星期 `Wed`

**API contract**：
- `GET /api/provider/[id]/availability?from=&to=&frequency=` — 返回可用日与时段
- 复用 #10 的可用时段 API

**Variants to deliver**：浅 EN + 浅 ZH（移动 + 桌面 + 状态合稿）。

**Illustrations needed**：循环说明卡用 `S9-recurring-booking` 32px 缩略；其他无场景插画。

---

## #12-S3 · `/bookings/new` Step 3 · 选地址 / Pick address

**Goal**：让用户从已存地址选一个，或新增一个地址，并看到 Provider 距离估算。

**Layout (mobile, top→bottom)**:
- **Header §2.1**（左 `←`）
- **进度条**（当前 `③`）
- **页面标题 H1 32**：`选择服务地址` / `Choose service address`
- **已存地址列表**（每条 80 高，圆形单选 + 标题 + 完整地址 1 行）：
  - 例标题：`家 · 默认` / `Home · Default`
  - 例地址：`Carlton, VIC 3053, Unit 2/15 Faraday St`
  - 距离行：`距 Provider 3.2km · 约 8 分钟车程` / `3.2km from provider · ~8 min drive`
- **新增地址按钮**（全宽次按钮，56 高，圆角 12）：`+ 新增地址` / `+ Add a new address`
- **门禁备注栏**（textarea，4 行高，圆角 12，placeholder 示例）：`门禁密码 / 楼层 / 提醒事项（选填）` / `Door code / floor / reminders (optional)`
- **底部 sticky CTA**：`下一步：确认` / `Next: review`

**Required content**:
| 元素 | ZH | EN |
|---|---|---|
| 页标题 | `选择服务地址` | `Choose service address` |
| 默认徽章 | `· 默认` | `· Default` |
| 距离行 | `距 Provider 3.2km · 约 8 分钟车程` | `3.2km from provider · ~8 min drive` |
| 新增按钮 | `+ 新增地址` | `+ Add a new address` |
| 备注 placeholder | `门禁密码 / 楼层 / 提醒事项（选填）` | `Door code / floor / reminders (optional)` |
| 主 CTA | `下一步：确认` | `Next: review` |

**States**：
1. Default（已存地址 ≥1 个）
2. **Empty (无地址)** — 顶部插画 `S3-empty-bookings` 缩到 96px + 文案 `还没添加地址，点下方新增` / `No address yet — tap below to add one` + 新增按钮变主按钮（主色填充）
3. **新增地址内嵌表单态** — 列表上方插入一个表单卡（街道、单元、楼层、城市、邮编、设为默认开关，主按钮 `保存地址`）
4. **Provider 不服务该地区** — 选中地址下方红字 `Provider 不在此区域服务` / `Provider doesn't serve this area` + 次按钮 `换 Provider` / `Pick another provider`（→ #9）
5. Loading（地址列表拉取）— 3 条骨架
6. Error — 列表区 `S7` + 重试

**Interactions**:
- 地址项单选（互斥）
- 新增按钮 = 内嵌表单展开，不跳路由
- 长按地址项 = 弹 `编辑 / 删除` 操作菜单（Sprint 1 占位，不实现编辑/删除路由）
- `下一步` → Step 4，要求至少选一个地址
- `←` → Step 2（弹二次确认）

**Edge cases**:
- 地址超长截断 + 详情用 tooltip / 点击展开
- 距离 < 1km 显示 `< 1km`
- 地址坐标拉取失败时距离行隐藏，不显示 N/A
- CN 区地址格式 `北京市朝阳区...`；AU/CA 用拉丁字符
- 用户当前位置授权未开 → 距离行显示 `距离需要定位授权 →` / `Allow location to see distance →` 链接

**API contract**：
- `GET /api/customer/addresses` — 地址列表
- `POST /api/customer/addresses` — 新增（内嵌表单提交）
- `GET /api/provider/[id]/serves?lat=&lng=` — 是否服务该地区 + 距离
- 距离来自 `lib/locationUtils.ts`

**Variants to deliver**：浅 EN + 浅 ZH（移动 + 桌面 + 状态合稿）。

**Illustrations needed**：Empty 用 `S3-empty-bookings` 96px；其他无。

---

## #12-S4 · `/bookings/new` Step 4 · 确认 / Review

**Goal**：让用户在掏钱前看清价格构成、取消政策、可加备注，并直达支付。

**Layout (mobile, top→bottom)**:
- **Header §2.1**（左 `←`）
- **进度条**（当前 `④`）
- **页面标题 H1 32**：`确认订单` / `Review your booking`
- **订单摘要卡**（圆角 16，`--bg-surface`，内边距 24）：
  - 服务名 + 时长 H3 22：`基础清洁 · 2 小时` / `Basic clean · 2 hrs`
  - 时间：`周三 4/8 14:00–16:00` / `Wed Apr 8, 2:00–4:00 PM`
  - Provider：`李 师傅 · ⭐ 4.9` / `Mr Li · ⭐ 4.9` + 头像 32
  - 地址：`Carlton, VIC 3053, Unit 2/15 Faraday St`
- **价格明细表**（折叠表，默认展开；圆角 12 卡）：
  - 行：`服务费` / `Service fee` — `A$55.00`
  - 行：`平台服务费 (8%)` / `Platform fee (8%)` — `A$4.40`
  - 行：`GST (10%)` / `GST (10%)` — `A$5.94`
  - 分隔线
  - 总计行（粗体 H3 22）：`合计` / `Total` — `A$65.34`
- **取消政策提示框**（`--badge-confirmed-bg` 浅蓝底 + 主色字 16，圆角 12，含 ℹ️ 图标）：
  - `距开始 > 24 小时取消可全额退款。≤ 24 小时取消扣 30%。` / `Free cancellation up to 24h before. After that, 30% fee applies.`
- **备注栏**（textarea 4 行）：placeholder `给 Provider 留言（选填）` / `Note to provider (optional)`
- **底部 sticky CTA**（高 80）：主按钮 `下一步：去支付 A$65.34` / `Next: pay A$65.34`

**Required content**:
| 元素 | ZH | EN |
|---|---|---|
| 页标题 | `确认订单` | `Review your booking` |
| 价格行 | `服务费 / 平台服务费 (8%) / GST (10%) / 合计` | `Service fee / Platform fee (8%) / GST (10%) / Total` |
| 取消政策 | `距开始 > 24 小时取消可全额退款。≤ 24 小时取消扣 30%。` | `Free cancellation up to 24h before. After that, 30% fee applies.` |
| 备注 placeholder | `给 Provider 留言（选填）` | `Note to provider (optional)` |
| 主 CTA | `下一步：去支付 A$65.34` | `Next: pay A$65.34` |

**States**：
1. Default
2. Loading（quote API 慢）— 价格明细骨架，主按钮 disabled `计算中…` / `Calculating…`
3. **Quote 失效**（用户停留 > 5min）— 顶部黄条 `价格已更新，请重新查看` / `Price updated — please review` + 重新拉 quote
4. **Provider 时段被抢（库存竞争）** — 红条 `这个时段刚被预订，请回到 Step 2 重选` / `This slot was just taken — please pick another` + 主按钮 disabled
5. Error — `S7` + 重试

**Interactions**:
- 价格明细可折叠/展开（点击合计行）
- 备注最多 200 字符
- `下一步：去支付` → 创建 booking record（status=PENDING/UNPAID）→ 跳 `/pay/[bookingId]`
- `←` → Step 3（不弹二次确认，因为 Step 4 还没提交）

**Edge cases**:
- AU 区税名 GST 10%；CN 区 VAT 6%；CA 区 HST 10%~15%（按省）
- CN 区"平台服务费"中文写法：`平台服务费` 不写"平台抽成"
- 金额始终带 `A$` `¥` `C$`，小数点后 2 位（CN ¥ 无小数也强制 `.00`）
- 备注超 200 字 实时计数显示 `198/200`
- 用户从 Step 2 进 Step 4 后再返回 Step 2 改时间，价格自动重算（quote API 重调）

**API contract**：
- `POST /api/booking/quote`（参数 `provider`、`service`、`time`、`address`）— 返回价格明细
- `POST /api/bookings`（提交，status=PENDING/UNPAID）— 返回 `bookingId`，跳支付

**Variants to deliver**：浅 EN + 浅 ZH（移动 + 桌面 + 状态合稿）。

**Illustrations needed**：无（表单页克制）。

---

## #13 · `/pay/[bookingId]` · 支付页 / Payment

**Goal**：让用户用 Apple/Google Pay 或信用卡完成支付（Stripe Elements 嵌入），并清楚知道是 Stripe 加密。

**Layout (mobile, top→bottom)**:
- **Header §2.1**（左 `←` → 返回 #12 Step 4）
- **页面标题 H1 32**：`支付` / `Payment`
- **订单摘要折叠卡**（高 96，默认折叠；左 Provider 头像 48 + 服务名 + 日期 + `A$65.34` 大字 + 右 `▾` 展开按钮）：
  - 展开后显示完整明细（同 #12 Step 4 的价格表，只读）
- **支付方式三选区**（每行 80 高，圆形单选）：
  - `Apple Pay`（仅 iOS Safari 显示，否则隐藏整行；图标 + `Apple Pay`）
  - `Google Pay`（仅 Chrome 支持时显示）
  - `信用卡` / `Credit / debit card`（默认选中）
- **Stripe Elements 卡片表单区**（仅当选中信用卡时展开）：
  - 已绑定卡列表（每条 64 高：卡 brand 图标 + `**** 4242` + 到期 `12/28` + 删除小图标 + 单选）
  - `+ 使用新卡` 链接 → 展开 Stripe Elements 嵌入式 iframe（卡号、有效期、CVC、邮编 4 字段，56 高）
  - `保存为默认卡` 复选框
- **安全提示条**（高 56，浅蓝底 `--badge-confirmed-bg` + 主色字 + 🔒 图标）：
  - `🔒 您的卡信息由 Stripe 加密存储，本站不接触` / `🔒 Card info encrypted by Stripe — we never see it`
- **底部 sticky CTA**（高 80）：主按钮全宽 `支付 A$65.34` / `Pay A$65.34`

**Required content**:
| 元素 | ZH | EN |
|---|---|---|
| 页标题 | `支付` | `Payment` |
| 摘要展开按钮 | `展开明细 ▾` | `View details ▾` |
| 支付方式 | `Apple Pay / Google Pay / 信用卡` | `Apple Pay / Google Pay / Credit / debit card` |
| 新卡按钮 | `+ 使用新卡` | `+ Use a new card` |
| 保存默认 | `保存为默认卡` | `Save as default card` |
| 安全提示 | `🔒 您的卡信息由 Stripe 加密存储，本站不接触` | `🔒 Card info encrypted by Stripe — we never see it` |
| 主 CTA | `支付 A$65.34` | `Pay A$65.34` |
| 处理中文案 | `处理中…请勿关闭页面` | `Processing… please don't close this page` |

**States**：
1. Default（信用卡已选，无已绑定卡）
2. 已选 Apple Pay — 隐藏卡片表单，主按钮文案变 `用 Apple Pay 支付 A$65.34` / `Pay A$65.34 with Apple Pay`
3. Loading（payment intent 创建中）— 主按钮 disabled `处理中…`
4. **3DS challenge** — Stripe 弹银行 3D 安全验证 modal（Stripe 自管 UI）；本页底部叠一个半透明遮罩 + 文案 `请完成银行验证…` / `Complete bank verification…`
5. **支付失败** — 顶部红条（`--danger` + 白字）`卡被拒：余额不足` / `Card declined: insufficient funds` + 三按钮：次 `换张卡` / `Use another card`、次 `联系银行` / `Contact your bank`、次 `联系客服` / `Get help`；插画**不放**（防误读为成功）
6. **支付成功瞬间** — 主按钮变绿 ✓ 0.6s 描边动画 → 跳 `/bookings/[id]/success`
7. Error（API 失败，非卡被拒）— `S7` + 重试

**Interactions**:
- Apple/Google Pay 选中 → 主按钮文案与 logo 变化
- 已绑定卡单选 → 主按钮 enabled
- `+ 使用新卡` → 展开 Stripe Elements iframe
- 主按钮 → 调用 Stripe `confirmPayment` → 等 webhook → 跳 success
- `←` 返回 → 弹二次确认 `离开会取消支付。订单还在，可以稍后从"我的预订"继续。` / `Leave? Payment cancels — booking saved, you can pay later from My Bookings.`

**Edge cases**:
- 失败原因映射 EN→ZH：`insufficient funds` = `余额不足`；`do_not_honor` = `银行拒付`；`expired_card` = `卡已过期`；`incorrect_cvc` = `安全码错误`；其他 = `卡被拒，请换张卡或联系银行` / `Card declined — try another or contact your bank`
- 3DS：iOS Safari 内可能弹 SCA challenge，文案保持本 locale
- AU 区显示 `A$`；CN 区 `¥` 且仅信用卡（Apple/Google Pay 在 CN 区隐藏）；CA 区 `C$`
- 不允许 SilverConnect 端缓存卡号（PCI 合规） — 设计稿不绘制完整卡号字段，只画 Stripe iframe 占位
- 长时间 (>15min) 未提交 → quote 过期 → 弹 modal `订单已过期，请回到上一步重新确认` / `Booking expired — please review again`

**API contract**：
- `POST /api/create-payment-intent` — 创建 Stripe PI
- Stripe webhook `payment_intent.succeeded` — 后端置 booking PAID + status=CONFIRMED
- `GET /api/bookings/[id]` — 轮询确认（也可走 SSE，Sprint 1 用轮询）

**Variants to deliver**：浅 EN + 浅 ZH（移动 + 桌面 + 状态合稿，含失败 + 3DS 状态）。

**Illustrations needed**：成功瞬间动效用按钮内 ✓ 描边；本页面**不**放场景插画（避免误读，UI_DESIGN.md §7.11）。

---

## #14 · `/bookings/[id]/success` · 支付成功 / Payment success

**Goal**：让用户安心 — 支付确认、订单号留存、加日历、回家页。

**Layout (mobile, top→bottom)**:
- **Header §2.1**（无返回，仅 Logo + 国家 + 语言）
- **场景插画 `S5-payment-success`**（200 高，居中；美姐 + 王阿姨握手 + 头顶 ✓ 0.6s 描边一次性绘制）
- **大字标题 H1 32 居中**：`已支付 ✓` / `Paid ✓` （绿色 `--success`）
- **订单号小字 16 `--text-secondary`**：`订单号 #BK-2026-04-08-A1B2` / `Booking #BK-2026-04-08-A1B2`
- **服务卡片**（高 144，`--bg-surface` 圆角 16）：
  - Provider 头像 48 + 名 + 评分
  - 时间：`周三 4/8 14:00–16:00`
  - 地址：`Carlton, VIC 3053`
  - 一行 16：`A$65.34（已含 GST）` / `A$65.34 (incl. GST)`
- **提醒条**（浅蓝底 + ℹ️）：`我们会在 24 小时前与 2 小时前各推送一次提醒` / `We'll remind you 24h and 2h before`
- **三按钮区**（垂直堆叠，每按钮 56 高，间距 12）：
  - 主按钮：`加入日历` / `Add to calendar`（生成 .ics）
  - 次按钮：`查看订单` / `View booking`（→ `/bookings/[id]`）
  - 次按钮：`返回首页` / `Back to home`（→ `/home`）

**Layout (desktop)**：插画放大到 280 高，其余同；按钮变 3 列横排。

**Required content**:
| 元素 | ZH | EN |
|---|---|---|
| 标题 | `已支付 ✓` | `Paid ✓` |
| 订单号 | `订单号 #BK-2026-04-08-A1B2` | `Booking #BK-2026-04-08-A1B2` |
| 含税后缀 | `（已含 GST）` | `(incl. GST)` |
| 提醒条 | `我们会在 24 小时前与 2 小时前各推送一次提醒` | `We'll remind you 24h and 2h before` |
| 主 CTA | `加入日历` | `Add to calendar` |
| 次 CTA 1 | `查看订单` | `View booking` |
| 次 CTA 2 | `返回首页` | `Back to home` |

**States**：
1. Default（浅）
2. **Default（深 — 必出）** — 同布局，背景 `#1E293B`，文字 `#F1F5F9`，绿 ✓ 用 `#86EFAC`，卡片用 `#334155`
3. Loading（webhook 未回来）— 标题先用 `处理中…` / `Processing…` + 旋转图标，主按钮 disabled；webhook 到达后切默认态（不刷新）

**Interactions**:
- `加入日历` → 触发 ICS 文件下载（iOS Safari 直接打开日历 app；Android 触发 intent）
- `查看订单` → `/bookings/[id]`
- `返回首页` → `/home`

**Edge cases**:
- ICS 内容含 Provider 联系方式、地址、24h 前提醒（VALARM）
- 时区：用户 Header 国家决定时区显示（AU = Australia/Sydney 等）；ICS 内含 TZID
- 订单号格式 `BK-YYYY-MM-DD-XXXX`（XXXX 4 位字母数字）
- CN 区 ¥ 金额；AU A$；CA C$；ICS 内金额一致

**API contract**：
- `GET /api/bookings/[id]` — 拉取订单（status=CONFIRMED）
- ICS 生成在前端做（date-fns + 模板字符串）

**Variants to deliver**：浅 EN + 浅 ZH + 深 EN + 深 ZH（移动 + 桌面 + 状态合稿，共 8+ 张）。

**Illustrations needed**：`S5-payment-success` 200px，含 ✓ 0.6s 一次性描边动效。

---

## #15 · `/bookings` · 我的预订列表 / My bookings

**Goal**：让用户找到一个具体订单（即将的、过去的、循环的）继续操作。

**Layout (mobile, top→bottom)**:
- **Header §2.1**
- **页面标题 H1 32**：`我的预订` / `My bookings`
- **三 Tab**（全宽分配，56 高；当前 Tab 主色下划线 2px + 主色字）：
  - `即将进行` / `Upcoming`
  - `历史` / `History`
  - `循环` / `Recurring`
- **Booking 卡列表**（每卡 168 高，圆角 16，间距 12，整卡可点跳详情）：
  - 卡顶左：日期大字 H3 22 `4/8 周三 14:00` / `Wed Apr 8, 2:00 PM`
  - 卡顶右：状态徽章（按 UI_DESIGN.md §1.5 token；如 `已确认` / `Confirmed` 用 `--badge-confirmed-bg/fg`）
  - 卡中：Provider 头像 48 + 名 + 服务：`李 师傅 · 基础清洁 · 2 小时` / `Mr Li · Basic clean · 2 hrs`
  - 卡底左：金额：`A$65.34` （含税不重复写）
  - 卡底右：3 个图标按钮（≥48×48；改约 / 取消 / 联系），并附 sr-only 文字
- **下拉刷新区**（移动端，顶部下拉触发）
- **AIFloatButton §2.3** + **BottomTabBar §2.2**（当前 Tab `预订` 高亮）

**Required content**:
| 元素 | ZH | EN |
|---|---|---|
| 页标题 | `我的预订` | `My bookings` |
| Tabs | `即将进行 / 历史 / 循环` | `Upcoming / History / Recurring` |
| 卡操作 1 | `改约` | `Reschedule` |
| 卡操作 2 | `取消` | `Cancel` |
| 卡操作 3 | `联系 Provider` | `Contact provider` |
| 状态文案 | 见 UI_DESIGN.md §1.5（待处理/已确认/进行中/已完成/已取消/已退款）| Pending / Confirmed / In progress / Completed / Cancelled / Refunded |
| 下拉刷新 | `下拉刷新` / `刷新中…` | `Pull to refresh` / `Refreshing…` |
| 加载更多 | `加载更多…` | `Loading more…` |

**States**：
1. Default — 多张订单卡（含不同状态徽章混排）
2. Loading — 4 张骨架卡
3. **Empty `即将进行`** — 插画 `S3-empty-bookings` 160 + `还没有即将进行的预订` / `No upcoming bookings` + 主按钮 `浏览服务 →` / `Browse services →`
4. **Empty `历史`** — `S3` 160 + `还没有历史预订` / `No past bookings`（无 CTA）
5. **Empty `循环`** — `S9-recurring-booking` 160 + `还没有循环订单` / `No recurring bookings yet` + 次按钮 `如何设置循环？` / `How do I set up recurring? →`
6. Error — `S7` + 重试
7. **下拉刷新中** — 顶部出现 24px 旋转图标 + `刷新中…` / `Refreshing…`

**Interactions**:
- Tab 切换不重新拉数据（按 tab 缓存 5min）
- 整卡点击 → `/bookings/[id]`
- `改约` → 弹 ⊞ RescheduleModal（Sprint 1 占位）
- `取消` → 二次确认 modal（含取消政策提示，按 #16 逻辑）
- `联系 Provider` → 拨打电话或 in-app message（Sprint 1 跳 `tel:`）
- 下拉刷新 → 重拉当前 Tab

**Edge cases**:
- `即将进行` Tab 默认排序：最近的在最上
- `历史` Tab 按完成日期倒序
- `循环` Tab 显示活跃循环 + 已暂停（暂停的灰显标签 `已暂停` / `Paused`）
- 状态徽章在深底（暗模式）下用 §1.5 深底版（半透明）；本屏不出深色，但卡片要预留可切换
- 中文日期 `4/8 周三 14:00`；EN `Wed Apr 8, 2:00 PM`（不要 24h `14:00` 在 EN 里）
- 取消按钮在 `已完成 / 已取消 / 已退款` 状态下隐藏
- 改约按钮在 `进行中 / 待确认完成 / 已完成` 隐藏

**API contract**：
- `GET /api/bookings?tab=upcoming|history|recurring&page=`

**Variants to deliver**：浅 EN + 浅 ZH（移动 + 桌面 + 状态合稿，含 3 个 Empty 子态）。

**Illustrations needed**：Empty 用 `S3-empty-bookings` 与 `S9-recurring-booking`；Error 用 `S7`。

---

## #16 · `/bookings/[id]` · 预订详情 / Booking detail

**Goal**：让用户查看单张订单完整信息，并按当前状态执行下一步动作（支付/改约/取消/确认完成/评价/争议）。

**Layout (mobile, top→bottom)**:
- **Header §2.1**（左 `←` 返回 `/bookings`）
- **状态徽章大字**（H3 22 居中，按状态用 §1.5 token；如 `已确认` 浅蓝底 + 深蓝字）
- **BookingStatusFlow**（水平 5 节点时间线，UI_DESIGN.md §5.2；每节点下时间戳；当前节点放大 1.4 倍主色填充；已过 `--success`；未到 `#CBD5E1`；取消/退款不嵌入流程，单独红条置顶）：
  - `待支付 → 已确认 → 进行中 → 待确认完成 → 已完成` / `Awaiting payment → Confirmed → In progress → Awaiting confirmation → Completed`
- **服务卡**（圆角 16，`--bg-surface`，与 #14 卡同样式）
- **地址卡**（同样式 + `打开地图 →` / `Open in map →` 次按钮）
- **价格明细折叠表**（默认展开）
- **备注卡**（如有）：`你给 Provider 的留言：` / `Your note to provider:` + 内容
- **操作区**（按状态条件渲染；按钮全宽 56 高）：
  - `待支付`：主 `去支付` / `Pay now` + 次 `取消` / `Cancel`
  - `已确认`：次 `改约` / `Reschedule` + 次 `取消` / `Cancel` + 次 `联系 Provider` / `Contact provider`
  - `进行中`：次 `联系 Provider` + danger 链接 `报告安全问题` / `Report a safety issue`（红字）
  - `待确认完成`：主 `确认完成并评价` / `Confirm & review`
  - `已完成`：次 `再次预订` / `Book again` + 次 `查看评价` / `View review`
  - `已取消 / 已退款`：次 `再次预订`
- **底部弱按钮**：`我有问题 →` / `I have an issue →`（跳争议提交 `/bookings/[id]/dispute`，Sprint 2 实装；Sprint 1 为占位）

**Required content**:
| 元素 | ZH | EN |
|---|---|---|
| 状态文案 | 见 UI_DESIGN.md §5.2 节点 | Same |
| 服务卡标题 | `服务` | `Service` |
| 地址卡标题 | `地址` | `Address` |
| 地图按钮 | `打开地图 →` | `Open in map →` |
| 价格明细标题 | `价格明细` | `Price details` |
| 备注 | `你给 Provider 的留言：` | `Your note to provider:` |
| 操作按钮 | 见上 | 见上 |
| 底部链接 | `我有问题 →` | `I have an issue →` |

**States**：
1. **待支付** — 顶部黄色提示条 `订单未支付，请尽快支付` / `Awaiting payment`；操作区只显 `去支付` + `取消`
2. **已确认** — 标准态；如距开始 < 24h 顶部加灰条 `≤24h 取消将扣 30% 取消费` / `Cancelling within 24h incurs a 30% fee`
3. **进行中** — 顶部蓝条 `Provider 已到达 / 服务进行中` / `Provider has arrived / Service in progress`；状态时间线节点 ③ 高亮
4. **待确认完成** — 顶部绿底条 `Provider 已完成，请确认并评价（48h 后自动确认）` / `Service finished — please confirm & review (auto-confirms in 48h)`；主操作 `确认完成并评价` 突出
5. **已完成** — 流程线全绿；多一张评价卡显示用户评价（如已评）
6. **已取消_全退** — 顶部红色横幅 `订单已取消 — 全额退款 A$65.34` / `Cancelled — full refund A$65.34`；流程线灰显
7. **已取消_部分退** — `订单已取消 — 退款 A$45.74（扣 30% 取消费）` / `Cancelled — refund A$45.74 (30% fee)`
8. **已退款** — `订单已退款 A$65.34（争议结果：全额退款）` / `Refunded A$65.34 (Dispute resolved: full refund)`
9. Loading — 整页骨架
10. Error — `S7` + 重试

**Interactions**:
- `去支付` → `/pay/[bookingId]`
- `改约` → 弹 ⊞ RescheduleModal
- `取消` → 二次确认 modal，文案随距开始时间动态：> 24h 显示 `全额退款` / `Full refund`；≤ 24h 显示 `扣 30% (A$19.60) 后退款` / `Refund minus 30% fee (A$19.60)`；提交后调 `DELETE /api/bookings/[id]`
- `联系 Provider` → `tel:` + `mailto:` 或 in-app（Sprint 1 = `tel:`）
- `报告安全问题` → `/safety/report`（Sprint 2 实装）
- `确认完成并评价` → `/bookings/[id]/feedback`（Sprint 2 实装；Sprint 1 占位 toast `Sprint 2 上线`）
- `再次预订` → `/bookings/new?provider=[id]&service=[serviceId]`
- `打开地图` → 唤起系统地图 app（iOS `maps://`，Android `geo:`）
- `我有问题` → `/bookings/[id]/dispute`（Sprint 2）

**Edge cases**:
- 状态机映射见 UI_DESIGN.md §5.2 + UI_PAGES.md §7
- 取消按钮在 `进行中 / 待确认完成 / 已完成 / 已取消 / 已退款` 隐藏
- 改约按钮在 `进行中 / 待确认完成 / 已完成 / 已取消 / 已退款` 隐藏
- 时间显示同 #15 的 ZH/EN 规则
- 用户切语言 → 状态徽章文案与按钮文案 hot-swap
- 价格明细永远展示完整（包含 GST/VAT/HST 税行）
- 备注超 200 字 折叠 `查看更多 →` / `Show more →`

**API contract**：
- `GET /api/bookings/[id]`
- `PATCH /api/bookings/[id]` — 改约
- `DELETE /api/bookings/[id]` — 取消（后端依据 24h 政策决定退款金额；FR-02 后端实装在 P2，前端按返回值显示）

**Variants to deliver**：浅 EN + 浅 ZH（移动 + 桌面 + 状态合稿，覆盖 8 种状态）。

**Illustrations needed**：本屏无场景插画（信息密度高）；状态时间线用线条 + 主色圆点；Error `S7`。

---

## #28 · `/notifications` · 通知中心 / Notifications

**Goal**：让用户看到所有未读通知（预订/支付/系统），并跳到对应详情。

**Layout (mobile, top→bottom)**:
- **Header §2.1**
- **页面标题 H1 32 + 右侧齿轮按钮**（48×48，跳通知设置 `/profile/notifications-settings`，Sprint 2 实装）：`通知` / `Notifications`
- **顶部 `全部标为已读` 文字按钮**（次按钮，56 高）：`全部标为已读` / `Mark all as read`
- **4 Tab**（全宽分配，48 高）：
  - `全部` `预订` `支付` `系统` / `All` `Bookings` `Payment` `System`
  - 当前 Tab 下划线主色 + 加粗
- **通知列表**（每条 80 高，圆角 12 卡，整条可点）：
  - 左：圆图标 40（按类型用 §1.5 token 颜色：预订=蓝、支付=绿、系统=灰）
  - 中：标题 18 + 副标 14 `--text-secondary`（1 行截断）
  - 右上：相对时间 14（`5 分钟前` / `5m ago`）
  - 右下：未读小红点 8px（`--danger`）
- **AIFloatButton §2.3** + **BottomTabBar §2.2**（当前 Tab `消息` 高亮）

**Required content (示例条目)**:
| 类型 | ZH 标题 | ZH 副标 | EN 标题 | EN 副标 |
|---|---|---|---|---|
| 预订 | `预订已确认 ✓` | `周三 4/8 14:00 与李师傅` | `Booking confirmed ✓` | `Wed Apr 8, 2:00 PM with Mr Li` |
| 预订提醒 | `明天 14:00 有清洁服务` | `提前 24 小时提醒` | `Cleaning tomorrow 2 PM` | `24h reminder` |
| 支付 | `支付成功 A$65.34` | `订单 #BK-2026-04-08-A1B2` | `Payment successful A$65.34` | `Booking #BK-2026-04-08-A1B2` |
| 支付失败 | `支付失败 — 卡被拒` | `换张卡再试 →` | `Payment failed — card declined` | `Try another card →` |
| 系统 | `欢迎加入 SilverConnect` | `开始第一次预订 →` | `Welcome to SilverConnect` | `Start your first booking →` |

| 元素 | ZH | EN |
|---|---|---|
| 页标题 | `通知` | `Notifications` |
| 全部已读 | `全部标为已读` | `Mark all as read` |
| Tabs | `全部 / 预订 / 支付 / 系统` | `All / Bookings / Payment / System` |
| 相对时间 | `刚刚 / 5 分钟前 / 1 小时前 / 昨天 / 3 天前 / 4/8` | `Just now / 5m ago / 1h ago / Yesterday / 3d ago / Apr 8` |

**States**：
1. Default（多条混合）
2. Loading — 6 条骨架
3. **Empty `全部`** — 插画 `S3` 改用 `S4-empty-chat`（小伴挥手）160 + `没有通知` / `No notifications` + 副标 `好消息会在这里出现` / `Good news will show up here`
4. **Empty `预订/支付/系统`** — 同上但副标按 Tab：`没有预订通知` / `No booking notifications`
5. **筛选 Tab 后无内容** — 同 Empty 但带 `查看全部 →` / `View all →` 链接
6. **全部已读后** — 顶部 `全部标为已读` 按钮 disabled
7. Error — `S7`

**Interactions**:
- 整条点击 → 跳对应详情：预订 `→ /bookings/[id]`；支付 `→ /bookings/[id]`（同一）；系统 `→ /home` 或对应 link
- 点击后立即标已读（红点消失，乐观更新）
- 长按一条 → 弹 `删除` / `Delete` 操作（Sprint 1 占位）
- `全部标为已读` → 调 API + 列表所有红点消失
- 齿轮 → `/profile/notifications-settings`（Sprint 2 实装）

**Edge cases**:
- SSE 推送新通知（Sprint 1 用轮询 30s，前端只管 UI 不区分实现）
- 通知到达时顶部短暂闪 `--brand-primary` 0.3s 提示有新消息
- 已读未读混排时未读优先（每 Tab 内）
- 时间格式：< 1 分钟 = `刚刚` / `Just now`；< 1 小时 = `Xm ago`；< 24h = `Xh ago`；昨天 = `Yesterday`；< 7d = `Xd ago`；> 7d = 月日 `Apr 8` / `4/8`
- 未读数量在 BottomTabBar 的 `消息` Tab 上以红色 badge 显示（Sprint 1 仅占位）

**API contract**：
- `GET /api/notifications?tab=&page=`
- `POST /api/notifications/mark-all-read`
- 实时：SSE on `/api/notifications/stream`（Sprint 1 用轮询代替）

**Variants to deliver**：浅 EN + 浅 ZH（移动 + 桌面 + 状态合稿）。

**Illustrations needed**：Empty 用 `S4-empty-chat`；Error `S7`。

---

## #29 · `/chat` · AI 聊天 + 紧急模式 / AI chat + Emergency mode

**Goal**：让用户与 AI 助手对话（改约、查询、客服），并在检测到紧急关键词时立即弹紧急联系卡。

**Layout (mobile, top→bottom)**:
- **Header §2.1**（左 `←` 返回上一页；右上小按钮 `转人工` / `Talk to a human`）
- **会话头**（高 64，浅蓝底 `--bg-surface`）：左 32×32 `C9-ai-companion` 头像 + 文字 `AI 助手 · 在线` / `AI assistant · online`
- **消息区**（自由滚动）：
  - AI 气泡（左对齐，最大 75% 宽，圆角 16，背景 `--bg-surface`，前置 48×48 `C9` 头像每条都有；眨眼每 4s + 说话时嘴部波动）
  - 用户气泡（右对齐，最大 75%，主色填充 + 白字，圆角 16）
  - AI 推荐气泡组：横滑小按钮 `改约` `取消` `查询价格` `找人工` / `Reschedule` `Cancel` `Check price` `Get human`
  - 流式输出：AI 文本逐字打印（200ms cursor 闪烁；`prefers-reduced-motion` 关闭则一次性显示）
- **输入区**（高 80，吸底；输入框 56 + 麦克风 48 + 发送 48）：
  - placeholder `想问什么？` / `Ask anything…`
  - 发送按钮主色填充
- **AIFloatButton §2.3 不显示**（已在聊天页内）
- **BottomTabBar §2.2**（当前 Tab `消息` 高亮）

**Layout (desktop)**：左侧 320 宽会话历史列表（已有会话 + `新对话`）+ 右侧主区（同移动端但更宽）。

**Required content**:
| 元素 | ZH | EN |
|---|---|---|
| 会话头 | `AI 助手 · 在线` | `AI assistant · online` |
| 转人工 | `转人工` | `Talk to a human` |
| 输入 placeholder | `想问什么？` | `Ask anything…` |
| AI 首句 | `您好王阿姨，需要什么帮助？` | `Hi Margaret, how can I help?` |
| AI 推荐气泡 | `改约 / 取消 / 查询价格 / 找人工` | `Reschedule / Cancel / Check price / Get human` |
| 麦克风按钮 sr-only | `语音输入` | `Voice input` |
| 发送按钮 sr-only | `发送` | `Send` |

### 紧急模式（Emergency overlay）— 必出深色变体

> 触发条件：用户输入或 AI 上下文检测到以下关键词。检测在客户端 + 服务端双重做，优先客户端立即弹。

**关键词清单**（按 UI_DESIGN.md §7.4）：
- ZH：`救命` `急救` `胸痛` `摔倒` `晕倒` `喘不上气` `出血`
- EN：`help` `can't breathe` `chest pain` `fell` `bleeding` `emergency`

**Emergency Layout (全屏覆盖)**:
- **背景**：`#DC2626`（`--danger`）红底纯色（占满 viewport，覆盖 Header / TabBar / AIFloatButton）
- **顶部插画 `S6-emergency-care`**（高 200，居中，Anna 微笑半身；线条改为白）
- **大字标题 H1 32**（白字）：`需要紧急帮助？` / `Need emergency help?`
- **副标 18**（白 80% 透明）：根据 Header 当前国家：
  - AU：`澳洲紧急服务 — 综合（医疗/火警/警察）` / `Australian Emergency — combined`
  - CN：`中国 120 医疗急救` / `China 120 Medical Emergency` + 第二行小字 14：`火警 119 / 报警 110`
  - CA：`加拿大 911 综合紧急` / `Canada 911 Combined Emergency`
- **大号一键拨打按钮**（120 高，圆角 16，白底 + `--danger` 红字 + 大号码 H1 48）：
  - AU：`📞 立即拨打 000` / `📞 Call 000 now`
  - CN：`📞 立即拨打 120` / `📞 Call 120 now`
  - CA：`📞 立即拨打 911` / `📞 Call 911 now`
- **次按钮**（全宽，56 高，半透明白底 + 白字）：`通知紧急联系人` / `Notify my emergency contact`
- **关闭按钮**（小，右上，48×48；长按 2s + 二次确认才关闭，防误触；进度环显示长按进度）：`关闭` / `Close`

**Required content (Emergency)**:
| 国家 | 主拨打号 ZH | 主拨打号 EN | 副号 |
|---|---|---|---|
| AU | `立即拨打 000` | `Call 000 now` | — |
| CN | `立即拨打 120` | `Call 120 now` | `火警 119 / 报警 110` / `Fire 119 / Police 110` |
| CA | `立即拨打 911` | `Call 911 now` | — |

**States to render**：
1. **AI 聊天 Default** — 带 5-6 条混合气泡（AI/用户）+ 推荐气泡组
2. **AI 聊天 Empty (首次打开)** — 居中 `S4-empty-chat` 200 + 大字 `我可以帮您改约、查询价格…` / `I can help reschedule, check prices…` + 推荐气泡组
3. **AI 流式输出中** — 最新 AI 气泡末端 cursor 闪烁
4. **AI 等待响应** — AI 气泡显示三个跳点动画（`...` 0.5s loop）
5. **转人工已发起** — 顶部条 `客服会在 5 分钟内加入对话` / `An agent will join within 5 min`
6. **紧急覆盖 Default**（必出，浅+深 各 EN+ZH）— 全屏红 + 白文 + 拨打按钮
7. **紧急覆盖 长按关闭进度** — 关闭按钮外周 2px 描边圆环 0→100% 进度
8. Loading（首次会话拉历史）— 消息区骨架 4 条
9. Error（AI 服务挂）— 顶部红条 `AI 暂时不可用，您可以转人工` / `AI is temporarily unavailable — try a human agent`

**Interactions**:
- 输入回车或点击发送 → 用户气泡立即出现 + 调流式 API
- 推荐气泡点击 = 直接发该意图（如点 `改约` → 用户气泡 `我想改约` + AI 处理）
- 麦克风 → 浏览器原生 `SpeechRecognition`（iOS Safari 不支持时按钮 disabled + tooltip）
- 紧急关键词触发 → 立即弹紧急覆盖 + 振动 100ms（vibrate API）+ 拨打按钮焦点
- 紧急覆盖拨打按钮 → `tel:000` / `tel:120` / `tel:911`（按国家）
- `通知紧急联系人` → 调 API 发送（Sprint 1 占位 toast `已发送给 Anna 18888888888`）
- 关闭紧急覆盖：长按 2s + 释放后弹二次确认 `确定要关闭紧急联系卡吗？` / `Close emergency card?`
- 转人工 → 调 API 转工单 + 顶部条提示

**Edge cases**:
- 紧急关键词检测在用户输入 enter 前 + 输入框 onChange 都做（提前预警可选；以提交为准）
- 紧急覆盖一旦弹出，**不允许 ESC、点击外部、滑动**关闭，仅长按 2s + 二次确认
- 用户在紧急覆盖时切换国家 → 立即重新渲染对应号码
- AI 输出不允许包含 SilverConnect 翻译（中文里是 `SilverConnect` 不是"银联"）— 后端注入硬约束 system prompt，前端不再过滤
- 浏览器拒绝振动权限时静默忽略
- 消息区滚动到底部跟随；用户主动滚动到上方时停止跟随，新消息时显示 `↓ 新消息` / `↓ New message` 浮按
- 输入超 1000 字符时禁用发送

**API contract**：
- `POST /api/ai/chat`（流式 SSE）
- `POST /api/safety/notify-contact` — 通知紧急联系人
- `POST /api/ai/escalate` — 转人工
- 关键词列表：硬编码在前端（与后端一致）；后端兜底再判一次
- 拨打号码硬编码：见上表

**Variants to deliver**：浅 EN + 浅 ZH + 深 EN + 深 ZH（移动 + 桌面 + 状态合稿，含 Emergency 状态在浅深 EN+ZH 各出一稿）。共 4 主稿 + 4 紧急 + 桌面同 = ~12 张。

**Illustrations needed**：
- AI 头像 `C9-ai-companion`（每条 AI 气泡前置 48px；头像有 4s 眨眼 + 说话嘴部微动）
- Empty 状态 `S4-empty-chat` 200px
- 紧急覆盖顶部 `S6-emergency-care` 200px（线条改白）
- AI 等待响应 `…` 跳点动画

---

## 附录 A · 全 14 屏共用元素清单（Claude Design 提示词复用）

- **Header §2.1**：固定高 80，吸顶；Logo 永远 `SilverConnect`；右侧国家 chip 88 + 语言 chip 88 + （未登录显示 Sign in 主按钮 / 已登录显示头像 48）
- **BottomTabBar §2.2**（仅移动 < 640px）：高 64；图标 32；5 项 `首页 / 服务 / 预订 / 消息 / 我的`
- **AIFloatButton §2.3**（除 #29 外每屏）：右下，64×64 圆，主色填充 + 白字 `问一下 / Ask AI`
- **EmergencyOverlay**（全屏覆盖；本 Sprint 仅 #29 触发；P2 全局挂载到任意客户页）
- **状态徽章**（按 UI_DESIGN.md §1.5 token 6 种）
- **价格行规则**：永远 `[符号][金额]/[单位]（含[税名]）`；AU GST、CN VAT、CA HST
- **进度条** in 预订向导：4 段，圆 + 数字 + 连线，当前主色填充

---

## 附录 B · 状态机映射（用于 #16 详情页按钮显示与 BookingStatusFlow）

| 后端 status / payment_status | UI_DESIGN.md 节点 | 中文显示 | 英文显示 |
|---|---|---|---|
| PENDING / UNPAID | 待支付 | `待支付` | `Awaiting payment` |
| PENDING / PAID | 已确认（即将变 CONFIRMED） | `已确认` | `Confirmed` |
| CONFIRMED / PAID | 已确认 | `已确认` | `Confirmed` |
| IN_PROGRESS / PAID | 进行中 | `进行中` | `In progress` |
| AWAITING_CONFIRMATION / PAID | 待确认完成 | `待确认完成` | `Awaiting confirmation` |
| COMPLETED / PAID | 已完成 | `已完成` | `Completed` |
| CANCELLED_BY_CUSTOMER (full_refund) | 取消_全退（独立红条，不嵌入流程） | `已取消 — 全额退款` | `Cancelled — full refund` |
| CANCELLED_BY_CUSTOMER (partial_refund) | 取消_部分退 | `已取消 — 部分退款` | `Cancelled — partial refund` |
| CANCELLED_BY_PROVIDER | 取消_全退 | `Provider 取消 — 全额退款` | `Provider cancelled — full refund` |
| DISPUTED | 争议中（红条） | `争议中` | `In dispute` |
| REFUNDED | 已退款（红条） | `已退款` | `Refunded` |

---

## 附录 C · 出稿交付包

每屏交付一个 `.fig` / `.pen` 文件，含：
- 主稿（按"Variants to deliver"列出的所有变体）
- 状态合稿（同画板，default/loading/empty/error/特殊态横向拼贴，便于评审）
- **像素栅格** 4px 对齐
- **图层命名** 中英双语（如 `Hero / Hero 区` `Card—Provider / 卡—Provider`）
- **导出预设** 按 UI_DESIGN.md 标注（图标 24/32/48 PNG@1x/2x/3x，插画 SVG 单文件）
- 每个变体在画板左上角标注 **`#NN-screen-name | locale | theme`**（如 `#7-home | en | light`）

---

## 附录 D · 评审协议

> 引用自 [docs/DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) §9：

```
Claude Design 出稿（浅 EN + 浅 ZH）→ 工程师对照 token 实现 →
设计师评审差异（颜色/间距/插画/动效）→ 工程修复 → Claude Design 重出动效片段 →
QA：a11y + 双语 + 对比度脚本扫描 → 合并 PR
```

每屏并行节奏：**设计 1d → 实现 1-2d → 评审 0.5d → 修复 0.5d ≈ 3-4 天 / 屏**。
14 屏单人 ~3 周（与 P1 W2-W4 时长吻合）。

---

**End of brief.** 出稿前再确认一遍：
1. 没有双语并排
2. `SilverConnect` 不译
3. A$ / ¥ / C$ 语义对
4. 紧急号码 AU 000 / CN 120 / CA 911
5. 浅色为主稿，仅 #14 + #29 出深色
