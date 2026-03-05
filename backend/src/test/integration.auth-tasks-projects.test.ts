import test from "node:test";
import assert from "node:assert/strict";
import { buildApp } from "../app.js";
import { prisma } from "../services/prisma.js";

const parseJson = (payload: string) => JSON.parse(payload) as { ok: boolean; data?: any; error?: { code: string } };

const randomId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

test("auth + tasks + projects integration flow", async () => {
  process.env.DISABLE_SEED = "1";
  const app = await buildApp();

  const modelId = randomId("model-it");
  const agentId = randomId("agent-it");
  const projectId = randomId("project-it");
  const handlePublisher = `pub_${Math.random().toString(36).slice(2, 10)}`;
  const handleTeam = `team_${Math.random().toString(36).slice(2, 10)}`;
  const taskIds: string[] = [];

  const cleanup = async () => {
    await prisma.taskQuestApplication.deleteMany({
      where: {
        OR: [{ projectId }, { taskId: { in: taskIds } }],
      },
    });
    await prisma.taskQuest.deleteMany({ where: { id: { in: taskIds } } });
    await prisma.projectRoleAgent.deleteMany({ where: { projectId } });
    await prisma.project.deleteMany({ where: { id: projectId } });
    await prisma.agent.deleteMany({ where: { id: agentId } });
    await prisma.model.deleteMany({ where: { id: modelId } });
    await prisma.user.deleteMany({ where: { handle: { in: [handlePublisher, handleTeam] } } });
  };

  const req = async (opts: {
    method: "GET" | "POST" | "PATCH" | "PUT";
    url: string;
    token?: string;
    body?: Record<string, unknown>;
  }) => {
    const res = await app.inject({
      method: opts.method,
      url: opts.url,
      headers: opts.token ? { authorization: `Bearer ${opts.token}` } : {},
      payload: opts.body,
    } as any);
    const json = parseJson(String((res as { payload: string }).payload));
    return { res, json };
  };

  try {
    await cleanup();

    const registerPublisher = await req({
      method: "POST",
      url: "/api/v1/auth/register",
      body: { handle: handlePublisher, displayName: "Publisher", password: "test123456" },
    });
    assert.equal(registerPublisher.res.statusCode, 200);
    assert.equal(registerPublisher.json.ok, true);
    const publisherToken = String(registerPublisher.json.data.token);

    const registerTeam = await req({
      method: "POST",
      url: "/api/v1/auth/register",
      body: { handle: handleTeam, displayName: "Team", password: "test123456" },
    });
    assert.equal(registerTeam.res.statusCode, 200);
    assert.equal(registerTeam.json.ok, true);
    const teamToken = String(registerTeam.json.data.token);

    const createModel = await req({
      method: "POST",
      url: "/api/v1/models",
      token: publisherToken,
      body: {
        id: modelId,
        name: "Integration Model",
        provider: "Test",
        modelId: "test-model-1",
        tier: "BALANCED",
      },
    });
    assert.equal(createModel.res.statusCode, 200);

    const healthCheck = await req({
      method: "POST",
      url: `/api/v1/models/${modelId}/health-check`,
      token: publisherToken,
      body: {},
    });
    assert.equal(healthCheck.res.statusCode, 200);

    const publishModel = await req({
      method: "POST",
      url: `/api/v1/models/${modelId}/publish`,
      token: publisherToken,
      body: {},
    });
    assert.equal(publishModel.res.statusCode, 200);

    const createAgent = await req({
      method: "POST",
      url: "/api/v1/agents",
      token: teamToken,
      body: {
        id: agentId,
        name: "Integration Agent",
        roleId: "general",
        workload: 40,
        defaultModelId: modelId,
        skillIds: [],
        mcpIds: [],
      },
    });
    assert.equal(createAgent.res.statusCode, 200);

    const createProject = await req({
      method: "POST",
      url: "/api/v1/projects",
      token: teamToken,
      body: { id: projectId, name: "Integration Project" },
    });
    assert.equal(createProject.res.statusCode, 200);

    const saveAssignments = await req({
      method: "PUT",
      url: `/api/v1/projects/${projectId}/role-agents`,
      token: teamToken,
      body: {
        roleAgentAssignments: [
          {
            roleId: "role.stage1",
            agents: [{ agentId, modelId, priority: 10 }],
          },
        ],
      },
    });
    assert.equal(saveAssignments.res.statusCode, 200);

    const createTask = await req({
      method: "POST",
      url: "/api/v1/tasks",
      token: publisherToken,
      body: {
        title: "Integration Task",
        background: "bg",
        objective: "obj",
        plan: "plan",
        conditions: "conditions",
        targetPath: "D:\\\\integration\\\\target",
      },
    });
    assert.equal(createTask.res.statusCode, 200);
    const taskId = String(createTask.json.data.id);
    taskIds.push(taskId);

    const publicListBefore = await req({ method: "GET", url: "/api/v1/tasks" });
    assert.equal(publicListBefore.res.statusCode, 200);
    assert.equal(publicListBefore.json.data.some((x: { id: string }) => x.id === taskId), true);

    const unpublishTask = await req({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/unpublish`,
      token: publisherToken,
      body: {},
    });
    assert.equal(unpublishTask.res.statusCode, 200);

    const publicListAfterUnpublish = await req({ method: "GET", url: "/api/v1/tasks" });
    assert.equal(publicListAfterUnpublish.res.statusCode, 200);
    assert.equal(publicListAfterUnpublish.json.data.some((x: { id: string }) => x.id === taskId), false);

    const ownerListAfterUnpublish = await req({ method: "GET", url: "/api/v1/tasks", token: publisherToken });
    assert.equal(ownerListAfterUnpublish.res.statusCode, 200);
    assert.equal(ownerListAfterUnpublish.json.data.some((x: { id: string }) => x.id === taskId), true);

    const republishTask = await req({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/publish`,
      token: publisherToken,
      body: {},
    });
    assert.equal(republishTask.res.statusCode, 200);

    const applyTask = await req({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/apply`,
      token: teamToken,
      body: { projectId, message: "team ready" },
    });
    assert.equal(applyTask.res.statusCode, 200);
    const applicationId = String(applyTask.json.data.id);

    const adoptTask = await req({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/adopt`,
      token: publisherToken,
      body: { applicationId },
    });
    assert.equal(adoptTask.res.statusCode, 200);

    const startTask = await req({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/start`,
      token: teamToken,
      body: {},
    });
    assert.equal(startTask.res.statusCode, 200);

    const progressTask = await req({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/progress`,
      token: teamToken,
      body: { report: "integration progress report" },
    });
    assert.equal(progressTask.res.statusCode, 200);

    const retreatTask = await req({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/retreat`,
      token: publisherToken,
      body: {},
    });
    assert.equal(retreatTask.res.statusCode, 200);
    assert.equal(retreatTask.json.data.status, "OPEN");
  } finally {
    await cleanup();
    await app.close();
  }
});
