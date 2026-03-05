import { prisma } from "./prisma.js";

export async function seedIfEmpty() {
  const agentCount = await prisma.agent.count();
  if (agentCount === 0) {
    await prisma.agent.createMany({
      data: [
        { id: "agent-backend-lead", name: "backend-lead", roleId: "role-backend", workload: 60 },
        { id: "agent-backend-a1", name: "backend-a1", roleId: "role-backend", workload: 40 },
        { id: "agent-backend-a2", name: "backend-a2", roleId: "role-backend", workload: 35 },
      ],
    });
  }

  const mcpCount = await prisma.mcp.count();
  if (mcpCount === 0) {
    await prisma.mcp.createMany({
      data: [
        {
          id: "mcp-jira",
          name: "Jira MCP",
          transport: "SSE",
          endpoint: "https://mcp.example.com/jira",
          status: "ACTIVE",
          tags: ["pm", "issue-tracking"],
          definition: { markdown: "# Jira MCP\n- Query issues\n- Update workflow" },
        },
        {
          id: "mcp-github",
          name: "GitHub MCP",
          transport: "HTTP",
          endpoint: "https://mcp.example.com/github",
          status: "ACTIVE",
          tags: ["dev", "repo"],
          definition: { markdown: "# GitHub MCP\n- PR review\n- Repo search" },
        },
      ],
    });
  }

  const project = await prisma.project.findUnique({ where: { id: "project-demo-1" } });
  if (!project) {
    await prisma.project.create({
      data: { id: "project-demo-1", name: "Demo Project" },
    });
  }

  const sampleTaskId = "task-sample-delivery";
  const sampleApplicationId = "task-sample-delivery-app";
  const sampleTask = await prisma.taskQuest.findUnique({ where: { id: sampleTaskId } });
  if (!sampleTask) {
    const detailPayload = {
      summary: "示例任务：优化任务列表并联调开始出发按钮。",
      background: "## 背景\n需要验证任务大厅在未登录时的可读性，以及团队出发后的状态流转。",
      objective: "## 目标\n1. 任务可见\n2. 出发按钮可触发\n3. 目标路径可查看",
      plan: "1. 浏览任务列表\n2. 登录后点击开始出发\n3. 检查状态与日志",
      conditions: "需保留当前数据；若任务已开始，按钮应不可重复触发。",
      targetPath: "D:\\Projects\\GitHub\\ai-projects-management\\delivery\\task-sample-delivery",
      startedAt: "",
    };
    const task = await prisma.taskQuest.create({
      data: {
        id: sampleTaskId,
        title: "示例任务：任务大厅联调",
        detail: `[TASK_DETAIL_V2] ${JSON.stringify(detailPayload)}`,
        reward: "Demo Badge + 联调通过",
        publisherId: "system",
        status: "ADOPTED",
      },
    });
    const application = await prisma.taskQuestApplication.create({
      data: {
        id: sampleApplicationId,
        taskId: task.id,
        projectId: "project-demo-1",
        applicantId: "system",
        message: "示例团队已就位，可直接开始出发。",
        status: "ADOPTED",
      },
    });
    await prisma.taskQuest.update({
      where: { id: task.id },
      data: { adoptedApplicationId: application.id },
    });
  }
}
