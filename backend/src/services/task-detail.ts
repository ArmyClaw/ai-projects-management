const TASK_DETAIL_V2_PREFIX = "[TASK_DETAIL_V2]";

export type TaskProgressReport = {
  id: string;
  applicationId: string;
  reporterId: string;
  report: string;
  createdAt: string;
};

export type TaskDetailV2 = {
  summary: string;
  background: string;
  objective: string;
  plan: string;
  conditions: string;
  targetPath: string;
  startedAt: string;
  retreatedAt: string;
  isPublished: boolean;
  deletedAt: string;
  progressReports: TaskProgressReport[];
};

const defaultTaskDetail = (summary: string): TaskDetailV2 => ({
  summary,
  background: summary,
  objective: "",
  plan: "",
  conditions: "",
  targetPath: "",
  startedAt: "",
  retreatedAt: "",
  isPublished: true,
  deletedAt: "",
  progressReports: [],
});

export const parseTaskDetail = (detail: string): TaskDetailV2 => {
  if (!detail.startsWith(TASK_DETAIL_V2_PREFIX)) {
    return defaultTaskDetail(detail);
  }
  const payloadRaw = detail.slice(TASK_DETAIL_V2_PREFIX.length).trim();
  try {
    const payload = JSON.parse(payloadRaw) as Partial<TaskDetailV2>;
    return {
      summary: payload.summary ?? "",
      background: payload.background ?? "",
      objective: payload.objective ?? "",
      plan: payload.plan ?? "",
      conditions: payload.conditions ?? "",
      targetPath: payload.targetPath ?? "",
      startedAt: payload.startedAt ?? "",
      retreatedAt: payload.retreatedAt ?? "",
      isPublished: payload.isPublished ?? true,
      deletedAt: payload.deletedAt ?? "",
      progressReports: Array.isArray(payload.progressReports)
        ? payload.progressReports
            .filter((item): item is TaskProgressReport => Boolean(item && typeof item === "object"))
            .map((item) => ({
              id: typeof item.id === "string" ? item.id : "",
              applicationId: typeof item.applicationId === "string" ? item.applicationId : "",
              reporterId: typeof item.reporterId === "string" ? item.reporterId : "",
              report: typeof item.report === "string" ? item.report : "",
              createdAt: typeof item.createdAt === "string" ? item.createdAt : "",
            }))
            .filter((item) => item.id && item.applicationId && item.reporterId && item.report)
        : [],
    };
  } catch {
    return defaultTaskDetail(detail);
  }
};

export const encodeTaskDetail = (payload: TaskDetailV2): string =>
  `${TASK_DETAIL_V2_PREFIX} ${JSON.stringify(payload)}`;

export const canViewTask = (detail: TaskDetailV2, publisherId: string, actorId: string) => {
  const isOwner = actorId !== "system" && publisherId === actorId;
  if (detail.deletedAt) return isOwner;
  if (detail.isPublished) return true;
  return isOwner;
};
