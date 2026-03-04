import { Prisma } from "@prisma/client";
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

  const mcpCountRows = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT COUNT(*)::bigint AS count FROM "Mcp"
  `);
  const mcpCount = Number(mcpCountRows[0]?.count ?? 0);
  if (mcpCount === 0) {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "Mcp" ("id", "name", "transport", "endpoint", "status", "tags", "definition", "createdAt", "updatedAt")
      VALUES
      (
        'mcp-jira',
        'Jira MCP',
        'SSE',
        'https://mcp.example.com/jira',
        'ACTIVE',
        ARRAY['pm','issue-tracking']::text[],
        '{"markdown":"# Jira MCP\\n- Query issues\\n- Update workflow"}'::jsonb,
        NOW(),
        NOW()
      ),
      (
        'mcp-github',
        'GitHub MCP',
        'HTTP',
        'https://mcp.example.com/github',
        'ACTIVE',
        ARRAY['dev','repo']::text[],
        '{"markdown":"# GitHub MCP\\n- PR review\\n- Repo search"}'::jsonb,
        NOW(),
        NOW()
      )
    `);
  }

  const project = await prisma.project.findUnique({ where: { id: "project-demo-1" } });
  if (!project) {
    await prisma.project.create({
      data: { id: "project-demo-1", name: "Demo Project" },
    });
  }
}
