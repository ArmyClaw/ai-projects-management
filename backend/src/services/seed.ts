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
}
