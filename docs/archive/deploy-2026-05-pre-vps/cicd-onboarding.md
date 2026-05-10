# CI/CD 加入指南

面向新加入 silverconnect-global 的开发者。读完这一篇，应该能：克隆代码 → 本地跑起来 → 提 PR → 看懂 CI 为什么红/绿 → 知道部署在哪发生、谁触发。

技术栈：Next.js + Drizzle + Supabase + Stripe。仓库有两条独立 CI/CD 流水线（生产 + staging 备用），同一份代码用不同 GitHub Secrets 区分部署目标。

---

## 一、两条流水线一览

| 维度 | 主线（生产） | 备用线（staging 演练） |
|------|--------------|------------------------|
| GitHub 账号 | `yanhaoau@gmail.com` | `yanhaocn2000@163.com` |
| GitHub 仓库 | `lesliezhili/silverconnect-global` | `yanhaocn2000/silverconnect` |
| Vercel scope | team `team_V0iunB5JnKuPRw80UkiSNxFc` | personal `yanhaoau-1392s-projects` |
| Vercel 项目 ID | `prj_mfwDqQusJ1UnEWr6ppat0yEv7Rwh` | `silverconnect` |
| 部署 URL | 生产域名 | https://silverconnect-one.vercel.app |
| Stripe | live keys | test mode keys |
| Supabase | 生产实例 | 测试实例 |

主线由仓库 owner 维护推送权限；新成员日常只跟主线打交道。备用线的搭建过程详见 [backup-cicd-plan.md](backup-cicd-plan.md)，这里只讲它"作为第二条 CI 在跑"这件事。

---

## 二、新人接入步骤

### 2.1 前置要求

- Node.js 20.x + npm 10.x（`package.json#engines` 强制）
- Python 3.10+（仅当你要碰 AI agent 时需要）
- Git
- 一个 Supabase 项目（Free 即可，仅用于本地）
- 一个 Stripe 测试账号

详见 [DEVELOPMENT.md](DEVELOPMENT.md#L3-L11)。

### 2.2 克隆和首次搭建

```bash
git clone https://github.com/lesliezhili/silverconnect-global.git
cd silverconnect-global
npm install
cp .env.example .env.local
```

然后填 `.env.local`，最少填以下几项才能跑起来：

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

完整变量清单和"哪些是占位符当前没被读取"的区别，见 [DEVELOPMENT.md § 2 首次搭建](DEVELOPMENT.md#L13-L60) 与 [DEPLOYMENT.md § Vercel 必填环境变量](DEPLOYMENT.md#L33-L58)。

注意 `.env.example` 里有几十个变量，**当前 TS 代码只读其中一小部分**——其他是未来集成的占位。以 DEVELOPMENT.md 给出的 runtime 列表为准。

### 2.3 跑起来

```bash
npm run dev          # Next.js on :3000
./run-ai-agent.sh    # FastAPI AI agent on :8000（可选）
```

更多脚本见 [DEVELOPMENT.md § 5 常用脚本](DEVELOPMENT.md#L78-L94)。

### 2.4 数据库初始化

```bash
npm run db:migrate
npm run db:seed
```

或者手动把 `lib/schema.sql` 粘到 Supabase SQL editor，再按编号顺序应用 `migrations/*.sql`。

---

## 三、分支模型与 PR 流程

### 3.1 分支命名

- `feat/<short>` — 新功能
- `fix/<short>` — 修 bug
- `chore/<short>` — 杂项/构建/依赖
- `docs/<short>` — 仅文档

### 3.2 commit message

祈使句标题，≤ 72 字符，带模块前缀，例如：

```
feat(payments): refund window enforcement
fix(auth): clear stale cookie on signout
docs(zh): add cicd onboarding guide
```

### 3.3 PR 流程

1. 从 `main` 切 feature 分支。
2. 推到 origin 触发 CI（见第四节）。
3. 开 PR 到 `main`，**等 `schema-and-lint` job 绿**再请求 review。
4. PR 描述链接 issue/spec，写测试计划，UI 改动附截图。
5. Merge 到 `main` 后 `deploy.yml` 自动触发生产部署。

更多见 [DEVELOPMENT.md § 8 Git 流程](DEVELOPMENT.md#L127-L132)。

---

## 四、CI 流水线说明

仓库内两个 workflow 文件，分工清楚：

### 4.1 [.github/workflows/ci.yml](../../.github/workflows/ci.yml) — 编译/lint 检查

**触发**：所有分支的 push + 所有 PR（见 [ci.yml#L3-L6](../../.github/workflows/ci.yml#L3-L6)）。

**做什么**：

1. `npm ci` 装依赖。
2. **Drizzle schema generate**（[ci.yml#L30-L33](../../.github/workflows/ci.yml#L30-L33)）— 离线校验 Drizzle TS schema 能编译成合法 SQL。`DATABASE_URL` 用占位值，不会真连数据库。
3. **Lint**（[ci.yml#L39-L41](../../.github/workflows/ci.yml#L39-L41)）— 当前是 informational，标了 `continue-on-error: true`。原因：仓库里有 3 个遗留的 ESLint errors 在 `app/api/**` 的 Supabase 路由里，等 Phase 2/3 重写时一并清理；清理完会移除 `continue-on-error` 让 lint 变成硬门禁。

**需要的 secrets**：无。`ci.yml` 全程不读任何 secret。

**并发**（[ci.yml#L8-L10](../../.github/workflows/ci.yml#L8-L10)）：同一 ref 的旧任务会被 cancel，避免推连续 commit 时浪费配额。

文件还预留了 [ci.yml#L43-L50](../../.github/workflows/ci.yml#L43-L50) 的 Phase 1 DB 烟测占位，要启用就加 `SUPABASE_TEST_DB_URL` secret。

### 4.2 [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) — Vercel 部署

**触发**（[deploy.yml#L14-L26](../../.github/workflows/deploy.yml#L14-L26)）：

- `push` 到 `main` → 自动跑 production 部署
- `workflow_dispatch` 手动触发 → 可选 preview 或 production

**做什么**：

1. 装 Vercel CLI。
2. `vercel pull` 拉对应环境配置。
3. `vercel build` 在 runner 上构建。
4. `vercel deploy --prebuilt` 上传产物。

**需要的 secrets**（见 [deploy.yml#L5-L8](../../.github/workflows/deploy.yml#L5-L8) 的注释）：

- `VERCEL_TOKEN` — vercel.com/account/tokens 生成的 PAT
- `VERCEL_ORG_ID` — 主线为 `team_V0iunB5JnKuPRw80UkiSNxFc`
- `VERCEL_PROJECT_ID` — 主线为 `prj_mfwDqQusJ1UnEWr6ppat0yEv7Rwh`

**runtime 环境变量**（`DATABASE_URL`、`STRIPE_*`、`GLM_*`、`EMAIL_*` 等）**不在 GitHub Secrets**，由 Vercel Project Settings → Environment Variables 管理。GitHub Actions 只负责"触发部署"，跑 runtime 时读 Vercel dashboard 配的值。

---

## 五、申请 Secrets

新成员被加为 repo collaborator 之后，**仓库 owner 配置 secrets，新成员不需要也不应该有 secret 写权限**。如果你 fork 出去自己跑，需要自己生成。

| Secret | 作用 | 怎么拿 |
|--------|------|--------|
| `VERCEL_TOKEN` | Actions 调 Vercel CLI | https://vercel.com/account/tokens 生成；建议 scope 到单一项目 |
| `VERCEL_ORG_ID` | 标识 team scope | Vercel Project → Settings → General |
| `VERCEL_PROJECT_ID` | 标识具体项目 | 同上 |

### 5.1 Hobby/personal 账号的特殊情况

如果你跑的是 **personal scope**（不是 team），例如备用线的 `yanhaoau-1392s-projects`：

- **不能**在 [deploy.yml#L32-L34](../../.github/workflows/deploy.yml#L32-L34) 设 `VERCEL_ORG_ID`，否则 `vercel deploy` 会报：

  ```
  Could not retrieve Project Settings.
  ```

- 解决：删掉 workflow 里的 `env: VERCEL_ORG_ID / VERCEL_PROJECT_ID` 块，改用 `vercel link --yes --project=<name> --token=...` 生成 `.vercel/project.json`，后续 `vercel deploy` 自动读取。

详见 [backup-cicd-plan.md § 5.1](backup-cicd-plan.md#L179-L190) 与备用 repo 的修复 commit `a064e08`。

主线是 team scope，**不受此问题影响**，正常配 ORG_ID 即可。

---

## 六、本地运行/调试

### 6.1 灌环境变量

```bash
cp .env.example .env.local
```

填测试 Supabase 的 URL/anon/service-role + Stripe test keys（`pk_test_` / `sk_test_` / `whsec_test_`）。**绝不要**把生产 `sk_live_` 灌进 `.env.local`。

注意命名陷阱（[DEVELOPMENT.md § 环境变量命名注意](DEVELOPMENT.md#L44-L52)）：服务端运行时读 `SUPABASE_SERVICE_ROLE_KEY`，但 `scripts/seed.js` / `scripts/migrate.js` / `scripts/seed-test-data.ts` / `scripts/delete-test-data.ts` 读 `SUPABASE_SERVICE_KEY`。两个都设、设同一值。

### 6.2 Stripe webhook 转发到本地

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 6.3 docker-compose 不构成自闭环

`docker-compose.yml` 起 Postgres / Redis / Mailhog / Adminer / Redis Commander，但 **运行中的 TS 代码当前走 Supabase**，会忽略 compose 注入的 `DATABASE_URL` / `REDIS_URL` / `EMAIL_*`。compose 适合用 Adminer（`:8080`）查 SQL，不构成生产 runtime。详见 [DEVELOPMENT.md § docker-compose 仅用于本地基础设施探索](DEVELOPMENT.md#L58-L60)。

---

## 七、部署失败排查

按从最常见到最不常见排：

### 7.1 `vercel deploy` 报 "Could not retrieve Project Settings"

- **场景**：在 personal/Hobby Vercel scope 上跑，且 workflow 设了 `VERCEL_ORG_ID`。
- **修复**：见上面 [§ 5.1](#51-hobbypersonal-账号的特殊情况)。已在备用线 commit `a064e08` 修复。
- **主线不会遇到**（team scope）。

### 7.2 `drizzle-kit generate` 失败

- **场景**：改了 `db/schema/*` 里的 TS 类型，但写出了非法 SQL（如未识别的 column type、循环引用、缺主键）。
- **怎么看**：CI log 里 `Drizzle schema generate` step 会输出错误行号。
- **修复**：本地跑一遍 `npx drizzle-kit generate --name=test` 复现，按错误改 schema。`DATABASE_URL` 用占位即可，generate 是离线的。

### 7.3 Lint 失败但 CI 仍然绿

- **场景**：lint 报错但 step 标 `continue-on-error: true`（[ci.yml#L41](../../.github/workflows/ci.yml#L41)），CI 整体不会因为 lint 红。
- **背景**：仓库当前有 3 个遗留 ESLint errors 在 `app/api/**`，预计 Phase 2/3 重写时清理。
- **新代码**：你写的新代码 lint 必须干净。`continue-on-error` 是过渡措施，不是免死金牌——review 时仍会盯新增的 lint warning/error。

### 7.4 `vercel build` 失败

- **常见原因**：缺 runtime 环境变量（如 `STRIPE_SECRET_KEY` 没在 Vercel dashboard 配），或某个 server component 在编译期就读了未定义的 env。
- **修复**：到 Vercel Project → Settings → Environment Variables 检查 Production scope 是否齐全。完整必填列表见 [DEPLOYMENT.md § Vercel 必填环境变量](DEPLOYMENT.md#L33-L58)。

### 7.5 部署成功但 runtime 报 RLS 拒绝

- **场景**：Supabase RLS 策略不允许当前 user 读，会**返回空数组而非报错**。
- **怎么看**：以该 user 身份在 Supabase SQL editor 复盘查询。
- **预防**：新建表的 RLS policy 要和建表 migration **同 PR 提交**，不要拆。

更多调试技巧见 [DEVELOPMENT.md § 9 调试小贴士](DEVELOPMENT.md#L134-L139)。

---

## 八、本仓库的特殊约定

### 8.1 这不是你训练数据里的 Next.js

[AGENTS.md](../../AGENTS.md) 第一条就说：本项目用的 Next.js 版本带 breaking changes，API、约定、文件结构可能都和你认识的不一样。**写 route handler / server action / layout 之前先读 `node_modules/next/dist/docs/` 里对应的 guide**。注意 deprecation 提示。

### 8.2 [CLAUDE.md](../../CLAUDE.md) 里的强制规则

CLAUDE.md 引用 AGENTS.md 之外，还继承了用户级全局强制规则，关键三条：

1. **禁止推测性结论** — 任何需要事实支撑的判断，先查/读/执行拿证据再下结论；不要靠联想编原因。
2. **外科手术式修改** — 只改任务要求的内容，每行改动可追溯。不要顺手改相邻代码、注释、格式；不要在 bug fix 里夹带重构。改动产生的孤儿 import / 变量自己清理。
3. **简单优先** — 最少代码解决问题，禁止投机性 flag、抽象、未来兼容层。200 行能写成 50 行就重写。

完整规则见 CLAUDE.md（继承自用户全局 `~/.claude/CLAUDE.md`）。

### 8.3 Markdown 链接规范

所有 `.md` 文件里的链接必须：

- 用相对路径（不是 `f:\` / `C:\` 绝对路径）
- Unix 分隔符 `/`（不是 `\`）
- 行号大写 L：`file.ts#L42` 或 `file.ts#L42-L60`
- 目录链接末尾加 `/`
- 包含完整文件扩展名

仓库根有 hook 自动检查（`~/.claude/hooks/check-markdown-links.py`）。

### 8.4 其他强约束（节选自 [DEVELOPMENT.md § 7 编码规范](DEVELOPMENT.md#L113-L126)）

- **TypeScript strict**，新代码不允许 `any`。
- **服务端 secret** — 客户端组件中绝不引入 `SUPABASE_SERVICE_ROLE_KEY`。
- **i18n** — 所有客户可见的新字符串入 `lib/translations.ts`，EN + ZH 一起加。
- **价格** — 永不内联计算，走 `lib/pricing.ts`。
- **认证** — 永不信客户端声明，服务端二次校验身份。
- **RLS** — 新建表的 policy 与建表迁移同提交。

---

## 九、常见问题 FAQ

**Q: 我推了分支但 GitHub Actions 没跑？**
A: 先确认你推到的是 `lesliezhili/silverconnect-global`（主线），不是 fork。再看 ci.yml 的 `concurrency` 配置——同一 ref 的旧 run 会被 cancel。

**Q: 我的 PR CI 红了，但 lint step 标着 ✅，是为什么？**
A: lint step 是 `continue-on-error: true`（informational），不会让 CI 红。CI 红一定是 `Drizzle schema generate` 或 `npm ci` 失败，看那两步的 log。

**Q: 部署到 Vercel 后页面 500，但本地正常？**
A: 99% 是 Vercel Project Settings 里某个环境变量没配齐。对照 [DEPLOYMENT.md § Vercel 必填环境变量](DEPLOYMENT.md#L33-L58) 一项项核。

**Q: 我能直接 `npx vercel --prod` 部署吗？**
A: 仓库 owner 可以。普通 collaborator 走 PR → merge 到 main → deploy.yml 自动跑这条路。手动部署绕过 CI 检查，不推荐。

**Q: staging 备用线我需要关心吗？**
A: 不需要主动维护。它由仓库 owner 周期性同步 + 演练。除非你被指派去演练或排查备用线问题，否则照主线流程走即可。

**Q: 提了 PR 之后 main 已经推进了，要 rebase 吗？**
A: 项目偏好新 commit 而非 amend/force-push。如果冲突小可以 rebase 解；冲突大就 merge main 进 feature 分支再处理。不要 `--force-with-lease` 改写已经 review 过的 commit。

**Q: cron 任务在两个 Vercel 项目同时开着会怎样？**
A: 同一段业务逻辑会跑两遍。`vercel.json#L10-L23` 定义了 daily cron，备用线必须在 Vercel Settings → Cron Jobs 手动暂停。详见 [backup-cicd-plan.md § 5.3](backup-cicd-plan.md#L217-L223)。

**Q: 我能自己加 GitHub workflow 文件吗？**
A: 可以提 PR，但要在 PR 描述里说明触发条件、需要哪些 secret、配额影响。免费账号每月 2000 分钟 Actions，新加的 workflow 别让它每个 push 都跑全量。

---

## 十、联系人 / 接手人

- **仓库 owner / 主线运维**：_待补_
- **备用线运维**：_待补_
- **Supabase 项目 owner**：_待补_
- **Stripe 账号 owner**：_待补_
- **Vercel team admin**：_待补_

新成员加入时，由 owner 在此填写当前对应人和邮箱/Slack handle。

---

## 相关文档

- [DEVELOPMENT.md](DEVELOPMENT.md) — 本地开发完整指南
- [DEPLOYMENT.md](DEPLOYMENT.md) — 部署 / 环境变量 / 发布清单
- [backup-cicd-plan.md](backup-cicd-plan.md) — 备用线搭建细节
- [AGENTS.md](../../AGENTS.md) — Next.js 定制版警告
- [CLAUDE.md](../../CLAUDE.md) — 项目强制规则入口
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)
- [.env.example](../../.env.example)
