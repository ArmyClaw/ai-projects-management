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
│   └── frontend/         # Vue 3 + Pinia前端
├── progress/             # 迭代记录
└── memory/               # 项目记忆
```

## 版本进度

| 版本 | 状态 | 说明 |
|------|------|------|
| v0.8 | ✅ 完成 | MVP - CLI 16命令 + API 28个 + 测试107个 |
| v0.9 | ✅ 完成 | 扩展 - AIAgent模拟API + 前端5页面 |
| v1.0 | 🔄 开发中 | 生产就绪 - 认证 + 状态管理 + 通知系统 |

### v1.0 开发进度 (5/5)

| 功能 | 状态 |
|------|------|
| GitHub OAuth | ✅ |
| JWT Token刷新 | ✅ |
| Pinia状态管理 | ✅ |
| 深色模式 | ✅ |
| 实时通知系统 | 🔄 进行中 |

## 核心功能

### 后端API (45个)
- 用户认证（邮箱/GitHub OAuth + JWT）
- 项目CRUD
- 任务管理（认领、提交、验收）
- Skill管理（导入导出）
- 积分系统
- 结算系统
- 争议仲裁
- 防作弊机制
- AIAgent模拟

### 前端功能
- 5个页面：项目列表、任务大厅、Skill市场、个人档案、首页
- 4个Pinia Store：User、Project、Task、Theme
- 深色/浅色/自动主题模式

### CLI命令 (16个)
- `aipm init` - 初始化配置
- `aipm project list/create/info/delete` - 项目管理
- `aipm task list/claim/detail/submit` - 任务管理
- `aipm skill list/export/import/validate` - Skill管理
- `aipm review status` - 审核状态

## 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+
- Git

### 安装
```bash
# 后端
cd develop/backend
npm install
npx prisma migrate dev
npm run dev

# 前端
cd develop/frontend
npm install
npm run dev

# CLI
cd develop/cli
npm install -g
aipm --help
```

## 设计文档

- [架构设计](design/架构设计文档_v0.8.md)
- [产品需求](design/产品需求规格说明书_v0.8.md)
- [场景设计](design/场景设计文档_v0.8.md)

## 许可证

MIT License

## 作者

ArmyClaw
