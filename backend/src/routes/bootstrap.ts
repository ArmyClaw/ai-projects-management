import { FastifyInstance } from "fastify";
import { z } from "zod";
import { fail, ok } from "../services/http.js";
import { prisma } from "../services/prisma.js";
import { writeAuditLog } from "../services/audit.js";
import { RoleAssignment, ValidationErrorDetail } from "../types/domain.js";

const assignmentAgentSchema = z.object({
  agentId: z.string().min(1),
  assignmentRole: z.enum(["PRIMARY", "ASSISTANT"]),
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

const validateAssignments = (
  assignments: RoleAssignment[],
  modelMap: Map<string, { healthStatus: string; tier: string }>,
  agentSet: Set<string>,
): ValidationErrorDetail[] => {
  const errors: ValidationErrorDetail[] = [];
  for (const role of assignments) {
    const primary = role.agents.filter((a) => a.assignmentRole === "PRIMARY");
    if (primary.length !== 1) {
      errors.push({
        field: `roles[${role.roleId}]`,
        reason: "MISSING_PRIMARY_AGENT",
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
      if (entry.assignmentRole === "PRIMARY" && model && !["PREMIUM", "BALANCED"].includes(model.tier)) {
        errors.push({
          field: `agents[${entry.agentId}].model`,
          reason: "INVALID_PRIMARY_MODEL_TIER",
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
        assignmentRole: a.assignmentRole,
        modelId: a.modelId,
        priority: a.priority,
      })),
    );

    await prisma.$transaction(async (tx) => {
      await tx.projectRoleAgent.deleteMany({ where: { projectId } });
      await tx.projectRoleAgent.createMany({ data: createRows });
    });

    const after = await prisma.projectRoleAgent.findMany({ where: { projectId } });
    await writeAuditLog({
      action: "UPDATE_ROLE_AGENTS",
      entityType: "PROJECT",
      entityId: projectId,
      beforeData: before,
      afterData: after,
    });

    return ok(reply, { projectId, updated: after.length });
  });
}
