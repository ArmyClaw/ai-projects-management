<template>
  <section>
    <h1 class="page-title">{{ t("tasks.title") }}</h1>
    <p class="muted page-subtitle">{{ t("tasks.subtitle") }}</p>

    <div class="card quest-hero">
      <div>
        <h3>{{ locale === "zh-CN" ? "任务发布站" : "Quest Counter" }}</h3>
        <p class="muted">{{ locale === "zh-CN" ? "像游戏大厅一样发布任务，等待团队报名，再采纳最优编排。" : "Post quests, wait for teams, and adopt the best lineup." }}</p>
      </div>
      <button class="button primary" :disabled="!isLoggedIn" @click="openCreateModal">
        {{ t("tasks.new") }}
      </button>
    </div>

    <div v-if="!isLoggedIn" class="card muted">
      {{ locale === "zh-CN" ? "请先在左下角登录主理人后再发布/报名任务。" : "Login as host from the bottom-left dock to publish or apply quests." }}
    </div>

    <div class="quest-grid">
      <article v-for="task in tasks" :key="task.id" class="quest-card">
        <header class="quest-head">
          <div>
            <h3>{{ task.title }}</h3>
            <p class="muted">{{ task.reward }}</p>
          </div>
          <span class="tag" :class="task.status.toLowerCase()">{{ task.status }}</span>
        </header>

        <p class="quest-detail">{{ task.detail }}</p>

        <div class="quest-meta">
          <span>{{ locale === "zh-CN" ? "发布者" : "Publisher" }}: {{ task.publisher?.displayName || task.publisherId }}</span>
          <span>{{ locale === "zh-CN" ? "报名队伍" : "Applications" }}: {{ task.applications.length }}</span>
        </div>

        <div class="application-list">
          <div v-for="application in task.applications" :key="application.id" class="application-item">
            <div>
              <strong>{{ application.project.name }}</strong>
              <p class="muted">{{ application.applicant?.displayName || application.applicantId }} · {{ application.project.assignmentsCount }} {{ locale === "zh-CN" ? "席位" : "slots" }}</p>
              <p class="message">{{ application.message || (locale === "zh-CN" ? "无留言" : "No message") }}</p>
            </div>
            <div class="application-actions">
              <span class="tag">{{ application.status }}</span>
              <button
                v-if="isMyTask(task) && task.status === 'OPEN' && application.status === 'APPLIED'"
                class="button tiny-btn"
                @click="adoptTeam(task.id, application.id)"
              >
                {{ locale === "zh-CN" ? "采纳" : "Adopt" }}
              </button>
            </div>
          </div>
          <p v-if="task.applications.length === 0" class="muted">{{ locale === "zh-CN" ? "暂无报名队伍。" : "No teams applied yet." }}</p>
        </div>

        <div class="quest-actions">
          <button
            v-if="!isMyTask(task)"
            class="button"
            :disabled="!canApply(task)"
            @click="openApplyModal(task)"
          >
            {{ locale === "zh-CN" ? "报名接任务" : "Apply With Team" }}
          </button>
          <span v-else class="muted">{{ locale === "zh-CN" ? "你发布的任务" : "Your quest" }}</span>
        </div>
      </article>
    </div>

    <p v-if="errorText" class="error-text">{{ errorText }}</p>

    <div v-if="createOpen" class="modal-backdrop" @click.self="createOpen = false">
      <div class="modal-panel">
        <h3>{{ locale === "zh-CN" ? "发布任务" : "Publish Quest" }}</h3>
        <div class="form-grid">
          <label>{{ locale === "zh-CN" ? "任务标题" : "Title" }}</label>
          <input v-model.trim="createForm.title" class="input" placeholder="Design AI Growth Campaign" />
          <label>{{ locale === "zh-CN" ? "任务奖励" : "Reward" }}</label>
          <input v-model.trim="createForm.reward" class="input" placeholder="5000 XP + MVP Delivery" />
          <label>{{ locale === "zh-CN" ? "任务描述" : "Description" }}</label>
          <textarea v-model.trim="createForm.detail" class="input" rows="5" />
        </div>
        <div class="modal-actions">
          <button class="button" @click="createOpen = false">{{ t("common.cancel") }}</button>
          <button class="button primary" @click="submitCreate">{{ locale === "zh-CN" ? "确认发布" : "Publish" }}</button>
        </div>
      </div>
    </div>

    <div v-if="applyOpen && currentTask" class="modal-backdrop" @click.self="applyOpen = false">
      <div class="modal-panel">
        <h3>{{ locale === "zh-CN" ? "报名任务" : "Apply Quest" }}: {{ currentTask.title }}</h3>
        <div class="form-grid">
          <label>{{ locale === "zh-CN" ? "选择项目编排团队" : "Choose Project Team" }}</label>
          <select v-model="applyForm.projectId" class="select">
            <option value="">{{ locale === "zh-CN" ? "请选择" : "Please select" }}</option>
            <option v-for="project in eligibleProjects" :key="project.id" :value="project.id">{{ project.name }} ({{ project.assignmentsCount }})</option>
          </select>
          <label>{{ locale === "zh-CN" ? "留言" : "Message" }}</label>
          <textarea v-model.trim="applyForm.message" class="input" rows="4" />
        </div>
        <p v-if="eligibleProjects.length === 0" class="muted">{{ locale === "zh-CN" ? "你还没有可报名的项目编排团队（需要有分配成员）。" : "No eligible project team yet (needs assignments)." }}</p>
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
import { apiGet, apiPost } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";

type UserLite = { id: string; handle: string; displayName: string; avatar: string };
type ProjectRow = {
  id: string;
  name: string;
  assignmentsCount: number;
  createdBy: string;
  updatedBy: string;
};
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
type TaskRow = {
  id: string;
  title: string;
  detail: string;
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
const applyOpen = ref(false);
const currentTask = ref<TaskRow | null>(null);

const createForm = reactive({
  title: "",
  detail: "",
  reward: "",
});

const applyForm = reactive({
  projectId: "",
  message: "",
});

const eligibleProjects = computed(() =>
  projects.value.filter((project) => project.createdBy === user.value?.id && project.assignmentsCount > 0),
);

const isMyTask = (task: TaskRow) => task.publisherId === user.value?.id;

const canApply = (task: TaskRow) => {
  if (!isLoggedIn.value) return false;
  if (task.status !== "OPEN") return false;
  if (isMyTask(task)) return false;
  return true;
};

const openCreateModal = () => {
  createForm.title = "";
  createForm.detail = "";
  createForm.reward = "";
  createOpen.value = true;
};

const openApplyModal = (task: TaskRow) => {
  currentTask.value = task;
  applyForm.projectId = "";
  applyForm.message = "";
  applyOpen.value = true;
};

const load = async () => {
  errorText.value = "";
  try {
    const [taskRows, projectRows] = await Promise.all([apiGet<TaskRow[]>("/tasks"), apiGet<ProjectRow[]>("/projects")]);
    tasks.value = taskRows;
    projects.value = projectRows;
  } catch (error) {
    errorText.value = String(error);
  }
};

const submitCreate = async () => {
  errorText.value = "";
  try {
    await apiPost("/tasks", {
      title: createForm.title,
      detail: createForm.detail,
      reward: createForm.reward,
    });
    createOpen.value = false;
    await load();
  } catch (error) {
    errorText.value = String(error);
  }
};

const submitApply = async () => {
  if (!currentTask.value) return;
  errorText.value = "";
  try {
    await apiPost(`/tasks/${currentTask.value.id}/apply`, {
      projectId: applyForm.projectId,
      message: applyForm.message,
    });
    applyOpen.value = false;
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

.quest-hero h3 {
  margin: 0;
  color: #111;
}

.quest-hero p {
  margin: 4px 0 0;
  color: #3f3f3f;
}

.quest-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.quest-card {
  border: 1px solid #1e1e1e;
  border-radius: 14px;
  padding: 12px;
  background: #fff;
}

.quest-head {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: flex-start;
}

.quest-head h3 {
  margin: 0;
}

.quest-head p {
  margin: 4px 0 0;
}

.quest-detail {
  margin: 10px 0;
  white-space: pre-wrap;
}

.quest-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

.application-item p {
  margin: 3px 0 0;
}

.application-actions {
  display: grid;
  justify-items: end;
  align-content: space-between;
  gap: 6px;
}

.message {
  font-size: 12px;
  color: #4d4d4d;
}

.quest-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.tiny-btn {
  min-height: 30px;
  padding: 6px 10px;
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
  width: min(680px, 100%);
  border: 1px solid #1f1f1f;
  border-radius: 14px;
  background: #fff;
  padding: 14px;
}

.modal-panel h3 {
  margin: 0 0 10px;
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

@media (max-width: 980px) {
  .quest-grid {
    grid-template-columns: 1fr;
  }

  .quest-hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
