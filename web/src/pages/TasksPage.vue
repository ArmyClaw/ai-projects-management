<template>
  <section>
    <h1 class="page-title">{{ t("tasks.title") }}</h1>
    <p class="muted page-subtitle">{{ t("tasks.subtitle") }}</p>

    <div class="card quest-hero">
      <div>
        <h3>{{ locale === "zh-CN" ? "任务大厅" : "Task Hall" }}</h3>
        <p class="muted">
          {{
            locale === "zh-CN"
              ? "小卡片 + 查看/编辑/撤退/进度四键操作，支持分页和队伍进度汇报。"
              : "Compact cards with View/Edit/Retreat/Progress actions, pagination, and team progress reports."
          }}
        </p>
      </div>
      <div class="hero-actions">
        <select v-model="statusFilter" class="select status-select" @change="load">
          <option value="ALL">{{ locale === "zh-CN" ? "全部状态" : "All status" }}</option>
          <option value="OPEN">OPEN</option>
          <option value="ADOPTED">ADOPTED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
        <button class="button primary" @click="openCreateModal">{{ t("tasks.new") }}</button>
      </div>
    </div>

    <div v-if="!isLoggedIn" class="card muted">
      {{
        locale === "zh-CN"
          ? "未登录也可以浏览任务大厅；发布、编辑、撤退、汇报进度需要登录。"
          : "You can browse task hall without login; publish/edit/retreat/progress require login."
      }}
    </div>

    <div v-if="tasks.length === 0" class="card muted">{{ locale === "zh-CN" ? "暂无任务数据。" : "No tasks yet." }}</div>

    <div v-else class="quest-grid compact">
      <article v-for="task in pagedTasks" :key="task.id" class="quest-mini-card">
        <header class="mini-head">
          <h3 :title="task.title">{{ task.title }}</h3>
          <span class="tag" :class="task.status.toLowerCase()">{{ task.status }}</span>
        </header>

        <p v-if="task.reward" class="mini-reward" :title="task.reward">{{ task.reward }}</p>
        <p class="mini-summary">{{ excerpt(task.background || task.objective || task.plan || task.detail, 100) }}</p>

        <div class="mini-meta">
          <span>{{ locale === "zh-CN" ? "发布者" : "Publisher" }}: {{ task.publisher?.displayName || task.publisherId }}</span>
          <span>{{ locale === "zh-CN" ? "报名" : "Applied" }}: {{ task.applications.length }}</span>
          <span>{{ locale === "zh-CN" ? "进度" : "Progress" }}: {{ task.progressReports.length }}</span>
        </div>

        <p v-if="task.targetPath" class="mini-path" :title="task.targetPath">
          {{ locale === "zh-CN" ? "目标地址" : "Target Path" }}: <code>{{ task.targetPath }}</code>
        </p>
        <p v-if="task.startedAt" class="mini-started">
          {{ locale === "zh-CN" ? "出发" : "Started" }}: {{ formatDateTime(task.startedAt) }}
        </p>
        <p v-if="task.retreatedAt" class="mini-retreated">
          {{ locale === "zh-CN" ? "最近撤退" : "Retreated" }}: {{ formatDateTime(task.retreatedAt) }}
        </p>

        <div class="mini-actions">
          <button class="button tiny-btn" @click="openViewModal(task)">{{ locale === "zh-CN" ? "查看" : "View" }}</button>
          <button class="button tiny-btn" :disabled="!canEditTask(task)" @click="openEditModal(task)">
            {{ locale === "zh-CN" ? "编辑" : "Edit" }}
          </button>
          <button class="button tiny-btn" :disabled="!canOpenProgress(task)" @click="openProgressModal(task)">
            {{ locale === "zh-CN" ? "进度" : "Progress" }}
          </button>
          <button class="button tiny-btn danger" :disabled="!canRetreatTask(task)" @click="retreatTask(task.id)">
            {{ locale === "zh-CN" ? "撤退" : "Retreat" }}
          </button>
          <button
            v-if="task.status === 'ADOPTED' && !task.startedAt"
            class="button tiny-btn primary"
            :disabled="!canStartTask(task)"
            @click="startTask(task.id)"
          >
            {{ locale === "zh-CN" ? "开始出发" : "Start Mission" }}
          </button>
          <button v-if="!isMyTask(task)" class="button tiny-btn" :disabled="!canApply(task)" @click="openApplyModal(task)">
            {{ locale === "zh-CN" ? "报名" : "Apply" }}
          </button>
        </div>
      </article>
    </div>

    <PaginationBar
      v-if="tasks.length > 0"
      :total="tasks.length"
      :page="page"
      :page-size="pageSize"
      :page-sizes="[6, 9, 12, 18]"
      :locale="locale"
      @update:page="page = $event"
      @update:pageSize="pageSize = $event"
    />

    <p v-if="errorText" class="error-text">{{ errorText }}</p>

    <div v-if="createOpen" class="modal-backdrop" @click.self="createOpen = false">
      <div class="modal-panel">
        <h3>{{ locale === "zh-CN" ? "发布任务" : "Publish Quest" }}</h3>
        <div class="form-grid">
          <label>{{ locale === "zh-CN" ? "任务标题" : "Title" }}</label>
          <input v-model.trim="createForm.title" class="input" />
          <label>{{ locale === "zh-CN" ? "任务奖励（可选）" : "Reward (optional)" }}</label>
          <input v-model.trim="createForm.reward" class="input" />
          <label>{{ locale === "zh-CN" ? "任务背景（Markdown）" : "Background (Markdown)" }}</label>
          <MarkdownEditor v-model="createForm.background" :rows="7" />
          <label>{{ locale === "zh-CN" ? "任务目标（Markdown）" : "Objective (Markdown)" }}</label>
          <MarkdownEditor v-model="createForm.objective" :rows="7" />
          <label>{{ locale === "zh-CN" ? "任务计划" : "Plan" }}</label>
          <textarea v-model.trim="createForm.plan" class="input" rows="4" />
          <label>{{ locale === "zh-CN" ? "任务条件" : "Conditions" }}</label>
          <textarea v-model.trim="createForm.conditions" class="input" rows="4" />
          <label>{{ locale === "zh-CN" ? "目标地址（文件夹路径）" : "Target Path (Folder)" }}</label>
          <input v-model.trim="createForm.targetPath" class="input" placeholder="D:\\Projects\\YourFolder\\Deliverables" />
        </div>
        <div class="modal-actions">
          <button class="button" @click="createOpen = false">{{ t("common.cancel") }}</button>
          <button class="button primary" :disabled="!isLoggedIn" @click="submitCreate">{{ locale === "zh-CN" ? "确认发布" : "Publish" }}</button>
        </div>
      </div>
    </div>

    <div v-if="viewOpen && currentTask" class="modal-backdrop" @click.self="viewOpen = false">
      <div class="modal-panel view-panel">
        <h3>{{ locale === "zh-CN" ? "任务详情" : "Quest Detail" }}: {{ currentTask.title }}</h3>

        <div v-if="currentTask.background" class="detail-section">
          <h4>{{ locale === "zh-CN" ? "任务背景" : "Background" }}</h4>
          <MarkdownEditor :model-value="currentTask.background" :preview-only="true" :readonly="true" :rows="6" />
        </div>
        <div v-if="currentTask.objective" class="detail-section">
          <h4>{{ locale === "zh-CN" ? "任务目标" : "Objective" }}</h4>
          <MarkdownEditor :model-value="currentTask.objective" :preview-only="true" :readonly="true" :rows="6" />
        </div>
        <div v-if="currentTask.plan" class="detail-section">
          <h4>{{ locale === "zh-CN" ? "任务计划" : "Plan" }}</h4>
          <p class="quest-detail">{{ currentTask.plan }}</p>
        </div>
        <div v-if="currentTask.conditions" class="detail-section">
          <h4>{{ locale === "zh-CN" ? "任务条件" : "Conditions" }}</h4>
          <p class="quest-detail">{{ currentTask.conditions }}</p>
        </div>
        <div v-if="currentTask.targetPath" class="detail-section">
          <h4>{{ locale === "zh-CN" ? "目标地址（文件夹路径）" : "Target Path (Folder)" }}</h4>
          <p class="path-text"><code>{{ currentTask.targetPath }}</code></p>
        </div>

        <div class="quest-meta">
          <span>{{ locale === "zh-CN" ? "发布者" : "Publisher" }}: {{ currentTask.publisher?.displayName || currentTask.publisherId }}</span>
          <span>{{ locale === "zh-CN" ? "报名队伍" : "Applications" }}: {{ currentTask.applications.length }}</span>
          <span>{{ locale === "zh-CN" ? "进度汇报" : "Reports" }}: {{ currentTask.progressReports.length }}</span>
        </div>

        <div class="application-list">
          <div v-for="application in currentTask.applications" :key="application.id" class="application-item">
            <div>
              <strong>{{ application.project.name }}</strong>
              <p class="muted">
                {{ application.applicant?.displayName || application.applicantId }} · {{ application.project.assignmentsCount }}
                {{ locale === "zh-CN" ? "席位" : "slots" }}
              </p>
              <p class="message">{{ application.message || (locale === "zh-CN" ? "无留言" : "No message") }}</p>
            </div>
            <div class="application-actions">
              <span class="tag">{{ application.status }}</span>
              <button
                v-if="isMyTask(currentTask) && currentTask.status === 'OPEN' && application.status === 'APPLIED'"
                class="button tiny-btn"
                @click="adoptTeam(currentTask.id, application.id)"
              >
                {{ locale === "zh-CN" ? "采纳" : "Adopt" }}
              </button>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="button" @click="viewOpen = false">{{ t("common.cancel") }}</button>
          <button class="button" :disabled="!canEditTask(currentTask)" @click="openEditModal(currentTask)">{{ locale === "zh-CN" ? "编辑任务" : "Edit" }}</button>
          <button class="button" :disabled="!canOpenProgress(currentTask)" @click="openProgressModal(currentTask)">{{ locale === "zh-CN" ? "进度面板" : "Progress Panel" }}</button>
        </div>
      </div>
    </div>

    <div v-if="editOpen" class="modal-backdrop" @click.self="editOpen = false">
      <div class="modal-panel">
        <h3>{{ locale === "zh-CN" ? "编辑任务" : "Edit Quest" }}</h3>
        <div class="form-grid">
          <label>{{ locale === "zh-CN" ? "任务标题" : "Title" }}</label>
          <input v-model.trim="editForm.title" class="input" />
          <label>{{ locale === "zh-CN" ? "任务奖励（可选）" : "Reward (optional)" }}</label>
          <input v-model.trim="editForm.reward" class="input" />
          <label>{{ locale === "zh-CN" ? "任务背景（Markdown）" : "Background (Markdown)" }}</label>
          <MarkdownEditor v-model="editForm.background" :rows="7" />
          <label>{{ locale === "zh-CN" ? "任务目标（Markdown）" : "Objective (Markdown)" }}</label>
          <MarkdownEditor v-model="editForm.objective" :rows="7" />
          <label>{{ locale === "zh-CN" ? "任务计划" : "Plan" }}</label>
          <textarea v-model.trim="editForm.plan" class="input" rows="4" />
          <label>{{ locale === "zh-CN" ? "任务条件" : "Conditions" }}</label>
          <textarea v-model.trim="editForm.conditions" class="input" rows="4" />
          <label>{{ locale === "zh-CN" ? "目标地址（文件夹路径）" : "Target Path (Folder)" }}</label>
          <input v-model.trim="editForm.targetPath" class="input" />
        </div>
        <div class="modal-actions">
          <button class="button" @click="editOpen = false">{{ t("common.cancel") }}</button>
          <button class="button primary" @click="submitEdit">{{ locale === "zh-CN" ? "保存修改" : "Save" }}</button>
        </div>
      </div>
    </div>

    <div v-if="progressOpen && currentTask" class="modal-backdrop" @click.self="progressOpen = false">
      <div class="modal-panel progress-panel">
        <h3>{{ locale === "zh-CN" ? "任务进度面板" : "Task Progress" }}: {{ currentTask.title }}</h3>
        <div class="progress-stats">
          <div class="progress-stat">
            <span class="muted">{{ locale === "zh-CN" ? "汇报总数" : "Reports" }}</span>
            <strong>{{ currentTask.progressReports.length }}</strong>
          </div>
          <div class="progress-stat">
            <span class="muted">{{ locale === "zh-CN" ? "已采纳队伍" : "Adopted Team" }}</span>
            <strong>{{ adoptedTeamName(currentTask) }}</strong>
          </div>
        </div>

        <div class="progress-board">
          <article v-for="application in currentTask.applications" :key="`progress-${application.id}`" class="progress-team-card">
            <header>
              <strong>{{ application.project.name }}</strong>
              <span class="tag">{{ application.status }}</span>
            </header>
            <p class="muted">{{ application.applicant?.displayName || application.applicantId }}</p>
            <div class="progress-log-list">
              <p v-if="reportsByApplication(currentTask, application.id).length === 0" class="muted">
                {{ locale === "zh-CN" ? "暂无进度汇报。" : "No progress report yet." }}
              </p>
              <div v-for="report in reportsByApplication(currentTask, application.id)" :key="report.id" class="progress-log-item">
                <div class="progress-log-head">
                  <span>{{ report.reporter?.displayName || report.reporterId }}</span>
                  <time>{{ formatDateTime(report.createdAt) }}</time>
                </div>
                <p>{{ report.report }}</p>
              </div>
            </div>
          </article>
        </div>

        <div class="progress-form">
          <label>{{ locale === "zh-CN" ? "汇报到队伍" : "Report Team" }}</label>
          <select v-model="progressForm.applicationId" class="select">
            <option v-for="application in currentTask.applications" :key="`report-target-${application.id}`" :value="application.id">
              {{ application.project.name }} ({{ application.status }})
            </option>
          </select>
          <label>{{ locale === "zh-CN" ? "进度内容" : "Progress Content" }}</label>
          <textarea v-model.trim="progressForm.report" class="input" rows="4" :placeholder="locale === 'zh-CN' ? '例如：今日完成 API 对齐，联调完成 80%。' : 'e.g. API alignment done, integration 80% complete.'" />
        </div>

        <div class="modal-actions">
          <button class="button" @click="progressOpen = false">{{ t("common.close") }}</button>
          <button class="button primary" :disabled="!canSubmitProgress(currentTask)" @click="submitProgress">
            {{ locale === "zh-CN" ? "提交进度" : "Submit Progress" }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="applyOpen && currentTask" class="modal-backdrop" @click.self="applyOpen = false">
      <div class="modal-panel">
        <h3>{{ locale === "zh-CN" ? "报名任务" : "Apply Quest" }}: {{ currentTask.title }}</h3>
        <div class="form-grid">
          <label>{{ locale === "zh-CN" ? "选择团队编排" : "Choose Team Plan" }}</label>
          <select v-model="applyForm.projectId" class="select">
            <option value="">{{ locale === "zh-CN" ? "请选择" : "Please select" }}</option>
            <option v-for="project in eligibleProjects" :key="project.id" :value="project.id">{{ project.name }} ({{ project.assignmentsCount }})</option>
          </select>
          <label>{{ locale === "zh-CN" ? "留言" : "Message" }}</label>
          <textarea v-model.trim="applyForm.message" class="input" rows="4" />
        </div>
        <div class="modal-actions">
          <button class="button" @click="applyOpen = false">{{ t("common.cancel") }}</button>
          <button class="button primary" :disabled="eligibleProjects.length === 0" @click="submitApply">{{ locale === "zh-CN" ? "确认报名" : "Apply" }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { apiGet, apiPatch, apiPost } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import PaginationBar from "../components/PaginationBar.vue";

type UserLite = { id: string; handle: string; displayName: string; avatar: string };
type ProjectRow = { id: string; name: string; assignmentsCount: number; createdBy: string; updatedBy: string };
type TaskApplication = {
  id: string;
  status: "APPLIED" | "ADOPTED" | "REJECTED";
  message: string;
  applicantId: string;
  applicant: UserLite | null;
  project: { id: string; name: string; createdBy: string; assignmentsCount: number };
  createdAt: string;
  updatedAt: string;
};
type TaskProgressReport = {
  id: string;
  applicationId: string;
  reporterId: string;
  reporter: UserLite | null;
  report: string;
  createdAt: string;
};
type TaskRow = {
  id: string;
  title: string;
  detail: string;
  background: string;
  objective: string;
  plan: string;
  conditions: string;
  targetPath: string;
  startedAt: string | null;
  retreatedAt: string | null;
  progressReports: TaskProgressReport[];
  reward: string;
  status: "OPEN" | "ADOPTED" | "CLOSED";
  publisherId: string;
  publisher: UserLite | null;
  adoptedApplicationId?: string | null;
  applications: TaskApplication[];
};

const { t, locale } = useI18n();
const { user, isLoggedIn } = useAuth();
const tasks = ref<TaskRow[]>([]);
const projects = ref<ProjectRow[]>([]);
const errorText = ref("");
const createOpen = ref(false);
const viewOpen = ref(false);
const editOpen = ref(false);
const progressOpen = ref(false);
const applyOpen = ref(false);
const currentTaskId = ref("");
const statusFilter = ref<"ALL" | "OPEN" | "ADOPTED" | "CLOSED">("ALL");
const page = ref(1);
const pageSize = ref(9);

const createForm = reactive({ title: "", reward: "", background: "", objective: "", plan: "", conditions: "", targetPath: "" });
const editForm = reactive({ id: "", title: "", reward: "", background: "", objective: "", plan: "", conditions: "", targetPath: "" });
const applyForm = reactive({ projectId: "", message: "" });
const progressForm = reactive({ applicationId: "", report: "" });

const currentTask = computed(() => tasks.value.find((task) => task.id === currentTaskId.value) ?? null);
const eligibleProjects = computed(() => projects.value.filter((project) => project.createdBy === user.value?.id && project.assignmentsCount > 0));
const pagedTasks = computed(() => tasks.value.slice((page.value - 1) * pageSize.value, (page.value - 1) * pageSize.value + pageSize.value));

const isMyTask = (task: TaskRow) => task.publisherId === user.value?.id;
const isMyAdoptedTeam = (task: TaskRow) => task.applications.some((application) => application.status === "ADOPTED" && application.applicantId === user.value?.id);
const canEditTask = (task: TaskRow) => isLoggedIn.value && isMyTask(task);
const canApply = (task: TaskRow) => isLoggedIn.value && task.status === "OPEN" && !isMyTask(task);
const canStartTask = (task: TaskRow) => isLoggedIn.value && task.status === "ADOPTED" && !task.startedAt;
const canOpenProgress = (task: TaskRow) => task.status === "ADOPTED" || task.progressReports.length > 0;
const canRetreatTask = (task: TaskRow) =>
  isLoggedIn.value && task.status === "ADOPTED" && !!task.startedAt && (isMyTask(task) || isMyAdoptedTeam(task));
const canSubmitProgress = (task: TaskRow) =>
  isLoggedIn.value &&
  (isMyTask(task) || isMyAdoptedTeam(task)) &&
  !!progressForm.applicationId &&
  progressForm.report.trim().length > 0;

const adoptedTeamName = (task: TaskRow) => {
  const adopted = task.applications.find((item) => item.id === task.adoptedApplicationId);
  if (!adopted) return locale.value === "zh-CN" ? "未采纳" : "Not adopted";
  return adopted.project.name;
};

const reportsByApplication = (task: TaskRow, applicationId: string) =>
  [...task.progressReports]
    .filter((report) => report.applicationId === applicationId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

const excerpt = (value: string, max = 80) => {
  const plain = value.replace(/[#>*_`~\-\[\]()]/g, " ").replace(/\s+/g, " ").trim();
  if (!plain) return locale.value === "zh-CN" ? "暂无说明" : "No description";
  return plain.length > max ? `${plain.slice(0, max)}...` : plain;
};

const resetCreateForm = () => {
  createForm.title = "";
  createForm.reward = "";
  createForm.background = "";
  createForm.objective = "";
  createForm.plan = "";
  createForm.conditions = "";
  createForm.targetPath = "";
};

const openCreateModal = () => {
  resetCreateForm();
  createOpen.value = true;
};

const openViewModal = (task: TaskRow) => {
  currentTaskId.value = task.id;
  viewOpen.value = true;
};

const openEditModal = (task: TaskRow) => {
  currentTaskId.value = task.id;
  editForm.id = task.id;
  editForm.title = task.title;
  editForm.reward = task.reward;
  editForm.background = task.background;
  editForm.objective = task.objective;
  editForm.plan = task.plan;
  editForm.conditions = task.conditions;
  editForm.targetPath = task.targetPath;
  editOpen.value = true;
};

const openProgressModal = (task: TaskRow) => {
  currentTaskId.value = task.id;
  progressForm.applicationId = task.adoptedApplicationId || task.applications[0]?.id || "";
  progressForm.report = "";
  progressOpen.value = true;
};

const openApplyModal = (task: TaskRow) => {
  currentTaskId.value = task.id;
  applyForm.projectId = "";
  applyForm.message = "";
  applyOpen.value = true;
};

const load = async () => {
  errorText.value = "";
  try {
    const taskPath = statusFilter.value === "ALL" ? "/tasks" : `/tasks?status=${statusFilter.value}`;
    const [taskRows, projectRows] = await Promise.all([apiGet<TaskRow[]>(taskPath), apiGet<ProjectRow[]>("/projects")]);
    tasks.value = taskRows;
    projects.value = projectRows;
    page.value = 1;
  } catch (error) {
    errorText.value = String(error);
  }
};

const submitCreate = async () => {
  if (!isLoggedIn.value) {
    errorText.value = locale.value === "zh-CN" ? "请先登录后再保存任务。" : "Please login before saving this quest.";
    return;
  }
  errorText.value = "";
  try {
    await apiPost("/tasks", {
      title: createForm.title,
      reward: createForm.reward,
      detail: createForm.background,
      background: createForm.background,
      objective: createForm.objective,
      plan: createForm.plan,
      conditions: createForm.conditions,
      targetPath: createForm.targetPath,
    });
    createOpen.value = false;
    await load();
  } catch (error) {
    errorText.value = String(error);
  }
};

const submitEdit = async () => {
  const target = tasks.value.find((item) => item.id === editForm.id);
  if (!target || !canEditTask(target)) {
    errorText.value = locale.value === "zh-CN" ? "仅发布者可以编辑任务。" : "Only publisher can edit task.";
    return;
  }
  if (!editForm.id) return;
  errorText.value = "";
  try {
    await apiPatch(`/tasks/${editForm.id}`, {
      title: editForm.title,
      reward: editForm.reward,
      detail: editForm.background,
      background: editForm.background,
      objective: editForm.objective,
      plan: editForm.plan,
      conditions: editForm.conditions,
      targetPath: editForm.targetPath,
    });
    editOpen.value = false;
    await load();
  } catch (error) {
    errorText.value = String(error);
  }
};

const submitApply = async () => {
  if (!currentTask.value) return;
  errorText.value = "";
  try {
    await apiPost(`/tasks/${currentTask.value.id}/apply`, { projectId: applyForm.projectId, message: applyForm.message });
    applyOpen.value = false;
    await load();
  } catch (error) {
    errorText.value = String(error);
  }
};

const submitProgress = async () => {
  if (!currentTask.value || !canSubmitProgress(currentTask.value)) return;
  errorText.value = "";
  try {
    await apiPost(`/tasks/${currentTask.value.id}/progress`, {
      applicationId: progressForm.applicationId,
      report: progressForm.report,
    });
    progressForm.report = "";
    await load();
  } catch (error) {
    errorText.value = String(error);
  }
};

const adoptTeam = async (taskId: string, applicationId: string) => {
  errorText.value = "";
  try {
    await apiPost(`/tasks/${taskId}/adopt`, { applicationId });
    await load();
  } catch (error) {
    errorText.value = String(error);
  }
};

const startTask = async (taskId: string) => {
  errorText.value = "";
  try {
    await apiPost(`/tasks/${taskId}/start`, {});
    await load();
  } catch (error) {
    errorText.value = String(error);
  }
};

const retreatTask = async (taskId: string) => {
  const yes = window.confirm(locale.value === "zh-CN" ? "确认撤退？撤退后任务会回到 OPEN 状态。" : "Confirm retreat? Task will return to OPEN.");
  if (!yes) return;
  errorText.value = "";
  try {
    await apiPost(`/tasks/${taskId}/retreat`, {});
    await load();
  } catch (error) {
    errorText.value = String(error);
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

onMounted(load);
</script>

<style scoped>
.page-subtitle {
  margin: 0 0 14px;
}

.quest-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background:
    radial-gradient(circle at 10px 10px, #131313 1px, transparent 1px) 0 0 / 13px 13px,
    linear-gradient(180deg, #fff 0%, #f9f9f9 100%);
}

.quest-hero > div {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #e9e9e9;
  border-radius: 10px;
  padding: 8px 10px;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-select {
  min-width: 140px;
}

.quest-grid.compact {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.quest-mini-card {
  border: 1px solid #dcdcdc;
  border-radius: 12px;
  padding: 10px;
  background: linear-gradient(180deg, #fff 0%, #fcfcfc 100%);
  display: grid;
  gap: 8px;
}

.mini-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.mini-head h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.25;
}

.mini-reward {
  margin: 0;
  font-size: 12px;
  color: #575757;
}

.mini-summary {
  margin: 0;
  font-size: 12px;
  color: #353535;
  min-height: 34px;
}

.mini-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 11px;
  color: #5e5e5e;
}

.mini-path,
.mini-started,
.mini-retreated {
  margin: 0;
  font-size: 11px;
  color: #555;
  word-break: break-all;
}

.mini-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 6px;
}

.tiny-btn {
  min-height: 30px;
  padding: 6px 10px;
}

.tiny-btn.danger {
  border-color: #d7b4b4;
  color: #6f1f1f;
  background: #fff7f7;
}

.detail-section {
  margin-top: 10px;
}

.detail-section h4 {
  margin: 0 0 6px;
  font-size: 13px;
}

.quest-detail {
  margin: 0;
  white-space: pre-wrap;
}

.path-text {
  margin: 0;
  word-break: break-all;
}

.quest-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
  font-size: 12px;
  color: #555;
}

.application-list {
  margin-top: 10px;
  border: 1px dashed #d8d8d8;
  border-radius: 10px;
  padding: 8px;
  display: grid;
  gap: 8px;
}

.application-item {
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 8px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.application-actions {
  display: grid;
  justify-items: end;
  align-content: space-between;
  gap: 6px;
}

.message {
  margin: 4px 0 0;
  font-size: 12px;
}

.progress-panel {
  width: min(1040px, 100%);
}

.progress-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.progress-stat {
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  padding: 8px;
  background: #fafafa;
  display: grid;
  gap: 2px;
}

.progress-board {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.progress-team-card {
  border: 1px solid #e3e3e3;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.progress-team-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-team-card p {
  margin: 4px 0;
}

.progress-log-list {
  display: grid;
  gap: 6px;
}

.progress-log-item {
  border: 1px dashed #d7d7d7;
  border-radius: 8px;
  padding: 8px;
  background: #fcfcfc;
}

.progress-log-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: #636363;
}

.progress-log-item p {
  margin: 6px 0 0;
  white-space: pre-wrap;
  font-size: 13px;
}

.progress-form {
  margin-top: 10px;
  border: 1px solid #e3e3e3;
  border-radius: 10px;
  padding: 10px;
  display: grid;
  gap: 8px;
}

.tag.open {
  border-color: #2f2f2f;
}

.tag.adopted {
  border-color: #111;
  background: #111;
  color: #fff;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(16, 16, 16, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
  padding: 16px;
}

.modal-panel {
  width: min(920px, 100%);
  max-height: calc(100vh - 36px);
  overflow: auto;
  border: 1px solid #1f1f1f;
  border-radius: 14px;
  background: #fff;
  padding: 14px;
}

.view-panel {
  width: min(980px, 100%);
}

.form-grid {
  display: grid;
  gap: 8px;
}

.modal-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1100px) {
  .quest-grid.compact {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 820px) {
  .quest-grid.compact,
  .progress-stats {
    grid-template-columns: 1fr;
  }

  .quest-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
