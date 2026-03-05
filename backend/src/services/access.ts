import { FastifyReply, FastifyRequest } from "fastify";
import { fail } from "./http.js";

export const isSystemActor = (actorId: string) => actorId === "system";

export const isOwner = (ownerId: string, actorId: string) => ownerId === actorId;

export const canReadCapability = (status: string, createdBy: string, actorId: string) => {
  if (status === "ACTIVE") return true;
  return createdBy === actorId && !isSystemActor(actorId);
};

export const buildCapabilityListWhere = <TStatus extends string>(
  actorId: string,
  status?: TStatus,
): { status?: TStatus; OR?: Array<{ status: TStatus } | { createdBy: string }>; createdBy?: string } => {
  if (isSystemActor(actorId)) {
    return { status: "ACTIVE" as TStatus };
  }
  if (status && status !== ("ACTIVE" as TStatus)) {
    return { status, createdBy: actorId };
  }
  if (status === ("ACTIVE" as TStatus)) {
    return { status };
  }
  return {
    OR: [{ status: "ACTIVE" as TStatus }, { createdBy: actorId }],
  };
};

export const requireOwner = (
  reply: FastifyReply,
  req: FastifyRequest,
  ownerId: string,
  message = "You are not allowed to modify this resource",
) => {
  const actorId = req.authUser?.id ?? "system";
  if (ownerId === actorId) return true;
  fail(reply, "FORBIDDEN", message, [{ field: "ownerId", reason: "FORBIDDEN" }], 403);
  return false;
};
