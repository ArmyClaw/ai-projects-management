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

## 开发规范

### Git Flow

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

# 启动开发环境
docker-compose -f docker/docker-compose.dev.yml up -d

# 安装依赖
cd frontend && npm install
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
