import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "../services/http.js";
import { prisma } from "../services/prisma.js";
import { writeAuditLog } from "../services/audit.js";
import { getActorId } from "../services/auth.js";

const createSkillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
  definitionMarkdown: z.string().min(1),
  avatar: z.string().optional(),
});

const updateSkillSchema = z.object({
  name: z.string().min(1).optional(),
  version: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  definitionMarkdown: z.string().min(1).optional(),
  avatar: z.string().optional(),
});

const listSkillQuerySchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "DEPRECATED", "ARCHIVED"]).optional(),
  tag: z.string().optional(),
});

export async function skillRoutes(app: FastifyInstance) {
  app.get("/api/v1/skills", async (req, reply) => {
    const parsed = listSkillQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid query", [
        { field: "query", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }

    const rows = await prisma.skill.findMany({
      where: {
        status: parsed.data.status,
        tags: parsed.data.tag ? { has: parsed.data.tag } : undefined,
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(reply, rows);
  });

  app.get("/api/v1/skills/:id", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      return fail(reply, "NOT_FOUND", "Skill not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    return ok(reply, skill);
  });

  app.post("/api/v1/skills", async (req, reply) => {
    const actorId = getActorId(req);
    const parsed = createSkillSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }
    const exists = await prisma.skill.findUnique({ where: { id: parsed.data.id } });
    if (exists) {
      return fail(reply, "CONFLICT", "Skill id already exists", [{ field: "id", reason: "DUPLICATE" }], 409);
    }
    const duplicate = await prisma.skill.findFirst({
      where: {
        name: parsed.data.name,
        version: parsed.data.version,
      },
      select: { id: true },
    });
    if (duplicate) {
      return fail(reply, "CONFLICT", "Skill name+version already exists", [
        { field: "name", reason: "DUPLICATE_VERSION" },
      ], 409);
    }

    const skill = await prisma.skill.create({
      data: {
        id: parsed.data.id,
        name: parsed.data.name,
        version: parsed.data.version,
        tags: parsed.data.tags,
        definition: { markdown: parsed.data.definitionMarkdown, avatar: parsed.data.avatar ?? "" } as Prisma.InputJsonValue,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
    await writeAuditLog({
      action: "CREATE",
      entityType: "SKILL",
      entityId: skill.id,
      afterData: skill,
      actorId,
    });
    return ok(reply, skill);
  });

  app.patch("/api/v1/skills/:id", async (req, reply) => {
    const actorId = getActorId(req);
    const id = (req.params as { id: string }).id;
    const parsed = updateSkillSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }

    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      return fail(reply, "NOT_FOUND", "Skill not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }

    const nextName = parsed.data.name ?? skill.name;
    const nextVersion = parsed.data.version ?? skill.version;
    const duplicate = await prisma.skill.findFirst({
      where: {
        name: nextName,
        version: nextVersion,
        id: { not: id },
      },
      select: { id: true },
    });
    if (duplicate) {
      return fail(reply, "CONFLICT", "Skill name+version already exists", [
        { field: "name", reason: "DUPLICATE_VERSION" },
      ], 409);
    }

    const updated = await prisma.skill.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.version !== undefined ? { version: parsed.data.version } : {}),
        ...(parsed.data.tags !== undefined ? { tags: parsed.data.tags } : {}),
        ...((parsed.data.definitionMarkdown !== undefined || parsed.data.avatar !== undefined)
          ? {
              definition: {
                markdown:
                  parsed.data.definitionMarkdown ??
                  (skill.definition &&
                  typeof skill.definition === "object" &&
                  typeof (skill.definition as { markdown?: unknown }).markdown === "string"
                    ? ((skill.definition as { markdown: string }).markdown ?? "")
                    : ""),
                avatar:
                  parsed.data.avatar ??
                  (skill.definition &&
                  typeof skill.definition === "object" &&
                  typeof (skill.definition as { avatar?: unknown }).avatar === "string"
                    ? ((skill.definition as { avatar: string }).avatar ?? "")
                    : ""),
              } as Prisma.InputJsonValue,
            }
          : {}),
        updatedBy: actorId,
      },
    });

    await writeAuditLog({
      action: "UPDATE",
      entityType: "SKILL",
      entityId: id,
      beforeData: skill,
      afterData: updated,
      actorId,
    });
    return ok(reply, updated);
  });

  app.post("/api/v1/skills/:id/publish", async (req, reply) => {
    const actorId = getActorId(req);
    const id = (req.params as { id: string }).id;
    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      return fail(reply, "NOT_FOUND", "Skill not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (skill.status !== "DRAFT") {
      return fail(reply, "CAPABILITY_NOT_ACTIVE", "Skill must be DRAFT before publish", [
        { field: "status", reason: skill.status },
      ]);
    }
    const definitionOk =
      skill.definition &&
      typeof skill.definition === "object" &&
      typeof (skill.definition as { markdown?: unknown }).markdown === "string" &&
      ((skill.definition as { markdown: string }).markdown || "").trim().length > 0;
    if (!definitionOk) {
      return fail(reply, "VALIDATION_ERROR", "Skill definition is invalid", [
        { field: "definition", reason: "INVALID_SCHEMA" },
      ], 400);
    }

    const updated = await prisma.skill.update({
      where: { id },
      data: { status: "ACTIVE", updatedBy: actorId },
    });
    await writeAuditLog({
      action: "PUBLISH",
      entityType: "SKILL",
      entityId: id,
      beforeData: skill,
      afterData: updated,
      actorId,
    });
    return ok(reply, updated);
  });

  app.post("/api/v1/skills/:id/deprecate", async (req, reply) => {
    const actorId = getActorId(req);
    const id = (req.params as { id: string }).id;
    const skill = await prisma.skill.findUnique({ where: { id } });
    if (!skill) {
      return fail(reply, "NOT_FOUND", "Skill not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (skill.status !== "ACTIVE") {
      return fail(reply, "VALIDATION_ERROR", "Only ACTIVE skill can be deprecated", [
        { field: "status", reason: skill.status },
      ], 400);
    }
    const updated = await prisma.skill.update({
      where: { id },
      data: { status: "DEPRECATED", updatedBy: actorId },
    });
    await writeAuditLog({
      action: "DEPRECATE",
      entityType: "SKILL",
      entityId: id,
      beforeData: skill,
      afterData: updated,
      actorId,
    });
    return ok(reply, updated);
  });
}
