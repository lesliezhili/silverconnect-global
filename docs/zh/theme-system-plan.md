# 主题系统方案（light / dark 双向支持 + 用户可切换）

> 状态：待评审
> 起因：募资页 `/donate` 被强制锁成 light，其它所有页面跟随系统 `prefers-color-scheme`（用户 OS 是 dark，所以看到的全是 dark）。结果是站内主题不一致，且用户**无法手动切换**——完全被 OS 绑死。
> 目标：站内有一个 light / dark / 跟随系统 三态切换，所有页面（含 donate）都遵守它；同时确认每个页面在两种主题下都不破。

---

## 1. 现状盘点

### 1.1 主题机制（[app/globals.css](../../app/globals.css) + [tailwind.config.ts](../../tailwind.config.ts)）
- **light 是 `:root` 默认值**（约 40 个 CSS 变量）
- dark 通过两条路径生效：
  - `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` —— 自动跟随 OS
  - `:root[data-theme="dark"] { ... }` —— 显式强制 dark
- `[data-theme="light"]`（任意节点，2026-05-11 为 donate 加的）—— 强制 light 子树
- Tailwind `darkMode: ["class", '[data-theme="dark"]']` —— `dark:` 工具类只在 `data-theme=dark` 下生效（**注意：OS 自动 dark 时 `dark:` 工具类不生效**，只有 CSS 变量切了）
- `<html>` 在 [app/layout.tsx L44](../../app/layout.tsx#L44) 渲染，**无 `suppressHydrationWarning`**

### 1.2 关键事实
- **`next-themes@0.4.4` 已经在 [package.json](../../package.json) 里**，但从未使用 —— 这是标准解法，不用再装
- **`@radix-ui/react-dropdown-menu` 已装** —— ThemeToggle 的下拉菜单直接用它
- **没有任何主题切换 UI**，没有 cookie / localStorage 存主题
- 全站约 75 个页面（admin 18 + customer 28 + provider 14 + public 12 + 杂项）
- donate 页是唯一强制 light 的（[app/[locale]/(public)/donate/layout.tsx](../../app/%5Blocale%5D/%28public%29/donate/layout.tsx)）

### 1.3 各 shell / 页面的"顶栏"盘点（决定切换入口要放几处）
| 区域 | 顶栏组件 | 渲染处 | 备注 |
|---|---|---|---|
| (customer) 全部 | [Header.tsx](../../components/layout/Header.tsx) | 各 customer page.tsx 自己渲染 Header | 右侧已有 donate / country / language / profile-or-login —— **已经很挤，移动端空间紧，所以 ThemeToggle 用单图标按钮+下拉，不用横排 chip** |
| (public) donate / help | [Header.tsx](../../components/layout/Header.tsx) | 各 page.tsx 自己渲染 | 同上 |
| (public) auth（login/register/forgot/reset/verify） | **无** | (public)/layout.tsx 是裸 `<>{children}</>` | 没有任何顶栏可挂入口 |
| oops / 404 catch-all | **无** | [app/[locale]/oops](../../app/%5Blocale%5D/oops) / [app/[locale]/[...rest]](../../app/%5Blocale%5D/%5B...rest%5D) | 不在 (public) route group 下，阶段 3 检查 |
| admin 登录页 | **无** | [admin/login/page.tsx](../../app/%5Blocale%5D/%28admin%29/admin/login/page.tsx) 自己渲染居中登录卡 | 不走 AdminShell，需要固定角落入口 |
| admin 登录后页面 | [AdminShell.tsx](../../components/layout/AdminShell.tsx) 自己的 `<header>`（L56-88） | AdminShell 包裹 | 独立 top bar，不复用 Header |
| provider 全部 | [Header.tsx](../../components/layout/Header.tsx) | 各 provider page.tsx 自己渲染（`import { Header } from "@/components/layout/Header"`，已核实 [provider/page.tsx L5](../../app/%5Blocale%5D/%28provider%29/provider/page.tsx#L5)） | **复用 Header**，没有独立的 ProviderHeader |
| BottomTabBar（移动 customer / provider） | — | — | tab 已满 5 个，不放主题切换 |

→ 结论：切换入口只需进 **Header（覆盖 customer + provider + public donate/help）+ AdminShell（覆盖 admin 登录后页面）两处**，再给 **public auth 5 页 + admin login** 加一个固定角落入口（见 §3 阶段 1 step 7）。404/oops 作为阶段 3 的检查项。

### 1.4 ⚠️ Tailwind `dark:` 工具类的隐患
现在 `darkMode` 只认 `[data-theme="dark"]`。当用户 OS=dark 但 `<html>` 没有 `data-theme` 时：
- CSS 变量切到了 dark 值（`@media` 那条）→ `bg-bg-base` 等 token-based 类**会**变暗 ✓
- 但 `dark:text-white` 这种**字面 `dark:` 工具类不会触发** ✗

也就是说现在 OS-dark 下"看起来是 dark"是靠 CSS 变量，不是靠 `dark:` 类。如果代码里有大量 `dark:xxx` 字面类，它们在 OS-dark 下其实没生效——这是个隐藏的不一致。**接入 next-themes 后 `<html data-theme="dark">` 会稳定存在，因此现有 `dark:` 类会在用户/系统 dark 下稳定生效，可能暴露出之前没显现的视觉问题**，需要专门 audit。

### 1.5 donate 的硬编码 hex 颜色（不会自适应主题）
| 文件 | 硬编码内容 |
|---|---|
| [Stories.tsx](../../components/donate/Stories.tsx) | 3 个故事卡的头像底色/字色、6 个标签的 bg/fg（粉/绿/紫等浅色调） |
| [ImpactStats.tsx](../../components/donate/ImpactStats.tsx) | 4 个图标 tile 的 bg/fg（浅蓝/浅黄/浅绿/浅紫） |
| [AllocationDonut.tsx](../../components/donate/AllocationDonut.tsx) | donut 5 段颜色、白色圆心 `fill="#fff"`、深色文字 `fill="#0F172A"`、3 个 Block 图标 bg/fg |
| [ProgressBar.tsx](../../components/donate/ProgressBar.tsx) | 渐变里的 `#3B82F6` |
| [donate/page.tsx](../../app/%5Blocale%5D/%28public%29/donate/page.tsx) | Hero 的 radial-gradient（用了 `rgba(24,88,196,0.10)` + `var(--bg-surface)`） |

这些在 light 下没问题；切到 dark 会出现"浅色 tile + 深色背景"的违和，donut 白色圆心会很扎眼。

---

## 2. 方案对比

### 方案 A（推荐）：next-themes 全局切换 + donate 跟随
- 用 `next-themes` 包一个 ThemeProvider（attribute=`data-theme`，使用默认 `storageKey="theme"` 写 localStorage）
- 一个 lucide 图标按钮 + 下拉菜单的 ThemeToggle，接进 **Header + AdminShell 两处** + public auth / admin login 的固定角落（见 §3 阶段 1）
- `<html>` 加 `suppressHydrationWarning`（next-themes 在客户端注入 `data-theme`，避免 hydration mismatch）
- **去掉 donate 的强制 light** → 它跟全站一样听切换
- 修 donate 的硬编码 hex：能换 token 的换 token；纯装饰色（故事头像/标签）提取成语义变量给 light/dark 各一套；donut 圆心 `#fff` → `var(--bg-base)`、文字 `#0F172A` → `var(--text-primary)`
- 全站扫硬编码 hex / inline style，audit 抽样页在 light + dark 两种模式下的渲染（见 §3 阶段 3）

优点：用户有控制权、全站一致、用的是社区标准库
代价：阶段 3 的 audit 范围不可控（抽样 + 自动化辅助压缩）；可能要修一批硬编码色值

### 方案 B：donate 也跟随 OS（去掉强制 light）+ 只修 donate 的 dark
- 去掉 `<div data-theme="light">`，donate 跟 `prefers-color-scheme` 走
- 只修 donate 的硬编码 hex（给 dark 变体）
- 不加切换 UI、不引入 ThemeProvider
- 用户依然被 OS 绑死，只是 donate 不再是异类

优点：改动最小
代价：没解决"用户无法手动切换"这个根本诉求；其它页面的潜在 `dark:` 类问题不碰

### 方案 C：donate 保持强制 light，其它不动
- donate 作为"营销落地页"永远 light（业界常见做法）
- 只确认其它页面在 OS-light 下不破
- 不写代码（或只补文档说明这个决策）

优点：零改动
代价：完全不满足用户"做一个 dark / 做 light 版"的诉求

---

## 3. 推荐：方案 A，分 4 个阶段实施

> ⚠️ **阶段 1 不能单独 ship**——它把切换器上线了，但 donate 的强制 light（[donate/layout.tsx L11](../../app/%5Blocale%5D/%28public%29/donate/layout.tsx#L11) 的 `<div data-theme="light">`）要到阶段 2 才删。如果只发阶段 1，用户切到 dark 后 donate 仍是 light，正好违背文档目标。因此**阶段 1 + 阶段 2 必须一起发**（"切换管道 + donate 解锁"是一个最小可发布单元）。阶段 3（全站 audit）可以后续迭代。

### 阶段 1 — ThemeProvider + 切换 UI（核心管道）
1. 新建 `app/providers.tsx`（`"use client"`）：导出一个组件，里面 `import { ThemeProvider } from "next-themes"` 然后 `<ThemeProvider attribute="data-theme" storageKey="theme" defaultTheme="system" enableSystem disableTransitionOnChange>{children}</ThemeProvider>`
   - ThemeProvider 是 client component，server layout 不能直接 `"use client"`，所以必须经这个 wrapper
2. `app/layout.tsx`：
   - `<html lang="en" suppressHydrationWarning>`（next-themes hydration 前在 client 注入 `data-theme`，没这个会 hydration warning）
   - `<body>` 内最外层包 `<Providers>{children}</Providers>`（ThemeProvider 操作的是 `<html>` 属性，自身放在 body 内即可）
3. `tailwind.config.ts`：`darkMode` 当前是 `["class", '[data-theme="dark"]']`——next-themes 设 `attribute="data-theme"` 时会在 `<html>` 上写 `data-theme="dark"` / `"light"`，正好命中这个选择器，`dark:` 工具类会按 `data-theme` 生效（正是我们要的）。**保持不变**
4. **next-themes 的 system 行为（已从 [node_modules/next-themes/dist] 源码确认，这里只做 sanity check 不是高不确定性分支）**：
   - 确认行为：next-themes 在 `<head>` 注入一段**同步执行的防闪 script**，首屏 paint 前读 localStorage / 系统偏好；`theme === "system"` 时它解析 `prefers-color-scheme` 后把 `<html>` 的 `data-theme` **直接写成 `"dark"` 或 `"light"`（resolved 值，不是 `"system"`）**。所以 Tailwind `dark:` 类（gated on `[data-theme="dark"]`）和 CSS 变量始终一致 ✓
   - sanity check：起 dev server，OS=dark，不手动切，看 `document.documentElement.getAttribute("data-theme")` 应为 `"dark"`（顺手确认一下，但不预期会失败）
   - 另：next-themes 默认 `enableColorScheme=true`，会在 `<html>` 写 inline `style.color-scheme: dark|light`，让浏览器 UA 控件（input/scrollbar 等）跟主题。**保留这个默认**
5. `app/globals.css`（按 step 4 确认的 next-themes 行为）：
   - `:root[data-theme="dark"]` 块**保留** —— next-themes 写 `<html data-theme="dark">` 时命中（`:root` 就是 `<html>` ✓）。**补一条 `color-scheme: dark;`** 进这个块（当前只有 `[data-theme="light"]` 块有 `color-scheme: light`，dark 块没有；JS 路径下 next-themes 的 inline style 会覆盖，但 JS-fail fallback 下没这条会让表单控件按 light UA 样式渲染）
   - `[data-theme="light"]` 块**保留**（已有 `color-scheme: light`）—— next-themes 写 `data-theme="light"` 时命中。⚠️ 这个选择器是裸的（不是 `:root[data-theme=light]`），意味着**任何子树都能用 `data-theme="light"` 强制锁 light**——这是 donate 当前那个 hack 的依赖（阶段 2 会删）。**主题系统上线后规定：业务页面禁止再用局部 `data-theme="light"` / `"dark"` 锁主题**；这个 CSS 块只作为"受控例外"保留（未来若有真的需要永远 light 的营销页，且经 review 批准）。阶段 3 扫描里加一条 `rg 'data-theme=' app components`，确认没有新增的私自锁主题
   - `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }` —— next-themes 的防闪 script 在首屏 paint 前就设好 `data-theme`，所以这条 `@media` **理论上已冗余**。**保留它当 defense-in-depth**（万一 JS 被禁 / script 失败）；这条里也**补 `color-scheme: dark;`**，保证 JS-fail 时表单控件也是暗的。但要清楚它只能修 CSS 变量 + color-scheme、修不了 `dark:` 类——所以**不依赖它做任何 `dark:` 相关的视觉**
6. 新增 `components/layout/ThemeToggle.tsx`（client）：
   - **不是三态 chip**——是一个**单图标按钮 + 下拉菜单**（用项目已有的 `@radix-ui/react-dropdown-menu`）。按钮本身只显示一个 lucide 图标（当前主题：`Sun` / `Moon` / `Monitor`），点开后菜单里 3 项可选
   - 图标用 lucide（`Sun` / `Moon` / `Monitor`），**不用 emoji**——跟项目现有操作图标（全是 lucide）和 UI 规范一致
   - 桌面 / 移动都只显示图标（Header 右侧已经很挤，见 §1.5），靠 `aria-label` + 菜单项文本承载文案
   - `mounted` flag 避免 SSR 读 `theme` 报 hydration mismatch（next-themes 标准写法）
   - 调 `next-themes` 的 `useTheme()` 的 `setTheme`
7. **切换入口落点（共 3 处，覆盖全部页面）**：
   - [Header.tsx](../../components/layout/Header.tsx) 右侧 —— 覆盖 **(customer) 全部 + (provider) 全部 + (public) donate/help**（这些页面都自己渲染 Header）
   - [AdminShell.tsx](../../components/layout/AdminShell.tsx) 的 top bar（L56-88）—— 覆盖 admin 登录后的 17 个页面；`/admin/login` 不走 AdminShell，见下一条
   - **public auth 5 页 + admin login**（public: login / register / forgot / reset / verify；admin: `/admin/login`）—— 这些页面不渲染 Header / AdminShell（已核实 admin/login 是独立居中登录卡，不走 AdminShell）。新建 `components/layout/PublicThemeCorner.tsx`（`fixed top-4 right-4` 的小 ThemeToggle），**新建** `app/[locale]/(public)/auth/layout.tsx`（当前不存在）渲染它来覆盖 5 个 auth 页；admin login 单页 page.tsx 里直接渲染同一个 `PublicThemeCorner`
   - PublicThemeCorner 的移动端验收：public auth 5 页 + admin login 都要截 mobile light/dark 图，确认右上角按钮不遮挡标题、返回链接、表单字段或错误提示；如有冲突，auth layout / admin login 页面给内容加 `pt-16` 或把按钮移到安全区内
   - 404/oops：这俩可能不在 `[locale]` 路由树下、也没有 layout 覆盖 —— **不在阶段 1 处理**，作为阶段 3 的一个检查项（确认它们在两个主题下不破；要不要加入口看届时它们的路由结构）
8. i18n：`theme` namespace（`light` / `dark` / `system` 三个菜单项标签 + `toggle` aria-label），5 个 locale

验收：Header / AdminShell 都有主题图标按钮，public auth + admin login 右上角有 PublicThemeCorner → 点开菜单选 light/dark/system → `<html data-theme>` 变化 + `style.color-scheme` 变化 → 页面立即换主题，刷新后保持（localStorage `theme`），无 hydration warning；移动端 Header 不溢出；auth/admin-login 移动端入口不遮挡表单

### 阶段 2 — 去掉 donate 强制 light + 修硬编码颜色
1. 删 [donate/layout.tsx](../../app/%5Blocale%5D/%28public%29/donate/layout.tsx) 里的 `data-theme="light"`，改回普通 `<div className="bg-bg-base text-text-primary">`（或者干脆删掉这个 layout，因为 (public) layout 已经够了）
2. [AllocationDonut.tsx](../../components/donate/AllocationDonut.tsx)：
   - 圆心 `fill="#fff"` → `fill="var(--bg-base)"`
   - 圆心描边 `stroke="#F1F5F9"` → `stroke="var(--bg-surface-2)"`
   - 中央文字 `fill="#0F172A"` → `fill="var(--text-primary)"`，`fill="#64748B"` → `fill="var(--text-tertiary)"`
   - 5 段 segment 颜色：light 下用现在的鲜艳色；dark 下可以保持（饱和色在深色背景上也 OK），或者降一档亮度。**建议保持**——饼图本来就是要彩色对比
   - 3 个 Block 图标的 bg/fg：light 用浅底+深字，dark 需要反过来。给 `dark:` 变体（用 inline style 难加 dark 变体，改成 Tailwind 类 + `dark:` 修饰，或者用 CSS 变量驱动）
3. [Stories.tsx](../../components/donate/Stories.tsx) / [ImpactStats.tsx](../../components/donate/ImpactStats.tsx)：头像底色、标签 bg/fg、tile bg/fg —— 这些是装饰性彩色 chip。dark 下"浅粉底+深粉字"会违和。
   - 方案：把这些颜色对从 inline style 提取成一组语义化 CSS 变量（`--chip-pink-bg` / `--chip-pink-fg` 等），在 globals.css 的 `:root` 和 `[data-theme="dark"]` 各定义一套（参考项目已有的 `--badge-*-bg/fg` 模式，那批就是这么做的）
   - 或者更简单：dark 下统一用半透明色（`rgba(... , 0.18)` 底 + 亮色字），跟项目 badge dark 方案一致
4. [ProgressBar.tsx](../../components/donate/ProgressBar.tsx)：`#3B82F6` 在 dark 下也 OK（蓝色渐变），保持；或换成 `var(--brand-primary-hover)` 让它跟主题
5. [donate/page.tsx](../../app/%5Blocale%5D/%28public%29/donate/page.tsx) Hero 渐变：已经用了 `var(--bg-surface)`，dark 下会自动变暗；`rgba(24,88,196,0.10)` 这个蓝光叠加在 dark 下也 OK，保持

验收（= 阶段 1+2 的发布门槛）：
- donate 页在 light / dark 下都协调；donut 不再有扎眼白圆心；故事卡/tile 在 dark 下是深色调而非浅色调
- **最小暗色冒烟**：home / admin dashboard / provider dashboard / login / donate 这 5 个主要入口，各截 light + dark 两张图（共 10 张），确认没有明显破色（浅块漏在深底上、文字看不清等）。这是上线前必跑的最低标准——阶段 3 的全站 audit 可以后续迭代，但这 5 个主入口不能带病上线
- 切主题 → `<html data-theme>` + `style.color-scheme` 都跟着变；刷新后保持；无 hydration warning

### 阶段 3 — 全站 light/dark audit（阶段 1+2 发布后迭代）
**真正的风险不是 `dark:` 类**——当前 `app`/`components` 里 `dark:` 字面类只有个位数命中（~5 处），激活后影响很小。**最大的实际风险是硬编码 hex 和 inline `style={{}}`**——它们不随 token 切换，dark 下会"浅色块漏在深色背景上"。而且**这不只 donate 一处**——已经扫到 `app/[locale]/(customer)/home/page.tsx`、`components/layout/EmergencyOverlay.tsx`、`components/domain/ProviderAvatar.tsx`、provider register 等也有硬编码色 / inline style。所以 §1.5 那张表只是 donate 的，不是全部。

1. **三个扫描作为正式验收清单**（不是"顺便看看"，是每条都要逐个判定 + 出处理结论；只审 `.tsx` 源码，忽略图片、快照、build 输出等生成物）：
   - `rg -n '#[0-9A-Fa-f]{3,8}\b' app components -g "*.tsx"` —— 全站硬编码 hex 色值。逐个判定：是可视前景/背景色 → 必须改 token 或加 light/dark 变体；是装饰性/品牌固定色（如 donut 段色、品牌渐变） → 标注为"两主题下都 OK，故意保留"
   - `rg -n 'style=\{\{' app components -g "*.tsx"` —— inline style。重点看里面有没有写死颜色的
   - `rg -n 'data-theme=' app components` —— 确认除了主题系统本身，没有业务页面私自锁主题（见 §3 阶段 1 step 5 的规定）
   - 产出：一份"硬编码色值清单 + 每条的处理结论（改 / 保留 / 已修）"，作为阶段 3 的可交付物
2. 视觉抽样 audit（每个 route group 挑 3-5 个代表页）×（light + dark）：
   - admin：login / dashboard / customers list / customer detail / settings
   - customer：home / services / bookings list / booking detail / profile / chat / **emergency overlay 弹层**
   - provider：dashboard / jobs / earnings / compliance / register
   - public：login / register / help hub / help article / donate / donate success
   - 杂项：oops / 404 / dev/components
3. 用 chrome-devtools：每页截图 light + dark，肉眼对比"有没有浅色块漏在深色背景上"或反之
4. 修发现的问题（一般是：硬编码 hex、忘了用 token、`dark:` 类逻辑写反）
5. 自动化兜底：`dev/components` 页是组件画廊，在两种主题下截全图，作为视觉回归基准

验收：① 硬编码色值清单全部有处理结论且改完；② `rg 'data-theme='` 无业务页面私自锁主题；③ 抽样页面在两种主题下都无明显破绽；④ `dev/components` 画廊两种主题截图都干净

### 阶段 4 — 边界 & 收尾
1. FOUC 复查：阶段 1 step 4 已经验证过防闪 script 工作（首屏 `data-theme` 是 resolved 值）；这里再用 throttled CPU + slow network 复测一次，确认没有"先 light 一闪再 dark"
2. `@media` fallback 去留：已在阶段 1 step 5 定了——**保留当 defense-in-depth**，不再讨论
3. e2e：`e2e/theme.spec.ts` —— 切到 dark → `<html>` 有 `data-theme="dark"` → 刷新后还在；切到 light 同理；切到 system → 跟 Playwright `emulateMedia({ colorScheme })` 走，DOM 上 `data-theme` 是 resolved 值
4. 顺手把 `components/layout/LanguageSelector.tsx` 里的 emoji（`🌐`）也换成 lucide `Globe`——既然 ThemeToggle 立了 lucide 标准，语言控件不该再用 emoji（不强制，但建议一起做，避免新旧不一致）
5. 文档：更新 [docs/UI_DESIGN.md](../../docs/UI_DESIGN.md) 说明主题切换的存在 + "禁止业务页面局部锁主题"的规定；删 donate-integration-plan 里"强制亮色"那段（已过时）

---

## 4. 工作量预估
- 阶段 1：~3-4h（sanity-check next-themes DOM → ThemeProvider → ThemeToggle 下拉组件 → 接进 **Header + AdminShell 两处** + public auth / admin login 的 PublicThemeCorner → i18n）
- 阶段 2：~2-3h（donate 颜色重构，提取 chip 语义变量是大头）+ 最小暗色冒烟 5 页 ×2 主题截图 —— **必须跟阶段 1 一起发**（见 §3 顶部的 ⚠️）
- 阶段 3：~3-5h（三个 rg 扫描 + 出硬编码色值处理清单 + audit ~20 抽样页 ×2 主题，修发现的问题，范围不可控）—— 阶段 1+2 发布后迭代
- 阶段 4：~1-2h
- **合计 ~1.5 天**；最小可发布单元 = 阶段 1+2（~5-7h，含最小暗色冒烟门槛），阶段 3 后续迭代且变数最大

## 5. 风险
| # | 风险 | 缓解 |
|---|---|---|
| R1 | 切到 dark 后硬编码 hex / inline style 的浅色块漏在深色背景上（真正的主要风险，且不只 donate——customer home / EmergencyOverlay / ProviderAvatar 等也有）；`dark:` 类激活后逻辑写反（次要，数量少） | 阶段 2 发布前先跑最小暗色冒烟（5 主入口 ×2 主题）；阶段 3 三个 rg 扫描作为正式验收（hex / inline-style / data-theme），出处理清单逐条改 |
| R2 | 阶段 1 单独发布会导致 donate 仍强制 light（"伪成功"） | 阶段 1+2 绑成一个最小可发布单元，禁止单发阶段 1（见 §3 顶部 ⚠️） |
| R3 | next-themes hydration 闪烁 | `suppressHydrationWarning` + next-themes 自带的防闪 script + `disableTransitionOnChange`；阶段 4 用 throttled CPU/network 复测 |
| R4 | donate 的鲜艳装饰色在 dark 下不好看 | 阶段 2 提取成语义变量，跟项目已有的 `--badge-*` dark 方案保持一致；最坏退路：donate 局部保留"受控例外"的强制 light（即阶段 1 step 5 说的那种） |
| R5 | JS 被禁 / 防闪 script 失败时，表单 UA 控件仍按 light 渲染（虽然 CSS 变量已通过 `@media` 切暗） | `:root[data-theme=dark]` 块和 `@media` dark fallback 里都补 `color-scheme: dark`（见阶段 1 step 5） |

## 6. 待你拍板
1. **采纳方案 A 还是 B？** A 给用户控制权 + 覆盖全部页面（Header + AdminShell + public auth/admin-login corner 三类入口），最小可发布单元 ~5-7h；B 最小改动但不解决"无法手动切换"
2. **donate 的鲜艳装饰色**：dark 下保留鲜艳感（提取语义变量给 light/dark 各一套）还是统一降饱和（直接套项目已有的 `--badge-*` dark 半透明方案）？
3. **发布粒度**：最小可发布单元已定为 **阶段 1+2 一起发**（含 5 主入口暗色冒烟门槛，不能单发阶段 1）。问阶段 3（全站硬编码色 audit）要不要也一起做完再发，还是阶段 1+2 先上、阶段 3 后续迭代？（推荐后者——阶段 3 范围不可控，不该卡住切换器上线）

> public auth / admin login 的主题入口已不再是待决项——定为复用 `PublicThemeCorner`（见 §3 阶段 1 step 7）。404/oops 留作阶段 3 检查项。
