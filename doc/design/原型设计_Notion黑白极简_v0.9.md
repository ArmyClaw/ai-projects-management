# Agent Team Builder - 原型设计（Notion风黑白极简）v0.9

> 文档版本：v0.9
> 更新日期：2026-03-01
> 视觉方向：Notion 风格（黑白、克制、信息优先）

---

## 一、设计目标

- 用最少视觉元素表达最清晰的信息结构。
- 强调“编排配置”而非“花哨交互”。
- 让管理者 10 分钟内完成团队模板到项目启动。

---

## 二、视觉规范（Design Tokens）

### 2.1 色彩
- `--bg`: `#FFFFFF`
- `--surface`: `#FAFAFA`
- `--surface-2`: `#F5F5F5`
- `--text-primary`: `#111111`
- `--text-secondary`: `#666666`
- `--text-muted`: `#999999`
- `--border`: `#E6E6E6`
- `--border-strong`: `#D0D0D0`
- `--black`: `#000000`
- `--white`: `#FFFFFF`

状态色（仍保持克制）：
- `--success`: `#1F1F1F` + icon 区分
- `--warning`: `#4A4A4A`
- `--danger`: `#000000` + error 背景线框

说明：避免高饱和色，通过线条、图标、标签文本区分状态。

### 2.2 字体
- 中文：`"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif`
- 英文：`Inter, system-ui, sans-serif`

字号层级：
- H1: 24/32, 600
- H2: 20/28, 600
- H3: 16/24, 600
- Body: 14/22, 400
- Caption: 12/18, 400

### 2.3 圆角与阴影
- 圆角：`6px`
- 卡片默认无阴影，仅边框。
- Hover 才给轻微阴影：`0 1px 2px rgba(0,0,0,.04)`

### 2.4 间距系统
- 基础单位：`4px`
- 常用：`8 / 12 / 16 / 20 / 24 / 32`

---

## 三、布局规范

### 3.1 应用框架
- 左侧：窄导航（220px）
- 顶部：页面标题 + 全局搜索 + 用户区
- 主区：内容最大宽度 `1200px`

### 3.2 信息密度
- 表格优先，卡片为辅。
- 关键配置使用“分步面板”，避免长表单。
- 一屏只聚焦一个任务。

---

## 四、关键组件规范

### 4.1 侧边导航
- 图标 + 文本，黑白线性图标。
- 当前项：浅灰背景 + 左侧 2px 黑色条。

### 4.2 表格
- 表头浅灰背景。
- 行高 40px。
- 操作列只保留 2-3 个高频动作，其他放更多菜单。

### 4.3 标签（Tag）
- 黑白边框标签：
- `PRIMARY`：黑底白字
- `ASSISTANT`：白底黑字
- `PREMIUM/BALANCED/ECONOMY`：线框 + 文本

### 4.4 向导（Wizard）
- 横向步骤条，当前步骤黑色文字+底线。
- 每步一个主操作按钮。

---

## 五、页面原型（低保真）

## 5.1 Dashboard

```text
+----------------------------------------------------------------------------------+
| Agent Team Builder                                  Search         Admin        |
+----------------------+-----------------------------------------------------------+
| Dashboard            | Overview                                                  |
| Roles                | [启动成功率] [模型可用率] [模板复用率] [Agent负载]      |
| Agents               |                                                           |
| Skills               | Recent Activity                                           |
| MCPs                 | - model published                                         |
| Models               | - role updated                                            |
| Team Templates       | - project bootstrapped                                    |
| Project Templates    |                                                           |
| Bootstrap            | Quick Actions                                             |
| Projects             | [新建角色] [新建模板] [启动项目]                         |
| Audit Logs           |                                                           |
+----------------------+-----------------------------------------------------------+
```

## 5.2 Agent 管理页

```text
+----------------------------------------------------------------------------------+
| Agents / Backend Role                                           [New Agent]      |
+----------------------------------------------------------------------------------+
| Filter: [Role v] [Status v] [Workload <= 80]                    Search [____]   |
+----------------------------------------------------------------------------------+
| Name            | Role      | Default Model       | Tier     | Workload | Ops   |
| backend-lead    | Backend   | gpt-5-codex         | PREMIUM  | 60%      | ...   |
| backend-a1      | Backend   | gpt-4.1-mini        | ECONOMY  | 40%      | ...   |
| backend-a2      | Backend   | gpt-4.1-mini        | ECONOMY  | 35%      | ...   |
+----------------------------------------------------------------------------------+
```

## 5.3 Model 库

```text
+----------------------------------------------------------------------------------+
| Models                                                         [New Model]       |
+----------------------------------------------------------------------------------+
| Name            | Provider  | Model ID        | Tier      | Health   | Status   |
| primary-coder   | OpenAI    | gpt-5-codex     | PREMIUM   | HEALTHY  | ACTIVE   |
| helper-fast     | OpenAI    | gpt-4.1-mini    | ECONOMY   | HEALTHY  | ACTIVE   |
+----------------------------------------------------------------------------------+
| [Health Check] [Publish] [Deprecate]                                          |
+----------------------------------------------------------------------------------+
```

## 5.4 项目启动向导（核心）

```text
Step 1 Template  -> Step 2 Params -> Step 3 Role Agents -> Step 4 Validate -> Step 5 Confirm

[Step 3: Role Agents]
Role: Backend (Headcount: 3)
- backend-lead      [PRIMARY]   Model: [gpt-5-codex v]
- backend-a1        [ASSISTANT] Model: [gpt-4.1-mini v]
- backend-a2        [ASSISTANT] Model: [gpt-4.1-mini v]

Rules:
- Exactly one PRIMARY required.
- PRIMARY model tier must be PREMIUM or BALANCED.

[Back]                                                     [Next: Validate]
```

## 5.5 校验失败页

```text
Validation Failed

- roles[backend]: MISSING_PRIMARY_AGENT
- agents[backend-lead].model: MODEL_UNAVAILABLE

[Go to Step 3 and Fix]
```

---

## 六、交互细节

- 所有 destructive 操作（二次确认）。
- 键盘优先：`/` 搜索，`Cmd/Ctrl+K` 全局命令。
- 表单自动保存草稿（每 5 秒）。
- 错误提示固定在字段下方，避免 toast 丢失上下文。

---

## 七、响应式策略

- Desktop（>=1280）：完整三栏体验。
- Tablet（768-1279）：折叠左侧导航。
- Mobile（<768）：仅查看与审批，不做复杂编排。

---

## 八、实现建议（前端）

- 基于现有 Vue3 + TS。
- 先做 Design Token + 基础组件主题覆盖。
- 再落 3 个关键页面：`/models`、`/agents`、`/projects/bootstrap`。

---

## 九、验收标准

- 视觉统一：黑白极简，无多余彩色噪音。
- 启动流程可在 5 步内完成。
- 同角色 1 主 2 辅分配可以被清晰配置与校验。
