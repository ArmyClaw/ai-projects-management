<<<<<<< HEAD
# OpenClaw 工作空间和实用指南

基于实际使用经验整理的 OpenClaw 实用指南和最佳实践。

## 项目说明

这是一个用于学习和实践 OpenClaw 助手使用的项目仓库，包含完整的工作空间配置和使用指南。

## 文件结构

```
.
├── OPENCLAW-PRACTICAL-GUIDE.md  # 完整实用指南（基于实际经验）
├── AGENTS.md                    # 工作空间指南
├── SOUL.md                      # AI 助手个性定义
├── USER.md                      # 用户信息
├── IDENTITY.md                  # 助手身份
├── TOOLS.md                     # 本地工具配置
├── HEARTBEAT.md                 # 定期检查任务
├── memory/                      # 记忆存储目录
│   └── 2026-02-01.md           # 今日工作记录
└── projects/                    # 项目目录
    └── my-test/                 # 示例项目（Git 子模块）
```

## 快速开始

### 1. 查看完整指南
阅读 [OPENCLAW-PRACTICAL-GUIDE.md](OPENCLAW-PRACTICAL-GUIDE.md) 获取基于实际使用经验的详细说明。

### 2. 核心功能
- **文件操作**：读写编辑各种文件
- **命令执行**：安全执行系统命令
- **Git 管理**：版本控制操作
- **飞书集成**：文档和消息处理
- **记忆管理**：长期和短期记忆存储

### 3. 常用命令
```bash
# 查看帮助
openclaw --help

# 网关管理
openclaw gateway status
openclaw gateway restart

# 消息发送
openclaw message send --channel feishu --message "测试消息"

# 记忆搜索
openclaw memory search "关键词"
```

## OpenClaw 快速参考

### 基础命令
```bash
# 读取文件
read 文件名

# 写入文件
write 文件名 "内容"

# 执行命令
exec "命令"

# Git 操作
exec "git add ."
exec "git commit -m '提交信息'"
exec "git push"
```

### 飞书文档操作
```bash
# 创建文档
feishu_doc_create "标题"

# 读取文档
feishu_doc_read "doc_token"

# 写入文档
feishu_doc_write "doc_token" "内容"
```

## 最佳实践

1. **每日记录**：在 `memory/YYYY-MM-DD.md` 中记录重要工作
2. **版本控制**：定期提交重要更改到 Git
3. **安全第一**：谨慎处理敏感操作
4. **批量处理**：相似任务尽量批量完成

## 故障排除

- **网关问题**：使用 `openclaw gateway --force` 强制重启
- **权限问题**：检查应用权限配置
- **网络问题**：验证网络连接和代理设置

## 学习路径

1. 从 `OPENCLAW-PRACTICAL-GUIDE.md` 的基础部分开始
2. 实践文件操作和命令执行
3. 学习飞书集成功能
4. 探索高级功能如定时任务和浏览器自动化

## 相关资源

- [官方文档](https://docs.openclaw.ai)
- [GitHub 仓库](https://github.com/openclaw/openclaw)
- [社区 Discord](https://discord.com/invite/clawd)

## 贡献

欢迎提交改进建议和问题反馈：
1. Fork 本仓库
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request

## 许可证

本项目内容遵循 MIT 许可证。

---

*最后更新: 2026-02-01*
=======
# AI Project Management Platform

> 优秀的人的经验，以Skill方式，用于项目各环节——这是未来人机协作完成项目的方式

## 项目简介

一个创新的AI项目管理平台，核心特点是：
- **Skill是参与者的核心资产**：优秀的人的经验封装为Skill
- **平台只管结果，不管过程**：参与者用自己的AI工具完成任务
- **社区共治，没有权威**：信用由历史记录写就
- **验收评价体系开源**：所有评价标准都是Skill，可被社区替代

## 核心原则

```
1. Skill是参与者的核心资产
2. 参与者自由选择AI工具（Claude/Cursor/Codex）
3. 平台只验收成果，不关心过程
4. 发起人只看验收标准是否达标
5. Skill可集成到AI工具（MCP Protocol）
6. 社区可复用优秀Skill
7. 没有权威，只有历史
```

## 项目结构

```
ai-project-management/
├── design/               # 设计文档 ⭐
│   ├── 架构设计文档_v0.8.md
│   ├── 原型设计文档_v0.8.md        ⭐新增
│   ├── 产品需求规格说明书_v0.8.md
│   └── 场景设计文档_v0.8.md
├── research/             # 技术研究
└── deploy/               # 部署文档
```

## v0.8 核心设计

### 1. 项目发起全流程Skill化（v0.8洞察）
- Skill贯穿项目全生命周期，不仅仅是验收环节
- 项目模板Skill：选择Web开发/移动端/数据分析等标准流程
- 任务拆解Skill：自动拆解为可执行任务
- 预算评估Skill：估算合理预算
- 发起人可自定义/调整Skill
- 后续环节：质量检查、代码审查、文档生成等

### 2. Skill体系
- Skill = 经验封装（Prompt + Workflow + Quality Standard）
- Skill是参与者的资产，不是平台服务
- Skill可集成到Claude/Cursor/Codex（MCP）

### 3. 交付流程
```
1. 发起人发布项目（拆解任务+定义验收标准）
2. 参与者认领任务
3. 参与者用自己的工具+Skill完成交付
4. 提交GitHub PR
5. 发起人验收成果
6. 验收通过 → 立即结算
```

### 4. 验收评价体系
- 所有评价标准都是开源Skill
- 官方验收标准Skill：basic-review, security-review, performance-review
- 发起人可选择或自定义验收标准
- 社区可贡献验收标准Skill

### 5. 社区共治
- 平台不做价值判断，只维护系统
- 信用来自历史记录，谁都看得见，谁也改不了
- 社区治理：虚假交易、抄袭洗稿、恶意差评
- 惩罚机制：冻结、封禁、公开记录

### 6. 初始信用（解决冷启动）
- 新用户没有历史记录，需要初始信用评价
- 初始信用Skill：技能测试 + 作品集 + 同行评议
- 初始信用权重随时间递减，长期信用更重要
- 初始信用评价体系本身也是开源的

### 7. 平台抽成（v0.8新增）
- 社区模式：5%
- 企业模式：3%
- 抽成用途透明（运营60%，治理20%，审核10%，合规10%）

### 8. 争议仲裁（v0.8新增）
- 双方协商 → 发起仲裁 → 平台仲裁 → 信用记录
- 完整4步流程
- 胜诉方信用+10，败诉方信用-5

### 9. 防作弊机制（v0.8新增）
- 技能测试：限时+随机题库+录像+人脸验证
- 作品集：AI检测+Git历史验证+原创性评分
- 同行评议：信用门槛+每日限制+匿名评议

## 版本历史

- **v0.8** (2026-02-18): 
  - 明确平台抽成机制（5%社区/3%企业）
  - 新增参与者API成本承担机制
  - 新增详细防作弊设计
  - 新增争议仲裁流程
  - 完善信用公式：最终信用=初始×衰减+长期

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
>>>>>>> 3db8d7efcdb08ceaf65724ece8fc34919214b120
