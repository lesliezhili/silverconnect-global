# 从 Vercel 迁回 VPS 部署方案

**日期**：2026-05-10
**目标**：把生产流量从 `https://silverconnect-one.vercel.app/` 切回 `http://47.236.169.73`，因 Vercel 体验不佳。
**最终架构**：VPS 承担主站全部流量；Vercel 项目精简为只承担将来 Stripe 接入用的 `/api/stripe/webhook` 与 `/[locale]/pay/*` 支付页（HTTPS 着陆点）。

---

## 1. 现状盘点

| 项 | 当前值 |
|---|---|
| 生产 URL | `https://silverconnect-one.vercel.app/` |
| Vercel ORG_ID | `team_V0iunB5JnKuPRw80UkiSNxFc` |
| Vercel PROJECT_ID | `prj_mfwDqQusJ1UnEWr6ppat0yEv7Rwh` |
| 旧 VPS | `http://47.236.169.73`（Ubuntu + nginx + PM2 + Node 20，按 [docs/DEPLOY_VPS.md](../DEPLOY_VPS.md) 已跑通） |
| CI/CD | [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml) push to main → `vercel deploy --prod` |
| Stripe | 代码尚未真正调 Stripe SDK（无 `import 'stripe'`、无 `app/api/stripe/*` 路由）；`pay/[bookingId]/page.tsx` 是 UI mock |
| Supabase | 生产库 `ukgolkaejlfhcqhudmve`（aws-1-ap-southeast-1，Transaction Pooler 6543），与部署无关，不动 |

**应用代码的 Vercel 锁定**：仅 `package.json` 有 `@vercel/analytics` 依赖（无实际 import），`vercel.json` 只配 `maxDuration: 60` + 空 `crons`。代码层无迁移阻塞。

---

## 2. 架构

```
                ┌────────────── 用户 ──────────────┐
                │                                  │
    主流量                                  支付/webhook 流量
                │                                  │
                ▼                                  ▼
    http://47.236.169.73             https://<vercel-pay-domain>
        (VPS, PM2 + nginx)                  (Vercel)
        ├ 全部 UI                            ├ /[locale]/pay/*
        ├ 全部 /api/* (除 stripe)            └ /api/stripe/webhook
        └ /api/cron/* (cron job)                  ↑
                                          Stripe → 这里发 webhook
```

**跨站交互**：
- 主站发起支付时，前端 `window.location.href = "https://<vercel-pay-domain>/zh/pay/<bookingId>?return=http://47.236.169.73/zh/bookings/<id>/success"` 跳过去
- 支付完成后 Vercel 端 `redirect` 回主站 success 路由
- 不用 iframe（Stripe Elements / Checkout 不允许在 iframe 里嵌套，CSP 也会拦）

---

## 3. 改动清单

### 3.1 仓库代码改动（PR 合 main 即生效）

| 文件 | 改动 | 说明 |
|---|---|---|
| `.github/workflows/deploy.yml` | 重写为 SSH → VPS 部署 | 见 §3.2 |
| `.github/workflows/deploy-vercel-pay.yml`（新增） | 仅当 `app/[locale]/pay/**` 或 `app/api/stripe/**` 改动时部署 Vercel | 见 §3.3 |
| `vercel.json` | 不改（保留 `maxDuration` 给将来 webhook 用） | — |
| `package.json` | 删除 `@vercel/analytics` 依赖（无实际使用） | 顺手清理（可独立 PR） |
| `docs/zh/DEPLOYMENT.md` | 更新部署目标说明 | 文档同步，最后做 |

### 3.2 部署流程（本地直推）

> **2026-05-10 决策**：实际采用本地 PowerShell 脚本 [scripts/deploy.ps1](../../scripts/deploy.ps1) 直推 VPS，GitHub Actions workflow 退役为 `workflow_dispatch`-only 的备份通路。决策原因见 [vercel-to-vps-handoff-report.md §10](vercel-to-vps-handoff-report.md#10-部署通道决策)。

日常用法：

```powershell
.\scripts\deploy.ps1                  # 全量部署
.\scripts\deploy.ps1 -SkipBuild       # 跳过 build 重推 .next
.\scripts\deploy.ps1 -DryRun          # 只 build + tar，不推
```

下文描述的是**等价的 CI 通路**（[.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)），多人协作 / 上线时可恢复。

**为什么不在 VPS 上 build**：VPS 894MB RAM（剩 74MB），本地 build 太挤。改成在 build 端（本机或 GitHub runner）跑 `npm ci + npm run build`，把 `.next` 产物 SCP 到 VPS，VPS 只装 production 依赖 + `pm2 reload`。

实际实现见 [.github/workflows/deploy.yml](../../.github/workflows/deploy.yml)。要点：

- runner 先 SCP `.env.local` 从 VPS 拉到本地（用于 build 时把 `NEXT_PUBLIC_*` 烘进 client bundle）
- build 完打 tar：`.next` + `public` + `package.json` + `package-lock.json` + `next.config.ts` + `i18n` + `messages` + `drizzle*` + `lib` + `components` + `app`
- SCP 到 VPS `/tmp/sc-deploy.tar.gz`
- VPS 端：保留旧 `.next` 为 `.next.prev`（一键回滚），解压新 tar，`npm ci --omit=dev`，`pm2 reload silverconnect --update-env`
- 自动健康检查：reload 后 3 秒 curl `/zh/home`，非 200 自动回滚
- 清理：runner 上的 `.env.local` 和 SSH key 在 `if: always()` 步骤删掉

新需要的 GitHub Secrets（一个）：
- `VPS_SSH_KEY` —— ed25519 私钥，对应公钥写在 VPS `root@47.236.169.73:~/.ssh/authorized_keys`

VPS_HOST / VPS_USER / VPS_PATH 不是 secret，硬编码在 workflow 的 `env` 里。

可选移除的旧 Secrets：`VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`（保留以备 §3.3 支付子站用）。

### 3.3 新的 deploy-vercel-pay.yml（仅支付路径）

```yaml
name: Deploy Vercel (pay subset)

on:
  push:
    branches: [main]
    paths:
      - 'app/**/pay/**'
      - 'app/api/stripe/**'
      - 'vercel.json'
  workflow_dispatch:

env:
  VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20.x, cache: npm }
      - run: npm install --global vercel@latest
      - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

> 注意：当前 Vercel 项目部署的是整个仓库。短期最简方案是**继续整仓部署**到 Vercel，但流量上只有 `/pay/*` 与 `/api/stripe/*` 经它（通过 nginx 不反代这些路径来强制走 Vercel 域名）。等后续真上 Stripe 时，再考虑用 Vercel 的 `Ignored Build Step` 或独立子项目缩范围。

### 3.4 VPS 侧现状（2026-05-10 实测）

VPS `47.236.169.73` 已基本跑通，**不需要重新初始化**：

| 项 | 状态 |
|---|---|
| OS | Ubuntu 24.04.4 LTS |
| Node / npm | v20.20.2 / 10.8.2 |
| PM2 | 7.0.1，进程 `silverconnect` 已 online（fork mode，PORT=3000） |
| nginx | 1.24.0，site `silverconnect` 已启用 |
| ufw | 22 / 80 / 443 全开 |
| swap | 4G（已加） |
| 内存 | 894MB total（紧张，仅作运行用，build 不在 VPS 跑） |
| `/opt/silverconnect` | 散文件 rsync 来的，**不是 git 仓库**（与 build-in-CI + SCP 流程兼容，无需 git） |
| `.env.local` | ✅ 已补 `SESSION_COOKIE_SECURE=false`、`CRON_SECRET=<64hex>`，`NEXT_PUBLIC_APP_URL` 改为 `http://47.236.169.73`；备份在 `.env.local.bak.current` |
| 站点健康 | `curl http://localhost:3000/zh/home` → 200，`curl http://47.236.169.73/zh/home` → 200 |

**注意**：`NEXT_PUBLIC_APP_URL` 是 build-time 烘进 client bundle 的，当前 PM2 跑的是 May 5 build（旧值 `localhost:3000`）。下次走 §3.2 工作流部署后才生效。

### 3.5 Cron 处理

Vercel `vercel.json.crons` 当前为空数组，无 Vercel cron 任务运行，**但代码里有** `app/api/cron/cancel-stale`、`recurring-bookings`、`sla-disputes` 三个端点。

VPS 上需要补 systemd timer 或 crontab 调用这些路径（带 `Authorization: Bearer $CRON_SECRET`）：

`/etc/cron.d/` 文件只支持 `KEY=value` 形式声明环境变量，不展开 shell 变量，所以采用脚本封装：

```bash
# /opt/silverconnect/scripts/cron-call.sh
#!/usr/bin/env bash
set -euo pipefail
source /opt/silverconnect/.env.local   # 读取 CRON_SECRET
curl -fsS -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000$1" > /dev/null
```

```bash
chmod 700 /opt/silverconnect/scripts/cron-call.sh
chown root:root /opt/silverconnect/scripts/cron-call.sh

# /etc/cron.d/silverconnect
*/15 * * * * root /opt/silverconnect/scripts/cron-call.sh /api/cron/cancel-stale
0    * * * * root /opt/silverconnect/scripts/cron-call.sh /api/cron/recurring-bookings
*/30 * * * * root /opt/silverconnect/scripts/cron-call.sh /api/cron/sla-disputes
```

频率可按业务调整，落地前看每个 route handler 的实际幂等性与耗时。

---

## 4. 切换流程（按顺序执行）

✅ = 已完成；🟡 = 需用户操作；⏸ = 等前置完成

| 步 | 动作 | 状态 |
|---|---|---|
| 1 | VPS env 补齐（`SESSION_COOKIE_SECURE` / `CRON_SECRET` / 修 `NEXT_PUBLIC_APP_URL`） | ✅ 2026-05-10 已做 |
| 2 | 本地仓库 `.github/workflows/deploy.yml` 改写为 build-in-CI + SCP | ✅ 同上 |
| 3 | 生成新部署 keypair（不要复用聊天里贴过的 RSA key） | 🟡 见报告 §3 |
| 4 | 把新公钥写入 VPS `~/.ssh/authorized_keys`，删旧 key 行 | 🟡 见报告 §3 |
| 5 | `gh secret set VPS_SSH_KEY < <新私钥>`（GitHub repo secret） | 🟡 见报告 §3 |
| 6 | 分支 reorg：`main → legacy-old`，`feat/ui-rebuild → main`（GitHub） | 🟡 见报告 §4 |
| 7 | push 触发 Workflow，自动 build → SCP → reload | ⏸ |
| 8 | 浏览器访问 `http://47.236.169.73/zh/home` 验证新 build 上线 | ⏸ |
| 9 | 安装 cron 脚本 + `/etc/cron.d/silverconnect`（§3.5） | 🟡 见报告 §5 |
| 10 | Vercel 项目改名 `silverconnect-pay`（避免误访问），dashboard 加 password protection | 🟡 见报告 §6 |
| 11 | 通知客户新地址 `http://47.236.169.73`，旧 Vercel URL 弃用 | 🟡 见报告 §6 |

---

## 5. 回滚方案

任意一步失败可立即回滚：

- **CI/CD 回滚**：`git revert` 改回 `deploy.yml`，main push → 自动回到 Vercel 部署
- **DNS / URL 回滚**：通知用户暂时仍用 Vercel URL，VPS 不影响 Vercel 自身（双站并存）
- **VPS 状态保护**：`pm2 reload`（不是 restart）保证零停机；构建失败时 `npm run build` 报错但 PM2 仍跑老版本

回滚窗口建议保留 **7 天**，期间不删除 Vercel 项目。

---

## 6. 风险与已知坑

| 风险 | 缓解 |
|---|---|
| VPS 单点故障，无 CDN | 演示阶段可接受；上线大流量再考虑 nginx + Cloudflare |
| 裸 IP + HTTP 下 iron-session 的 `Secure` cookie 写不进浏览器 | [lib/auth/session.ts:38](../../lib/auth/session.ts#L38) 已有转义阀，VPS `.env.local` 设 `SESSION_COOKIE_SECURE=false`。**长期建议绑域名上 HTTPS**，否则裸 HTTP session 易被窃听 |
| Supabase Transaction Pooler 已 OK，但需确认 VPS 出口 IP 在 Supabase Network Restrictions 白名单（如有） | Supabase dashboard → Settings → Network 确认 |
| `npm ci` 在低内存 VPS 上 OOM | `NODE_OPTIONS=--max-old-space-size=4096`；不够则加 swap（DEPLOY_VPS.md §11.1） |
| 客户已用 Vercel URL 收藏 | 在 Vercel 项目根加重定向到 VPS（仅 `/`，不影响 `/pay`） |
| `@vercel/analytics` 没用但留在依赖里 | 不影响功能，按 §3.1 选择性清理 |
| Vercel 与 VPS 代码版本会随时间漂移 | Vercel 仅在 `app/**/pay/**` / `app/api/stripe/**` / `vercel.json` 变动时重新部署；其余共享代码（schema、auth、i18n）若大改，建议 `workflow_dispatch` 手动触发一次 Vercel 同步 |
| GitHub Actions runner IP 出口需被 VPS SSH 允许 | 默认 22 端口对外开放即可；若有 ufw 限制需放行 GitHub Actions IP 段或换走自托管 runner |

---

## 7. 决策点（已确认）

- ✅ Stripe webhook 留 Vercel，主站 VPS（用户决定）
- ✅ Vercel 项目保留作支付落地，不删除
- ✅ VPS 部署方式：PM2 + nginx（沿用 DEPLOY_VPS.md）

## 8. 待用户提供

- VPS SSH 用户名（默认假设 `root`）
- 是否已有部署专用 keypair；如无，本地 `ssh-keygen -t ed25519 -f ~/.ssh/silverconnect-deploy` 生成后把公钥推到 VPS
- 是否需要域名 + HTTPS（如要，加 §6 提到的 cookie secure 问题就一并解决）

---

*文档生成时间：2026-05-10*
