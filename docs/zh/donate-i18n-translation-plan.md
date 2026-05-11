# 募资页 i18n 翻译方案（zh-TW / ja / ko 补全）

> 状态：已评审修订，待执行
> 起因：今天新增的募资页 `/[locale]/donate` 只做了 `zh-CN`（完整中文）和 `en`（完整英文）两个版本；`zh-TW`、`ja`、`ko` 三个 locale 的 `donate` namespace 当前直接复用了 `en` 的英文字串（占位 fallback）。需要补成真正的繁中 / 日文 / 韩文。
> 目标：`messages/{zh-TW,ja,ko}.json` 的 `donate` namespace 全部翻成对应语言，结构 / 占位符 / 数组 / emoji / 品牌名保持不变，渲染无破。

---

## 0. 前置代码修复（翻译前先做）

现有成功页 [success/page.tsx L32](../../app/%5Blocale%5D/%28public%29/donate/success/page.tsx#L32) 用 `recurring = donation.mode === "monthly" ? t("recurring") + " " : ""`，然后 `t.raw("body")` 里 `.replace("{recurring}", recurring)`。`+ " "` 会多塞一个空格——en 现在实际渲染成 `your $50 monthly  donation`（双空格），zh-CN 渲染成 `你的 $50 月度 捐款`（"捐款"前多一个空格）。这个片段拼接模式在日/韩里更难规避（语序完全不同）。

**修法**：把 `success.body`（单句 + `{recurring}` 槽）拆成两条完整句子 `success.bodyOnce` / `success.bodyMonthly`，删掉 `success.recurring`；`success/page.tsx` 改成 `const bodyKey = donation.mode === "monthly" ? "bodyMonthly" : "bodyOnce"`，然后 `t.raw(bodyKey).replace("${amount}", ...).replace("{email}", ...)`。这样每个 locale 的两种句子各自完整，不用拼接、不会有多余空格。

- 影响：`messages/{en,zh-CN,zh-TW,ja,ko}.json` 的 `donate.success` 结构都改（`body` + `recurring` → `bodyOnce` + `bodyMonthly`）；`success/page.tsx` 改 ~3 行；`success` 没有 `recurring` 那个 fragment 了
- 这一步先做，再做翻译

## 1. 现状盘点

- `messages/` 下 5 个 locale 文件，各有一个 `donate` namespace（**94 个 leaf 字串**，做完 §0 的 success 重构后仍是 94：删 `recurring` -1、`body` 拆成 `bodyOnce`+`bodyMonthly` +1）
- `zh-CN`：完整中文 ✓
- `en`：完整英文 ✓
- `zh-TW` / `ja` / `ko`：**= en 的英文复制**（占位）✗ —— 这就是要修的
- `donate` namespace 结构（9 个顶层组，§0 重构后）：
  - `meta`（title / desc）—— SEO 文案
  - `hero`（badge / title1 / titleHighlight / subtitle / ctaPrimary / ctaSecondary / trust1 / trust2 / trust3）
  - `progress`（raised / goal / percentComplete / daysLeft / donors / avg / communities）
  - `impact`（eyebrow / title / seniorsServed / visits / cities / volunteers）
  - `stories`（title + s1/s2/s3 各有 name / meta / quote / tag1 / tag2）
  - `allocation`（eyebrow / title / block1-3 Title+Body / centerLabel / **items[5] 数组** / footnote）
  - `form`（eyebrow / title / subtitle / once / monthly / customLabel / customPlaceholder / nameLabel / emailLabel / emailHint / phoneLabel / messageLabel / messagePlaceholder / anonymous / submitOnce / submitMonthly / submitting / pickAmount / overLimit / errorGeneric / paymentLabel / paymentNote / **amounts{25,50,100,250,other}**）
  - `success`（title / **bodyOnce** / **bodyMonthly** / cta）—— §0 重构后，不再有 `body` / `recurring`
  - `cancel`（title / body / cta）

## 2. 翻译时必须保持不变的东西（硬约束）

| # | 约束 | 出现在哪 |
|---|---|---|
| C1a | **next-intl ICU 参数**（next-intl 在渲染期会接收参数，必须原样保留花括号）：`progress.percentComplete` 的 `{pct}`；`form.submitOnce` / `form.submitMonthly` / `form.amounts.other` 的 `{amount}`（注意这三个 form 值里写的是 `${amount}` —— `$` 是字面美元符，`{amount}` 才是 ICU 参数；翻译时 `${amount}` 整体保留、别拆 `$` 和 `{amount}`）。位置可调（放句中自然处），不能改写/删/漏 |
| C1b | **raw literal 占位符**（代码用 `t.raw(...).replace(...)`，next-intl **不**校验、不处理 ICU 转义；必须逐字保留）：`progress.daysLeft` 的 `{days}`；`success.bodyOnce` / `success.bodyMonthly` 里的 `${amount}` 和 `{email}`。成功页代码会做字符串 `.replace("${amount}", ...)` / `.replace("{email}", ...)`，所以这两个 token 必须**一字不差**出现在每条成功页句子里（每条句子各出现一次） |
| C1c | `form.overLimit` 里有邮箱地址 `contact@silverconnect.org` 但**没有**任何占位符（见 C8） |
| C2 | `progress.daysLeft` 里的 `<b>...</b>` HTML 标签原样保留（页面用 `dangerouslySetInnerHTML` 渲染） | 仅 `progress.daysLeft` |
| C3 | 品牌名 **SilverConnect** 不翻译 | `meta.*`、`hero.subtitle` |
| C4 | emoji 原样保留：☕ 🍲 💬 🛟 💙 🛡 🧾 📊 等 | `hero.trust*`、`form.amounts.*`、`success.title` 等 |
| C5 | `allocation.items` 是数组 `[{label, pct}, ...]`——只翻 `label`，`pct` 数字不动，5 项顺序不变 | `allocation.items` |
| C6 | `form.amounts` 的 key 是字符串 `"25"` `"50"` `"100"` `"250"` `"other"`——key 不动，只翻 value | `form.amounts` |
| C7 | 货币符号 `$` 和金额数字（$25 / $50 / $250 / $50,000）不动；"AUD" 不动 | `form.subtitle`("All amounts in AUD")、`form.amounts.*`、`form.overLimit`、`success.bodyOnce`/`bodyMonthly` |
| C8 | 联系邮箱 `contact@silverconnect.org` 不动 | `form.overLimit` |
| C9 | **不出现 "可抵税 / tax-deductible / 税额控除 / 税額控除 / 세액공제 / 세금 공제"** —— DGR 资质未确认前不承诺税务（与 donate-integration-plan 的措辞约束一致）；统一用"捐款收据 / 感谢信"类措辞 | `meta.desc`、`hero.trust2`、`form.emailHint`、`form.paymentNote` |
| C10 | 五种 locale 的 `donate` 结构必须**完全一致**（key 集合相同，§0 重构后的结构）——只换 value，不增删 key | 全部 |
| C11 | `success.bodyOnce` / `success.bodyMonthly` 是两条**完整句子**（§0 重构后），各自含一个 `${amount}` 和一个 `{email}`，月捐句子额外把"月度/每月/매월"这层意思写进句子里。两条句子在各自语言里都要是通顺的完整句，不再有片段拼接、不能有多余空格 | `success.bodyOnce`、`success.bodyMonthly` |

## 3. 翻译策略（按 locale）

### 3.1 zh-TW（繁体中文）
- 基本是把 `zh-CN` 的 `donate` 做**简→繁转换**，但要注意台湾用语习惯（不是单纯字形转换）：
  - `视频` → `視訊`（不是「視頻」）
  - `信息` → `資訊` / `訊息`（按语境）
  - `软件 / 小程序` → 用语境，募资页里出现的是「远程关怀小程序」→ `遠端關懷小程式`
  - `紧急响应` → `緊急應變`（台湾更常用「應變」）或保留「緊急回應」——**待拍板**，建议「緊急應變」
  - `捐赠人 / 捐款人` → `捐款人`（一致）
  - `第三方托管` → `第三方託管`
  - `审计` → `審計` / `稽核`——募资语境用「審計」即可
  - 人名地名：`陈奶奶`→`陳奶奶`、`墨尔本`→`墨爾本`、`多伦多`→`多倫多`、`上海`→`上海`（不变）
- emoji / 占位符 / 数字 / 品牌名按 §2 保留

### 3.2 ja（日本語）
- 全新翻译，正式、稳重、有温度的语气（募资文案要打动潜在捐款人，但**不卖惨、不幼化**长者）
- 关键术语对照：
  | 中/英 | 日 |
  |---|---|
  | 捐款 / donation | 寄付 |
  | 月捐 / monthly | 毎月の寄付 / 継続寄付 |
  | 单次捐款 / one-time | 今回のみ |
  | 长者 / senior / elder | 高齢者 / 高齢の方（统一用「高齢者」「高齢の方」，**不**用「お年寄り」——募资页面向公众，过亲切的称呼可能显得幼化或不够尊重） |
  | 独居 | ひとり暮らし |
  | 失能 / dependent care | 要介護 |
  | 陪伴 / companionship | 寄り添い / 見守り |
  | 健康监测 / health monitoring | 健康モニタリング |
  | 紧急响应 / emergency response | 緊急対応 |
  | 志愿者 / volunteer | ボランティア |
  | 非营利组织 / nonprofit | 非営利団体 |
  | 第三方托管 / escrow | 第三者預託（エスクロー） |
  | 年度审计 / annual audit | 年次監査 |
  | 捐款收据 / receipt | 寄付受領証（领収书類，**不**用「税控除証明書」←违反 C9） |
  | 已筹集 / raised | 集まった金額 |
  | 目标 / goal | 目標 |
  | 捐赠人 / donors | 寄付者 |
  | 平均捐款 / avg donation | 平均寄付額 |
  | 合作社区 / partner communities | 連携コミュニティ |
- 人名地名（保守方案，见 §6 Q1）：`陈奶奶 · 78` → `陳さん · 78`（姓 + さん，年龄保留）；`王爷爷 · 82` → `王さん · 82`；`林阿姨 · 71` → `林さん · 71`；`墨尔本`→`メルボルン`、`多伦多`→`トロント`、`上海`→`上海`（汉字保留）、`帕金森`→`パーキンソン病`、`独居 6 年`→`ひとり暮らし 6 年`、`失能照护`→`要介護`
- 占位符在日文句中的位置要自然，例如 raw `progress.daysLeft` `"<b>{days}</b> days left"` → `あと <b>{days}</b> 日`；ICU `form.submitMonthly` `"Confirm ${amount} / mo"` → `${amount} を毎月寄付する` 之类

### 3.3 ko（한국어）
- 全新翻译，募资文案，正式但有温度（敬语「-습니다」体）
- 关键术语对照：
  | 中/英 | 韩 |
  |---|---|
  | 捐款 / donation | 기부 |
  | 月捐 / monthly | 매월 기부 / 정기 기부 |
  | 单次捐款 / one-time | 일회성 기부 |
  | 长者 / senior / elder | 어르신 |
  | 独居 | 독거 |
  | 失能 / dependent care | 거동 불편 / 돌봄 필요 |
  | 陪伴 / companionship | 말벗 / 동행 |
  | 健康监测 / health monitoring | 건강 모니터링 |
  | 紧急响应 / emergency response | 긴급 대응 |
  | 志愿者 / volunteer | 자원봉사자 |
  | 非营利组织 / nonprofit | 비영리 단체 |
  | 第三方托管 / escrow | 제3자 예치 |
  | 年度审计 / annual audit | 연례 감사 |
  | 捐款收据 / receipt | 기부금 영수증（**不**用「세액공제 증명서」←违反 C9） |
  | 已筹集 / raised | 모금액 |
  | 目标 / goal | 목표 |
  | 捐赠人 / donors | 기부자 |
  | 平均捐款 / avg donation | 평균 기부액 |
  | 合作社区 / partner communities | 협력 커뮤니티 |
- 人名地名（保守方案，见 §6 Q1）：`陈奶奶 · 78` → `천 씨 · 78`（姓 + 씨，年龄保留）；`王爷爷 · 82` → `왕 씨 · 82`；`林阿姨 · 71` → `린 씨 · 71`；`墨尔本`→`멜버른`、`多伦多`→`토론토`、`上海`→`상하이`、`帕金森`→`파킨슨병`、`独居 6 년`→`독거 6 년`、`失能照护`→`거동 불편 / 돌봄 필요`
- 注：ko 的 `success.bodyMonthly` 用「매월 기부」之类把"月捐"含义写进句子；敬语「-습니다」体

## 4. 执行步骤

1. **§0 前置代码修复**先做：拆 `success.body` → `bodyOnce` / `bodyMonthly`，删 `recurring`，改 `success/page.tsx` 选 key 逻辑；同步改 `en` + `zh-CN` 的 `donate.success`。跑 `npm run build` 确认通过
2. **翻译 `zh-TW` / `ja` / `ko` 的 `donate` namespace**：替换这 3 个文件里整段 `"donate": { ... }` 为对应语言的译文。zh-TW 以 `zh-CN` 的 `donate` 为底做繁化 + 台湾用语校正；ja / ko 按 §3.2 / §3.3 的术语表 + 保守人名方案翻译。每段翻完先逐条核 §2 的硬约束（C1a/C1b 占位符、C2 `<b>`、C3 品牌名、C4 emoji、C5 数组、C6 amounts key、C9 无税务措辞、C10 key 集一致）
3. 翻译期间不动 `en` / `zh-CN` 的其它内容（除非 §6 Q3 决定一起校对措辞）
4. 跑 §5 的验收

## 5. 验收

- [ ] `node -e "JSON.parse(...)"` 5 个文件都合法 JSON
- [ ] **结构一致性**：`node -e` inline 递归收集每个 locale `donate` 的 key 路径集合，5 个 locale 完全相同（无多余 / 缺失 key；且 `success` 下是 `bodyOnce`/`bodyMonthly` 不是 `body`/`recurring`）—— 一次性内联检查，不是落地脚本
- [ ] **占位符完整**：`rg` 每个翻译值——C1a 的 `{pct}`/`{amount}` 在该有的 key 里各出现一次；C1b 的 `progress.daysLeft` 保留 `{days}`，`success.bodyOnce` 和 `success.bodyMonthly` 各保留一次 `${amount}` 和一次 `{email}`；`progress.daysLeft` 有 `<b>` `</b>`
- [ ] **C9 检查**：`rg` 三个新文件的 `donate` 段，确认没有 "可抵税 / tax-deductible / 税控除 / 税額控除 / 세액공제 / 세금 공제" 之类
- [ ] `allocation.items` 仍是 5 项数组，每项 `pct` 数字不变（45/25/15/10/5）
- [ ] `form.amounts` key 仍是 `25/50/100/250/other`
- [ ] **donate 主页渲染检查**：`npm run dev` → 访问 `/zh-TW/donate`、`/ja/donate`、`/ko/donate`，各截一张图，确认：① 文字是对应语言不是英文；② 金额按钮 `$25/$50/$100/$250` 正常；③ Hero 标题 + highlight 拼接自然；④ "距截止还有 N 天" 那行 `<b>` 加粗生效；⑤ 没有溢出 / 截断 / 乱码
- [ ] **success 页 once / monthly 两种句子检查**（这是最容易出问题的地方）：在测试库各 seed 一条 `once` 和一条 `monthly` donation，并确保都有 `stripeSessionId`；分别访问 `/{zh-TW,ja,ko}/donate/success?session_id=<once_stripeSessionId>` 和 `?session_id=<monthly_stripeSessionId>`，确认两种句子都通顺、`${amount}` 替换成带 `$` 的金额、`{email}` 替换成邮箱、没有多余空格、月捐句子里有"月度/毎月/매월"那层意思
  - ⚠️ 浏览器可能有 `NEXT_LOCALE` cookie 把 `/zh-TW/...` 重定向到别的 locale（chrome-devtools 实例踩过 `=en`）。验证前先清 cookie，或在 evaluate 里确认 `location.pathname` 真的没被重定向
- [ ] `npm run build` 通过（会加载并使用 message 文件，能暴露 JSON、缺 key、部分 ICU 参数问题；§0 改完后也要重新跑一次）

## 6. 待你拍板

1. **ja / ko 故事人名风格**：保守方案 `陳さん · 78` / `천 씨 · 78`（姓 + さん/씨 + 年龄），还是跟 en 版一样亲切化（`陳おばあちゃん` / `천 할머니`），还是保留中文原文（`陈奶奶`）？（建议保守方案——募资页面向公众，过亲切可能显得幼化/不够尊重；en 版那个 "Grandma Chen" 也可以届时一并改成保守风格）
2. **zh-TW 的「紧急响应」**：用台湾常见的「緊急應變」，还是「緊急回應」？（建议「緊急應變」）
3. **要不要顺便校对 zh-CN / en**：这两个是今天新写的没人复核过；要不要这次一起再过一遍措辞（含 §6 Q1 决定后 en 故事名是否一并改）？（建议过一遍，成本低）
