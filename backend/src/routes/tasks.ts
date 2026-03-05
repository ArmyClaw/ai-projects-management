import { FastifyInstance } from "fastify";
import { z } from "zod";
import { fail, ok } from "../services/http.js";
import { getActorId } from "../services/auth.js";
import { prisma } from "../services/prisma.js";
import { writeAuditLog } from "../services/audit.js";
import { canViewTask, encodeTaskDetail, parseTaskDetail } from "../services/task-detail.js";

const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(80),
  detail: z.string().trim().max(2000).optional().default(""),
  reward: z.string().trim().max(120).optional().default(""),
  background: z.string().trim().max(5000).optional().default(""),
  objective: z.string().trim().max(5000).optional().default(""),
  plan: z.string().trim().max(3000).optional().default(""),
  conditions: z.string().trim().max(3000).optional().default(""),
  targetPath: z.string().trim().max(500).optional().default(""),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  detail: z.string().trim().max(2000).optional(),
  reward: z.string().trim().max(120).optional(),
  background: z.string().trim().max(5000).optional(),
  objective: z.string().trim().max(5000).optional(),
  plan: z.string().trim().max(3000).optional(),
  conditions: z.string().trim().max(3000).optional(),
  targetPath: z.string().trim().max(500).optional(),
});

const applyTaskSchema = z.object({
  projectId: z.string().min(1),
  message: z.string().trim().max(400).optional(),
});

const adoptTaskSchema = z.object({
  applicationId: z.string().min(1),
});

const progressTaskSchema = z.object({
  applicationId: z.string().min(1).optional(),
  report: z.string().trim().min(1).max(3000),
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
    const rawTasks = await prisma.taskQuest.findMany({
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

    const tasks = rawTasks.filter((task) => canViewTask(parseTaskDetail(task.detail), task.publisherId, actorId));

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
      tasks.map((task) => {
        const detail = parseTaskDetail(task.detail);
        return {
          id: task.id,
          title: task.title,
          detail: detail.summary,
          background: detail.background,
          objective: detail.objective,
          plan: detail.plan,
          conditions: detail.conditions,
          targetPath: detail.targetPath,
          startedAt: detail.startedAt || null,
          retreatedAt: detail.retreatedAt || null,
          isPublished: detail.isPublished,
          deletedAt: detail.deletedAt || null,
          progressReports: detail.progressReports.map((report) => ({
            id: report.id,
            applicationId: report.applicationId,
            reporterId: report.reporterId,
            reporter: userMap.get(report.reporterId) ?? null,
            report: report.report,
            createdAt: report.createdAt,
          })),
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
        };
      }),
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
        detail: encodeTaskDetail({
          summary: parsed.data.detail,
          background: parsed.data.background,
          objective: parsed.data.objective,
          plan: parsed.data.plan,
          conditions: parsed.data.conditions,
          targetPath: parsed.data.targetPath,
          startedAt: "",
          retreatedAt: "",
          isPublished: true,
          deletedAt: "",
          progressReports: [],
        }),
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

  app.patch("/api/v1/tasks/:id", async (req, reply) => {
    const actorId = getActorId(req);
    if (actorId === "system") {
      return fail(reply, "UNAUTHORIZED", "Please login first", [{ field: "authorization", reason: "REQUIRED" }], 401);
    }
    const taskId = (req.params as { id: string }).id;
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [{ field: "body", reason: "INVALID" }], 400);
    }

    const task = await prisma.taskQuest.findUnique({ where: { id: taskId } });
    if (!task) {
      return fail(reply, "NOT_FOUND", "Task not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (task.publisherId !== actorId) {
      return fail(reply, "FORBIDDEN", "Only publisher can edit", [{ field: "publisherId", reason: "FORBIDDEN" }], 403);
    }

    const currentDetail = parseTaskDetail(task.detail);
    const nextSummary =
      parsed.data.detail ?? (parsed.data.background !== undefined ? parsed.data.background : currentDetail.summary);
    const nextDetail = encodeTaskDetail({
      summary: nextSummary,
      background: parsed.data.background ?? currentDetail.background,
      objective: parsed.data.objective ?? currentDetail.objective,
      plan: parsed.data.plan ?? currentDetail.plan,
      conditions: parsed.data.conditions ?? currentDetail.conditions,
      targetPath: parsed.data.targetPath ?? currentDetail.targetPath,
      startedAt: currentDetail.startedAt,
      retreatedAt: currentDetail.retreatedAt,
      isPublished: currentDetail.isPublished,
      deletedAt: currentDetail.deletedAt,
      progressReports: currentDetail.progressReports,
    });

    const updated = await prisma.taskQuest.update({
      where: { id: taskId },
      data: {
        title: parsed.data.title ?? task.title,
        reward: parsed.data.reward ?? task.reward,
        detail: nextDetail,
      },
    });

    await writeAuditLog({
      action: "UPDATE",
      entityType: "TASK",
      entityId: taskId,
      beforeData: task,
      afterData: updated,
      actorId,
    });
    return ok(reply, updated);
  });

  app.post("/api/v1/tasks/:id/publish", async (req, reply) => {
    const actorId = getActorId(req);
    const taskId = (req.params as { id: string }).id;
    const task = await prisma.taskQuest.findUnique({ where: { id: taskId } });
    if (!task) {
      return fail(reply, "NOT_FOUND", "Task not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (task.publisherId !== actorId) {
      return fail(reply, "FORBIDDEN", "Only publisher can publish", [{ field: "publisherId", reason: "FORBIDDEN" }], 403);
    }
    const detail = parseTaskDetail(task.detail);
    const updated = await prisma.taskQuest.update({
      where: { id: taskId },
      data: {
        detail: encodeTaskDetail({ ...detail, isPublished: true, deletedAt: "" }),
      },
    });
    await writeAuditLog({
      action: "PUBLISH",
      entityType: "TASK",
      entityId: taskId,
      beforeData: task,
      afterData: updated,
      actorId,
    });
    return ok(reply, { taskId, isPublished: true });
  });

  app.post("/api/v1/tasks/:id/unpublish", async (req, reply) => {
    const actorId = getActorId(req);
    const taskId = (req.params as { id: string }).id;
    const task = await prisma.taskQuest.findUnique({ where: { id: taskId } });
    if (!task) {
      return fail(reply, "NOT_FOUND", "Task not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (task.publisherId !== actorId) {
      return fail(reply, "FORBIDDEN", "Only publisher can unpublish", [{ field: "publisherId", reason: "FORBIDDEN" }], 403);
    }
    const detail = parseTaskDetail(task.detail);
    const updated = await prisma.taskQuest.update({
      where: { id: taskId },
      data: {
        detail: encodeTaskDetail({ ...detail, isPublished: false }),
      },
    });
    await writeAuditLog({
      action: "UNPUBLISH",
      entityType: "TASK",
      entityId: taskId,
      beforeData: task,
      afterData: updated,
      actorId,
    });
    return ok(reply, { taskId, isPublished: false });
  });

  app.post("/api/v1/tasks/:id/delete", async (req, reply) => {
    const actorId = getActorId(req);
    const taskId = (req.params as { id: string }).id;
    const task = await prisma.taskQuest.findUnique({ where: { id: taskId } });
    if (!task) {
      return fail(reply, "NOT_FOUND", "Task not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (task.publisherId !== actorId) {
      return fail(reply, "FORBIDDEN", "Only publisher can delete", [{ field: "publisherId", reason: "FORBIDDEN" }], 403);
    }
    const detail = parseTaskDetail(task.detail);
    const deletedAt = new Date().toISOString();
    const updated = await prisma.taskQuest.update({
      where: { id: taskId },
      data: {
        detail: encodeTaskDetail({ ...detail, isPublished: false, deletedAt }),
      },
    });
    await writeAuditLog({
      action: "DELETE",
      entityType: "TASK",
      entityId: taskId,
      beforeData: task,
      afterData: updated,
      actorId,
    });
    return ok(reply, { taskId, deletedAt });
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
    const taskDetail = parseTaskDetail(task.detail);
    if (taskDetail.deletedAt || !taskDetail.isPublished) {
      return fail(reply, "FORBIDDEN", "Task is not publicly available", [{ field: "id", reason: "NOT_PUBLIC" }], 403);
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

  app.post("/api/v1/tasks/:id/start", async (req, reply) => {
    const actorId = getActorId(req);
    if (actorId === "system") {
      return fail(reply, "UNAUTHORIZED", "Please login first", [{ field: "authorization", reason: "REQUIRED" }], 401);
    }
    const taskId = (req.params as { id: string }).id;
    const task = await prisma.taskQuest.findUnique({ where: { id: taskId } });
    if (!task) {
      return fail(reply, "NOT_FOUND", "Task not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (task.status !== "ADOPTED") {
      return fail(reply, "VALIDATION_ERROR", "Task is not adopted yet", [{ field: "status", reason: task.status }], 400);
    }

    const detail = parseTaskDetail(task.detail);
    if (detail.startedAt) {
      return fail(reply, "CONFLICT", "Task already started", [{ field: "startedAt", reason: "ALREADY_STARTED" }], 409);
    }
    if (!task.adoptedApplicationId) {
      return fail(reply, "VALIDATION_ERROR", "Adopted application missing", [{ field: "adoptedApplicationId", reason: "MISSING" }], 400);
    }

    const adoptedApplication = await prisma.taskQuestApplication.findUnique({ where: { id: task.adoptedApplicationId } });
    if (!adoptedApplication) {
      return fail(reply, "NOT_FOUND", "Adopted application not found", [{ field: "adoptedApplicationId", reason: "NOT_FOUND" }], 404);
    }
    const canStart = task.publisherId === actorId || adoptedApplication.applicantId === actorId;
    if (!canStart) {
      return fail(reply, "FORBIDDEN", "Only publisher or adopted team can start", [{ field: "actorId", reason: "FORBIDDEN" }], 403);
    }

    const startedAt = new Date().toISOString();
    const updated = await prisma.taskQuest.update({
      where: { id: taskId },
      data: {
        detail: encodeTaskDetail({
          ...detail,
          startedAt,
          retreatedAt: "",
        }),
      },
    });

    await writeAuditLog({
      action: "START",
      entityType: "TASK",
      entityId: taskId,
      beforeData: task,
      afterData: updated,
      actorId,
    });

    return ok(reply, { taskId, startedAt });
  });

  app.post("/api/v1/tasks/:id/retreat", async (req, reply) => {
    const actorId = getActorId(req);
    if (actorId === "system") {
      return fail(reply, "UNAUTHORIZED", "Please login first", [{ field: "authorization", reason: "REQUIRED" }], 401);
    }
    const taskId = (req.params as { id: string }).id;
    const task = await prisma.taskQuest.findUnique({ where: { id: taskId } });
    if (!task) {
      return fail(reply, "NOT_FOUND", "Task not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (task.status !== "ADOPTED" || !task.adoptedApplicationId) {
      return fail(reply, "VALIDATION_ERROR", "Task is not in active adopted stage", [{ field: "status", reason: task.status }], 400);
    }
    const adopted = await prisma.taskQuestApplication.findUnique({ where: { id: task.adoptedApplicationId } });
    if (!adopted) {
      return fail(reply, "NOT_FOUND", "Adopted application not found", [{ field: "adoptedApplicationId", reason: "NOT_FOUND" }], 404);
    }
    const canRetreat = task.publisherId === actorId || adopted.applicantId === actorId;
    if (!canRetreat) {
      return fail(reply, "FORBIDDEN", "Only publisher or adopted team can retreat", [{ field: "actorId", reason: "FORBIDDEN" }], 403);
    }

    const detail = parseTaskDetail(task.detail);
    const retreatedAt = new Date().toISOString();
    await prisma.$transaction(async (tx) => {
      await tx.taskQuestApplication.update({
        where: { id: adopted.id },
        data: { status: "REJECTED" },
      });
      await tx.taskQuest.update({
        where: { id: taskId },
        data: {
          status: "OPEN",
          adoptedApplicationId: null,
          detail: encodeTaskDetail({
            ...detail,
            startedAt: "",
            retreatedAt,
          }),
        },
      });
    });

    await writeAuditLog({
      action: "RETREAT",
      entityType: "TASK",
      entityId: taskId,
      beforeData: task,
      afterData: { retreatedAt },
      actorId,
    });
    return ok(reply, { taskId, retreatedAt, status: "OPEN" });
  });

  app.post("/api/v1/tasks/:id/progress", async (req, reply) => {
    const actorId = getActorId(req);
    if (actorId === "system") {
      return fail(reply, "UNAUTHORIZED", "Please login first", [{ field: "authorization", reason: "REQUIRED" }], 401);
    }
    const taskId = (req.params as { id: string }).id;
    const parsed = progressTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(reply, "VALIDATION_ERROR", "Invalid input", [{ field: "body", reason: "INVALID" }], 400);
    }

    const task = await prisma.taskQuest.findUnique({
      where: { id: taskId },
      include: { applications: true },
    });
    if (!task) {
      return fail(reply, "NOT_FOUND", "Task not found", [{ field: "id", reason: "NOT_FOUND" }], 404);
    }
    if (!task.adoptedApplicationId) {
      return fail(reply, "VALIDATION_ERROR", "Task has no adopted team", [{ field: "adoptedApplicationId", reason: "MISSING" }], 400);
    }
    const adopted = task.applications.find((item) => item.id === task.adoptedApplicationId);
    if (!adopted) {
      return fail(reply, "NOT_FOUND", "Adopted application not found", [{ field: "adoptedApplicationId", reason: "NOT_FOUND" }], 404);
    }

    const canReport = actorId === task.publisherId || actorId === adopted.applicantId;
    if (!canReport) {
      return fail(reply, "FORBIDDEN", "Only publisher or adopted team can report", [{ field: "actorId", reason: "FORBIDDEN" }], 403);
    }

    const detail = parseTaskDetail(task.detail);
    const applicationId = parsed.data.applicationId ?? adopted.id;
    const belongs = task.applications.some((item) => item.id === applicationId);
    if (!belongs) {
      return fail(reply, "VALIDATION_ERROR", "Application not in this task", [{ field: "applicationId", reason: "INVALID" }], 400);
    }

    const nextReport = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      applicationId,
      reporterId: actorId,
      report: parsed.data.report,
      createdAt: new Date().toISOString(),
    };

    const updated = await prisma.taskQuest.update({
      where: { id: taskId },
      data: {
        detail: encodeTaskDetail({
          ...detail,
          progressReports: [...detail.progressReports, nextReport].slice(-200),
        }),
      },
    });

    await writeAuditLog({
      action: "PROGRESS_REPORT",
      entityType: "TASK",
      entityId: taskId,
      beforeData: task,
      afterData: { reportId: nextReport.id },
      actorId,
    });
    return ok(reply, { taskId, report: nextReport, updatedAt: updated.updatedAt });
  });
}
