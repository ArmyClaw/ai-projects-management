import { FastifyReply, FastifyRequest } from "fastify";
import { fail } from "./http.js";
import { prisma } from "./prisma.js";

const PUBLIC_MUTATION_PATHS = new Set<string>([
  "/api/v1/auth/register",
  "/api/v1/auth/login",
  "/api/v1/auth/logout",
]);

const normalizeToken = (authorization?: string) => {
  if (!authorization) return "";
  const [scheme, value] = authorization.split(" ");
  if (!scheme || !value || scheme.toLowerCase() !== "bearer") return "";
  return value.trim();
};

export const getActorId = (req: FastifyRequest) => req.authUser?.id ?? "system";

export const resolveAuthUser = async (req: FastifyRequest) => {
  const token = normalizeToken(req.headers.authorization);
  if (!token) return null;
  const session = await prisma.userSession.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.userSession.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return {
    id: session.user.id,
    handle: session.user.handle,
    displayName: session.user.displayName,
    avatar: session.user.avatar,
    codingCliTools: session.user.codingCliTools,
  };
};

export const authGuard = async (req: FastifyRequest, reply: FastifyReply) => {
  const method = req.method.toUpperCase();
  const needAuth = method === "POST" || method === "PATCH" || method === "PUT" || method === "DELETE";
  const path = ((req as unknown as { routerPath?: string }).routerPath ?? req.url.split("?")[0]) as string;
  if (!needAuth || !path.startsWith("/api/v1")) return;
  if (PUBLIC_MUTATION_PATHS.has(path)) return;

  const user = await resolveAuthUser(req);
  if (!user) {
    return fail(reply, "UNAUTHORIZED", "Please login first", [{ field: "authorization", reason: "REQUIRED" }], 401);
  }
  req.authUser = user;
};
