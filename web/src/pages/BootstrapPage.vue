<template>
  <section>
    <h1 class="page-title">{{ t("bootstrap.title") }}</h1>
    <p class="muted page-subtitle">{{ locale === "zh-CN" ? "挑选队友、规划攻略路线，用直观流水线锁定执行。" : "Pick your team, plan the raid, and lock execution in a clear pipeline." }}</p>

    <div class="card">
      <div class="section-head">
        <h3 class="section-title">{{ t("bootstrap.registry") }}</h3>
        <button class="button primary" @click="openWizardModal">{{ t("bootstrap.new") }}</button>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>{{ t("common.id") }}</th>
            <th>{{ t("common.name") }}</th>
            <th>{{ locale === "zh-CN" ? "分配数" : "Assignments" }}</th>
            <th>{{ t("common.updated") }}</th>
            <th>{{ t("common.action") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in pagedProjects" :key="p.id">
            <td><code>{{ p.id }}</code></td>
            <td>{{ p.name }}</td>
            <td>{{ p.assignmentsCount }}</td>
            <td>{{ formatDateTime(p.updatedAt) }}</td>
            <td>
              <button class="button" style="margin-right: 6px" @click="openWizardModal(p)">{{ locale === "zh-CN" ? "用该项目继续编排" : "Plan With This Project" }}</button>
              <button class="button" @click="exportProjectConfig(p)">{{ locale === "zh-CN" ? "导出配置" : "Export Config" }}</button>
            </td>
          </tr>
          <tr v-if="projects.length === 0">
            <td colspan="5" class="muted">{{ t("bootstrap.noFound") }}</td>
          </tr>
        </tbody>
      </table>
      <PaginationBar
        :total="projects.length"
        :page="currentPage"
        :page-size="pageSize"
        :locale="locale"
        @update:page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
    </div>

    <div v-if="wizardOpen" class="modal-backdrop" @click.self="closeWizardModal">
      <div class="modal-panel wizard-modal">
        <div class="wizard-layout">
          <aside class="target-side">
            <h3 class="target-title">{{ locale === "zh-CN" ? "目标角色" : "Target Character" }}</h3>
            <div class="target-avatar">
              <div class="head"></div>
              <div class="eye left"></div>
              <div class="eye right"></div>
              <div class="mouth"></div>
            </div>
            <p class="target-name">{{ form.taskTarget || (locale === "zh-CN" ? "未知目标" : "Unknown Boss") }}</p>
            <p class="muted target-note">{{ locale === "zh-CN" ? "先组队，再规划每个阶段，然后执行。" : "Assemble your teammates and map each stage before execution." }}</p>
            <div class="tag-cloud">
              <span class="tag">{{ locale === "zh-CN" ? "阶段" : "Stages" }}: {{ stages.length }}</span>
              <span class="tag">{{ locale === "zh-CN" ? "队友" : "Teammates" }}: {{ totalAssignments }}</span>
              <span class="tag">{{ locale === "zh-CN" ? "样例" : "Examples" }}: {{ totalExamples }}</span>
            </div>
          </aside>

          <div class="main-side">
            <div class="stepper">
              <button class="step" :class="{ active: step === 1 }" @click="step = 1">{{ locale === "zh-CN" ? "Step 1 - 基本信息" : "Step 1 - Basic Info" }}</button>
              <button class="step" :class="{ active: step === 2 }" @click="step = 2">{{ locale === "zh-CN" ? "Step 2 - 队友编排" : "Step 2 - Team Pipeline" }}</button>
              <button class="step" :class="{ active: step === 3 }" @click="step = 3">{{ locale === "zh-CN" ? "Step 3 - 校验保存" : "Step 3 - Validate & Save" }}</button>
            </div>

            <div v-if="step === 1" class="step-panel">
              <h3 class="section-title">{{ locale === "zh-CN" ? "Step 1 - 基本信息" : "Step 1 - Basic Info" }}</h3>
              <div class="row">
                <div>
                  <label>{{ locale === "zh-CN" ? "项目 ID" : "Project ID" }}</label>
                  <input v-model="form.projectId" class="input" placeholder="project-delivery-01" />
                </div>
                <div>
                  <label>{{ locale === "zh-CN" ? "项目名称" : "Project Name" }}</label>
                  <input v-model="form.projectName" class="input" placeholder="AI Delivery Pipeline" />
                </div>
              </div>
              <div class="row">
                <div>
                  <label>{{ locale === "zh-CN" ? "模板 ID" : "Template ID" }}</label>
                  <input v-model="form.projectTemplateId" class="input" placeholder="tpl-pipeline-v1" />
                </div>
                <div>
                  <label>{{ locale === "zh-CN" ? "模板名称" : "Template Name" }}</label>
                  <input v-model="form.templateName" class="input" placeholder="Pipeline Template" />
                </div>
              </div>
              <div class="row">
                <div>
                  <label>{{ locale === "zh-CN" ? "开始日期" : "Start Date" }}</label>
                  <input v-model="form.startDate" class="input" placeholder="YYYY-MM-DD" />
                </div>
                <div>
                  <label>{{ locale === "zh-CN" ? "任务目标" : "Mission Objective" }}</label>
                  <input v-model="form.objective" class="input" placeholder="Launch MVP with staged collaboration" />
                </div>
              </div>
              <div>
                <label>任务目标（Target）</label>
                <input v-model="form.taskTarget" class="input" placeholder="例如：拿下核心用户场景 / 攻克某个关键角色需求" />
              </div>
              <div>
                <label>计划（Plan）</label>
                <textarea
                  v-model="form.taskPlan"
                  class="input"
                  rows="4"
                  placeholder="1. 阶段拆解&#10;2. 队友分工&#10;3. 交付节奏&#10;4. 风险预案"
                />
              </div>
            </div>

            <div v-if="step === 2" class="step-panel">
              <div class="section-head">
                <h3 class="section-title">{{ locale === "zh-CN" ? "Step 2 - 组队攻略路线" : "Step 2 - Team Route" }}</h3>
                <button class="button primary" @click="addStage">{{ locale === "zh-CN" ? "+ 添加阶段" : "+ Add Stage" }}</button>
              </div>
              <p class="muted">{{ locale === "zh-CN" ? "每个阶段至少需要一个队友，且必须有一个 PRIMARY 负责人。" : "Each stage needs at least one teammate and exactly one PRIMARY lead." }}</p>

              <div class="pipeline-board">
                <div class="stage-card" v-for="(stage, stageIndex) in stages" :key="stage.id">
                  <div class="stage-head">
                    <h4>Step {{ stageIndex + 1 }} - {{ stage.title || (locale === "zh-CN" ? "未命名阶段" : "Untitled Stage") }}</h4>
                    <button class="button tiny-btn" @click="removeStage(stage.id)">{{ locale === "zh-CN" ? "移除" : "Remove" }}</button>
                  </div>

                  <div class="row">
                    <div>
                      <label>{{ locale === "zh-CN" ? "阶段标题" : "Stage Title" }}</label>
                      <input v-model="stage.title" class="input" placeholder="Requirement Analysis" />
                    </div>
                    <div>
                      <label>{{ locale === "zh-CN" ? "角色 ID" : "Role ID" }}</label>
                      <input v-model="stage.roleId" class="input" placeholder="role.requirement" />
                    </div>
                  </div>

                  <div>
                    <label>{{ locale === "zh-CN" ? "阶段目标" : "Stage Objective" }}</label>
                    <input v-model="stage.objective" class="input" placeholder="Freeze scope and acceptance criteria" />
                  </div>

                  <div class="assignment-list">
                    <div class="assignment-row" v-for="(assignment, assignmentIndex) in stage.assignments" :key="`${stage.id}-${assignmentIndex}`">
                      <div class="row compact-row">
                        <div>
                          <label>{{ locale === "zh-CN" ? "队友" : "Teammate" }}</label>
                          <select v-model="assignment.agentId" class="select" @change="onAgentChanged(stageIndex, assignmentIndex)">
                            <option disabled value="">{{ locale === "zh-CN" ? "选择 Agent" : "Choose agent" }}</option>
                            <option v-for="agent in agents" :key="agent.id" :value="agent.id">{{ agent.name }} ({{ agent.id }})</option>
                          </select>
                        </div>
                        <div>
                          <label>{{ locale === "zh-CN" ? "角色" : "Role" }}</label>
                          <select v-model="assignment.assignmentRole" class="select">
                            <option value="PRIMARY">PRIMARY</option>
                            <option value="ASSISTANT">ASSISTANT</option>
                          </select>
                        </div>
                        <div>
                          <label>{{ locale === "zh-CN" ? "模型" : "Model" }}</label>
                          <select v-model="assignment.modelId" class="select">
                            <option disabled value="">{{ locale === "zh-CN" ? "选择模型" : "Choose model" }}</option>
                            <option v-for="m in models" :key="m.id" :value="m.id">{{ m.id }} ({{ m.tier }})</option>
                          </select>
                        </div>
                        <div>
                          <label>{{ locale === "zh-CN" ? "示例数量" : "Example Count" }}</label>
                          <input v-model.number="assignment.exampleCount" type="number" min="1" class="input" />
                        </div>
                        <div class="remove-cell">
                          <button class="button tiny-btn" @click="removeAssignment(stage.id, assignmentIndex)">{{ locale === "zh-CN" ? "移除" : "Remove" }}</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button class="button tiny-btn" @click="addAssignment(stage.id)">{{ locale === "zh-CN" ? "+ 添加队友" : "+ Add Teammate" }}</button>
                </div>
              </div>
            </div>

            <div v-if="step === 3" class="step-panel">
              <h3 class="section-title">{{ locale === "zh-CN" ? "Step 3 - 校验并保存" : "Step 3 - Validate & Save" }}</h3>
              <div class="summary-grid">
                <div class="summary-card">
                  <p class="muted">{{ locale === "zh-CN" ? "阶段" : "Stages" }}</p>
                  <h4>{{ stages.length }}</h4>
                </div>
                <div class="summary-card">
                  <p class="muted">{{ locale === "zh-CN" ? "队友" : "Teammates" }}</p>
                  <h4>{{ totalAssignments }}</h4>
                </div>
                <div class="summary-card">
                  <p class="muted">{{ locale === "zh-CN" ? "示例" : "Examples" }}</p>
                  <h4>{{ totalExamples }}</h4>
                </div>
              </div>
              <div class="row">
                <button class="button" @click="runValidate">{{ locale === "zh-CN" ? "执行校验" : "Run Validate" }}</button>
                <button class="button primary" @click="validateAndSave">{{ locale === "zh-CN" ? "校验并保存" : "Validate + Save" }}</button>
              </div>
              <pre class="json-result">{{ validationText }}</pre>
              <pre class="json-result">{{ saveText }}</pre>
            </div>

            <div class="modal-actions">
              <button class="button" @click="closeWizardModal">{{ t("common.close") }}</button>
              <button class="button" :disabled="step === 1" @click="step--">{{ locale === "zh-CN" ? "上一步" : "Back" }}</button>
              <button class="button primary" :disabled="step === 3" @click="goNext">{{ locale === "zh-CN" ? "下一步" : "Next" }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { apiGet, apiPost, apiPut } from "../lib/api";
import PaginationBar from "../components/PaginationBar.vue";
import { useI18n } from "../lib/i18n";

type Agent = {
  id: string;
  name: string;
  defaultModelId?: string | null;
  workflow?: Record<string, unknown> | null;
};

type Model = {
  id: string;
  tier: string;
};

type ProjectRow = {
  id: string;
  name: string;
  assignmentsCount: number;
  updatedAt: string;
};

type StageAssignment = {
  agentId: string;
  assignmentRole: "PRIMARY" | "ASSISTANT";
  modelId: string;
  exampleCount: number;
};

type PipelineStage = {
  id: string;
  title: string;
  roleId: string;
  objective: string;
  assignments: StageAssignment[];
};

const wizardOpen = ref(false);
const { t, locale } = useI18n();
const step = ref(1);
const agents = ref<Agent[]>([]);
const models = ref<Model[]>([]);
const projects = ref<ProjectRow[]>([]);
const currentPage = ref(1);
const pageSize = ref(10);
const validationText = ref("No validation yet.");
const saveText = ref("Not saved.");

const form = reactive({
  projectId: "project-delivery-01",
  projectName: "AI Delivery Pipeline",
  projectTemplateId: "tpl-pipeline-v1",
  templateName: "Pipeline Template",
  startDate: "2026-03-10",
  objective: "Launch MVP with staged collaboration",
  taskTarget: "",
  taskPlan: "",
});

const stages = ref<PipelineStage[]>([]);

const createDefaultStage = (index = 1): PipelineStage => ({
  id: `stage-${index}`,
  title: index === 1 ? "Requirement Analysis" : `Stage ${index}`,
  roleId: index === 1 ? "role.requirement" : `role.stage${index}`,
  objective: index === 1 ? "Freeze scope and acceptance criteria" : "",
  assignments: [{ agentId: "", assignmentRole: "PRIMARY", modelId: "", exampleCount: 3 }],
});

const resetWizardData = () => {
  step.value = 1;
  validationText.value = "No validation yet.";
  saveText.value = "Not saved.";
  form.projectId = "project-delivery-01";
  form.projectName = "AI Delivery Pipeline";
  form.projectTemplateId = "tpl-pipeline-v1";
  form.templateName = "Pipeline Template";
  form.startDate = "2026-03-10";
  form.objective = "Launch MVP with staged collaboration";
  form.taskTarget = "";
  form.taskPlan = "";
  stages.value = [createDefaultStage(1)];
};

const totalAssignments = computed(() => stages.value.reduce((acc, stage) => acc + stage.assignments.length, 0));
const totalExamples = computed(() =>
  stages.value.reduce((acc, stage) => acc + stage.assignments.reduce((sum, assignment) => sum + Math.max(1, Number(assignment.exampleCount) || 1), 0), 0),
);
const totalPages = computed(() => Math.max(1, Math.ceil(projects.value.length / pageSize.value)));
const pagedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return projects.value.slice(start, start + pageSize.value);
});

const findAssistantModel = (agent: Agent): string => {
  const workflow = agent.workflow && typeof agent.workflow === "object" ? (agent.workflow as Record<string, unknown>) : null;
  return workflow && typeof workflow.assistantModelId === "string" ? workflow.assistantModelId : "";
};

const getSuggestedModel = (agentId: string, assignmentRole: "PRIMARY" | "ASSISTANT") => {
  const agent = agents.value.find((x) => x.id === agentId);
  if (!agent) return "";
  if (assignmentRole === "PRIMARY") return agent.defaultModelId || "";
  return findAssistantModel(agent) || agent.defaultModelId || "";
};

const makeDefaultAssignment = (): StageAssignment => ({
  agentId: "",
  assignmentRole: "PRIMARY",
  modelId: "",
  exampleCount: 1,
});

const addStage = () => {
  const next = stages.value.length + 1;
  stages.value.push(createDefaultStage(next));
};

const removeStage = (stageId: string) => {
  if (stages.value.length <= 1) return;
  stages.value = stages.value.filter((stage) => stage.id !== stageId);
};

const addAssignment = (stageId: string) => {
  const stage = stages.value.find((x) => x.id === stageId);
  if (!stage) return;
  const assignment = makeDefaultAssignment();
  assignment.assignmentRole = stage.assignments.some((x) => x.assignmentRole === "PRIMARY") ? "ASSISTANT" : "PRIMARY";
  stage.assignments.push(assignment);
};

const removeAssignment = (stageId: string, idx: number) => {
  const stage = stages.value.find((x) => x.id === stageId);
  if (!stage) return;
  stage.assignments.splice(idx, 1);
  if (stage.assignments.length === 0) {
    stage.assignments.push(makeDefaultAssignment());
  }
};

const onAgentChanged = (stageIndex: number, assignmentIndex: number) => {
  const assignment = stages.value[stageIndex]?.assignments[assignmentIndex];
  if (!assignment || assignment.modelId) return;
  assignment.modelId = getSuggestedModel(assignment.agentId, assignment.assignmentRole);
};

const openWizardModal = (project?: ProjectRow) => {
  resetWizardData();
  if (project) {
    form.projectId = project.id;
    form.projectName = project.name;
  }
  wizardOpen.value = true;
};

const closeWizardModal = () => {
  wizardOpen.value = false;
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const normalizeStage = (stage: PipelineStage, index: number) => ({
  id: stage.id || `stage-${index + 1}`,
  name: `Step ${index + 1} - ${stage.title || `Stage ${index + 1}`}`,
  objective: stage.objective || "",
  roles: [
    {
      roleId: stage.roleId || `role.stage${index + 1}`,
      instances: Math.max(stage.assignments.length, 1),
      responsibilities: stage.assignments.map((assignment) => {
        const agentName = agents.value.find((x) => x.id === assignment.agentId)?.name || assignment.agentId || "unassigned";
        return `${agentName} handles ${Math.max(1, Number(assignment.exampleCount) || 1)} examples`;
      }),
    },
  ],
});

const roleAgentAssignments = computed(() =>
  stages.value.map((stage, stageIndex) => ({
    roleId: stage.roleId || `role.stage${stageIndex + 1}`,
    agents: stage.assignments.map((assignment, assignmentIndex) => ({
      agentId: assignment.agentId,
      assignmentRole: assignment.assignmentRole,
      modelId: assignment.modelId,
      priority: (assignmentIndex + 1) * 10,
    })),
  })),
);

const combinedObjective = computed(() => {
  const lines = [
    `Mission: ${form.objective}`,
    `Target: ${form.taskTarget}`,
    "Plan:",
    form.taskPlan,
  ]
    .map((x) => x.trim())
    .filter(Boolean);
  return lines.join("\n");
});

const payload = computed(() => ({
  projectTemplateId: form.projectTemplateId,
  projectName: form.projectName,
  startDate: form.startDate,
  objective: combinedObjective.value,
  projectTemplate: {
    name: form.templateName,
    phases: stages.value.map(normalizeStage),
  },
  roleAgentAssignments: roleAgentAssignments.value,
}));

const validateLocal = (): string | null => {
  if (!form.projectId.trim() || !form.projectName.trim()) return "Project ID and Project Name are required.";
  if (!form.taskTarget.trim()) return "请填写任务目标（Target）。";
  if (!form.taskPlan.trim()) return "请填写计划（Plan）。";
  if (stages.value.length === 0) return "At least one stage is required.";
  for (let i = 0; i < stages.value.length; i += 1) {
    const stage = stages.value[i];
    if (stage.assignments.length === 0) return `Stage ${i + 1} needs at least one assignment.`;
    const primaryCount = stage.assignments.filter((assignment) => assignment.assignmentRole === "PRIMARY").length;
    if (primaryCount !== 1) return `Stage ${i + 1} must have exactly one PRIMARY agent.`;
    for (let j = 0; j < stage.assignments.length; j += 1) {
      const assignment = stage.assignments[j];
      if (!assignment.agentId || !assignment.modelId) return `Stage ${i + 1}, assignment ${j + 1} is incomplete.`;
      if (Math.max(1, Number(assignment.exampleCount) || 1) < 1) return `Stage ${i + 1}, assignment ${j + 1} example count invalid.`;
    }
  }
  return null;
};

const runValidate = async () => {
  const localError = validateLocal();
  if (localError) {
    validationText.value = localError;
    return;
  }
  try {
    const res = await apiPost("/projects/bootstrap/validate", payload.value);
    validationText.value = JSON.stringify(res, null, 2);
  } catch (e) {
    validationText.value = String(e);
  }
};

const validateAndSave = async () => {
  const localError = validateLocal();
  if (localError) {
    saveText.value = localError;
    return;
  }

  try {
    const validateRes = await apiPost("/projects/bootstrap/validate", payload.value);
    validationText.value = JSON.stringify(validateRes, null, 2);

    const existing = projects.value.find((project) => project.id === form.projectId.trim());
    if (!existing) {
      await apiPost("/projects", {
        id: form.projectId.trim(),
        name: form.projectName.trim(),
      });
    }

    const saveRes = await apiPut(`/projects/${form.projectId.trim()}/role-agents`, {
      roleAgentAssignments: roleAgentAssignments.value,
    });
    saveText.value = JSON.stringify(saveRes, null, 2);
    await load();
  } catch (e) {
    saveText.value = String(e);
  }
};

const goNext = () => {
  if (step.value === 1) {
    if (!form.projectId.trim() || !form.projectName.trim() || !form.taskTarget.trim() || !form.taskPlan.trim()) {
      validationText.value = "Step 1 fields are required: Project / Target / Plan.";
      return;
    }
  }
  if (step.value === 2 && stages.value.length === 0) {
    validationText.value = "At least one stage is required.";
    return;
  }
  step.value += 1;
};

const load = async () => {
  projects.value = await apiGet<ProjectRow[]>("/projects");
  agents.value = await apiGet<Agent[]>("/agents");
  models.value = await apiGet<Model[]>("/models");
};

watch(totalPages, (next) => {
  if (currentPage.value > next) currentPage.value = next;
});

const exportProjectConfig = async (project: ProjectRow) => {
  try {
    const data = await apiGet<Record<string, unknown>>(`/projects/${project.id}/export`);
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.id}-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    saveText.value = String(error);
  }
};

onMounted(async () => {
  resetWizardData();
  await load();
});
</script>

<style scoped>
.page-subtitle {
  margin: 0 0 14px;
}

.section-title {
  margin: 0;
  font-size: 16px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(18, 18, 18, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 16px;
}

.modal-panel {
  width: min(1320px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
  border: 1px solid #1f1f1f;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
  padding: 14px;
}

.wizard-modal {
  background: repeating-linear-gradient(45deg, #fff, #fff 10px, #f6f6f6 10px, #f6f6f6 20px);
}

.wizard-layout {
  display: grid;
  grid-template-columns: 290px 1fr;
  gap: 14px;
}

.target-side {
  border: 1px solid #1d1d1d;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.target-title {
  margin: 0;
}

.target-avatar {
  width: 130px;
  height: 130px;
  border: 2px solid #1d1d1d;
  border-radius: 50%;
  margin: 12px auto 8px;
  position: relative;
  background: #fff;
}

.target-avatar .head {
  width: 62px;
  height: 62px;
  border: 2px solid #1d1d1d;
  border-radius: 50%;
  position: absolute;
  top: 18px;
  left: 32px;
}

.target-avatar .eye {
  width: 6px;
  height: 6px;
  background: #111;
  border-radius: 50%;
  position: absolute;
  top: 43px;
}

.target-avatar .eye.left {
  left: 50px;
}

.target-avatar .eye.right {
  right: 50px;
}

.target-avatar .mouth {
  width: 18px;
  height: 6px;
  border: 2px solid #111;
  border-top: 0;
  border-radius: 0 0 10px 10px;
  position: absolute;
  top: 57px;
  left: 55px;
}

.target-name {
  text-align: center;
  margin: 0;
  font-weight: 700;
}

.target-note {
  text-align: center;
  margin-top: 8px;
}

.tag-cloud {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
}

.main-side {
  border: 1px solid #1f1f1f;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.stepper {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.step {
  border: 1px solid #1d1d1d;
  border-radius: 11px;
  padding: 10px;
  background: #fff;
  text-align: center;
  cursor: pointer;
}

.step.active {
  background: #111;
  color: #fff;
}

.step-panel {
  border: 1px dashed #303030;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.pipeline-board {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.stage-card {
  border: 1px solid #1d1d1d;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
}

.stage-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.stage-head h4 {
  margin: 0;
}

.assignment-list {
  margin: 10px 0;
  display: grid;
  gap: 10px;
}

.assignment-row {
  border: 1px dashed #2d2d2d;
  border-radius: 10px;
  padding: 8px;
  background: #fff;
}

.compact-row {
  align-items: end;
}

.remove-cell {
  display: flex;
  align-items: end;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.summary-card {
  border: 1px solid #222;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.summary-card p,
.summary-card h4 {
  margin: 0;
}

.summary-card h4 {
  margin-top: 4px;
  font-size: 22px;
}

.json-result {
  white-space: pre-wrap;
  margin-top: 10px;
  border: 1px solid #222;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.tiny-btn {
  min-height: 32px;
  padding: 6px 10px;
}

.modal-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 1080px) {
  .wizard-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .stepper {
    grid-template-columns: 1fr;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
