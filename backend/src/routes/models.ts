import { FastifyInstance } from "fastify";
import { z } from "zod";
import { fail, ok } from "../services/http.js";
import { prisma } from "../services/prisma.js";
import { writeAuditLog } from "../services/audit.js";

const createModelSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  provider: z.string().min(1),
  modelId: z.string().min(1),
  tier: z.enum(["PREMIUM", "BALANCED", "ECONOMY"]),
});

export async function modelRoutes(app: FastifyInstance) {
  app.get("/api/v1/models", async (_, reply) => {
    const rows = await prisma.model.findMany({ orderBy: { createdAt: "desc" } });
    return ok(reply, rows);
  });

  app.post("/api/v1/models", async (req, reply) => {
    const parsed = createModelSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [
        { field: "body", reason: parsed.error.issues[0]?.message ?? "INVALID" },
      ], 400);
    }
    const exists = await prisma.model.findUnique({ where: { id: parsed.data.id } });
    if (exists) {
      return fail(reply, "CONFLICT", "Model id already exists", [
        { field: "id", reason: "DUPLICATE" },
      ], 409);
    }
    const model = await prisma.model.create({
      data: {
        id: parsed.data.id,
        name: parsed.data.name,
        provider: parsed.data.provider,
        modelId: parsed.data.modelId,
        tier: parsed.data.tier,
      },
    });
    await writeAuditLog({
      action: "CREATE",
      entityType: "MODEL",
      entityId: model.id,
      afterData: model,
    });
    return ok(reply, model);
  });

  app.post("/api/v1/models/:id/health-check", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const current = await prisma.model.findUnique({ where: { id } });
    if (!current) {
      return fail(reply, "NOT_FOUND", "Model not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    const model = await prisma.model.update({
      where: { id },
      data: { healthStatus: "HEALTHY" },
    });
    if (!model) {
      return fail(reply, "NOT_FOUND", "Model not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    await writeAuditLog({
      action: "HEALTH_CHECK",
      entityType: "MODEL",
      entityId: id,
      beforeData: current,
      afterData: model,
    });
    return ok(reply, {
      id: model.id,
      healthStatus: model.healthStatus,
      checkedAt: model.updatedAt.toISOString(),
    });
  });

  app.post("/api/v1/models/:id/publish", async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const model = await prisma.model.findUnique({ where: { id } });
    if (!model) {
      return fail(reply, "NOT_FOUND", "Model not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (!["HEALTHY", "DEGRADED"].includes(model.healthStatus)) {
      return fail(reply, "MODEL_UNAVAILABLE", "Model is not healthy", [
        { field: "healthStatus", reason: model.healthStatus },
      ]);
    }
    const updated = await prisma.model.update({
      where: { id },
      data: { status: "ACTIVE" },
    });
    await writeAuditLog({
      action: "PUBLISH",
      entityType: "MODEL",
      entityId: id,
      beforeData: model,
      afterData: updated,
    });
    return ok(reply, updated);
  });
}
