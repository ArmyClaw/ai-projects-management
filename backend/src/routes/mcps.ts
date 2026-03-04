import { Prisma } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { fail, ok } from "../services/http.js";
import { prisma } from "../services/prisma.js";
import { writeAuditLog } from "../services/audit.js";
import { getActorId } from "../services/auth.js";

const createMcpSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  transport: z.string().min(1),
  endpoint: z.string().url(),
  tags: z.array(z.string().min(1)).default([]),
  definitionMarkdown: z.string().min(1),
  avatar: z.string().optional(),
});

const updateMcpSchema = z.object({
  name: z.string().min(1).optional(),
  transport: z.string().min(1).optional(),
  endpoint: z.string().url().optional(),
  tags: z.array(z.string().min(1)).optional(),
  definitionMarkdown: z.string().min(1).optional(),
  avatar: z.string().optional(),
});

const listMcpQuerySchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "DEPRECATED", "ARCHIVED"]).optional(),
  tag: z.string().optional(),
});

const shapeMcp = (row: {
  id: string;
  name: string;
  transport: string;
  endpoint: string;
  status: string;
  tags: string[];
  definition: unknown;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}) => row;

export async function mcpRoutes(app: FastifyInstance) {
  app.get("/api/v1/mcps", async (req, reply) => {
    const parsed = listMcpQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid query", [
        { field: "query", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }

    const rows = await prisma.mcp.findMany({
      where: {
        status: parsed.data.status,
        tags: parsed.data.tag ? { has: parsed.data.tag } : undefined,
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(reply, rows.map(shapeMcp));
  });

  app.post("/api/v1/mcps", async (req, reply) => {
    const actorId = getActorId(req);
    const parsed = createMcpSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }

    const exists = await prisma.mcp.findUnique({ where: { id: parsed.data.id } });
    if (exists) {
      return fail(reply, "CONFLICT", "MCP id already exists", [{ field: "id", reason: "DUPLICATE" }], 409);
    }

    const duplicate = await prisma.mcp.findFirst({
      where: {
        name: parsed.data.name,
        endpoint: parsed.data.endpoint,
      },
      select: { id: true },
    });
    if (duplicate) {
      return fail(reply, "CONFLICT", "MCP name+endpoint already exists", [
        { field: "name", reason: "DUPLICATE_ENDPOINT" },
      ], 409);
    }

    const inserted = await prisma.mcp.create({
      data: {
        id: parsed.data.id,
        name: parsed.data.name,
        transport: parsed.data.transport,
        endpoint: parsed.data.endpoint,
        tags: parsed.data.tags,
        definition: { markdown: parsed.data.definitionMarkdown, avatar: parsed.data.avatar ?? "" } as Prisma.InputJsonValue,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
    await writeAuditLog({
      action: "CREATE",
      entityType: "MCP",
      entityId: parsed.data.id,
      afterData: inserted,
      actorId,
    });
    return ok(reply, shapeMcp(inserted));
  });

  app.patch("/api/v1/mcps/:id", async (req, reply) => {
    const actorId = getActorId(req);
    const id = (req.params as { id: string }).id;
    const parsed = updateMcpSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }

    const before = await prisma.mcp.findUnique({ where: { id } });
    if (!before) {
      return fail(reply, "NOT_FOUND", "MCP not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }

    const nextName = parsed.data.name ?? before.name;
    const nextEndpoint = parsed.data.endpoint ?? before.endpoint;
    const duplicate = await prisma.mcp.findFirst({
      where: {
        name: nextName,
        endpoint: nextEndpoint,
        id: { not: id },
      },
      select: { id: true },
    });
    if (duplicate) {
      return fail(reply, "CONFLICT", "MCP name+endpoint already exists", [
        { field: "name", reason: "DUPLICATE_ENDPOINT" },
      ], 409);
    }

    const currentDefinition =
      before.definition && typeof before.definition === "object" ? (before.definition as Record<string, unknown>) : {};
    const nextMarkdown =
      parsed.data.definitionMarkdown ?? (typeof currentDefinition.markdown === "string" ? currentDefinition.markdown : "");
    const nextAvatar = parsed.data.avatar ?? (typeof currentDefinition.avatar === "string" ? currentDefinition.avatar : "");

    const updated = await prisma.mcp.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        ...(parsed.data.transport !== undefined ? { transport: parsed.data.transport } : {}),
        ...(parsed.data.endpoint !== undefined ? { endpoint: parsed.data.endpoint } : {}),
        ...(parsed.data.tags !== undefined ? { tags: parsed.data.tags } : {}),
        definition: { markdown: nextMarkdown, avatar: nextAvatar } as Prisma.InputJsonValue,
        updatedBy: actorId,
      },
    });

    await writeAuditLog({
      action: "UPDATE",
      entityType: "MCP",
      entityId: id,
      beforeData: before,
      afterData: updated,
      actorId,
    });
    return ok(reply, shapeMcp(updated));
  });

  app.post("/api/v1/mcps/:id/publish", async (req, reply) => {
    const actorId = getActorId(req);
    const id = (req.params as { id: string }).id;
    const before = await prisma.mcp.findUnique({ where: { id } });
    if (!before) {
      return fail(reply, "NOT_FOUND", "MCP not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (before.status !== "DRAFT") {
      return fail(reply, "CAPABILITY_NOT_ACTIVE", "MCP must be DRAFT before publish", [
        { field: "status", reason: before.status },
      ]);
    }

    const updated = await prisma.mcp.update({
      where: { id },
      data: { status: "ACTIVE", updatedBy: actorId },
    });
    await writeAuditLog({
      action: "PUBLISH",
      entityType: "MCP",
      entityId: id,
      beforeData: before,
      afterData: updated,
      actorId,
    });
    return ok(reply, shapeMcp(updated));
  });

  app.post("/api/v1/mcps/:id/deprecate", async (req, reply) => {
    const actorId = getActorId(req);
    const id = (req.params as { id: string }).id;
    const before = await prisma.mcp.findUnique({ where: { id } });
    if (!before) {
      return fail(reply, "NOT_FOUND", "MCP not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (before.status !== "ACTIVE") {
      return fail(reply, "VALIDATION_ERROR", "Only ACTIVE MCP can be deprecated", [
        { field: "status", reason: before.status },
      ], 400);
    }

    const updated = await prisma.mcp.update({
      where: { id },
      data: { status: "DEPRECATED", updatedBy: actorId },
    });
    await writeAuditLog({
      action: "DEPRECATE",
      entityType: "MCP",
      entityId: id,
      beforeData: before,
      afterData: updated,
      actorId,
    });
    return ok(reply, shapeMcp(updated));
  });
}
