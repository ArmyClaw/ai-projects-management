import { FastifyInstance } from "fastify";
import { ok } from "../services/http.js";
import { prisma } from "../services/prisma.js";

export async function auditRoutes(app: FastifyInstance) {
  app.get("/api/v1/audit-logs", async (req, reply) => {
    const q = req.query as { entityType?: string; entityId?: string; take?: string };
    const take = Math.min(Number(q.take ?? "50"), 200);
    const rows = await prisma.auditLog.findMany({
      where: {
        entityType: q.entityType,
        entityId: q.entityId,
      },
      orderBy: { createdAt: "desc" },
      take,
    });
    return ok(reply, rows);
  });
}
