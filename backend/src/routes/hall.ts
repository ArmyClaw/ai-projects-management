import { FastifyInstance } from "fastify";
import { prisma } from "../services/prisma.js";
import { ok } from "../services/http.js";

type AgentWorkflow = {
  mcpIds?: unknown;
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const countMcpFromWorkflow = (workflow: unknown) => {
  if (!workflow || typeof workflow !== "object") return 0;
  const value = (workflow as AgentWorkflow).mcpIds;
  if (!Array.isArray(value)) return 0;
  return value.filter((x) => typeof x === "string").length;
};

export async function hallRoutes(app: FastifyInstance) {
  app.get("/api/v1/hall/overview", async (_, reply) => {
    const today = startOfToday();
    const [
      totalModels,
      totalSkills,
      totalMcps,
      totalProjects,
      totalAssignments,
      todayModels,
      todaySkills,
      todayMcps,
      todayProjects,
      projects,
      agents,
      topModelUsage,
      topAgentUsage,
      recentLogs,
    ] = await Promise.all([
      prisma.model.count(),
      prisma.skill.count(),
      prisma.mcp.count(),
      prisma.project.count(),
      prisma.projectRoleAgent.count(),
      prisma.model.count({ where: { createdAt: { gte: today } } }),
      prisma.skill.count({ where: { createdAt: { gte: today } } }),
      prisma.mcp.count({ where: { createdAt: { gte: today } } }),
      prisma.project.count({ where: { createdAt: { gte: today } } }),
      prisma.project.findMany({
        select: { id: true, name: true, createdAt: true, assignments: { select: { id: true } } },
        orderBy: { assignments: { _count: "desc" } },
        take: 8,
      }),
      prisma.agent.findMany({ select: { id: true, name: true, skillIds: true, workflow: true } }),
      prisma.projectRoleAgent.groupBy({
        by: ["modelId"],
        _count: { modelId: true },
        orderBy: { _count: { modelId: "desc" } },
        take: 1,
      }),
      prisma.projectRoleAgent.groupBy({
        by: ["agentId"],
        _count: { agentId: true },
        orderBy: { _count: { agentId: "desc" } },
        take: 1,
      }),
      prisma.auditLog.findMany({
        select: { action: true, entityType: true, entityId: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 18,
      }),
    ]);

    const skillMaster = agents
      .map((a) => ({ id: a.id, name: a.name, skillCount: a.skillIds.length }))
      .sort((a, b) => b.skillCount - a.skillCount)[0] ?? null;

    const mcpMaster = agents
      .map((a) => ({ id: a.id, name: a.name, mcpCount: countMcpFromWorkflow(a.workflow) }))
      .sort((a, b) => b.mcpCount - a.mcpCount)[0] ?? null;

    const projectLuxuryTopRaw = projects.map((p) => ({
      id: p.id,
      name: p.name,
      assignmentsCount: p.assignments.length,
      createdAt: p.createdAt,
    }));
    const luxuryProject = projectLuxuryTopRaw[0] ?? null;

    const modelIds = topModelUsage.map((x) => x.modelId);
    const agentIds = topAgentUsage.map((x) => x.agentId);
    const [topModelRows, topAgentRows] = await Promise.all([
      modelIds.length > 0 ? prisma.model.findMany({ where: { id: { in: modelIds } }, select: { id: true, name: true } }) : [],
      agentIds.length > 0 ? prisma.agent.findMany({ where: { id: { in: agentIds } }, select: { id: true, name: true } }) : [],
    ]);

    const modelById = new Map(topModelRows.map((m) => [m.id, m]));
    const agentById = new Map(topAgentRows.map((a) => [a.id, a]));

    const worldChannelRaw =
      recentLogs.length > 0
        ? recentLogs.map((log) => ({
            message: `${log.entityType}#${log.entityId} ${log.action}`,
            at: log.createdAt,
          }))
        : [
            ...projectLuxuryTopRaw.slice(0, 3).map((project) => ({
              message: `PROJECT#${project.id} READY`,
              at: project.createdAt,
            })),
            ...agents.slice(0, 3).map((agent) => ({
              message: `AGENT#${agent.id} ONLINE`,
              at: new Date(),
            })),
          ];

    const worldChannel =
      worldChannelRaw.length > 0
        ? worldChannelRaw
        : [
            { message: "SYSTEM#LOBBY READY", at: new Date() },
            { message: "SYSTEM#CHANNEL WAITING_FOR_EVENTS", at: new Date() },
          ];

    const projectLuxuryTop =
      projectLuxuryTopRaw.length > 0
        ? projectLuxuryTopRaw.map((item) => ({
            id: item.id,
            name: item.name,
            assignmentsCount: item.assignmentsCount,
          }))
        : [
            { id: "SHOWCASE-001", name: "Starter Pipeline", assignmentsCount: 0 },
            { id: "SHOWCASE-002", name: "Empty Slot - Create Your First Team", assignmentsCount: 0 },
          ];

    return ok(reply, {
      generatedAt: new Date(),
      today: {
        modelsCreated: todayModels,
        skillsCreated: todaySkills,
        mcpsCreated: todayMcps,
        projectsCreated: todayProjects,
      },
      totals: {
        models: totalModels,
        skills: totalSkills,
        mcps: totalMcps,
        agents: agents.length,
        projects: totalProjects,
        projectAssignments: totalAssignments,
      },
      champions: {
        skillMaster,
        mcpMaster,
        projectTycoon: luxuryProject,
        mostUsedModel:
          topModelUsage[0]
            ? {
                modelId: topModelUsage[0].modelId,
                modelName: modelById.get(topModelUsage[0].modelId)?.name ?? topModelUsage[0].modelId,
                usageCount: topModelUsage[0]._count.modelId,
              }
            : null,
        mostUsedAgent:
          topAgentUsage[0]
            ? {
                agentId: topAgentUsage[0].agentId,
                agentName: agentById.get(topAgentUsage[0].agentId)?.name ?? topAgentUsage[0].agentId,
                usageCount: topAgentUsage[0]._count.agentId,
              }
            : null,
      },
      projectLuxuryTop,
      worldChannel,
    });
  });
}
