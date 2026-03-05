import { Prisma } from "@prisma/client";
import { FastifyInstance } from "fastify";
import { z } from "zod";
import { fail, ok } from "../services/http.js";
import { prisma } from "../services/prisma.js";
import { writeAuditLog } from "../services/audit.js";
import { getActorId } from "../services/auth.js";
import { buildCapabilityListWhere, requireOwner } from "../services/access.js";

const createMcpSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  transport: z.enum(["HTTP", "SSE", "STDIO"]),
  endpoint: z.string().url().optional(),
  command: z.string().min(1).optional(),
  args: z.array(z.string().min(1)).optional().default([]),
  headers: z.record(z.string()).optional().default({}),
  timeoutMs: z.number().int().min(500).max(120000).optional().default(30000),
  tags: z.array(z.string().min(1)).default([]),
  definitionMarkdown: z.string().optional().default(""),
  avatar: z.string().optional(),
}).superRefine((data, ctx) => {
  if ((data.transport === "HTTP" || data.transport === "SSE") && !data.endpoint) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endpoint"], message: "ENDPOINT_REQUIRED" });
  }
  if (data.transport === "STDIO" && !data.command) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["command"], message: "COMMAND_REQUIRED" });
  }
});

const updateMcpSchema = z.object({
  name: z.string().min(1).optional(),
  transport: z.enum(["HTTP", "SSE", "STDIO"]).optional(),
  endpoint: z.string().url().optional(),
  command: z.string().min(1).optional(),
  args: z.array(z.string().min(1)).optional(),
  headers: z.record(z.string()).optional(),
  timeoutMs: z.number().int().min(500).max(120000).optional(),
  tags: z.array(z.string().min(1)).optional(),
  definitionMarkdown: z.string().optional(),
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

type McpConfig = {
  transport?: string;
  endpoint?: string;
  command?: string;
  args?: string[];
  headers?: Record<string, string>;
  timeoutMs?: number;
};

const readMcpConfig = (definition: unknown, fallback: { transport: string; endpoint: string }): McpConfig => {
  if (!definition || typeof definition !== "object") {
    return { transport: fallback.transport, endpoint: fallback.endpoint, args: [], headers: {}, timeoutMs: 30000 };
  }
  const raw = (definition as Record<string, unknown>).config;
  if (!raw || typeof raw !== "object") {
    return { transport: fallback.transport, endpoint: fallback.endpoint, args: [], headers: {}, timeoutMs: 30000 };
  }
  const config = raw as Record<string, unknown>;
  const headersRaw = config.headers && typeof config.headers === "object" ? (config.headers as Record<string, unknown>) : {};
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(headersRaw)) {
    if (typeof value === "string") headers[key] = value;
  }
  return {
    transport: typeof config.transport === "string" ? config.transport : fallback.transport,
    endpoint: typeof config.endpoint === "string" ? config.endpoint : fallback.endpoint,
    command: typeof config.command === "string" ? config.command : "",
    args: Array.isArray(config.args) ? config.args.filter((item): item is string => typeof item === "string") : [],
    headers,
    timeoutMs: typeof config.timeoutMs === "number" ? config.timeoutMs : 30000,
  };
};

export async function mcpRoutes(app: FastifyInstance) {
  app.get("/api/v1/mcps", async (req, reply) => {
    const parsed = listMcpQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid query", [
        { field: "query", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }
    const actorId = getActorId(req);
    const baseWhere = buildCapabilityListWhere(actorId, parsed.data.status);
    const rows = await prisma.mcp.findMany({
      where: {
        ...baseWhere,
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

    const normalizedEndpoint = parsed.data.transport === "STDIO" ? `stdio://${parsed.data.id}` : (parsed.data.endpoint ?? "");
    const duplicate = await prisma.mcp.findFirst({
      where: {
        name: parsed.data.name,
        endpoint: normalizedEndpoint,
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
        endpoint: normalizedEndpoint,
        tags: parsed.data.tags,
        definition: {
          markdown: parsed.data.definitionMarkdown,
          avatar: parsed.data.avatar ?? "",
          config: {
            transport: parsed.data.transport,
            endpoint: parsed.data.transport === "STDIO" ? "" : normalizedEndpoint,
            command: parsed.data.command ?? "",
            args: parsed.data.args,
            headers: parsed.data.headers,
            timeoutMs: parsed.data.timeoutMs,
          },
        } as Prisma.InputJsonValue,
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
    if (!requireOwner(reply, req, before.createdBy, "Only creator can edit MCP")) return;

    const nextName = parsed.data.name ?? before.name;
    const currentConfig = readMcpConfig(before.definition, { transport: before.transport, endpoint: before.endpoint });
    const nextTransport = parsed.data.transport ?? before.transport;
    const nextEndpoint = nextTransport === "STDIO" ? `stdio://${id}` : (parsed.data.endpoint ?? currentConfig.endpoint ?? before.endpoint);
    const nextCommand = parsed.data.command ?? currentConfig.command ?? "";
    if ((nextTransport === "HTTP" || nextTransport === "SSE") && !nextEndpoint) {
      return fail(reply, "VALIDATION_ERROR", "Endpoint is required", [{ field: "endpoint", reason: "REQUIRED" }], 400);
    }
    if (nextTransport === "STDIO" && !nextCommand) {
      return fail(reply, "VALIDATION_ERROR", "Command is required", [{ field: "command", reason: "REQUIRED" }], 400);
    }
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

    const currentDefinition = before.definition && typeof before.definition === "object" ? (before.definition as Record<string, unknown>) : {};
    const nextMarkdown =
      parsed.data.definitionMarkdown ?? (typeof currentDefinition.markdown === "string" ? currentDefinition.markdown : "");
    const nextAvatar = parsed.data.avatar ?? (typeof currentDefinition.avatar === "string" ? currentDefinition.avatar : "");
    const nextArgs = parsed.data.args ?? currentConfig.args ?? [];
    const nextHeaders = parsed.data.headers ?? currentConfig.headers ?? {};
    const nextTimeoutMs = parsed.data.timeoutMs ?? currentConfig.timeoutMs ?? 30000;

    const updated = await prisma.mcp.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
        transport: nextTransport,
        endpoint: nextEndpoint,
        ...(parsed.data.tags !== undefined ? { tags: parsed.data.tags } : {}),
        definition: {
          markdown: nextMarkdown,
          avatar: nextAvatar,
          config: {
            transport: nextTransport,
            endpoint: nextTransport === "STDIO" ? "" : nextEndpoint,
            command: nextTransport === "STDIO" ? nextCommand : "",
            args: nextArgs,
            headers: nextHeaders,
            timeoutMs: nextTimeoutMs,
          },
        } as Prisma.InputJsonValue,
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
    if (!requireOwner(reply, req, before.createdBy, "Only creator can publish MCP")) return;
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
    if (!requireOwner(reply, req, before.createdBy, "Only creator can deprecate MCP")) return;
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
