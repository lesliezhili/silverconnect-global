# 部署到测试服（silverconnect-one.vercel.app）

> 一次完整部署的可复制流程。读完直接照做即可。
> 测试服 URL：https://silverconnect-one.vercel.app
> 生产 URL：另一个 Vercel 项目（不在本流程范围）

---

## 0. 前置事实

仓库有两个 git remote：

| remote | URL | 用途 |
|--------|-----|------|
| `origin` | `https://github.com/lesliezhili/silverconnect-global.git` | 主线（生产） |
| `backup` | `https://github.com/yanhaocn2000/silverconnect.git` | 备用线（测试服） |

**触发逻辑**：
- backup 仓的 `.github/workflows/deploy.yml` 监听 `push` 到 `main` → 自动跑 production 部署 → 更新 `silverconnect-one.vercel.app`。
- 因此"部署到测试服" = "把代码 push 到 `backup` 远程的 `main` 分支"。

**关键差异**（必须知道，否则 CI 会红）：
- backup 仓的 `deploy.yml` 删掉了 `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` 的 `env:` 块（它的 Vercel scope 是 personal/Hobby，带这两个 env 会报 `Could not retrieve Project Settings`）。
- backup 仓的 `vercel.json` 把 `crons` 清空（避免和生产 cron 重复跑）。
- 这些差异以 commit 形式存在于 backup/main，不在 origin/main 上。所以 **不能直接把 origin 分支 force push 到 backup/main**——会丢这些 fix。

---

## 1. 完整流程（5 步）

### Step 1：本地确认改动

```bash
git status --short        # 看清楚哪些文件改了
git diff                  # 复核 diff
npm run lint              # 必须 0 errors
npm run build             # 必须 compiled successfully
```

> `npm run build` 在某些项目上会报一个固定的 `.next/dev/types/validator.ts` 类型错误，那是 Next 16 dev validator 的预存问题，与本次改动无关——只要"Compiled successfully"出现过就算通过。

### Step 2：精确提交（只提交本次任务相关文件）

```bash
git add <file1> <file2> ...
git status --short        # 再次确认 staged 列表
git commit -m "<type>(<scope>): <subject>

<body>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

提交规范：
- 标题：祈使句、≤ 72 字、`<type>(<scope>): <subject>` 格式（type ∈ feat/fix/chore/docs）
- body：解释 why，不解释 what
- **不要**用 `git add -A` / `git add .`，会把无关的临时文件、IDE 配置一起带上

### Step 3：与 backup/main 同步（处理分叉）

```bash
git fetch backup
git log --oneline backup/main..HEAD     # HEAD 比 backup/main 多哪些
git log --oneline HEAD..backup/main     # backup/main 比 HEAD 多哪些
```

若 backup/main 有 HEAD 不在的 commit（绝大多数情况都会），**必须** merge 进当前分支：

```bash
git merge backup/main --no-ff -m "Merge backup/main into <branch> for staging deploy"
```

`--no-ff` 保留合并 commit，方便后续看是哪次 merge 引入的 backup-specific 改动。

> 不要用 cherry-pick + force push 的"省事"路径——会丢失 backup 仓的 deploy.yml fix 和 cron 禁用 commit，下次部署直接 CI 红。

### Step 4：推送触发部署

```bash
git push backup HEAD:main
```

`HEAD:main` 把当前分支顶端推到 backup 远程的 main。

> ⚠ 这是直接推 main，**Auto Mode 下会被分类器拦截**，需要用户显式授权。
> ⚠ 不要加 `--force`。如果非 fast-forward，先做 Step 3 的 merge。

### Step 5：验证部署成功

三个检查并行做：

```bash
# 1) Actions 状态（无 gh CLI 时直接看网页）
open https://github.com/yanhaocn2000/silverconnect/actions

# 2) /login 短链（应跳到 /<locale>/auth/login，看到 Tab）
curl -sIL https://silverconnect-one.vercel.app/login | grep -i location

# 3) /p 短链（应跳到 /<locale>/auth/login?role=provider）
curl -sIL https://silverconnect-one.vercel.app/p | grep -i location
```

预期：
- Actions 上 `CI` 和 `Deploy to Vercel` 两个 workflow 都 ✓ Success
- `/login` 重定向到 `/en/auth/login`（或 cookie/Accept-Language 选定的 locale）
- `/p` 重定向到 `/en/auth/login?role=provider`
- 浏览器打开两个 URL 检查 UI（Tab、标题、注册链接）符合预期

部署一般 **3 分钟内** 完成（Vercel build 1~2 分钟 + 上传 30 秒）。

---

## 2. 失败排查（按概率从高到低）

### 2.1 `vercel deploy` 报 "Could not retrieve Project Settings"

**原因**：deploy.yml 里残留了 `VERCEL_ORG_ID` env，但 backup Vercel 是 personal scope。
**修复**：确认你 push 的内容里 `.github/workflows/deploy.yml` 是 backup 版本（无 `env: VERCEL_ORG_ID:` 行）。如果是从 origin 拉的代码忘了 merge backup/main，回去做 Step 3。

### 2.2 build 阶段失败 / 缺环境变量

**原因**：Vercel staging 项目缺某个 runtime env（`STRIPE_*` / `SUPABASE_*` / `JWT_SECRET` 等）。
**修复**：登 vercel.com → silverconnect 项目 → Settings → Environment Variables → Production scope 对照 `.env.example` 补齐。**不要** 把 `sk_live_` 灌进 staging（staging 用 test mode keys）。

### 2.3 push 时 `non-fast-forward`

**原因**：跳过了 Step 3。
**修复**：回去做 `git fetch backup && git merge backup/main`。**不要** `--force`。

### 2.4 部署成功但页面 500

**原因**：99% 是 Supabase RLS 或 env 问题。
**排查**：Vercel → silverconnect → Logs → Runtime，看具体堆栈。

---

## 3. 回滚

backup Vercel 项目 → Deployments → 找上一个 ✓ Ready 的 → "..." → Promote to Production。
代码层面无需动 git；下次再 push backup/main 时新 commit 会自然成为最新部署。

---

## 4. 不要做的事

- ❌ `git push backup main --force`：丢失 backup-specific commits
- ❌ 跳过 Step 1 的 lint/build：CI 会替你跑，但 push 后再红就要再 push 一遍
- ❌ 在 staging 灌生产 secret：测试服一旦泄露就是全公司事故
- ❌ 在 staging 改了 cron 后忘了在 Vercel UI 暂停（参考 `vercel.json` 的 backup 版本是空数组）
- ❌ 用 origin 的 `main` 直接推 `backup/main`：origin/main 上没有 backup 的 deploy.yml fix

---

## 5. 一行速查

```bash
# 标准流程（已 commit、已和 backup/main 同步后）
git push backup HEAD:main && open https://github.com/yanhaocn2000/silverconnect/actions
```
