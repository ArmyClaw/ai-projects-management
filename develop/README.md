# AI Project Management Platform - 开发目录

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
develop/
├── frontend/          # 前端项目
├── backend/          # 后端项目
├── cli/              # CLI工具
├── docs/             # 开发文档
├── scripts/          # 辅助脚本
└── docker/           # Docker配置
```

## 项目初始化步骤

基于design目录下的设计文档初始化项目开发：

### Step 1: 环境准备

```bash
# 确认环境
node --version   # v18+
npm --version    # v9+
git --version    # v2+
docker --version # v24+
docker-compose --version # v2+
psql --version   # v15+ (可选，本地PostgreSQL)
```

### Step 2: 创建开发分支

```bash
# 从master创建develop分支
git checkout master
git pull origin master
git checkout -b develop
git push -u origin develop
```

### Step 3: 初始化前端项目

```bash
cd develop

# 使用npm create vite创建Vue 3 + TypeScript项目
cd frontend
npm create vite@latest . -- --template vue-ts

# 安装核心依赖
npm install
npm install vue-router@4 pinia naive-ui vue-i18n@9
npm install -D @vitejs/plugin-vue @vitejs/plugin-legacy
npm install eslint prettier -D
npm install @types/node -D

# 安装工具库
npm install axios dayjs
```

### Step 4: 初始化后端项目

```bash
cd ../backend

# 创建项目目录
mkdir -p src/{routes,controllers,services,models,middleware,utils,config}
npm init -y

# 安装核心依赖
npm install fastify @fastify/cors @fastify/jwt @fastify/postgres
npm install @prisma/client
npm install typescript ts-node -D
npm install @types/node @types/express -D

# 安装开发工具
npm install eslint prettier -D
```

### Step 5: 初始化CLI项目

```bash
cd ../cli

# 创建项目
npm init -y
npm install commander.js inquirer chalk boxen
npm install typescript -D
npm install @types/node @types/inquirer -D

# 创建命令结构
mkdir -p src/commands
mkdir -p src/utils
```

### Step 6: 配置Prisma

```bash
cd backend

# 初始化Prisma
npm install prisma -D
npx prisma init

# 编辑prisma/schema.prisma（参考架构设计文档的数据模型）
# 编辑prisma/.env（数据库连接配置）

# 生成客户端
npx prisma generate

# 创建数据库
npx prisma db push
```

### Step 7: 配置Docker

```bash
cd ../docker

# 创建开发环境Docker配置
mkdir -f docker-compose.dev.yml

# 创建生产环境Docker配置
mkdir -f docker-compose.prod.yml

# 创建各服务Dockerfile
mkdir -f frontend.Dockerfile
mkdir -f backend.Dockerfile
mkdir -f cli.Dockerfile
```

### Step 8: 配置Git Hooks

```bash
cd ../..

# 安装husky和lint-staged
npm install husky lint-staged -D

# 初始化husky
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

### Step 9: 验证初始化

```bash
# 启动PostgreSQL
docker-compose -f docker/docker-compose.dev.yml up -d postgres

# 验证前端
cd frontend && npm run dev

# 验证后端（新建终端窗口）
cd backend && npm run dev

# 验证CLI
cd cli && node bin/index.js --help
```

## 开发规范

### Git Flow（当前：简化模式）

```
master      - 主分支（当前开发分支）
```

> **说明**: 项目初期暂时在master分支直接开发，简化流程，待功能稳定后再启用完整Git Flow。

### 后续启用完整Git Flow

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

## 快速开始

```bash
# 克隆项目
git clone https://github.com/your-repo/ai-project-management.git
cd ai-project-management

# 切换到开发分支
git checkout develop

# 启动开发环境
docker-compose -f docker/docker-compose.dev.yml up -d

# 安装依赖
cd develop/frontend && npm install
cd ../backend && npm install
cd ../cli && npm install

# 运行
npm run dev
```

## 相关文档

- [需求规格说明书](../design/产品需求规格说明书_v0.8.md)
- [架构设计文档](../design/架构设计文档_v0.8.md)
- [原型设计文档](../design/原型设计文档_v0.8.md)
- [场景设计文档](../design/场景设计文档_v0.8.md)
- [进度总结](../progress/README.md)

---

**最后更新**: 2026-02-19
