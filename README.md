# AI Project Management Platform

<div align="center">
  <img src="logo.svg" alt="AI Project Management Platform" width="120" height="120">
  <br><br>
  <strong>优秀的人的经验，以Skill方式，用于项目各环节——人机协作完成项目的新范式</strong>
</div>

## 项目简介

一个创新的AI驱动项目管理平台，核心特点是：
- **Skill是参与者的核心资产**：优秀经验封装为可复用Skill
- **平台只管结果，不管过程**：参与者用自有AI工具（Claude/Cursor/Codex）完成任务
- **社区共治，没有权威**：信用由历史记录客观写就
- **验收评价体系开源**：所有评价标准都是Skill，可被社区替代

## 核心原则

1. **Skill是核心资产** - 参与者经验封装，可集成到AI工具（MCP Protocol）
2. **自由选择AI工具** - 不绑定特定AI，信任参与者选择
3. **只验收成果** - 平台不关心实现过程，只验证结果
4. **开源评价体系** - 验收标准Skill公开透明
5. **历史信用** - 没有权威，只有可追溯的记录

## 技术架构

```
ai-project-management/
├── design/              # 设计文档
│   ├── 架构设计文档_v0.8.md
│   ├── 产品需求规格说明书_v0.8.md
│   └── 场景设计文档_v0.8.md
├── develop/             # 项目源码
│   ├── backend/         # Node.js后端 (Fastify + Prisma)
│   ├── cli/             # TypeScript命令行工具
│   └── frontend/        # Vue 3 + Pinia前端
├── progress/            # 迭代记录
└── memory/              # 项目记忆
```

## 版本进度

| 版本 | 状态 | 说明 |
|------|------|------|
| v1.0 | ✅ 完成 | 完整功能 - CLI 16 + API 50 + 前端5页面 + 测试130 |

### v1.0 功能清单

| 模块 | 数量 | 状态 |
|------|------|------|
| CLI命令 | 16个 | ✅ |
| 后端API | 50个 | ✅ |
| 前端页面 | 5个 | ✅ |
| Pinia Store | 5个 | ✅ |
| 测试用例 | 130个 | ✅ |

## 快速开始

### 环境要求

| 软件 | 版本要求 |
|------|---------|
| Node.js | 18+ |
| PostgreSQL | 14+ |
| Git | 任意 |

### 1. 克隆项目

```bash
git clone https://github.com/ArmyClaw/ai-projects-management.git
cd ai-projects-management
```

### 2. 后端安装

```bash
cd develop/backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 设置数据库连接和JWT密钥

# 初始化数据库
npx prisma migrate dev

# 启动后端服务
npm run dev
```

后端服务运行在 `http://localhost:4000`

### 3. 前端安装

```bash
cd develop/frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端服务运行在 `http://localhost:5173`

### 4. CLI工具安装

```bash
cd develop/cli

# 全局安装
npm install -g .

# 验证安装
aipm --help
```

## 配置说明

### 环境变量 (backend/.env)

```env
# 数据库
DATABASE_URL="postgresql://user:password@localhost:5432/ai_projects"

# JWT密钥 (请修改为随机字符串)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# 服务器
PORT=4000
NODE_ENV=development

# GitHub OAuth (可选)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### API端口配置

| 服务 | 端口 | 地址 |
|------|------|------|
| 后端API | 4000 | http://localhost:4000 |
| Swagger文档 | - | http://localhost:4000/docs |
| 前端开发 | 5173 | http://localhost:5173 |

## 使用指南

### 1. 注册/登录

```bash
# 方式1: 使用CLI登录
aipm login

# 方式2: 直接注册用户
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# 方式3: GitHub OAuth登录
curl http://localhost:4000/api/v1/auth/github/url
```

### 2. 项目管理

```bash
# 列出项目
aipm project list

# 创建项目
aipm project create --name "My Project" --description "项目描述"

# 查看项目详情
aipm project info <project-id>

# 删除项目
aipm project delete <project-id>
```

### 3. 任务管理

```bash
# 列出任务
aipm task list

# 查看任务详情
aipm task detail <task-id>

# 认领任务
aipm task claim <task-id>

# 提交任务
aipm task submit <task-id> --message "完成说明"
```

### 4. Skill管理

```bash
# 列出可用Skill
aipm skill list

# 导出Skill
aipm skill export <skill-id> -o skill.json

# 导入Skill
aipm skill import skill.json

# 验证Skill
aipm skill validate skill.json
```

### 5. 查看审核状态

```bash
aipm review status
```

## API文档

### 认证API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | /api/v1/auth/register | 用户注册 |
| POST | /api/v1/auth/login | 用户登录 |
| POST | /api/v1/auth/refresh | 刷新Token |
| GET | /api/v1/auth/me | 获取当前用户 |
| POST | /api/v1/auth/logout | 登出 |

### 项目API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | /api/v1/projects | 项目列表 |
| POST | /api/v1/projects | 创建项目 |
| GET | /api/v1/projects/:id | 项目详情 |
| PUT | /api/v1/projects/:id | 更新项目 |
| DELETE | /api/v1/projects/:id | 删除项目 |

### 任务API

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | /api/v1/tasks | 任务列表 |
| POST | /api/v1/tasks | 创建任务 |
| GET | /api/v1/tasks/:id | 任务详情 |
| PUT | /api/v1/tasks/:id | 更新任务 |
| DELETE | /api/v1/tasks/:id | 删除任务 |

### 完整API文档

访问 http://localhost:4000/docs 查看Swagger完整文档

## 前端页面

| 页面 | 路由 | 描述 |
|------|------|------|
| 首页 | / | 平台特性展示 |
| 项目 | /projects | 项目列表和管理 |
| 任务 | /tasks | 任务大厅 |
| 技能 | /skills | Skill市场 |
| 个人 | /profile | 用户档案 |

## 主要功能

### 主题切换

- 🌞 浅色模式
- 🌙 深色模式
- 💻 自动跟随系统

### 国际化

- 🇨🇳 中文
- 🇺🇸 English

### 实时通知

- 任务状态更新
- 结算提醒
- 争议仲裁
- 系统消息

## 测试

```bash
# 后端测试
cd develop/backend
npm test

# 查看测试覆盖率
npm run test:coverage
```

## 构建部署

### Docker部署

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 前端构建

```bash
cd develop/frontend
npm run build
```

## 项目结构

```
develop/
├── backend/
│   ├── src/
│   │   ├── routes/       # API路由
│   │   ├── services/     # 业务服务
│   │   └── app.ts        # 应用入口
│   ├── tests/             # 测试文件
│   ├── prisma/            # 数据库 schema
│   └── package.json
├── cli/
│   ├── src/              # CLI源码
│   └── package.json
└── frontend/
    ├── src/
    │   ├── views/        # 页面组件
    │   ├── components/   # 公共组件
    │   ├── stores/       # Pinia状态
    │   ├── services/     # API服务
    │   └── locales/      # 国际化文件
    └── package.json
```

## 开发

### 运行开发服务器

```bash
# 后端 (端口 4000)
cd develop/backend
npm run dev

# 前端 (端口 5173)
cd develop/frontend
npm run dev

# CLI
cd develop/cli
npm run dev
```

### 代码检查

```bash
# ESLint
npm run lint

# TypeScript类型检查
npm run typecheck
```

## 许可证

MIT License

## 作者

ArmyClaw
