import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "../services/http.js";
import { prisma } from "../services/prisma.js";
import { writeAuditLog } from "../services/audit.js";

const createAgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  roleId: z.string().min(1),
  workload: z.number().int().min(0).max(100),
  defaultModelId: z.string().min(1).optional(),
  skillIds: z.array(z.string().min(1)).default([]),
  workflow: z.record(z.unknown()).optional(),
});

const updateAgentModelSchema = z.object({
  defaultModelId: z.string().min(1),
});

const updateAgentCapabilitiesSchema = z.object({
  skillIds: z.array(z.string().min(1)).default([]),
  workflow: z.record(z.unknown()),
});

const updateRoleGroupSchema = z.object({
  skillIds: z.array(z.string().min(1)).default([]),
  workflow: z.record(z.unknown()).default({}),
  workloadMarkdown: z.string().min(1),
  primaryModelId: z.string().min(1),
  assistantModelId: z.string().min(1),
});

export async function agentRoutes(app: FastifyInstance) {
  app.get("/api/v1/agents", async (_, reply) => {
    const rows = await prisma.agent.findMany({ orderBy: { createdAt: "desc" } });
    return ok(reply, rows);
  });

  app.post("/api/v1/agents", async (req, reply) => {
    const parsed = createAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }

    const exists = await prisma.agent.findUnique({ where: { id: parsed.data.id } });
    if (exists) {
      return fail(reply, "CONFLICT", "Agent id already exists", [{ field: "id", reason: "DUPLICATE" }], 409);
    }

    if (parsed.data.defaultModelId) {
      const model = await prisma.model.findUnique({ where: { id: parsed.data.defaultModelId } });
      if (!model || model.status !== "ACTIVE") {
        return fail(reply, "CAPABILITY_NOT_ACTIVE", "Model must be ACTIVE", [
          { field: "defaultModelId", reason: "MODEL_NOT_ACTIVE" },
        ]);
      }
    }

    if (parsed.data.skillIds.length > 0) {
      const activeSkillRows = await prisma.skill.findMany({
        where: {
          id: { in: parsed.data.skillIds },
          status: "ACTIVE",
        },
        select: { id: true },
      });
      const activeSkillSet = new Set(activeSkillRows.map((s) => s.id));
      const missing = parsed.data.skillIds.find((id) => !activeSkillSet.has(id));
      if (missing) {
        return fail(reply, "CAPABILITY_NOT_ACTIVE", "Skill must be ACTIVE", [
          { field: "skillIds", reason: `SKILL_NOT_ACTIVE:${missing}` },
        ]);
      }
    }

    const agent = await prisma.agent.create({
      data: {
        id: parsed.data.id,
        name: parsed.data.name,
        roleId: parsed.data.roleId,
        workload: parsed.data.workload,
        defaultModelId: parsed.data.defaultModelId,
        skillIds: parsed.data.skillIds,
        workflow: parsed.data.workflow as Prisma.InputJsonValue | undefined,
      },
    });
    await writeAuditLog({
      action: "CREATE",
      entityType: "AGENT",
      entityId: agent.id,
      afterData: agent,
    });
    return ok(reply, agent);
  });

  app.patch("/api/v1/agents/:id/model", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const parsed = updateAgentModelSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "defaultModelId", reason: "REQUIRED" },
      ], 400);
    }
    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      return fail(reply, "NOT_FOUND", "Agent not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    const model = await prisma.model.findUnique({ where: { id: parsed.data.defaultModelId } });
    if (!model || model.status !== "ACTIVE") {
      return fail(reply, "CAPABILITY_NOT_ACTIVE", "Model must be ACTIVE", [
        { field: "defaultModelId", reason: "MODEL_NOT_ACTIVE" },
      ]);
    }
    const updated = await prisma.agent.update({
      where: { id },
      data: { defaultModelId: parsed.data.defaultModelId },
    });
    await writeAuditLog({
      action: "UPDATE_MODEL",
      entityType: "AGENT",
      entityId: id,
      beforeData: agent,
      afterData: updated,
    });
    return ok(reply, updated);
  });

  app.patch("/api/v1/agents/:id/capabilities", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const parsed = updateAgentCapabilitiesSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }

    const agent = await prisma.agent.findUnique({ where: { id } });
    if (!agent) {
      return fail(reply, "NOT_FOUND", "Agent not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }

    if (parsed.data.skillIds.length > 0) {
      const activeSkillRows = await prisma.skill.findMany({
        where: {
          id: { in: parsed.data.skillIds },
          status: "ACTIVE",
        },
        select: { id: true },
      });
      const activeSkillSet = new Set(activeSkillRows.map((s) => s.id));
      const missing = parsed.data.skillIds.find((skillId) => !activeSkillSet.has(skillId));
      if (missing) {
        return fail(reply, "CAPABILITY_NOT_ACTIVE", "Skill must be ACTIVE", [
          { field: "skillIds", reason: `SKILL_NOT_ACTIVE:${missing}` },
        ]);
      }
    }

    const updated = await prisma.agent.update({
      where: { id },
      data: {
        skillIds: parsed.data.skillIds,
        workflow: parsed.data.workflow as Prisma.InputJsonValue,
      },
    });

    await writeAuditLog({
      action: "UPDATE",
      entityType: "AGENT",
      entityId: id,
      beforeData: agent,
      afterData: updated,
    });
    return ok(reply, updated);
  });

  app.get("/api/v1/agents/role-groups", async (_, reply) => {
    const rows = await prisma.agent.findMany({
      select: {
        roleId: true,
      },
      distinct: ["roleId"],
      orderBy: { roleId: "asc" },
    });
    const roleIds = rows.map((r) => r.roleId);
    const profiles = await prisma.agentRoleProfile.findMany({
      where: { roleId: { in: roleIds } },
      orderBy: { roleId: "asc" },
    });
    const profileMap = new Map(profiles.map((p) => [p.roleId, p]));
    const data = roleIds.map((roleId) => ({
      roleId,
      config: profileMap.get(roleId) ?? null,
    }));
    return ok(reply, data);
  });

  app.put("/api/v1/agents/role-groups/:roleId/config", async (req, reply) => {
    const roleId = (req.params as { roleId: string }).roleId;
    const parsed = updateRoleGroupSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }

    const roleExists = await prisma.agent.findFirst({ where: { roleId }, select: { id: true } });
    if (!roleExists) {
      return fail(reply, "NOT_FOUND", "Role group not found", [{ field: "roleId", reason: "NOT_FOUND" }], 404);
    }

    const modelIds = [parsed.data.primaryModelId, parsed.data.assistantModelId];
    const modelRows = await prisma.model.findMany({
      where: {
        id: { in: modelIds },
        status: "ACTIVE",
      },
      select: { id: true },
    });
    const modelSet = new Set(modelRows.map((m) => m.id));
    const inactive = modelIds.find((id) => !modelSet.has(id));
    if (inactive) {
      return fail(reply, "CAPABILITY_NOT_ACTIVE", "Model must be ACTIVE", [
        { field: "modelId", reason: `MODEL_NOT_ACTIVE:${inactive}` },
      ]);
    }

    if (parsed.data.skillIds.length > 0) {
      const activeSkillRows = await prisma.skill.findMany({
        where: {
          id: { in: parsed.data.skillIds },
          status: "ACTIVE",
        },
        select: { id: true },
      });
      const activeSkillSet = new Set(activeSkillRows.map((s) => s.id));
      const missing = parsed.data.skillIds.find((skillId) => !activeSkillSet.has(skillId));
      if (missing) {
        return fail(reply, "CAPABILITY_NOT_ACTIVE", "Skill must be ACTIVE", [
          { field: "skillIds", reason: `SKILL_NOT_ACTIVE:${missing}` },
        ]);
      }
    }

    const before = await prisma.agentRoleProfile.findUnique({ where: { roleId } });
    const updated = await prisma.agentRoleProfile.upsert({
      where: { roleId },
      create: {
        roleId,
        skillIds: parsed.data.skillIds,
        workflow: parsed.data.workflow as Prisma.InputJsonValue,
        workloadMarkdown: parsed.data.workloadMarkdown,
        primaryModelId: parsed.data.primaryModelId,
        assistantModelId: parsed.data.assistantModelId,
      },
      update: {
        skillIds: parsed.data.skillIds,
        workflow: parsed.data.workflow as Prisma.InputJsonValue,
        workloadMarkdown: parsed.data.workloadMarkdown,
        primaryModelId: parsed.data.primaryModelId,
        assistantModelId: parsed.data.assistantModelId,
      },
    });

    await writeAuditLog({
      action: "UPDATE",
      entityType: "AGENT",
      entityId: roleId,
      beforeData: before,
      afterData: updated,
    });
    return ok(reply, updated);
  });
}
