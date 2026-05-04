# SilverConnect — VPS 部署指南（SSH + nginx + PM2）

**目标**：把 `feat/ui-rebuild` 分支部署到一台 Ubuntu/Debian VPS，让客户用 `http://<server-ip>` 直接访问，0 端口号。

**时间预估**：5–10 分钟（首次安装 Node + nginx 慢一点）。

**前置假设**：
- 服务器跑 Ubuntu 20.04+ 或 Debian 11+，有 root SSH 访问
- 服务器至少 1 GB RAM、5 GB 磁盘空闲
- 防火墙允许 22 / 80（443 if HTTPS）出入

---

## 0. 安全先行 ⚠️

### 0.1 私钥处置

如果是**聊天/transcript/截图里贴过的 private key**，永远视为已泄露：

```bash
# 在服务器上 — 撤销这把公钥
nano ~/.ssh/authorized_keys
# 删掉对应那一行（认指纹或 comment），保存
```

### 0.2 生成新部署专用 keypair（强烈推荐）

在**你的本机**：

```bash
ssh-keygen -t ed25519 -f ~/.ssh/silverconnect-deploy -N "" \
  -C "silverconnect deploy $(date +%F)"

# 用旧 key（如果还能用）把新公钥推上去
ssh -i <旧key路径> root@<server-ip> \
  "echo '$(cat ~/.ssh/silverconnect-deploy.pub)' >> ~/.ssh/authorized_keys"

# 或者 SCP 上去再追加
scp -i <旧key> ~/.ssh/silverconnect-deploy.pub root@<server-ip>:/tmp/
ssh -i <旧key> root@<server-ip> "cat /tmp/silverconnect-deploy.pub >> ~/.ssh/authorized_keys"
```

之后**只**用 `~/.ssh/silverconnect-deploy` 登录，旧 key 删掉。

### 0.3 文件权限

```bash
chmod 600 ~/.ssh/silverconnect-deploy
chmod 644 ~/.ssh/silverconnect-deploy.pub
```

Windows OpenSSH：

```powershell
icacls "$env:USERPROFILE\.ssh\silverconnect-deploy" /inheritance:r /grant:r "$($env:USERNAME):(R)"
```

---

## 1. 服务器初始化（一次性）

SSH 进去：

```bash
ssh -i ~/.ssh/silverconnect-deploy root@<server-ip>
```

### 1.1 系统包

```bash
apt-get update
apt-get install -y curl git nginx ufw
```

### 1.2 Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node -v   # 期望 v20.x
npm -v
```

### 1.3 PM2（保活进程管理）

```bash
npm install -g pm2
pm2 -v
```

### 1.4 防火墙

```bash
ufw allow 22/tcp     # 不要锁死 SSH
ufw allow 80/tcp
ufw allow 443/tcp    # 如果以后上 HTTPS
ufw --force enable
ufw status
```

---

## 2. 代码上传（三选一）

项目目录约定：`/opt/silverconnect`

```bash
mkdir -p /opt/silverconnect && cd /opt/silverconnect
```

### 选项 A — Git clone（如果分支已 push 到 GitHub fork 且公网可读）

```bash
git clone -b feat/ui-rebuild https://github.com/<你的用户名>/silverconnect-global.git .
```

如果是 private 仓库，要么用 deploy key（GitHub repo settings → Deploy keys），要么用 PAT（personal access token）：

```bash
git clone -b feat/ui-rebuild https://<github用户名>:<PAT>@github.com/<owner>/silverconnect-global.git .
```

### 选项 B — Rsync 从本机推（不需要 push 到 GitHub）

在**本机**（Linux/Mac/WSL）：

```bash
cd /f/Project/silverconnect-global  # 你的本地路径
rsync -avz --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude '.env*' \
  --exclude .design-handoff \
  -e "ssh -i ~/.ssh/silverconnect-deploy" \
  ./ root@<server-ip>:/opt/silverconnect/
```

Windows PowerShell 没有原生 rsync，用 `scp + tar` 替代：

```powershell
# 本机
cd F:\Project\silverconnect-global
git archive --format=tar.gz feat/ui-rebuild -o $env:TEMP\silverconnect.tar.gz
scp -i $env:USERPROFILE\.ssh\silverconnect-deploy `
    $env:TEMP\silverconnect.tar.gz `
    root@<server-ip>:/tmp/silverconnect.tar.gz

# 服务器
ssh -i $env:USERPROFILE\.ssh\silverconnect-deploy root@<server-ip>
cd /opt/silverconnect
tar xzf /tmp/silverconnect.tar.gz
rm /tmp/silverconnect.tar.gz
```

### 选项 C — Git push 到服务器上的 bare repo（最干净，长期推荐）

服务器：

```bash
mkdir -p /srv/git/silverconnect.git
cd /srv/git/silverconnect.git
git init --bare
```

本机：

```bash
git remote add deploy ssh://root@<server-ip>/srv/git/silverconnect.git
git push deploy feat/ui-rebuild
```

服务器 `/opt/silverconnect`：

```bash
cd /opt/silverconnect
git clone /srv/git/silverconnect.git .
git checkout feat/ui-rebuild
```

之后每次更新只需在服务器跑 `git pull && npm run build && pm2 restart silverconnect`。

---

## 3. 环境变量

```bash
cd /opt/silverconnect
nano .env.local
```

最小可演示集（**仅 UI demo，不联后端**，访客可能看到 500 在涉及 API 的页面）：

```dotenv
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=http://<server-ip>
```

完整生产集（如果要 auth + 支付能跑）：

```dotenv
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://<your-domain>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # 仅服务端

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# AI 服务（FastAPI）
AI_SERVICE_URL=http://<server-ip>:8001
```

```bash
chmod 600 .env.local
```

> **看视觉演示就行**：跳过完整环境变量；后端 API 路由（`app/api/**`）会 500，但所有 Sprint 1 + P2 的 UI 页面（home / services / providers / booking 向导 / pay UI / success / 评价 / 争议 / help / 紧急覆盖 / profile + 子页 stub / auth 表单）都是 mock 数据 SSR，渲染没问题。

---

## 4. 安装依赖 + 构建

```bash
cd /opt/silverconnect
npm install --no-audit --no-fund
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

预期输出：`✓ Compiled successfully` + 路由清单。如果失败，看「7. 故障排查」。

---

## 5. PM2 启动

```bash
cd /opt/silverconnect
PORT=3000 pm2 start npm --name silverconnect -- run start

# 状态
pm2 status
pm2 logs silverconnect --lines 30

# 开机自启
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash
pm2 save
```

健康检查：

```bash
curl -I http://localhost:3000/zh/home
# 期望: HTTP/1.1 200 OK
```

如果回 200，进 nginx；非 200 看 `pm2 logs silverconnect`。

---

## 6. nginx 反代 80 → 3000

```bash
cat > /etc/nginx/sites-available/silverconnect <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Next.js 静态资源透传 + gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/javascript application/xml+rss image/svg+xml;
    gzip_min_length 1024;

    # 大上传（评价照片、争议证据）
    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;

        # IMPORTANT: Next.js builds 30x Location headers from req.url, which
        # carries the upstream :3000. Without these rewrites the browser
        # gets redirected to http://host:3000/x and ufw blocks port 3000,
        # so the site appears unreachable. These three lines strip :3000
        # from any redirect Location header before sending to client.
        proxy_redirect http://127.0.0.1:3000/ /;
        proxy_redirect http://$host:3000/ /;
        proxy_redirect ~^http://[^/]+:3000(/.*)$ $1;

        proxy_http_version 1.1;

        # SSE / 流式响应（AI 聊天）
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;

        # 转发头
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

ln -sf /etc/nginx/sites-available/silverconnect /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

健康检查：

```bash
curl -I http://localhost/zh/home
curl -I http://<server-ip>/zh/home
```

预期 `HTTP/1.1 200 OK`，response 含 `x-powered-by: Next.js`。

---

## 7. （可选）HTTPS — Let's Encrypt

需要先有域名 A 记录指向服务器 IP。

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d <your-domain>
# 跟着提示填邮箱、同意条款；自动改 nginx 配置 + 续期
certbot renew --dry-run    # 验证续期管道
```

证书到期前 30 天 systemd timer 自动续期。

---

## 8. 客户访问 URL

| 入口 | URL |
|---|---|
| 首页（中文） | `http://<server-ip>/zh/home` |
| 首页（英文） | `http://<server-ip>/en/home` |
| 根路径 | `http://<server-ip>/` → 自动 307 到 `/en/home` |

不带端口号、不带 locale 也行，浏览器跟着重定向走。

---

## 9. 更新部署（之后改代码）

### 选项 A / B 上传方式：

```bash
# 选项 A: git pull
cd /opt/silverconnect
git pull origin feat/ui-rebuild
npm install --no-audit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
pm2 restart silverconnect
```

```bash
# 选项 B: 本机 rsync 后服务器
ssh root@<server-ip> "cd /opt/silverconnect && npm install --no-audit && NODE_OPTIONS='--max-old-space-size=4096' npm run build && pm2 restart silverconnect"
```

```bash
# 选项 C: 本地 push 后服务器
git push deploy feat/ui-rebuild
ssh root@<server-ip> "cd /opt/silverconnect && git pull && npm run build && pm2 restart silverconnect"
```

零停机滚动更新（生产场景）：

```bash
pm2 reload silverconnect    # 而不是 restart
```

---

## 10. 烟囱测试（部署完跑一遍）

服务器上：

```bash
# 14 个 Sprint 1 路由 + auth + profile + help
for url in \
  /zh/home /en/home \
  /zh/services /zh/services/cleaning \
  /zh/providers/p1 \
  /zh/bookings/new "/zh/bookings/new?step=4" \
  /zh/pay/abc /zh/bookings/abc/success \
  /zh/bookings /zh/bookings/abc \
  /zh/notifications /zh/chat \
  "/zh/chat?emergency=1" \
  /zh/auth/login /zh/auth/register \
  /zh/auth/forgot /zh/help \
  /zh/help/cancellation-policy
do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost$url")
  printf "%s %s\n" "$code" "$url"
done
```

预期全部 `200`（profile 路由会 307 到 login，因为没 cookie）。

---

## 11. 故障排查

### 11.1 `npm run build` 报内存不足

```
JavaScript heap out of memory
```

**修复**：
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
# 还不行就 8192
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

服务器 RAM < 2 GB 还要加 swap：
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 11.2 `pm2 logs silverconnect` 显示 `EADDRINUSE: 3000`

```bash
pm2 stop silverconnect
fuser -k 3000/tcp
pm2 restart silverconnect
```

### 11.3 nginx 502 Bad Gateway

`pm2 status` 看 silverconnect 是不是 stopped/errored。
```bash
pm2 logs silverconnect --lines 100
pm2 restart silverconnect
```

### 11.4 国家切换后所有页 500

检查 cookie 写入是否符合预期：
```bash
curl -I -b "sc-country=CN" http://<server-ip>/zh/home
```
应该 200。如果还 500，看 nginx error log + pm2 log。

### 11.5 浏览器看到「Application error: a server-side exception has occurred」

```bash
pm2 logs silverconnect --lines 200 | grep -i error
```
最常见原因：`messages/en.json` 或 `zh.json` 损坏（运行 `node -e "JSON.parse(require('fs').readFileSync('messages/en.json'))"` 验证），或环境变量缺失但代码 require 了它。

### 11.6 turbopack/Next 缓存损坏

```bash
cd /opt/silverconnect
rm -rf .next
npm run build
pm2 restart silverconnect
```

### 11.7 路由 404 但代码在那

确保 build 成功且 pm2 跑的就是 `npm run start`（不是 dev mode）：
```bash
pm2 describe silverconnect | grep "exec cwd\|script\|args"
```
应显示 `args: run start`。

---

## 12. 撤销部署 / 完全清理

```bash
pm2 stop silverconnect && pm2 delete silverconnect
rm -rf /opt/silverconnect /srv/git/silverconnect.git
rm /etc/nginx/sites-enabled/silverconnect /etc/nginx/sites-available/silverconnect
systemctl reload nginx
ufw delete allow 80/tcp
# 撤销 SSH key
sed -i '/silverconnect deploy/d' ~/.ssh/authorized_keys
```

---

## 13. 已知限制（演示阶段）

部署的是 `feat/ui-rebuild` 分支，**P0 + P1 + P2 已完成**：

✅ **能演示**（不依赖后端 / mock 数据）：
- 14 屏 Sprint 1 客户黄金路径
- 11 屏 P2（auth 5 屏、profile 6 屏、feedback、dispute、help 6 屏）
- 国家切换（cookie，3 国 currency / tax / 紧急号）
- 语言切换（路径前缀，EN/ZH）
- 桌面响应式（≥640px 出 DesktopNav）
- 状态合稿（每页 `?state=loading|empty|error|...`）

⚠️ **会 500**（需要后端 + 环境变量）：
- 实际登录注册：`/api/auth/login` `/api/auth/register` 需要 Supabase Auth 配置
- 实际下单 / 支付：需要 Stripe API key + webhook
- AI 聊天：需要 `ai_customer_service.py` (FastAPI) 跑在 8001 端口

部署给客户**只看视觉和交互**没问题。给他链接前提示一句"下单功能联调中"即可。

---

## 14. 成本

VPS（1 vCPU / 2 GB RAM / 30 GB / 1 TB 流量）：
- 阿里云轻量服务器：~¥40/月
- DigitalOcean Basic Droplet：$6/月
- Hetzner CX21：€4.5/月

够撑住演示流量；上线流量需要至少 2 vCPU / 4 GB。
