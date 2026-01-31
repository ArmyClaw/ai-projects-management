# OpenClaw 使用指南项目

这是一个用于学习和实践 OpenClaw 助手使用的项目仓库。

## 项目结构

```
my-test/
├── README.md          # 项目说明
├── OPENCLAW-GUIDE.md  # OpenClaw 详细使用指南
└── .git/             # Git 仓库配置
```

## 文件说明

### OPENCLAW-GUIDE.md
包含 OpenClaw 的完整使用指南，涵盖：
- 核心功能介绍
- 快速开始指南
- 飞书集成详细说明
- 最佳实践和故障排除
- 高级功能示例

## 如何使用

1. **克隆仓库**
   ```bash
   git clone git@github.com:ArmyClaw/my-test.git
   cd my-test
   ```

2. **查看指南**
   ```bash
   # 查看完整指南
   cat OPENCLAW-GUIDE.md
   
   # 或使用 less 分页查看
   less OPENCLAW-GUIDE.md
   ```

3. **更新内容**
   ```bash
   # 编辑指南
   nano OPENCLAW-GUIDE.md
   
   # 提交更改
   git add OPENCLAW-GUIDE.md
   git commit -m "更新指南内容"
   git push origin master
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

## 学习路径

1. 从 `OPENCLAW-GUIDE.md` 的基础部分开始
2. 实践文件操作和命令执行
3. 学习飞书集成功能
4. 探索高级功能如定时任务和浏览器自动化

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