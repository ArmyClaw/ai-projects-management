import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { fail, ok } from "../services/http.js";
import { prisma } from "../services/prisma.js";
import { writeAuditLog } from "../services/audit.js";

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

type McpRow = {
  id: string;
  name: string;
  transport: string;
  endpoint: string;
  status: string;
  tags: string[] | null;
  definition: unknown;
  createdAt: Date;
  updatedAt: Date;
};

const loadMcpById = async (id: string) => {
  const rows = await prisma.$queryRaw<McpRow[]>(Prisma.sql`
    SELECT "id", "name", "transport", "endpoint", "status", "tags", "definition", "createdAt", "updatedAt"
    FROM "Mcp"
    WHERE "id" = ${id}
    LIMIT 1
  `);
  return rows[0] ?? null;
};

export async function mcpRoutes(app: FastifyInstance) {
  app.get("/api/v1/mcps", async (req, reply) => {
    const parsed = listMcpQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid query", [
        { field: "query", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }

    const rows = await prisma.$queryRaw<McpRow[]>(Prisma.sql`
      SELECT "id", "name", "transport", "endpoint", "status", "tags", "definition", "createdAt", "updatedAt"
      FROM "Mcp"
      ORDER BY "createdAt" DESC
    `);

    const filtered = rows.filter((row) => {
      if (parsed.data.status && row.status !== parsed.data.status) return false;
      if (parsed.data.tag && !(row.tags ?? []).includes(parsed.data.tag)) return false;
      return true;
    });
    return ok(reply, filtered);
  });

  app.post("/api/v1/mcps", async (req, reply) => {
    const parsed = createMcpSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }

    const exists = await loadMcpById(parsed.data.id);
    if (exists) {
      return fail(reply, "CONFLICT", "MCP id already exists", [{ field: "id", reason: "DUPLICATE" }], 409);
    }

    const duplicateRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
      FROM "Mcp"
      WHERE "name" = ${parsed.data.name}
        AND "endpoint" = ${parsed.data.endpoint}
      LIMIT 1
    `);
    if (duplicateRows.length > 0) {
      return fail(reply, "CONFLICT", "MCP name+endpoint already exists", [
        { field: "name", reason: "DUPLICATE_ENDPOINT" },
      ], 409);
    }

    const tagArraySql =
      parsed.data.tags.length > 0
        ? Prisma.sql`ARRAY[${Prisma.join(parsed.data.tags)}]::text[]`
        : Prisma.sql`ARRAY[]::text[]`;
    const definitionJson = JSON.stringify({ markdown: parsed.data.definitionMarkdown, avatar: parsed.data.avatar ?? "" });

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "Mcp" ("id", "name", "transport", "endpoint", "status", "tags", "definition", "createdAt", "updatedAt")
      VALUES (
        ${parsed.data.id},
        ${parsed.data.name},
        ${parsed.data.transport},
        ${parsed.data.endpoint},
        'DRAFT',
        ${tagArraySql},
        ${definitionJson}::jsonb,
        NOW(),
        NOW()
      )
    `);

    const inserted = await loadMcpById(parsed.data.id);
    await writeAuditLog({
      action: "CREATE",
      entityType: "MCP",
      entityId: parsed.data.id,
      afterData: inserted,
    });
    return ok(reply, inserted);
  });

  app.patch("/api/v1/mcps/:id", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const parsed = updateMcpSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }

    const before = await loadMcpById(id);
    if (!before) {
      return fail(reply, "NOT_FOUND", "MCP not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }

    const nextName = parsed.data.name ?? before.name;
    const nextEndpoint = parsed.data.endpoint ?? before.endpoint;
    const duplicateRows = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT "id"
      FROM "Mcp"
      WHERE "name" = ${nextName}
        AND "endpoint" = ${nextEndpoint}
        AND "id" <> ${id}
      LIMIT 1
    `);
    if (duplicateRows.length > 0) {
      return fail(reply, "CONFLICT", "MCP name+endpoint already exists", [
        { field: "name", reason: "DUPLICATE_ENDPOINT" },
      ], 409);
    }

    const currentDefinition = before.definition && typeof before.definition === "object" ? (before.definition as Record<string, unknown>) : {};
    const nextMarkdown = parsed.data.definitionMarkdown ?? (typeof currentDefinition.markdown === "string" ? currentDefinition.markdown : "");
    const nextAvatar = parsed.data.avatar ?? (typeof currentDefinition.avatar === "string" ? currentDefinition.avatar : "");
    const nextTags = parsed.data.tags ?? (before.tags ?? []);
    const tagArraySql = nextTags.length > 0 ? Prisma.sql`ARRAY[${Prisma.join(nextTags)}]::text[]` : Prisma.sql`ARRAY[]::text[]`;
    const definitionJson = JSON.stringify({ markdown: nextMarkdown, avatar: nextAvatar });

    await prisma.$executeRaw(Prisma.sql`
      UPDATE "Mcp"
      SET
        "name" = ${parsed.data.name ?? before.name},
        "transport" = ${parsed.data.transport ?? before.transport},
        "endpoint" = ${parsed.data.endpoint ?? before.endpoint},
        "tags" = ${tagArraySql},
        "definition" = ${definitionJson}::jsonb,
        "updatedAt" = NOW()
      WHERE "id" = ${id}
    `);

    const updated = await loadMcpById(id);
    await writeAuditLog({
      action: "UPDATE",
      entityType: "MCP",
      entityId: id,
      beforeData: before,
      afterData: updated,
    });
    return ok(reply, updated);
  });

  app.post("/api/v1/mcps/:id/publish", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const before = await loadMcpById(id);
    if (!before) {
      return fail(reply, "NOT_FOUND", "MCP not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (before.status !== "DRAFT") {
      return fail(reply, "CAPABILITY_NOT_ACTIVE", "MCP must be DRAFT before publish", [
        { field: "status", reason: before.status },
      ]);
    }

    await prisma.$executeRaw(Prisma.sql`
      UPDATE "Mcp"
      SET "status" = 'ACTIVE', "updatedAt" = NOW()
      WHERE "id" = ${id}
    `);
    const updated = await loadMcpById(id);
    await writeAuditLog({
      action: "PUBLISH",
      entityType: "MCP",
      entityId: id,
      beforeData: before,
      afterData: updated,
    });
    return ok(reply, updated);
  });

  app.post("/api/v1/mcps/:id/deprecate", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const before = await loadMcpById(id);
    if (!before) {
      return fail(reply, "NOT_FOUND", "MCP not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (before.status !== "ACTIVE") {
      return fail(reply, "VALIDATION_ERROR", "Only ACTIVE MCP can be deprecated", [
        { field: "status", reason: before.status },
      ], 400);
    }

    await prisma.$executeRaw(Prisma.sql`
      UPDATE "Mcp"
      SET "status" = 'DEPRECATED', "updatedAt" = NOW()
      WHERE "id" = ${id}
    `);
    const updated = await loadMcpById(id);
    await writeAuditLog({
      action: "DEPRECATE",
      entityType: "MCP",
      entityId: id,
      beforeData: before,
      afterData: updated,
    });
    return ok(reply, updated);
  });
}
