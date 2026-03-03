import { prisma } from "./prisma.js";

export async function writeAuditLog(params: {
  action: string;
  entityType: string;
  entityId: string;
  beforeData?: unknown;
  afterData?: unknown;
  actorId?: string;
}) {
  await prisma.auditLog.create({
    data: {
      actorId: params.actorId ?? "system",
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeData: params.beforeData as object | undefined,
      afterData: params.afterData as object | undefined,
    },
  });
}
