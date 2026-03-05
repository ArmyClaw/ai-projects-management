import { prisma } from "./prisma.js";
import { encodeTaskDetail } from "./task-detail.js";

export async function seedIfEmpty() {
  await prisma.model.upsert({
    where: { id: "model-openai-gpt4o-mini" },
    update: {},
    create: {
      id: "model-openai-gpt4o-mini",
      name: "OpenAI GPT-4o mini",
      provider: "OpenAI",
      modelId: "gpt-4o-mini",
      tier: "BALANCED",
      status: "ACTIVE",
      healthStatus: "HEALTHY",
    },
  });
  await prisma.model.upsert({
    where: { id: "model-anthropic-sonnet" },
    update: {},
    create: {
      id: "model-anthropic-sonnet",
      name: "Anthropic Claude Sonnet",
      provider: "Anthropic",
      modelId: "claude-sonnet-4-0",
      tier: "PREMIUM",
      status: "ACTIVE",
      healthStatus: "HEALTHY",
    },
  });
  await prisma.model.upsert({
    where: { id: "model-google-gemini-flash" },
    update: {},
    create: {
      id: "model-google-gemini-flash",
      name: "Google Gemini Flash",
      provider: "Google",
      modelId: "gemini-2.0-flash",
      tier: "ECONOMY",
      status: "ACTIVE",
      healthStatus: "DEGRADED",
    },
  });

  const skillSeeds = [
    {
      id: "skill-fastapi-api-design",
      name: "FastAPI API Design",
      version: "1.0.0",
      tags: ["python", "api", "backend", "fastapi"],
      markdown:
        "# FastAPI API Design\n\n- Source: https://github.com/fastapi/fastapi\n- Focus: REST API contract, request validation, async handler design.\n- Checklist: router layering, schema boundaries, error code consistency.",
    },
    {
      id: "skill-prisma-data-modeling",
      name: "Prisma Data Modeling",
      version: "1.0.0",
      tags: ["prisma", "database", "migration", "postgres"],
      markdown:
        "# Prisma Data Modeling\n\n- Source: https://github.com/prisma/prisma\n- Focus: schema evolution, relation design, migration safety.\n- Checklist: nullable transitions, index coverage, seed compatibility.",
    },
    {
      id: "skill-playwright-e2e",
      name: "Playwright E2E",
      version: "1.0.0",
      tags: ["e2e", "playwright", "qa", "web"],
      markdown:
        "# Playwright E2E\n\n- Source: https://github.com/microsoft/playwright\n- Focus: end-to-end regression for core user journeys.\n- Checklist: auth flow, flaky selectors, trace capture and retries.",
    },
    {
      id: "skill-vitest-unit-testing",
      name: "Vitest Unit Testing",
      version: "1.0.0",
      tags: ["vitest", "test", "frontend", "typescript"],
      markdown:
        "# Vitest Unit Testing\n\n- Source: https://github.com/vitest-dev/vitest\n- Focus: fast unit/integration suites for TS modules.\n- Checklist: boundary mocks, deterministic fixtures, coverage on reducers/services.",
    },
    {
      id: "skill-zod-runtime-validation",
      name: "Zod Runtime Validation",
      version: "1.0.0",
      tags: ["zod", "validation", "typescript", "schema"],
      markdown:
        "# Zod Runtime Validation\n\n- Source: https://github.com/colinhacks/zod\n- Focus: request/response contract validation and safe parsing.\n- Checklist: strict object mode, custom issue messages, shared schema reuse.",
    },
  ] as const;

  for (const seed of skillSeeds) {
    await prisma.skill.upsert({
      where: { id: seed.id },
      update: {},
      create: {
        id: seed.id,
        name: seed.name,
        version: seed.version,
        status: "ACTIVE",
        tags: [...seed.tags],
        definition: { markdown: seed.markdown, avatar: "" },
      },
    });
  }

  const mcpSeeds = [
    {
      id: "mcp-server-filesystem",
      name: "MCP Filesystem Server",
      tags: ["mcp", "filesystem", "tooling"],
      pkg: "@modelcontextprotocol/server-filesystem",
      notes: "Read/write local workspace files with explicit allowed directories.",
    },
    {
      id: "mcp-server-github",
      name: "MCP GitHub Server",
      tags: ["mcp", "github", "devops"],
      pkg: "@modelcontextprotocol/server-github",
      notes: "Query issues, pull requests, and repository metadata.",
    },
    {
      id: "mcp-server-postgres",
      name: "MCP Postgres Server",
      tags: ["mcp", "postgres", "data"],
      pkg: "@modelcontextprotocol/server-postgres",
      notes: "Run SQL in controlled environments for data diagnosis.",
    },
    {
      id: "mcp-server-memory",
      name: "MCP Memory Server",
      tags: ["mcp", "memory", "context"],
      pkg: "@modelcontextprotocol/server-memory",
      notes: "Persist structured memory/context between interactions.",
    },
    {
      id: "mcp-server-fetch",
      name: "MCP Fetch Server",
      tags: ["mcp", "http", "integration"],
      pkg: "@modelcontextprotocol/server-fetch",
      notes: "Fetch external resources via tool call interface.",
    },
  ] as const;

  for (const seed of mcpSeeds) {
    await prisma.mcp.upsert({
      where: { id: seed.id },
      update: {},
      create: {
        id: seed.id,
        name: seed.name,
        transport: "STDIO",
        endpoint: `stdio://${seed.id}`,
        status: "ACTIVE",
        tags: [...seed.tags],
        definition: {
          markdown: `# ${seed.name}\n\n- Source: https://github.com/modelcontextprotocol/servers\n- Package: ${seed.pkg}\n- Note: ${seed.notes}`,
          avatar: "",
          config: {
            transport: "STDIO",
            endpoint: "",
            command: "npx",
            args: ["-y", seed.pkg],
            headers: {},
            timeoutMs: 30000,
          },
        },
      },
    });
  }

  const agentSeeds = [
    {
      id: "agent-architect-owl",
      name: "Architect Owl",
      roleId: "general",
      workload: 70,
      defaultModelId: "model-anthropic-sonnet",
      skillIds: ["skill-prisma-data-modeling", "skill-zod-runtime-validation"],
      mcpIds: ["mcp-server-postgres", "mcp-server-filesystem"],
      soul: "Calm systems thinker, prefers explicit contracts and migration safety.",
    },
    {
      id: "agent-bug-hunter-raccoon",
      name: "Bug Hunter Raccoon",
      roleId: "general",
      workload: 55,
      defaultModelId: "model-openai-gpt4o-mini",
      skillIds: ["skill-playwright-e2e", "skill-vitest-unit-testing"],
      mcpIds: ["mcp-server-fetch", "mcp-server-filesystem"],
      soul: "Night-shift debugger, hunts flaky cases and edge-condition regressions.",
    },
    {
      id: "agent-doc-bard-fox",
      name: "Doc Bard Fox",
      roleId: "general",
      workload: 45,
      defaultModelId: "model-google-gemini-flash",
      skillIds: ["skill-fastapi-api-design", "skill-zod-runtime-validation"],
      mcpIds: ["mcp-server-github", "mcp-server-memory"],
      soul: "Turns implementation details into crisp guides and release notes.",
    },
    {
      id: "agent-release-captain-penguin",
      name: "Release Captain Penguin",
      roleId: "general",
      workload: 65,
      defaultModelId: "model-openai-gpt4o-mini",
      skillIds: ["skill-prisma-data-modeling", "skill-playwright-e2e", "skill-vitest-unit-testing"],
      mcpIds: ["mcp-server-github", "mcp-server-postgres", "mcp-server-fetch"],
      soul: "Release commander, emphasizes rollback plans and delivery rhythm.",
    },
  ] as const;

  for (const seed of agentSeeds) {
    await prisma.agent.upsert({
      where: { id: seed.id },
      update: {},
      create: {
        id: seed.id,
        name: seed.name,
        roleId: seed.roleId,
        workload: seed.workload,
        defaultModelId: seed.defaultModelId,
        skillIds: [...seed.skillIds],
        workflow: {
          mcpIds: [...seed.mcpIds],
          persona: {
            agents: `## AGENTS.md\n- ${seed.name}\n- Mission: deliver stable output fast`,
            user: "## USER.md\n- Product owner prefers concise weekly updates.",
            soul: `## SOUL.md\n- ${seed.soul}`,
            avatar: "",
          },
        },
      },
    });
  }

  await prisma.project.upsert({
    where: { id: "project-oss-delivery" },
    update: {},
    create: { id: "project-oss-delivery", name: "OSS Delivery Squad" },
  });
  await prisma.project.upsert({
    where: { id: "project-quality-guard" },
    update: {},
    create: { id: "project-quality-guard", name: "Quality Guard Team" },
  });
  await prisma.project.upsert({
    where: { id: "project-rag-lab" },
    update: {},
    create: { id: "project-rag-lab", name: "RAG Lab Expedition" },
  });

  const assignmentSeeds = [
    { projectId: "project-oss-delivery", roleId: "role.discovery", agentId: "agent-architect-owl", modelId: "model-anthropic-sonnet", priority: 10 },
    { projectId: "project-oss-delivery", roleId: "role.impl", agentId: "agent-release-captain-penguin", modelId: "model-openai-gpt4o-mini", priority: 20 },
    { projectId: "project-quality-guard", roleId: "role.qa", agentId: "agent-bug-hunter-raccoon", modelId: "model-openai-gpt4o-mini", priority: 10 },
    { projectId: "project-quality-guard", roleId: "role.docs", agentId: "agent-doc-bard-fox", modelId: "model-google-gemini-flash", priority: 20 },
    { projectId: "project-rag-lab", roleId: "role.research", agentId: "agent-doc-bard-fox", modelId: "model-google-gemini-flash", priority: 10 },
    { projectId: "project-rag-lab", roleId: "role.eval", agentId: "agent-bug-hunter-raccoon", modelId: "model-openai-gpt4o-mini", priority: 20 },
  ] as const;

  for (const seed of assignmentSeeds) {
    const exists = await prisma.projectRoleAgent.findFirst({
      where: { projectId: seed.projectId, roleId: seed.roleId, agentId: seed.agentId },
      select: { id: true },
    });
    if (!exists) {
      await prisma.projectRoleAgent.create({ data: { ...seed } });
    }
  }

  await prisma.taskQuest.upsert({
    where: { id: "task-open-api-hardening" },
    update: {},
    create: {
      id: "task-open-api-hardening",
      title: "API Hardening Sprint (FastAPI + Zod)",
      detail: encodeTaskDetail({
        summary: "Harden API contracts and error-handling paths before beta release.",
        background: "## Background\nService grew quickly; validation and error format drifted across endpoints.",
        objective: "## Objective\n1. Unify request schema validation\n2. Align error envelope\n3. Add safety tests",
        plan: "1. Audit current routes\n2. Normalize schemas\n3. Add tests and docs\n4. Dry-run release",
        conditions: "No breaking API change without compatibility notes; keep rollback migration.",
        targetPath: "D:\\Projects\\GitHub\\ai-projects-management\\backend\\src\\routes",
        startedAt: "",
        retreatedAt: "",
        isPublished: true,
        deletedAt: "",
        progressReports: [],
      }),
      reward: "Stability Badge + Release Ready",
      publisherId: "system",
      status: "OPEN",
    },
  });

  await prisma.taskQuest.upsert({
    where: { id: "task-adopted-mcp-rollout" },
    update: {},
    create: {
      id: "task-adopted-mcp-rollout",
      title: "MCP Tooling Rollout",
      detail: encodeTaskDetail({
        summary: "Integrate filesystem/github/postgres MCP servers into delivery workflow.",
        background: "## Background\nTeam needs unified tool access for issue tracking, SQL diagnosis, and repo operations.",
        objective: "## Objective\nEnable secure stdio MCP config and validate end-to-end usage in agent team flow.",
        plan: "1. Register MCP servers\n2. Bind to agents\n3. Test real task run\n4. Publish rollout note",
        conditions: "Least privilege first; redact tokens in logs.",
        targetPath: "D:\\Projects\\GitHub\\ai-projects-management\\web\\src\\pages\\McpsPage.vue",
        startedAt: "2026-03-01T09:20:00.000Z",
        retreatedAt: "",
        isPublished: true,
        deletedAt: "",
        progressReports: [
          {
            id: "task-adopted-mcp-rollout-r1",
            applicationId: "task-adopted-mcp-rollout-app-1",
            reporterId: "system",
            report: "完成 3 个 MCP 的配置联调，正在验证权限边界。",
            createdAt: "2026-03-01T10:30:00.000Z",
          },
        ],
      }),
      reward: "Tooling Master Ribbon",
      publisherId: "system",
      status: "ADOPTED",
      adoptedApplicationId: "task-adopted-mcp-rollout-app-1",
    },
  });

  await prisma.taskQuest.upsert({
    where: { id: "task-closed-e2e-regression" },
    update: {},
    create: {
      id: "task-closed-e2e-regression",
      title: "Release Regression Sweep",
      detail: encodeTaskDetail({
        summary: "Run full E2E + integration suite for release candidate and close blockers.",
        background: "## Background\nNeed high-confidence verification before rolling out mission-critical updates.",
        objective: "## Objective\nClose known flaky cases and produce final release report.",
        plan: "1. Run CI matrix\n2. Reproduce flakes\n3. Patch + rerun\n4. Final sign-off",
        conditions: "All critical journeys pass in two consecutive runs.",
        targetPath: "D:\\Projects\\GitHub\\ai-projects-management\\backend\\src\\test",
        startedAt: "2026-02-25T03:00:00.000Z",
        retreatedAt: "",
        isPublished: true,
        deletedAt: "",
        progressReports: [
          {
            id: "task-closed-e2e-regression-r1",
            applicationId: "task-closed-e2e-regression-app-1",
            reporterId: "system",
            report: "第一轮发现 2 个 flaky 场景，已补重试策略和等待条件。",
            createdAt: "2026-02-25T08:10:00.000Z",
          },
          {
            id: "task-closed-e2e-regression-r2",
            applicationId: "task-closed-e2e-regression-app-1",
            reporterId: "system",
            report: "第二轮全绿，已输出发布回归报告。",
            createdAt: "2026-02-26T06:40:00.000Z",
          },
        ],
      }),
      reward: "Release Guardian Medal",
      publisherId: "system",
      status: "CLOSED",
      adoptedApplicationId: "task-closed-e2e-regression-app-1",
    },
  });

  await prisma.taskQuestApplication.upsert({
    where: { id: "task-adopted-mcp-rollout-app-1" },
    update: {},
    create: {
      id: "task-adopted-mcp-rollout-app-1",
      taskId: "task-adopted-mcp-rollout",
      projectId: "project-oss-delivery",
      applicantId: "system",
      message: "OSS Delivery Squad ready for MCP rollout.",
      status: "ADOPTED",
    },
  });
  await prisma.taskQuestApplication.upsert({
    where: { id: "task-adopted-mcp-rollout-app-2" },
    update: {},
    create: {
      id: "task-adopted-mcp-rollout-app-2",
      taskId: "task-adopted-mcp-rollout",
      projectId: "project-quality-guard",
      applicantId: "system",
      message: "QA team can support fallback and regression checks.",
      status: "REJECTED",
    },
  });
  await prisma.taskQuestApplication.upsert({
    where: { id: "task-closed-e2e-regression-app-1" },
    update: {},
    create: {
      id: "task-closed-e2e-regression-app-1",
      taskId: "task-closed-e2e-regression",
      projectId: "project-quality-guard",
      applicantId: "system",
      message: "Quality Guard Team executing full regression matrix.",
      status: "ADOPTED",
    },
  });
}
