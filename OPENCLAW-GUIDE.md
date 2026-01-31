# OpenClaw 使用指南

## 概述
OpenClaw 是一个功能强大的 AI 助手平台，支持多通道通信、文件操作、代码执行、浏览器控制等多种功能。

## 核心功能

### 1. 通信通道
- **飞书 (Feishu)**: 支持文档创建、读取、更新、删除等操作
- **Telegram/WhatsApp/Signal**: 即时消息通信
- **Discord/Slack**: 团队协作通信
- **邮件/日历**: 邮件管理和日程安排

### 2. 文件操作
- **读取文件**: 支持文本文件和图片读取
- **编辑文件**: 精确的文本替换和编辑
- **写入文件**: 创建新文件或覆盖现有文件
- **Git 操作**: 仓库初始化、提交、推送等

### 3. 代码执行
- **Shell 命令**: 执行各种系统命令
- **后台进程**: 管理长时间运行的任务
- **PTY 终端**: 支持交互式命令行界面
- **安全模式**: 可控的执行权限管理

### 4. 浏览器控制
- **页面导航**: 打开和浏览网页
- **截图功能**: 捕获网页快照
- **UI 自动化**: 自动点击、输入等操作
- **Chrome 扩展**: 浏览器标签接管

### 5. 节点管理
- **设备控制**: 远程控制配对设备
- **摄像头**: 拍照和录像功能
- **屏幕录制**: 捕获屏幕内容
- **通知推送**: 发送系统通知

## 快速开始

### 初始化 OpenClaw 项目

```bash
# 1. 创建工作区目录
mkdir -p ~/.openclaw/workspace

# 2. 初始化配置文件
openclaw config init

# 3. 启动网关服务
openclaw gateway start

# 4. 检查状态
openclaw status
```

### 基础文件结构

```
~/.openclaw/workspace/
├── AGENTS.md          # 助手配置文件
├── SOUL.md           # 助手个性定义
├── USER.md           # 用户信息
├── TOOLS.md          # 工具配置
├── IDENTITY.md       # 助手身份
├── HEARTBEAT.md      # 心跳任务
├── MEMORY.md         # 长期记忆
├── memory/           # 每日记忆
│   └── YYYY-MM-DD.md
└── projects/         # 项目目录
    └── my-test/      # 你的项目
```

### 常用命令示例

```bash
# 读取文件
read /path/to/file.md

# 写入文件
write /path/to/file.md "内容"

# 执行命令
exec "ls -la"

# Git 操作
exec "git add ."
exec "git commit -m '更新'"
exec "git push origin master"
```

## 飞书集成指南

### 1. 文档操作
```bash
# 创建文档
feishu_doc_create "文档标题"

# 读取文档
feishu_doc_read "doc_token"

# 写入文档
feishu_doc_write "doc_token" "内容"

# 追加内容
feishu_doc_append "doc_token" "追加内容"
```

### 2. 文件夹管理
```bash
# 列出文件夹内容
feishu_folder_list "folder_token"
```

### 3. 块级操作
```bash
# 列出所有块
feishu_doc_list_blocks "doc_token"

# 更新块内容
feishu_doc_update_block "doc_token" "block_id" "新内容"

# 删除块
feishu_doc_delete_block "doc_token" "block_id"
```

## 最佳实践

### 1. 记忆管理
- **每日记忆**: 记录当天的重要事件到 `memory/YYYY-MM-DD.md`
- **长期记忆**: 重要信息更新到 `MEMORY.md`
- **自动备份**: 定期提交记忆文件到 Git

### 2. 项目管理
```bash
# 项目初始化流程
mkdir -p projects/my-project
cd projects/my-project
git init
echo "# 项目名称" > README.md
git add .
git commit -m "Initial commit"
```

### 3. 安全注意事项
- 敏感信息不要写入公开文件
- 外部操作前先询问确认
- 使用 `trash` 代替 `rm` 删除文件
- 定期检查权限设置

### 4. 性能优化
- 大文件使用分页读取
- 长时间任务使用后台进程
- 定期清理临时文件
- 使用心跳机制进行定期检查

## 故障排除

### 常见问题

1. **权限问题**
   ```bash
   # 检查文件权限
   ls -la /path/to/file
   
   # 修复权限
   chmod 644 /path/to/file
   ```

2. **Git 推送失败**
   ```bash
   # 检查远程配置
   git remote -v
   
   # 重新添加远程
   git remote add origin git@github.com:username/repo.git
   
   # 强制推送（谨慎使用）
   git push -f origin master
   ```

3. **飞书 API 错误**
   - 检查应用权限范围
   - 确认文档 token 正确
   - 验证网络连接

### 调试工具

```bash
# 查看 OpenClaw 状态
openclaw status

# 检查网关服务
openclaw gateway status

# 查看日志
tail -f ~/.openclaw/logs/openclaw.log
```

## 高级功能

### 1. 定时任务 (Cron)
```bash
# 创建定时任务
cron add --name "每日备份" --schedule "0 2 * * *" --command "backup.sh"
```

### 2. 子代理会话
```bash
# 创建子代理处理复杂任务
sessions_spawn --task "分析日志文件" --agentId "analyst"
```

### 3. 浏览器自动化
```bash
# 打开网页并截图
browser open --url "https://example.com"
browser screenshot --output "screenshot.png"
```

### 4. 语音合成
```bash
# 文本转语音
tts "你好，我是 OpenClaw 助手"
```

## 资源链接

- **官方文档**: https://docs.openclaw.ai
- **GitHub 仓库**: https://github.com/openclaw/openclaw
- **社区 Discord**: https://discord.com/invite/clawd
- **技能市场**: https://clawdhub.com

## 更新日志

### 2026-02-01
- 创建 OpenClaw 使用指南
- 初始化 Git 仓库并推送到远程
- 添加基础使用方法和最佳实践
- 包含飞书集成详细指南

---

**提示**: 本指南会根据 OpenClaw 的更新而持续改进。建议定期查看官方文档获取最新信息。