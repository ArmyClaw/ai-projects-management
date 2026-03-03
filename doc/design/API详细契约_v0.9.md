# Agent Team Builder - API 详细契约 v0.9

> 文档版本：v0.9
> 更新日期：2026-03-01
> 协议：REST/JSON

---

## 一、通用规范

### 1.1 Base URL
- `https://{host}/api/v1`

### 1.2 认证
- Header：`Authorization: Bearer <token>`
- Header：`X-Org-Id: <uuid>`

### 1.3 通用响应

成功：
```json
{
  "ok": true,
  "data": {},
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-03-01T10:00:00Z"
  }
}
```

失败：
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "name", "reason": "REQUIRED" }
    ]
  },
  "meta": {
    "requestId": "req_124",
    "timestamp": "2026-03-01T10:01:00Z"
  }
}
```

### 1.4 分页
- Query：`page`（默认1）、`pageSize`（默认20，最大100）、`sortBy`、`sortOrder`

---

## 二、错误码规范

| 代码 | HTTP | 说明 |
|---|---|---|
| UNAUTHORIZED | 401 | 未登录或 token 无效 |
| FORBIDDEN | 403 | 权限不足 |
| VALIDATION_ERROR | 400 | 参数校验失败 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 唯一约束冲突 |
| MCP_HEALTH_CHECK_FAILED | 422 | MCP 健康检查失败 |
| MODEL_UNAVAILABLE | 422 | 模型不可用 |
| MISSING_PRIMARY_AGENT | 422 | 未配置主负责人 Agent |
| INVALID_PRIMARY_MODEL_TIER | 422 | 主负责人模型档位不符合要求 |
| CAPABILITY_NOT_ACTIVE | 422 | 引用能力非 ACTIVE |
| TEMPLATE_NOT_PUBLISHED | 422 | 模板未发布 |
| BOOTSTRAP_VALIDATION_FAILED | 422 | 启动前校验失败 |
| INTERNAL_ERROR | 500 | 服务内部错误 |

---

## 三、角色与 Agent API

## 3.1 创建角色
- `POST /roles`

请求：
```json
{
  "name": "测试工程师",
  "description": "负责测试策略、自动化测试与质量门禁",
  "skillIds": ["skill-uuid-1"],
  "mcpIds": ["mcp-uuid-1"]
}
```

响应：
```json
{
  "ok": true,
  "data": {
    "id": "role-uuid-1",
    "status": "ACTIVE"
  }
}
```

## 3.2 查询角色列表
- `GET /roles?page=1&pageSize=20&status=ACTIVE&keyword=测试`

## 3.3 更新角色
- `PATCH /roles/{roleId}`

请求（部分字段）：
```json
{
  "description": "负责测试与发布前质量保障",
  "skillIds": ["skill-uuid-1", "skill-uuid-2"],
  "mcpIds": ["mcp-uuid-1"]
}
```

## 3.4 创建 Agent
- `POST /agents`

请求：
```json
{
  "name": "QA-Agent-01",
  "roleId": "role-uuid-1",
  "defaultModelId": "model-uuid-balanced",
  "workload": 20,
  "extraSkillIds": ["skill-uuid-3"],
  "extraMcpIds": ["mcp-uuid-2"]
}
```

## 3.5 更新 Agent 能力
- `PATCH /agents/{agentId}/capabilities`

请求：
```json
{
  "addSkillIds": ["skill-uuid-4"],
  "removeSkillIds": ["skill-uuid-2"],
  "addMcpIds": ["mcp-uuid-3"],
  "removeMcpIds": []
}
```

## 3.6 Agent 列表
- `GET /agents?roleId=...&status=ACTIVE&minWorkload=0&maxWorkload=80`

---

## 3.7 更新 Agent 默认模型
- `PATCH /agents/{agentId}/model`

请求：
```json
{
  "defaultModelId": "model-uuid-premium"
}
```

---

## 四、Skill API

## 4.1 创建 Skill
- `POST /skills`

请求：
```json
{
  "name": "Backend API Design",
  "version": "1.0.0",
  "tags": ["backend", "api"],
  "definition": {
    "prompts": [],
    "workflow": [],
    "qualityStandard": {}
  }
}
```

## 4.2 发布 Skill
- `POST /skills/{skillId}/publish`

规则：
- 当前状态必须 `DRAFT`。
- `definition` 必须通过 schema 校验。

## 4.3 下线 Skill
- `POST /skills/{skillId}/deprecate`

规则：
- 若被 `PUBLISHED` 模板引用，返回 `CONFLICT`。

## 4.4 Skill 列表与详情
- `GET /skills?status=ACTIVE&tag=backend`
- `GET /skills/{skillId}`

---

## 五、MCP API

## 5.1 创建 MCP
- `POST /mcps`

请求：
```json
{
  "name": "repo-tool",
  "version": "1.0.0",
  "endpoint": "https://mcp.example.com/repo",
  "paramSchema": {
    "type": "object",
    "properties": {
      "repo": { "type": "string" }
    },
    "required": ["repo"]
  },
  "authPolicy": {
    "mode": "token",
    "scopes": ["repo:read"]
  }
}
```

## 5.2 MCP 健康检查
- `POST /mcps/{mcpId}/health-check`

响应：
```json
{
  "ok": true,
  "data": {
    "healthStatus": "HEALTHY",
    "latencyMs": 85,
    "checkedAt": "2026-03-01T11:00:00Z"
  }
}
```

## 5.3 发布 MCP
- `POST /mcps/{mcpId}/publish`

规则：
- 仅 `healthStatus=HEALTHY` 才可发布。

## 5.4 MCP 列表与详情
- `GET /mcps?status=ACTIVE&healthStatus=HEALTHY`
- `GET /mcps/{mcpId}`

---

## 五A、Model API

## 5A.1 创建模型配置
- `POST /models`

请求：
```json
{
  "name": "primary-coder",
  "provider": "OpenAI",
  "modelId": "gpt-5-codex",
  "tier": "PREMIUM",
  "maxContext": 200000,
  "pricing": { "inputPer1M": 15, "outputPer1M": 60 }
}
```

## 5A.2 模型健康检查
- `POST /models/{modelId}/health-check`

## 5A.3 发布模型配置
- `POST /models/{modelId}/publish`

规则：
- 仅 `healthStatus=HEALTHY/DEGRADED` 才可发布。

## 5A.4 模型列表与详情
- `GET /models?status=ACTIVE&tier=ECONOMY`
- `GET /models/{modelId}`

---

## 六、模板 API

## 6.1 创建团队模板
- `POST /team-templates`

请求：
```json
{
  "name": "standard-web-team",
  "version": "1.0.0",
  "description": "标准Web研发团队",
  "roles": [
    { "roleId": "role-arch", "headcount": 1 },
    { "roleId": "role-backend", "headcount": 2 },
    { "roleId": "role-frontend", "headcount": 2 },
    { "roleId": "role-qa", "headcount": 1 }
  ]
}
```

## 6.2 发布团队模板
- `POST /team-templates/{templateId}/publish`

## 6.3 创建项目模板
- `POST /project-templates`

请求：
```json
{
  "name": "web-project-6w",
  "version": "1.0.0",
  "teamTemplateId": "team-template-uuid",
  "durationDays": 42,
  "workflowConfig": {
    "phases": ["需求", "开发", "测试", "上线"]
  },
  "milestoneConfig": {
    "milestones": [
      { "name": "需求冻结", "day": 7 },
      { "name": "联调完成", "day": 28 },
      { "name": "上线验收", "day": 42 }
    ]
  },
  "qualityGates": {
    "gates": [
      { "name": "代码评审", "required": true },
      { "name": "回归测试", "required": true }
    ]
  }
}
```

## 6.4 发布项目模板
- `POST /project-templates/{templateId}/publish`

## 6.5 模板列表
- `GET /team-templates?status=PUBLISHED`
- `GET /project-templates?status=PUBLISHED`

---

## 七、项目启动 API

## 7.1 启动前校验
- `POST /projects/bootstrap/validate`

请求：
```json
{
  "projectTemplateId": "project-template-uuid",
  "projectName": "AI代码审查平台",
  "startDate": "2026-03-10",
  "objective": "6周完成基础版本",
  "roleAgentAssignments": [
    {
      "roleId": "role-backend",
      "agents": [
        { "agentId": "agent-backend-lead", "assignmentRole": "PRIMARY", "modelId": "model-premium-1", "priority": 1 },
        { "agentId": "agent-backend-a1", "assignmentRole": "ASSISTANT", "modelId": "model-economy-1", "priority": 10 },
        { "agentId": "agent-backend-a2", "assignmentRole": "ASSISTANT", "modelId": "model-economy-2", "priority": 20 }
      ]
    }
  ]
}
```

成功响应：
```json
{
  "ok": true,
  "data": {
    "pass": true,
    "warnings": [],
    "summary": {
      "roles": 4,
      "skills": 12,
      "mcps": 4,
      "models": 3
    }
  }
}
```

失败响应：
```json
{
  "ok": false,
  "error": {
    "code": "BOOTSTRAP_VALIDATION_FAILED",
    "message": "Validation failed",
    "details": [
      { "field": "mcps[repo-tool]", "reason": "MCP_HEALTH_CHECK_FAILED" },
      { "field": "roles[qa]", "reason": "MISSING_REQUIRED_SKILL" },
      { "field": "roles[backend]", "reason": "MISSING_PRIMARY_AGENT" },
      { "field": "agents[agent-backend-lead].model", "reason": "MODEL_UNAVAILABLE" }
    ]
  }
}
```

## 7.2 启动项目
- `POST /projects/bootstrap`

请求：同 `validate`。

响应：
```json
{
  "ok": true,
  "data": {
    "projectId": "project-uuid",
    "status": "PLANNED",
    "planVersion": 1
  }
}
```

## 7.3 查询项目计划
- `GET /projects/{projectId}/plan`

## 7.4 更新项目角色 Agent 分配
- `PUT /projects/{projectId}/role-agents`

规则：
- 每个 `roleId` 必须且仅可有 1 个 `PRIMARY`。
- `PRIMARY` 使用模型 tier 必须为 `PREMIUM` 或 `BALANCED`。

---

## 八、审计 API

## 8.1 查询审计日志
- `GET /audit-logs?entityType=SKILL&entityId=...&page=1&pageSize=20`

响应字段：
- `action`
- `actor`
- `entityType`
- `entityId`
- `beforeData`
- `afterData`
- `createdAt`

---

## 九、幂等与并发

- 创建类接口支持 `Idempotency-Key` Header（24小时内去重）。
- 更新模板、能力发布采用乐观锁字段 `updatedAt` 或 `version`。

---

## 十、限流与安全

- 默认限流：`120 req/min/user`。
- 健康检查接口：`30 req/min/user`。
- MCP 密钥只支持密文写入，不返回明文。
