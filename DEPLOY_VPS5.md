# SilverConnect Global — VPS-5 部署手册

> 为接手部署的 AI 准备的可执行步骤手册。
> 目标服务器：**VPS-5 (47.236.169.73, Singapore, Ubuntu 24.04)**
> 项目本地路径：`F:\Project\silverconnect-global`
> 编写时间：2026-05-04

---

## 0. 部署目标

| 项 | 值 |
|---|---|
| 应用 | Next.js (Node 20)，本仓库 |
| 数据库 | PostgreSQL 15（容器，**自带，不用 VPS-3**） |
| 缓存 | Redis 7（容器） |
| 进程管理 | PM2（Next.js）/ Docker Compose（PG + Redis） |
| 反向代理 | nginx + Let's Encrypt（可选，二期） |
| 监听端口 | Next.js: `3000`，PG: `5432`（仅本机），Redis: `6379`（仅本机） |

---

## 1. VPS-5 现状（部署前已确认）

```
OS:       Ubuntu 24.04.4 LTS
RAM:      894 MB total / 512 MB available
Swap:     4096 MB total / 4027 MB free  ← 充裕
Disk:     30 GB total / 19 GB free
CPU:      2 核 / load 0.00
Docker:   ❌ 未安装（必须先装）
Node:     ❌ 未安装（必须先装）
UFW:      active，只开了 22/tcp（部署时需开 80/443）
现有服务: 无（仅 sshd + systemd-resolve）
```

> ⚠️ 注意：内存只有 894MB。**Next.js `npm run build` 峰值会到 1-1.5GB**，必须依赖 swap，或本地 build 后上传产物。本手册采用"服务器上 build + 限制 Node 堆"方案。

---

## 2. SSH 接入

```powershell
# 在本机 PowerShell（项目根目录）
ssh -i F:\Project\testspec\TV2ALL\tmp\vps5_key.pem `
    -o StrictHostKeyChecking=no `
    root@47.236.169.73
```

**注意**：VPS-5 只接受 publickey 认证（已在 sshd_config 禁用密码）。如果上一个 AI 把私钥贴到 transcript 了：

1. 登录后清理：`nano ~/.ssh/authorized_keys`，删掉对应那行
2. 本地重新生成 keypair：`ssh-keygen -t ed25519 -f ~/.ssh/silverconnect-deploy -C "silverconnect"`
3. 把新公钥推上去：`ssh -i <旧key> root@47.236.169.73 "echo '$(cat ~/.ssh/silverconnect-deploy.pub)' >> ~/.ssh/authorized_keys"`

> 但本次部署你**就用 `tmp\vps5_key.pem` 这把现成的 key 即可**，不用换。

---

## 3. 服务器初始化（一次性）

SSH 进 VPS-5 后**按顺序粘贴执行**，每段独立可重试：

### 3.1 系统更新 + 基础工具

```bash
apt update && apt -y upgrade
apt -y install curl git ca-certificates gnupg lsb-release ufw
```

### 3.2 安装 Docker + Docker Compose Plugin

```bash
# 官方源
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list
apt update
apt -y install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
docker --version && docker compose version  # 验证
```

### 3.3 安装 Node 20（NodeSource）

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt -y install nodejs
node -v   # 应显示 v20.x
npm -v
npm i -g pm2
```

### 3.4 防火墙：开放 80/443/3000

```bash
ufw allow 80/tcp comment "HTTP"
ufw allow 443/tcp comment "HTTPS"
ufw allow 3000/tcp comment "Next.js (临时直连，上线后建议关掉只走 nginx)"
ufw status numbered
```

> ⚠️ 别动 22/tcp 那条。如果 ufw 提示要重启 sshd 也别动。

---

## 4. 拉取仓库

> **关键决策**：本仓库目前在本地（`F:\Project\silverconnect-global`），是否已推到 GitHub？

### 情况 A：仓库在 GitHub 公开 / 你有 access

```bash
mkdir -p /opt
cd /opt
git clone https://github.com/<owner>/silverconnect-global.git silverconnect
cd silverconnect
```

### 情况 B：仓库只在本地（最常见）

在**本机 PowerShell** 打包后 scp 上去：

```powershell
# 本机执行
cd F:\Project\silverconnect-global
# 打包（排除 node_modules, .next, .git，避免几百 MB 浪费）
tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=.next-* `
    -czf F:\silverconnect.tar.gz .

scp -i F:\Project\testspec\TV2ALL\tmp\vps5_key.pem `
    F:\silverconnect.tar.gz root@47.236.169.73:/opt/
```

回到 VPS-5：

```bash
mkdir -p /opt/silverconnect
cd /opt/silverconnect
tar -xzf /opt/silverconnect.tar.gz
rm /opt/silverconnect.tar.gz
ls -la   # 确认 package.json, docker-compose.yml, app/ 都在
```

---

## 5. 配置 `.env`

```bash
cd /opt/silverconnect
cp .env.example .env
nano .env
```

**最小可跑配置**（其他第三方 key 上线前再补）：

```ini
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://47.236.169.73:3000   # 后续换域名

# 本机 Docker 起的 PG（密码改一个强随机的！）
DB_NAME=silverconnect
DB_USER=silverconnect
DB_PASSWORD=<生成强密码，例如 openssl rand -base64 24>
DB_HOST=localhost
DB_PORT=5432
DATABASE_URL=postgres://silverconnect:<上面的密码>@localhost:5432/silverconnect

REDIS_URL=redis://localhost:6379

# Supabase / Stripe / Email 等：开发模式留空或填 test key，上线前再换真实值
```

> 生成密码：`openssl rand -base64 24`
> 把 `.env` 权限收紧：`chmod 600 .env`

---

## 6. 启动数据库 + Redis

仓库自带 `docker-compose.yml`，直接用：

```bash
cd /opt/silverconnect
# 只起 postgres + redis，mailhog 生产不需要
docker compose up -d postgres redis
docker compose ps    # 都应该 healthy
```

确认 PG 能连：

```bash
docker compose exec postgres psql -U silverconnect -d silverconnect -c "\dt"
```

如果有 schema migration 脚本：

```bash
# 仓库提供的迁移命令
npm ci   # 先装依赖才能跑 migrate
npm run db:migrate
# 如需种子数据
npm run db:seed
```

> ⚠️ `docker-compose.yml` 默认把 `lib/schema.sql` 挂载到 `/docker-entrypoint-initdb.d/`，**首次启动**会自动执行。如果跑过 `db:migrate`，看哪个是真正的 source of truth，二选一别重复。

---

## 7. 构建 Next.js

### 7.1 装依赖

```bash
cd /opt/silverconnect
npm ci    # 用 lock 文件，约 3-5 分钟
```

### 7.2 构建（控制内存峰值）

```bash
# 限制 Node 堆 1GB，配合 swap 不会 OOM
NODE_OPTIONS="--max-old-space-size=1024" npm run build
```

> 如果 build 中途被 kill（`Killed` 字样），是 OOM。两个救法：
> 1. 降到 `--max-old-space-size=768`，让出更多给 swap buffer
> 2. **本地 build 完上传 `.next` 目录**（推荐，build 在自己 PC 上更快）：
>    ```powershell
>    # 本地 build
>    cd F:\Project\silverconnect-global
>    npm ci; npm run build
>    tar -czf F:\dotnext.tar.gz .next
>    scp -i ... F:\dotnext.tar.gz root@47.236.169.73:/opt/silverconnect/
>    # 服务器解压
>    ssh ... "cd /opt/silverconnect && tar -xzf dotnext.tar.gz && rm dotnext.tar.gz"
>    ```

---

## 8. 启动 Next.js（PM2 守护）

```bash
cd /opt/silverconnect
pm2 start npm --name silverconnect \
    --max-memory-restart 600M \
    -- start
pm2 save
pm2 startup systemd -u root --hp /root   # 跟随开机
# ↑ 命令末尾它会输出一行 sudo env PATH=... 让你执行，照办即可
```

### 检查

```bash
pm2 status
pm2 logs silverconnect --lines 50

# 本机 curl 验证
curl -I http://localhost:3000
# 外网验证（在你本机）
curl -I http://47.236.169.73:3000
```

---

## 9. 验收清单

- [ ] `pm2 status` 显示 silverconnect 为 `online`
- [ ] `docker compose ps` 显示 postgres、redis 都 `healthy`
- [ ] `curl http://localhost:3000` 返回 200 / 重定向
- [ ] 浏览器打开 `http://47.236.169.73:3000`，首页能渲染
- [ ] `pm2 logs silverconnect` 无持续报错
- [ ] `free -m` 中 `available` ≥ 100MB（不爆内存）
- [ ] `df -h /` 中可用 ≥ 5GB（留余地）

---

## 10. 常见踩坑

| 现象 | 原因 | 修法 |
|------|------|------|
| `npm run build` 中途被 `Killed` | OOM | 降 `--max-old-space-size`，或本机 build 后上传 `.next` |
| `pm2 logs` 报 `ECONNREFUSED 127.0.0.1:5432` | PG 还没起来 / `.env` 密码不对 | `docker compose ps` 看健康，`.env` 与 compose 用同一密码 |
| 浏览器访问 :3000 超时 | UFW 没放行 | `ufw allow 3000/tcp` |
| 端口被占 | 不太可能（VPS-5 几乎空机） | `ss -tlnp \| grep 3000` 看是谁 |
| `docker compose up` 报权限 | 用了非 root | 本手册全程 `root`，按手册即可 |
| `npm ci` 卡 GitHub | Singapore 出口对 GitHub 一般 OK | 加 `npm config set registry https://registry.npmmirror.com` 试 |
| Hermes Cron 抢资源 | VPS-5 是 Hermes 节点 | `crontab -l` 看，必要时让 Howard 协调时段 |

---

## 11. 二期增强（不影响初次上线，按需做）

1. **域名 + HTTPS**：参考 TV2ALL 的 Vaultwarden 模式 —— AWS-1 nginx 反代 → VPS-5:3000，Let's Encrypt 自动续期。需要 Howard 提供域名。
2. **关闭 :3000 直连**：`ufw delete allow 3000/tcp`，只允许 AWS-1 IP（`15.134.38.42`）访问。
3. **加入 auto_inspection 监控**：在 VPS-2 的 `/opt/tv2all/auto_inspection/auto_inspection.py` 里加一条 VPS-5 :3000 健康检查（参考现有写法）。需要把 inspector key 公钥加到 VPS-5 的 `~/.ssh/authorized_keys`。
4. **PG 备份**：`pg_dump` cron 到 VPS-3 `/opt/backups/silverconnect/`（参考 Vaultwarden 备份脚本结构）。

---

## 12. 回滚

如果部署失败要彻底清理：

```bash
pm2 delete silverconnect 2>/dev/null
cd /opt/silverconnect && docker compose down -v 2>/dev/null
rm -rf /opt/silverconnect
ufw delete allow 3000/tcp
ufw delete allow 80/tcp
ufw delete allow 443/tcp
```

---

## 13. 报告格式

部署完成后向 Howard 汇报，请包含：

```
✅ 部署完成
- URL: http://47.236.169.73:3000
- PG: silverconnect@localhost:5432  (Docker 容器)
- Redis: localhost:6379  (Docker 容器)
- 进程: PM2 silverconnect (online, 内存 X MB)
- 当前 VPS-5 资源: free -m / df -h 输出
- 已知遗留: <例如 Stripe key 还是 test 模式 / 没配域名 / .env 里 X 项是占位>
```

---

**禁止动作**：
- ❌ 不要碰 VPS-3 的 PostgreSQL（TV2ALL 交易主库）
- ❌ 不要在 VPS-1/2/4/CN-1/CN-2 上跑这个项目
- ❌ 不要修改 VPS-5 的 sshd_config
- ❌ 不要把 `.env` 提交到 git
- ❌ 不要把私钥贴到对话里 / 日志里
