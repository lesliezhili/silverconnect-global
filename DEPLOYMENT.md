# SilverConnect 部署指南

> 本文档面向开发者（CC），说明如何提交代码、触发 CI/CD 流水线，以及项目在 Vercel 上的部署配置。

---

## 一、项目基本信息

| 项目 | 详情 |
|------|------|
| 仓库地址 | https://github.com/yanhaocn2000/silverconnect |
| 默认分支 | `main` |
| 部署平台 | Vercel |
| CI/CD 工具 | GitHub Actions |

---

## 二、代码提交规范

### 分支策略

- **`main`** — 生产分支，每次 push 自动触发 CI/CD 并部署到 Vercel
- **功能分支** — 命名格式：`feature/xxx`，开发完成后提 PR 合并到 `main`

### 提交流程

```bash
# 1. 克隆仓库
git clone https://github.com/yanhaocn2000/silverconnect.git
cd silverconnect

# 2. 创建功能分支
git checkout -b feature/your-feature-name

# 3. 开发并提交代码
git add .
git commit -m "feat: 描述你的改动"

# 4. 推送到远程
git push origin feature/your-feature-name

# 5. 在 GitHub 上发起 Pull Request → main
```

### Commit Message 规范

| 前缀 | 用途 |
|------|------|
| `feat:` | 新功能 |
| `fix:` | Bug 修复 |
| `docs:` | 文档更新 |
| `style:` | 样式调整 |
| `refactor:` | 代码重构 |
| `chore:` | 构建/依赖更新 |

---

## 三、CI/CD 流水线说明

CI/CD 配置文件位于：`.github/workflows/ci.yml`

### 触发条件

| 事件 | 分支 | 触发的 Job |
|------|------|-----------|
| `push` | `main` | build + deploy |
| `pull_request` | `main` | build（仅检查，不部署）|

### 流水线阶段

```
push to main
    │
    ▼
┌─────────────────────────────┐
│         build Job           │
│  1. Checkout 代码            │
│  2. 安装 Node.js 20          │
│  3. npm ci（安装依赖）        │
│  4. npm test（运行测试）      │
│  5. npm run build（构建）    │
└────────────┬────────────────┘
             │ 成功后
             ▼
┌─────────────────────────────┐
│         deploy Job          │
│  1. Checkout 代码            │
│  2. 执行部署脚本              │
│    （Vercel 自动接管部署）    │
└─────────────────────────────┘
```

### 项目必须包含的文件

为使 CI/CD 正常运行，项目根目录需要包含：

```
silverconnect/
├── package.json          ← 必须（定义 scripts: test, build）
├── package-lock.json     ← 必须（npm ci 依赖此文件）
├── .github/
│   └── workflows/
│       └── ci.yml        ← 已配置 ✅
└── ...其他项目文件
```

### package.json 最低要求

```json
{
  "name": "silverconnect",
  "version": "1.0.0",
  "scripts": {
    "dev": "你的开发命令",
    "build": "你的构建命令",
    "test": "你的测试命令（无测试可写 echo 'no tests'）",
    "start": "你的启动命令"
  }
}
```

---

## 四、Vercel 部署配置

### 部署说明

| 项目 | 详情 |
|------|------|
| Vercel 账户 | yanhaoau-1392s（Hobby） |
| 触发方式 | push 到 `main` 分支自动部署 |
| 预览部署 | PR 合并前自动生成预览链接 |

### Vercel 支持的框架（选择一个）

| 框架 | 构建命令 | 输出目录 |
|------|----------|---------|
| Next.js | `next build` | `.next` |
| React (CRA) | `react-scripts build` | `build` |
| Vue (Vite) | `vite build` | `dist` |
| Nuxt.js | `nuxt build` | `.output` |
| 纯静态 HTML | —（无需构建） | `./` 或 `public` |

### vercel.json（可选，放置于项目根目录）

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/"
    }
  ]
}
```

> ⚠️ 如果使用 Next.js / Vue / React 等框架，Vercel 会自动识别，**无需** `vercel.json`。

---

## 五、CC 操作清单

请按以下清单依次完成代码提交：

- [ ] 1. 克隆仓库到本地
- [ ] 2. 在项目根目录创建 `package.json`，填写正确的 `scripts`
- [ ] 3. 安装依赖并生成 `package-lock.json`（运行 `npm install`）
- [ ] 4. 提交所有项目文件到 `main` 分支
- [ ] 5. 检查 GitHub Actions 页面，确认 CI/CD 流水线通过
- [ ] 6. 检查 Vercel 项目页面，确认部署成功并获取访问链接

### 快速验证

Push 代码后，打开以下链接检查状态：

- **GitHub Actions 流水线**：https://github.com/yanhaocn2000/silverconnect/actions
- **Vercel 部署状态**：https://vercel.com/yanhaoau-1392s-projects

---

## 六、常见问题

**Q: CI/CD 报错 "Dependencies lock file is not found"**
> A: 确保提交了 `package-lock.json` 文件（运行 `npm install` 会自动生成）

**Q: CI/CD 报错 "npm test" 失败**
> A: 在 `package.json` 的 `scripts.test` 中添加：`"test": "echo 'no tests' && exit 0"`

**Q: Vercel 无法识别框架**
> A: 在 Vercel 项目 Settings → Framework Preset 中手动选择框架

**Q: 部署后页面空白**
> A: 检查 Vercel 的 Build & Output Settings，确认 Output Directory 与框架匹配

---

*文档生成时间：2026-05-07 | 仓库：yanhaocn2000/silverconnect*
