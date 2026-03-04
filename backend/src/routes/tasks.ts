import { FastifyInstance } from "fastify";
import { z } from "zod";
import { fail, ok } from "../services/http.js";
import { getActorId } from "../services/auth.js";
import { prisma } from "../services/prisma.js";
import { writeAuditLog } from "../services/audit.js";

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(80),
  detail: z.string().trim().min(1).max(2000),
  reward: z.string().trim().min(1).max(120),
});

const applyTaskSchema = z.object({
  projectId: z.string().min(1),
  message: z.string().trim().max(400).optional(),
});

const adoptTaskSchema = z.object({
  applicationId: z.string().min(1),
});

const listQuerySchema = z.object({
  status: z.enum(["OPEN", "ADOPTED", "CLOSED"]).optional(),
});

export async function taskRoutes(app: FastifyInstance) {
  app.get("/api/v1/tasks", async (req, reply) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid query", [{ field: "query", reason: "INVALID" }], 400);
    }
    const actorId = getActorId(req);
    const tasks = await prisma.taskQuest.findMany({
      where: {
        status: parsed.data.status,
      },
      orderBy: { createdAt: "desc" },
      include: {
        applications: {
          orderBy: { createdAt: "asc" },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                createdBy: true,
                _count: { select: { assignments: true } },
              },
            },
          },
        },
      },
    });

    const userIds = new Set<string>();
    for (const task of tasks) {
      userIds.add(task.publisherId);
      for (const application of task.applications) {
        userIds.add(application.applicantId);
      }
    }
    const users = await prisma.user.findMany({
      where: { id: { in: [...userIds] } },
      select: { id: true, handle: true, displayName: true, avatar: true },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));

    return ok(
      reply,
      tasks.map((task) => ({
        id: task.id,
        title: task.title,
        detail: task.detail,
        reward: task.reward,
        status: task.status,
        publisherId: task.publisherId,
        publisher: userMap.get(task.publisherId) ?? null,
        adoptedApplicationId: task.adoptedApplicationId,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        myApplication: task.applications.find((x) => x.applicantId === actorId) ?? null,
        applications: task.applications.map((application) => ({
          id: application.id,
          status: application.status,
          message: application.message,
          applicantId: application.applicantId,
          applicant: userMap.get(application.applicantId) ?? null,
          project: {
            id: application.project.id,
            name: application.project.name,
            createdBy: application.project.createdBy,
            assignmentsCount: application.project._count.assignments,
          },
          createdAt: application.createdAt,
          updatedAt: application.updatedAt,
        })),
      })),
    );
  });

  app.post("/api/v1/tasks", async (req, reply) => {
    const actorId = getActorId(req);
    if (actorId === "system") {
      return fail(reply, "UNAUTHORIZED", "Please login first", [{ field: "authorization", reason: "REQUIRED" }], 401);
    }
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [{ field: "body", reason: "INVALID" }], 400);
    }
    const task = await prisma.taskQuest.create({
      data: {
        title: parsed.data.title,
        detail: parsed.data.detail,
        reward: parsed.data.reward,
        publisherId: actorId,
      },
    });
    await writeAuditLog({
      action: "CREATE",
      entityType: "TASK",
      entityId: task.id,
      afterData: task,
      actorId,
    });
    return ok(reply, task);
  });

  app.post("/api/v1/tasks/:id/apply", async (req, reply) => {
    const actorId = getActorId(req);
    if (actorId === "system") {
      return fail(reply, "UNAUTHORIZED", "Please login first", [{ field: "authorization", reason: "REQUIRED" }], 401);
    }
    const taskId = (req.params as { id: string }).id;
    const parsed = applyTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [{ field: "body", reason: "INVALID" }], 400);
    }

    const [task, project] = await Promise.all([
      prisma.taskQuest.findUnique({ where: { id: taskId } }),
      prisma.project.findUnique({
        where: { id: parsed.data.projectId },
        include: { _count: { select: { assignments: true } } },
      }),
    ]);
    if (!task) {
      return fail(reply, "NOT_FOUND", "Task not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (task.status !== "OPEN") {
      return fail(reply, "VALIDATION_ERROR", "Task is not open", [{ field: "status", reason: task.status }], 400);
    }
    if (task.publisherId === actorId) {
      return fail(reply, "VALIDATION_ERROR", "Publisher cannot apply own task", [{ field: "publisherId", reason: "SELF_APPLY" }], 400);
    }
    if (!project) {
      return fail(reply, "NOT_FOUND", "Project not found", [{ field: "projectId", reason: "NOT_FOUND" }], 404);
    }
    if (project.createdBy !== actorId) {
      return fail(reply, "FORBIDDEN", "Only project owner can apply", [{ field: "projectId", reason: "NOT_OWNER" }], 403);
    }
    if (project._count.assignments <= 0) {
      return fail(reply, "VALIDATION_ERROR", "Project has no team assignments", [{ field: "projectId", reason: "EMPTY_TEAM" }], 400);
    }

    const duplicate = await prisma.taskQuestApplication.findUnique({
      where: { taskId_projectId: { taskId, projectId: parsed.data.projectId } },
    });
    if (duplicate) {
      return fail(reply, "CONFLICT", "Project already applied this task", [{ field: "projectId", reason: "DUPLICATE" }], 409);
    }

    const application = await prisma.taskQuestApplication.create({
      data: {
        taskId,
        projectId: parsed.data.projectId,
        applicantId: actorId,
        message: parsed.data.message ?? "",
      },
    });
    await writeAuditLog({
      action: "APPLY",
      entityType: "TASK",
      entityId: taskId,
      afterData: application,
      actorId,
    });
    return ok(reply, application);
  });

  app.post("/api/v1/tasks/:id/adopt", async (req, reply) => {
    const actorId = getActorId(req);
    if (actorId === "system") {
      return fail(reply, "UNAUTHORIZED", "Please login first", [{ field: "authorization", reason: "REQUIRED" }], 401);
    }
    const taskId = (req.params as { id: string }).id;
    const parsed = adoptTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [{ field: "body", reason: "INVALID" }], 400);
    }

    const task = await prisma.taskQuest.findUnique({ where: { id: taskId } });
    if (!task) {
      return fail(reply, "NOT_FOUND", "Task not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (task.publisherId !== actorId) {
      return fail(reply, "FORBIDDEN", "Only publisher can adopt", [{ field: "publisherId", reason: "FORBIDDEN" }], 403);
    }
    if (task.status !== "OPEN") {
      return fail(reply, "VALIDATION_ERROR", "Task is not open", [{ field: "status", reason: task.status }], 400);
    }

    const target = await prisma.taskQuestApplication.findUnique({ where: { id: parsed.data.applicationId } });
    if (!target || target.taskId !== taskId) {
      return fail(reply, "NOT_FOUND", "Application not found", [{ field: "applicationId", reason: "NOT_FOUND" }], 404);
    }
    if (target.status !== "APPLIED") {
      return fail(reply, "VALIDATION_ERROR", "Application already processed", [{ field: "status", reason: target.status }], 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.taskQuestApplication.updateMany({
        where: { taskId, id: { not: target.id }, status: "APPLIED" },
        data: { status: "REJECTED" },
      });
      await tx.taskQuestApplication.update({
        where: { id: target.id },
        data: { status: "ADOPTED" },
      });
      await tx.taskQuest.update({
        where: { id: taskId },
        data: {
          status: "ADOPTED",
          adoptedApplicationId: target.id,
        },
      });
    });

    await writeAuditLog({
      action: "ADOPT_TEAM",
      entityType: "TASK",
      entityId: taskId,
      beforeData: task,
      afterData: { applicationId: target.id },
      actorId,
    });
    return ok(reply, { taskId, adoptedApplicationId: target.id });
  });
}
