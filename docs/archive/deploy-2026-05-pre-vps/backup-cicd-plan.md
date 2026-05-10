# 备用 CI/CD 方案：163 GitHub 账号 + Vercel + 测试 Supabase

> 主仓库已用 `lesliezhili/silverconnect-global`（绑 Gmail 账号）部署 Vercel 生产环境。
> 本方案目标：**搭一条完全独立的备用流水线**，使用 163 邮箱注册的 GitHub 账号，部署到独立 Vercel 项目，连独立的"测试用" Supabase。出问题时主备互不影响，可以快速切流。

---

## 0. 账号清单（先准备好，再开工）

| 资源 | 主线（已存在） | 备用（要建） |
|------|----------------|--------------|
| GitHub 账号 | `yanhaoau@gmail.com` | `yanhaocn2000@163.com` |
| GitHub 仓库 | `lesliezhili/silverconnect-global` | `<新账号>/silverconnect-global` |
| Vercel 团队/账号 | `team_V0iunB5JnKuPRw80UkiSNxFc` | 新建（用 163 GitHub 登录） |
| Vercel 项目 | `prj_mfwDqQusJ1UnEWr6ppat0yEv7Rwh` | 新建（如 `silverconnect-staging`） |
| Supabase 项目 | 生产 | 新建测试项目（独立 URL/anon/service-role） |
| 域名 | 生产域名 | Vercel 自动域名即可（或绑 `staging.xxx`） |

⚠ **不要让备用流水线接触生产 Supabase 和生产 Stripe live keys**。备用环境只能用：
- 独立 Supabase 测试项目
- Stripe **test mode** keys（`pk_test_`/`sk_test_`/`whsec_test_`）

---

## 一、整体架构

```
┌─────────────────────────────┐         ┌─────────────────────────────┐
│  主线（Gmail）              │         │  备用线（163）              │
│  GitHub: lesliezhili/...    │         │  GitHub: <163账号>/...      │
│  分支: main                 │         │  分支: main                 │
│      │                      │         │      │                      │
│      ▼                      │         │      ▼                      │
│  GitHub Actions             │         │  GitHub Actions             │
│      │                      │         │      │                      │
│      ▼                      │         │      ▼                      │
│  Vercel 生产项目            │         │  Vercel staging 项目        │
│      │                      │         │      │                      │
│      ▼                      │         │      ▼                      │
│  Supabase 生产              │         │  Supabase 测试              │
│  Stripe LIVE                │         │  Stripe TEST                │
└─────────────────────────────┘         └─────────────────────────────┘
        ▲                                       ▲
        └─────── 本地 git remote 双推 ──────────┘
                 origin / backup
```

**核心原则**：
1. 同一份代码，两个 git remote，两套 secrets，两个 Vercel 项目，两个 Supabase。
2. 备用流水线对生产**只读**（最多读 schema 同步用的 SQL 文件），绝不写。
3. 切换主备 = 改 DNS（如果绑了域名）或直接改链接。

---

## 二、准备步骤

### 2.1 在 163 GitHub 账号下建仓

1. 用 `yanhaocn2000@163.com` 登录 GitHub。
2. 新建空仓库 `silverconnect-global`（**Private**）。
3. **不要** fork 主仓库——fork 会把权限和 Actions 配额绑到主仓库 owner。要的是**独立镜像**。

### 2.2 本地加第二个 remote

```powershell
# 在 f:\Project\silverconnect-global
git remote add backup https://github.com/<163账号用户名>/silverconnect-global.git
git remote -v
# 应该看到:
#   origin  https://github.com/lesliezhili/silverconnect-global.git
#   backup  https://github.com/<163账号>/silverconnect-global.git
```

推送当前所有分支到 backup：

```powershell
git push backup --all
git push backup --tags
```

> 之后日常推送：`git push origin <branch>` 推主线，`git push backup <branch>` 推备用。
> 如想一次推两边，可以配 `git remote set-url --add --push origin <主仓库 URL>` + 加 backup URL，让 `git push origin` 同时推两个远端。**但不推荐**：CI 会被双触发，浪费配额。建议手动决定何时推 backup。

### 2.3 准备身份验证

163 账号的 GitHub 推送需要：
- **PAT (Personal Access Token)**：GitHub → Settings → Developer settings → PAT (classic 或 fine-grained)，勾 `repo` + `workflow`。
- 或 SSH key：`ssh-keygen -t ed25519 -C "yanhaocn2000@163.com" -f ~/.ssh/id_ed25519_163`，把公钥挂到 163 GitHub 账号。
- 推荐 SSH，避免和主账号 PAT 串。配 `~/.ssh/config`：

```
Host github-163
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_163
  IdentitiesOnly yes
```

然后 `git remote set-url backup git@github-163:<163账号>/silverconnect-global.git`。

---

## 三、Supabase 测试项目

### 3.1 创建

1. 用 163 邮箱（或任何邮箱，但建议和这条线绑同一身份）登录 Supabase。
2. 新建项目 `silverconnect-staging`，区域选离生产远的（如生产在 us-east，测试用 ap-southeast 之类，避免误连）。
3. 记录三件套：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`（Settings → Database → Connection string → URI，`pooler.supabase.com:6543` for serverless）

### 3.2 同步 schema

项目用 Drizzle，`drizzle.config.ts` 和 `db/schema/` 是单一事实来源。

```powershell
# 临时把测试库的 DATABASE_URL 设到环境
$env:DATABASE_URL = "postgresql://postgres.xxx:<pwd>@aws-0-xxx.pooler.supabase.com:6543/postgres"
npx drizzle-kit generate --name=staging-init
npx drizzle-kit migrate
```

或者直接 `npx drizzle-kit push` 一把推（仅适合空库，生产慎用）。

> 实际命令以 `package.json` scripts 和项目当前 drizzle-kit 版本为准——本文未逐一验证 `migrate` / `push` 在当前版本的行为。先看 [DEPLOYMENT.md](./DEPLOYMENT.md) 里现有的迁移流程，照搬指向 staging URL 即可。

### 3.3 种子数据（可选）

如有 `scripts/seed-*.ts`，跑一遍灌测试数据。**不要**从生产 dump 数据——里面有真实用户和 PII。

---

## 四、Vercel staging 项目

### 4.1 创建

1. 用 163 GitHub 账号登录 Vercel（首次会自动建一个 personal team）。
2. **Add New → Project → Import** 选 163 账号下的 `silverconnect-global`。
3. Framework: Next.js（vercel.json 已存在，会自动识别）。
4. **先不部署**，进 Settings 配环境变量。

### 4.2 环境变量

进 Vercel Project → Settings → Environment Variables，**Production / Preview / Development 都灌一遍**（或至少 Production + Preview）：

| 变量 | 值来源 |
|------|--------|
| `NODE_ENV` | `production`（Vercel 默认） |
| `NEXT_PUBLIC_APP_URL` | Vercel 分配的域名，如 `https://silverconnect-staging.vercel.app` |
| `NEXT_PUBLIC_APP_ENV` | `staging`（用来区分 Sentry 等） |
| `NEXT_PUBLIC_SUPABASE_URL` | 测试 Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 测试 Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | 测试 Supabase |
| `DATABASE_URL` | 测试 Supabase pooler URI |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_...`（在 Stripe 测试模式建一个新的 webhook 端点指向 staging 域名） |
| `JWT_SECRET` | 新生成一个 32+ 位随机串，**不要复用生产的** |
| `EMAIL_*` | 用一个测试 SMTP（或临时屏蔽邮件发送） |
| 其他可选（Sentry / GLM / Datadog / Twilio） | 测试或留空 |

参考完整变量列表：[../../.env.example](../../.env.example)。

### 4.3 拿到 Vercel ID

Vercel Project → Settings → General：
- `Project ID`（`prj_...`）
- `Team ID` / `Org ID`（`team_...` 或 personal `<username>`）

再到 Account → Tokens 创建一个 token，**仅授权这个 staging 项目**（如果 Vercel 支持 scoped token，否则就用 account-level，但定期轮换）。

---

## 五、备用仓库的 GitHub Actions

### 5.1 复用现有 workflow

主线已有 [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) 和 [.github/workflows/ci.yml](../../.github/workflows/ci.yml)。备用仓库使用同一份 workflow，部署也走 Vercel CLI（和主线机制一致），只是 secrets 指向 staging：

- `VERCEL_TOKEN` = staging token
- `VERCEL_PROJECT_ID` = staging project id

> ⚠ **Hobby 账号没有 team_xxx ORG ID**：personal scope 的 Vercel 项目（如 `yanhaoau-1392s-projects`），其 deploy.yml 不能再设 `env: VERCEL_ORG_ID`，否则 `vercel deploy` 会报 "Could not retrieve Project Settings"。
> 解决：把 deploy.yml 里 `env:` 块删掉（包含 `VERCEL_ORG_ID` 和 `VERCEL_PROJECT_ID`），改用 `vercel link --yes --project=<name> --token=...` 步骤生成 `.vercel/project.json`，后续 `vercel deploy` 自动读取。
> 实际改动见 backup repo `commit a064e08`。

这样 push 到 backup 的 main 分支，会自动跑 deploy.yml，部署到 staging 项目。

### 5.2 让 CI 也跑 DB 烟测（可选增强）

[ci.yml:43-50](../../.github/workflows/ci.yml#L43-L50) 提到一个待启用的 Phase 1 烟测占位。备用仓库正好适合启用：

1. 在 163 GitHub 仓库加 secret `SUPABASE_TEST_DB_URL` = 测试 Supabase 的 `DATABASE_URL`。
2. 给 ci.yml 加一个 job（**只在备用仓库跑**，可以用 `if: github.repository == '<163账号>/silverconnect-global'` 条件）：

```yaml
  smoke-db:
    if: github.repository == '<163账号>/silverconnect-global'
    runs-on: ubuntu-latest
    needs: schema-and-lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20.x, cache: npm }
      - run: npm ci
      - name: Smoke
        env:
          DATABASE_URL: ${{ secrets.SUPABASE_TEST_DB_URL }}
        run: npx tsx scripts/smoke-phase1.ts
```

> 主仓库因为没那个 secret，job 会被 `if` 跳过，不影响主线。

### 5.3 关掉备用仓库的 Cron（重要）

[vercel.json:10-23](../../vercel.json#L10-L23) 定义了三个 daily cron。**两个 Vercel 项目都开启会导致同样的业务逻辑跑两遍**——如果 cron 写共享数据（即使是不同 DB，也可能调外部 API、发邮件、扣 Stripe），就出事。

策略：
- **方案 A（推荐）**：备用 staging 项目在 Vercel Settings → Cron Jobs 里**手动暂停**全部 cron。需要演练时再开。
- **方案 B**：维护两份 vercel.json，备用分支用空 `crons: []`。维护成本高，不推荐。

### 5.4 Stripe webhook 双端点

Stripe webhook 不能广播到两个 URL。备用环境用 Stripe **test mode** 自己的 webhook：
- 测试模式 → Webhooks → Add endpoint → URL = `https://<staging域名>/api/webhooks/stripe`（项目固定路径，见 [API.md:127](./API.md#L127)）
- 拿 `whsec_test_...` 灌进 Vercel staging 的 `STRIPE_WEBHOOK_SECRET`
- 生产 webhook 不动

---

## 六、日常流程

### 6.1 正常开发

```powershell
git push origin feat/xxx       # 推主线，触发主线 CI
# 主线没问题、合并到 main 后再决定要不要镜像到 backup
git push backup main           # 同步到备用，触发 staging 部署
```

### 6.2 切流（生产挂了）

1. 确认 staging 项目最新 commit = 当前要服务的版本（如果落后就 `git push backup main`）。
2. 把生产域名 CNAME 切到 `<staging-project>.vercel.app`（DNS TTL 决定生效时间）。
3. 通知用户切到 test mode 支付（如果 Stripe webhook 还连 test，那这段时间生意是"演练"，没真钱）。
4. 同时修生产，修好后改回 DNS。

> ⚠ 切流到 staging = 用户连到的是测试 Supabase 和 Stripe test。**这只是"页面还能打开"的兜底，不是真业务连续性**。如果要真切流（保住交易），方案要升级——见第八节。

### 6.3 演练频率

每月一次：
- `git push backup main` 同步代码
- 打开 staging URL 走一遍核心流程（注册/登录/下单/AI 客服）
- 看 Vercel build log 和 Supabase logs 没新错
- 临时取消 cron 暂停，手动触发一次任务（Vercel → Cron Jobs → Run now），看是否完成，跑完再恢复暂停

---

## 七、Secrets 管理

| 文件 | 内容 | 是否进 git |
|------|------|------------|
| `.env.local` | 本机开发 | ❌ |
| `.env.staging.local` | 本机连 staging Supabase 调试用（建议新建） | ❌ |
| Vercel staging 环境变量 | 部署时使用 | ❌（Vercel dashboard） |
| GitHub 163 仓库 secrets | Actions 用 | ❌（GitHub） |

**绝不**把 `sk_live_`、生产 `SUPABASE_SERVICE_ROLE_KEY`、生产 `JWT_SECRET` 灌进 staging 任何地方。

---

## 八、未来可选升级

如果备用线不只是"演练"，要做真冗灾：

1. **共享数据库**：staging Vercel 也连生产 Supabase（高风险，需要严格的只读 / RLS 策略）。
2. **Stripe live 双 webhook**：在生产 Stripe 账号下给同一事件加第二个 endpoint 指向 staging 域名（Stripe 支持一个事件投递多个 endpoint）。但这意味着 staging 也会收到真支付事件，需要 staging 代码具备幂等去重，否则不要这么做。
3. **域名故障转移**：用 Cloudflare Load Balancer 或 Route53 health check 自动切换。
4. **数据复制**：Supabase 主从，或用第三方做 logical replication 到备用 Supabase。

这些都涉及成本和数据合规，先不做。

---

## 九、Checklist（执行时勾）

- [ ] 163 GitHub 账号建好，PAT/SSH 配好
- [ ] 在 163 账号下建 private repo `silverconnect-global`
- [ ] 本地加 `backup` remote，首次推送 `--all` + `--tags`
- [ ] Supabase 建 staging 项目，同步 Drizzle schema
- [x] Vercel 用 163 登录，导入备用仓库，灌环境变量（用 staging Supabase + Stripe test）
- [x] 拿 `VERCEL_TOKEN` / `PROJECT_ID`，配进 163 仓库 secrets（Hobby 个人 scope 不需要 `ORG_ID`，详见 5.1）
- [ ] **暂停 staging 项目的 cron jobs**
- [ ] Stripe test mode 加 webhook 端点，拿 `whsec_test_` 灌 Vercel
- [x] 推一次 backup main，看 deploy.yml 跑通，访问 staging 域名验证
- [ ] 走一遍核心流程（注册/登录/下单），无报错
- [x] 文档化两条线的 URL 和 owner（见下方第 11 节）

---

## 十、风险提示

1. **Cron 重复执行**——已在 5.3 节标注，部署完**第一件事**就是去 Vercel staging 暂停 cron。
2. **环境变量串号**——配 staging Vercel 时，逐项检查 URL/key 不是生产值。可以先全空白，再一项项粘。
3. **Stripe webhook 误触发**——staging 必须用 test mode；如果误把 live `whsec` 配进去，会把测试操作当成真支付走。
4. **GitHub Actions 配额**——免费账号每月 2000 分钟。两个仓库各跑 CI + deploy 会翻倍消耗。盯着 Settings → Billing → Actions usage。
5. **163 账号双因子**——务必开 2FA，否则丢了等于备用线落入他人手。

---

## 十一、部署事实档案（执行结果）

> 本节记录已完成的实际部署信息，便于后续维护和切流参考。

### 主线（生产）

| 项 | 值 |
|----|----|
| GitHub repo | https://github.com/lesliezhili/silverconnect-global |
| GitHub owner | yanhaoau@gmail.com |
| Vercel team | `team_V0iunB5JnKuPRw80UkiSNxFc` |
| Vercel project | `prj_mfwDqQusJ1UnEWr6ppat0yEv7Rwh` |
| Stripe | live keys |
| Supabase | 生产项目 |

### 备用线（staging）

| 项 | 值 |
|----|----|
| GitHub repo | https://github.com/yanhaocn2000/silverconnect |
| GitHub owner | yanhaocn2000@163.com |
| Vercel scope | `yanhaoau-1392s-projects`（Hobby 个人，无 team_xxx ORG ID） |
| Vercel project | `silverconnect` |
| **Staging URL** | https://silverconnect-one.vercel.app |
| 第一次成功部署 commit | `a064e08`（2026-05-07） |
| 修复点 | 删除 deploy.yml 的 `env: VERCEL_ORG_ID/VERCEL_PROJECT_ID` 块（个人 scope 与 team_xxx 不兼容） |
| Stripe | test mode keys |
| Supabase | 测试项目 |

### 探活记录（2026-05-07）

| 路径 | 状态 | 备注 |
|------|------|------|
| `/` | 200 | 自动跳到 `/en/home` |
| `/en/home` | 200 | i18n 中间件正常 |
| `/zh/home` | 200 | 中文路由 |
| `/en/auth/login` | 200 | 登录页渲染正常 |
| `/en/auth/register` | 200 | 注册页渲染正常 |

> ⚠️ 仅 GET 探活，未验证数据库连接、Stripe、邮件等动态功能。要真测得提交表单走核心流程。
