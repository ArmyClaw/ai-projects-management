import { FastifyInstance } from "fastify";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { fail, ok } from "../services/http.js";
import { prisma } from "../services/prisma.js";
import { resolveAuthUser } from "../services/auth.js";

const registerSchema = z.object({
  handle: z.string().trim().min(2).max(24).regex(/^[a-zA-Z0-9_-]+$/),
  displayName: z.string().trim().min(1).max(40),
  password: z.string().min(6).max(128),
  avatar: z.string().optional(),
});

const loginSchema = z.object({
  handle: z.string().trim().min(2).max(24),
  password: z.string().min(1).max(128),
});

const SESSION_DAYS = 30;

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const verifyPassword = (password: string, stored: string) => {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const next = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(next, "hex"));
};

const makeSession = async (userId: string) => {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.userSession.create({
    data: { userId, token, expiresAt },
  });
  return { token, expiresAt };
};

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/v1/auth/register", async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [{ field: "body", reason: "INVALID" }], 400);
    }

    const handle = parsed.data.handle.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { handle } });
    if (exists) {
      return fail(reply, "CONFLICT", "Handle already exists", [{ field: "handle", reason: "DUPLICATE" }], 409);
    }

    const user = await prisma.user.create({
      data: {
        handle,
        displayName: parsed.data.displayName,
        avatar: parsed.data.avatar ?? "",
        passwordHash: hashPassword(parsed.data.password),
      },
      select: { id: true, handle: true, displayName: true, avatar: true },
    });
    const session = await makeSession(user.id);
    return ok(reply, { user, token: session.token, expiresAt: session.expiresAt });
  });

  app.post("/api/v1/auth/login", async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [{ field: "body", reason: "INVALID" }], 400);
    }
    const handle = parsed.data.handle.toLowerCase();
    const user = await prisma.user.findUnique({ where: { handle } });
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return fail(reply, "UNAUTHORIZED", "Invalid credentials", [{ field: "handle", reason: "INVALID_CREDENTIALS" }], 401);
    }
    const session = await makeSession(user.id);
    return ok(reply, {
      user: {
        id: user.id,
        handle: user.handle,
        displayName: user.displayName,
        avatar: user.avatar,
      },
      token: session.token,
      expiresAt: session.expiresAt,
    });
  });

  app.get("/api/v1/auth/me", async (req, reply) => {
    const user = await resolveAuthUser(req);
    if (!user) {
      return fail(reply, "UNAUTHORIZED", "Please login first", [{ field: "authorization", reason: "REQUIRED" }], 401);
    }
    return ok(reply, user);
  });

  app.post("/api/v1/auth/logout", async (req, reply) => {
    const authorization = req.headers.authorization ?? "";
    const token = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
    if (token) {
      await prisma.userSession.deleteMany({ where: { token } });
    }
    return ok(reply, { loggedOut: true });
  });
}
