# AI Project Management Platform

## 项目概述

> 优秀的人的经验，以Skill方式，用于项目各环节

## 技术栈

| 层级 | 技术选型 | 说明 |
|------|-----------|------|
| 前端 | Vue 3 + TypeScript | 模板语法AI友好 |
| UI组件 | Naive UI | Vue生态友好 |
| 后端 | Fastify + TypeScript | 高性能 |
| ORM | Prisma | 类型安全 |
| 数据库 | PostgreSQL | JSON支持好 |
| 认证 | JWT + GitHub OAuth | 无状态 |
| CLI | Node.js + Commander.js | TypeScript统一 |
| 国际化 | vue-i18n | 中英文支持 |
| 部署 | Docker | 一键部署 |

## 项目结构

```
ai-projects-management/
├── frontend/          # 前端项目 (Vue 3 + Naive UI)
├── backend/          # 后端项目 (Fastify + Prisma)
├── cli/              # CLI工具
├── docs/             # 开发文档
├── doc/              # 设计文档
│   ├── design/       # 设计文档
│   ├── memory/      # 开发日志
│   └── progress/    # 进度文档
├── scripts/          # 辅助脚本
└── docker/           # Docker配置
```

## 环境要求

- Node.js v18+
- npm v9+
- Git v2+
- Docker v24+ (可选)
- PostgreSQL v15+ (可选，可用Docker)

## 快速开始

### 方式一：使用Docker启动（推荐）

```bash
# 克隆项目
git clone https://github.com/ArmyClaw/ai-projects-management.git
cd ai-projects-management

# 启动所有服务
docker-compose up -d

# 访问
# 前端: http://localhost:3000
# 后端: http://localhost:4000
# API文档: http://localhost:4000/docs
```

### 方式二：本地开发

#### Linux/macOS

```bash
# 克隆项目
git clone https://github.com/ArmyClaw/ai-projects-management.git
cd ai-projects-management

# 启动PostgreSQL
docker-compose up -d postgres

# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install

# 启动前端（终端1）
cd frontend
npm run dev

# 启动后端（终端2）
cd backend
npm run dev
```

#### Windows

```powershell
# 克隆项目
git clone https://github.com/ArmyClaw/ai-projects-management.git
cd ai-projects-management

# 启动PostgreSQL
docker-compose up -d postgres

# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ..\backend
npm install

# 启动前端（PowerShell终端1）
cd frontend
npm run dev

# 启动后端（PowerShell终端2）
cd backend
npm run dev
```

## 访问信息

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:3000 | Vue 3 开发服务器 |
| 后端 | http://localhost:4000 | Fastify API服务 |
| API文档 | http://localhost:4000/docs | Swagger API文档 |
| PostgreSQL | localhost:5432 | 数据库 (docker) |

## 相关文档

- [需求规格说明书](doc/design/产品需求规格说明书_v0.8.md)
- [架构设计文档](doc/design/架构设计文档_v0.8.md)
- [原型设计文档](doc/design/原型设计文档_v0.8.md)
- [场景设计文档](doc/design/场景设计文档_v0.8.md)
- [进度总结](doc/progress/README.md)
- [开发日志](doc/memory/)

## 开发规范

### Git分支策略

```
main        - 生产分支
develop     - 开发分支
feature/*   - 功能分支
hotfix/*    - 紧急修复
release/*   - 发布分支
```

### 代码规范

- TypeScript strict模式
- ESLint + Prettier
- 组件命名：PascalCase
- 函数命名：camelCase
- 常量命名：UPPER_SNAKE_CASE

### 提交规范

```
feat: 新功能
fix: Bug修复
docs: 文档更新
refactor: 重构
test: 测试
chore: 构建/工具
```

---

**最后更新**: 2026-02-24
