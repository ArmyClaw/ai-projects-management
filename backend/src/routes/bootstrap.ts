import { FastifyInstance } from "fastify";
import { z } from "zod";
import { fail, ok } from "../services/http.js";
import { prisma } from "../services/prisma.js";
import { writeAuditLog } from "../services/audit.js";
import { getActorId } from "../services/auth.js";
import { RoleAssignment, ValidationErrorDetail } from "../types/domain.js";

const assignmentAgentSchema = z.object({
  agentId: z.string().min(1),
  modelId: z.string().min(1),
  priority: z.number().int().positive(),
});

const roleAssignmentSchema = z.object({
  roleId: z.string().min(1),
  agents: z.array(assignmentAgentSchema).min(1),
});

const responsibilitySchema = z.string().trim().min(1);

const phaseRoleSchema = z.object({
  roleId: z.string().min(1),
  instances: z.number().int().positive(),
  responsibilities: z.array(responsibilitySchema).min(1),
});

const phaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  objective: z.string().optional(),
  roles: z.array(phaseRoleSchema).min(1),
});

const projectTemplateSchema = z.object({
  name: z.string().min(1),
  phases: z.array(phaseSchema).min(1),
});

const validateSchema = z.object({
  projectTemplateId: z.string().min(1),
  projectName: z.string().min(1),
  startDate: z.string().min(1),
  objective: z.string().optional(),
  projectTemplate: projectTemplateSchema,
  roleAgentAssignments: z.array(roleAssignmentSchema).min(1),
});

const updateRoleAgentsSchema = z.object({
  roleAgentAssignments: z.array(roleAssignmentSchema).min(1),
});

const createProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});

const validateAssignments = (
  assignments: RoleAssignment[],
  modelMap: Map<string, { healthStatus: string; tier: string }>,
  agentSet: Set<string>,
): ValidationErrorDetail[] => {
  const errors: ValidationErrorDetail[] = [];
  for (const role of assignments) {
    if (role.agents.length === 0) {
      errors.push({
        field: `roles[${role.roleId}]`,
        reason: "MISSING_ROLE_AGENT",
      });
      continue;
    }
    for (const entry of role.agents) {
      const model = modelMap.get(entry.modelId);
      if (!model || !["HEALTHY", "DEGRADED"].includes(model.healthStatus)) {
        errors.push({
          field: `agents[${entry.agentId}].model`,
          reason: "MODEL_UNAVAILABLE",
        });
      }
      if (!agentSet.has(entry.agentId)) {
        errors.push({
          field: `agents[${entry.agentId}]`,
          reason: "AGENT_NOT_FOUND",
        });
      }
    }
  }
  return errors;
};

const validateTemplate = (
  template: z.infer<typeof projectTemplateSchema>,
  assignments: RoleAssignment[],
): { details: ValidationErrorDetail[]; templateRoleCount: number; plannedInstances: number } => {
  const details: ValidationErrorDetail[] = [];
  const roleRequiredHeadcount = new Map<string, number>();

  for (const phase of template.phases) {
    for (const role of phase.roles) {
      if (role.responsibilities.length === 0) {
        details.push({
          field: `template.phases[${phase.id}].roles[${role.roleId}]`,
          reason: "MISSING_ROLE_RESPONSIBILITIES",
        });
      }
      const current = roleRequiredHeadcount.get(role.roleId) ?? 0;
      roleRequiredHeadcount.set(role.roleId, Math.max(current, role.instances));
    }
  }

  const assignmentMap = new Map(assignments.map((r) => [r.roleId, r]));
  for (const [roleId, required] of roleRequiredHeadcount.entries()) {
    const assigned = assignmentMap.get(roleId);
    if (!assigned) {
      details.push({
        field: `roles[${roleId}]`,
        reason: "MISSING_ROLE_ASSIGNMENT",
      });
      continue;
    }
    if (assigned.agents.length < required) {
      details.push({
        field: `roles[${roleId}]`,
        reason: "ROLE_INSTANCE_NOT_ENOUGH",
      });
    }
  }

  return {
    details,
    templateRoleCount: roleRequiredHeadcount.size,
    plannedInstances: [...roleRequiredHeadcount.values()].reduce((acc, x) => acc + x, 0),
  };
};

export async function bootstrapRoutes(app: FastifyInstance) {
  app.get("/api/v1/projects", async (_, reply) => {
    const rows = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { assignments: true } },
      },
    });
    return ok(
      reply,
      rows.map((project) => ({
        id: project.id,
        name: project.name,
        createdBy: project.createdBy,
        updatedBy: project.updatedBy,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        assignmentsCount: project._count.assignments,
      })),
    );
  });

  app.post("/api/v1/projects", async (req, reply) => {
    const actorId = getActorId(req);
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }
    const exists = await prisma.project.findUnique({ where: { id: parsed.data.id } });
    if (exists) {
      return fail(reply, "CONFLICT", "Project id already exists", [{ field: "id", reason: "DUPLICATE" }], 409);
    }
    const project = await prisma.project.create({
      data: {
        id: parsed.data.id,
        name: parsed.data.name,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
    await writeAuditLog({
      action: "CREATE",
      entityType: "PROJECT",
      entityId: project.id,
      afterData: project,
      actorId,
    });
    return ok(reply, project);
  });

  app.get("/api/v1/projects/:id/export", async (req, reply) => {
    const projectId = (req.params as { id: string }).id;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        assignments: {
          orderBy: [{ roleId: "asc" }, { priority: "asc" }],
          include: {
            agent: { select: { id: true, name: true } },
            model: { select: { id: true, name: true, provider: true, modelId: true, tier: true } },
          },
        },
      },
    });
    if (!project) {
      return fail(reply, "NOT_FOUND", "Project not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }

    const roleMap = new Map<
      string,
      Array<{
        priority: number;
        agent: { id: string; name: string };
        model: { id: string; name: string; provider: string; modelId: string; tier: string };
      }>
    >();
    for (const row of project.assignments) {
      const list = roleMap.get(row.roleId) ?? [];
      list.push({
        priority: row.priority,
        agent: { id: row.agent.id, name: row.agent.name },
        model: {
          id: row.model.id,
          name: row.model.name,
          provider: row.model.provider,
          modelId: row.model.modelId,
          tier: row.model.tier,
        },
      });
      roleMap.set(row.roleId, list);
    }

    return ok(reply, {
      project: {
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
      summary: {
        roles: roleMap.size,
        assignments: project.assignments.length,
        teammateCount: new Set(project.assignments.map((a) => a.agentId)).size,
      },
      roles: [...roleMap.entries()].map(([roleId, assignments]) => ({ roleId, assignments })),
      exportedAt: new Date().toISOString(),
    });
  });

  app.post("/api/v1/projects/bootstrap/validate", async (req, reply) => {
    const parsed = validateSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }
    const modelIds = parsed.data.roleAgentAssignments.flatMap((r) => r.agents.map((a) => a.modelId));
    const agentIds = parsed.data.roleAgentAssignments.flatMap((r) => r.agents.map((a) => a.agentId));
    const [modelRows, agentRows] = await Promise.all([
      prisma.model.findMany({ where: { id: { in: modelIds } } }),
      prisma.agent.findMany({ where: { id: { in: agentIds } } }),
    ]);
    const modelMap = new Map(modelRows.map((m) => [m.id, { healthStatus: m.healthStatus, tier: m.tier }]));
    const agentSet = new Set(agentRows.map((a) => a.id));
    const assignmentDetails = validateAssignments(parsed.data.roleAgentAssignments, modelMap, agentSet);
    const templateValidation = validateTemplate(parsed.data.projectTemplate, parsed.data.roleAgentAssignments);
    const details = [...assignmentDetails, ...templateValidation.details];
    if (details.length > 0) {
      return fail(reply, "BOOTSTRAP_VALIDATION_FAILED", "Validation failed", details);
    }
    return ok(reply, {
      pass: true,
      warnings: [],
      summary: {
        phases: parsed.data.projectTemplate.phases.length,
        roles: parsed.data.roleAgentAssignments.length,
        templateRoles: templateValidation.templateRoleCount,
        plannedInstances: templateValidation.plannedInstances,
        models: parsed.data.roleAgentAssignments.reduce((acc, r) => acc + r.agents.length, 0),
      },
    });
  });

  app.put("/api/v1/projects/:id/role-agents", async (req, reply) => {
    const actorId = getActorId(req);
    const projectId = (req.params as { id: string }).id;
    const parsed = updateRoleAgentsSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return fail(reply, "NOT_FOUND", "Project not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }

    const modelIds = parsed.data.roleAgentAssignments.flatMap((r) => r.agents.map((a) => a.modelId));
    const agentIds = parsed.data.roleAgentAssignments.flatMap((r) => r.agents.map((a) => a.agentId));
    const [modelRows, agentRows] = await Promise.all([
      prisma.model.findMany({ where: { id: { in: modelIds } } }),
      prisma.agent.findMany({ where: { id: { in: agentIds } } }),
      ]);
    const modelMap = new Map(modelRows.map((m) => [m.id, { healthStatus: m.healthStatus, tier: m.tier }]));
    const agentSet = new Set(agentRows.map((a) => a.id));
    const details = validateAssignments(parsed.data.roleAgentAssignments, modelMap, agentSet);
    if (details.length > 0) {
      return fail(reply, "BOOTSTRAP_VALIDATION_FAILED", "Validation failed", details);
    }

    const before = await prisma.projectRoleAgent.findMany({ where: { projectId } });

    const createRows = parsed.data.roleAgentAssignments.flatMap((r) =>
      r.agents.map((a) => ({
        projectId,
        roleId: r.roleId,
        agentId: a.agentId,
        modelId: a.modelId,
        priority: a.priority,
        createdBy: actorId,
        updatedBy: actorId,
      })),
    );

    await prisma.$transaction(async (tx) => {
      await tx.projectRoleAgent.deleteMany({ where: { projectId } });
      await tx.projectRoleAgent.createMany({ data: createRows });
      await tx.project.update({
        where: { id: projectId },
        data: { updatedBy: actorId },
      });
    });

    const after = await prisma.projectRoleAgent.findMany({ where: { projectId } });
    await writeAuditLog({
      action: "UPDATE_ROLE_AGENTS",
      entityType: "PROJECT",
      entityId: projectId,
      beforeData: before,
      afterData: after,
      actorId,
    });

    return ok(reply, { projectId, updated: after.length });
  });
}
