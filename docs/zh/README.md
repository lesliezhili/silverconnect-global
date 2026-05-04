# SilverConnect Global — 文档索引（中文）

工程文档中文版。英文原版在 [`../`](../)，两者保持同步。当出现冲突以代码为准。

## 工程文档

| 文档 | 内容 |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | 系统架构、组件、数据流 |
| [REQUIREMENTS.md](REQUIREMENTS.md) | 产品需求、用户故事、范围 |
| [API.md](API.md) | `app/api/**` 下所有路由的 REST 参考 |
| [DATABASE.md](DATABASE.md) | 数据模型、表、关系、迁移 |
| [DEVELOPMENT.md](DEVELOPMENT.md) | 本地搭建、规范、脚本 |
| [TESTING.md](TESTING.md) | 测试策略：单元、集成、E2E、性能 |
| [DEPLOYMENT.md](DEPLOYMENT.md) | 构建、发布、环境矩阵 |
| [OPERATIONS.md](OPERATIONS.md) | 运行手册：监控、On-call、事件、备份 |
| [SECURITY.md](SECURITY.md) | 威胁模型、控制、漏洞披露 |

## 项目级文档（仓库根目录，沿用既有）

| 文档 | 内容 |
|---|---|
| [README.md](../../README.md) | 项目概览、快速开始 |
| [CONTRIBUTING.md](../../CONTRIBUTING.md) | 贡献流程 |
| [CHANGELOG.md](../../CHANGELOG.md) | 发布历史 |
| [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) | 社区行为准则 |
| [ROADMAP.md](../../ROADMAP.md) | 后续规划 |
| [BUSINESS_MODEL.md](../../BUSINESS_MODEL.md) | 商业模式 |
| [SOLUTION_DESIGN_AND_OPERATIONS.md](../../SOLUTION_DESIGN_AND_OPERATIONS.md) | 方案级总览 |

## 新成员阅读顺序

1. [README.md](../../README.md) → 2. [ARCHITECTURE.md](ARCHITECTURE.md) → 3. [DEVELOPMENT.md](DEVELOPMENT.md) → 4. [DATABASE.md](DATABASE.md) → 5. [API.md](API.md) → 6. [TESTING.md](TESTING.md)

## 翻译说明

- 通用工程术语（API、RLS、Webhook、TypeScript 等）保留英文。
- 文件路径、字段名、命令、代码块原样保留。
- 与英文原版结构完全一致；评审循环修过的事实差异（如 `payment_transactions` 缺 RLS、`@critical` 标签缺失等）已同步反映。
