<template>
  <section>
    <h1 class="page-title">{{ t("agents.title") }}</h1>
    <p class="muted page-subtitle">{{ t("agents.subtitle") }}</p>

    <div class="card">
      <div class="section-head">
        <h3 class="section-title">{{ t("agents.registry") }}</h3>
        <button class="button primary" @click="openCreateModal">{{ t("agents.new") }}</button>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>{{ t("common.id") }}</th>
            <th>{{ t("common.name") }}</th>
            <th>{{ locale === "zh-CN" ? "模型" : "Model" }}</th>
            <th>{{ t("skills.title") }}</th>
            <th>{{ t("nav.mcps") }}</th>
            <th>{{ t("agents.workload") }}</th>
            <th>{{ t("agents.persona") }}</th>
            <th>{{ t("common.updated") }}</th>
            <th>{{ t("common.action") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in pagedAgents" :key="a.id">
            <td><code>{{ a.id }}</code></td>
            <td>{{ a.name }}</td>
            <td>{{ a.defaultModelId || "-" }}</td>
            <td>{{ summarizeSkills(a.skillIds) }}</td>
            <td>{{ summarizeMcps(extractMcpIds(a)) }}</td>
            <td>{{ a.workload }}%</td>
            <td>{{ extractPersonaSummary(a) }}</td>
            <td>{{ formatDateTime(a.updatedAt) }}</td>
            <td>
              <button class="button" @click="openEditModal(a)">{{ t("common.edit") }}</button>
            </td>
          </tr>
          <tr v-if="agents.length === 0">
            <td colspan="8" class="muted">{{ t("agents.noFound") }}</td>
          </tr>
        </tbody>
      </table>
      <PaginationBar
        :total="agents.length"
        :page="currentPage"
        :page-size="pageSize"
        :locale="locale"
        @update:page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
      <p v-if="tableError" class="error-text">{{ tableError }}</p>
    </div>

    <div v-if="createModalOpen" class="modal-backdrop" @click.self="closeCreateModal">
      <div class="modal-panel fancy-modal">
        <div class="create-layout">
          <aside class="persona-side">
            <h3 class="builder-title">Agent Builder</h3>
            <p class="muted builder-note">{{ locale === "zh-CN" ? "选择你的队友画像并调校能力。" : "Pick your teammate profile and tune capabilities." }}</p>
            <div class="avatar-card">
              <img :src="newAvatarData || defaultAgentAvatar" alt="agent avatar" class="agent-avatar" />
              <input ref="avatarInputRef" type="file" class="hidden-input" accept="image/*" @change="handleAvatarFile" />
              <div class="avatar-actions">
                <button class="button" @click="pickAvatarFile">{{ locale === "zh-CN" ? "设置头像" : "Set Avatar" }}</button>
                <button class="button" @click="resetAvatar">{{ t("common.reset") }}</button>
              </div>
            </div>
            <h3 class="persona-name">{{ newAgentName || (locale === "zh-CN" ? "未命名 Agent" : "Unnamed Agent") }}</h3>
            <p class="muted">{{ locale === "zh-CN" ? "自动角色：general" : "Auto role: general" }}</p>
            <div class="persona-badges">
              <span class="tag">{{ t("skills.title") }}: {{ newSkillIds.length }}</span>
              <span class="tag">MCP: {{ newMcpIds.length }}</span>
              <span class="tag">{{ locale === "zh-CN" ? "负载" : "Load" }}: {{ newWorkload }}%</span>
            </div>
          </aside>

          <div ref="formSideRef" class="form-side">
            <h3 class="section-title">{{ editingAgentId ? `${t("common.edit")} Agent` : `${t("common.create")} Agent` }}</h3>
            <div class="anchor-nav">
              <button class="button tiny-pill" @click="scrollToBlock('basic')">{{ locale === "zh-CN" ? "基础信息" : "Basic" }}</button>
              <button class="button tiny-pill" @click="scrollToBlock('model')">{{ locale === "zh-CN" ? "模型配置" : "Model" }}</button>
              <button class="button tiny-pill" @click="scrollToBlock('capability')">{{ locale === "zh-CN" ? "技能/工具" : "Skills/Tools" }}</button>
              <button class="button tiny-pill" @click="scrollToBlock('docs')">{{ locale === "zh-CN" ? "文档配置" : "Docs" }}</button>
            </div>

            <div id="agent-block-basic" class="form-block">
              <h4 class="block-title">{{ locale === "zh-CN" ? "基础信息" : "Basic Profile" }}</h4>
              <div class="form-grid-two">
                <div>
                  <label for="agent-id">Agent ID</label>
                  <input id="agent-id" v-model="newAgentId" :disabled="Boolean(editingAgentId)" class="input" placeholder="agent.backend.primary" />
                </div>
                <div>
                  <label for="agent-name">{{ t("common.name") }}</label>
                  <input id="agent-name" v-model="newAgentName" class="input" placeholder="Backend Primary Agent" />
                </div>
                <div>
                  <label for="agent-workload">{{ locale === "zh-CN" ? "负载 (0-100)" : "Workload (0-100)" }}</label>
                  <input id="agent-workload" v-model.number="newWorkload" type="number" min="0" max="100" class="input" />
                </div>
              </div>
            </div>

            <div id="agent-block-model" class="form-block">
              <h4 class="block-title">{{ locale === "zh-CN" ? "模型配置" : "Model" }}</h4>
              <div class="form-grid-two single-col">
                <div>
                  <label for="agent-model-primary">
                    {{ locale === "zh-CN" ? "模型（可选，不选则自动智能选择）" : "Model (optional, auto-select if empty)" }}
                  </label>
                  <select id="agent-model-primary" v-model="newDefaultModelId" class="select">
                    <option value="">{{ locale === "zh-CN" ? "自动智能选择" : "Auto smart select" }}</option>
                    <option v-for="m in activeModels" :key="m.id" :value="m.id">{{ m.id }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div id="agent-block-capability" class="capability-grid">
              <div class="form-block">
                <h4 class="block-title">{{ t("skills.title") }} (ACTIVE)</h4>
                <div class="mcp-picker">
                  <div class="mcp-selected">
                    <span v-if="newSkillIds.length === 0" class="muted">{{ locale === "zh-CN" ? "尚未选择技能。" : "No Skill selected." }}</span>
                    <span v-for="skillId in newSkillIds" :key="`picked-skill-${skillId}`" class="tag">
                      {{ getSkillDisplay(skillId) }}
                      <button class="remove-chip" @click="removeSelectedSkill(skillId)">x</button>
                    </span>
                  </div>
                  <div class="mcp-picker-actions">
                    <input v-model.trim="skillKeyword" class="input" :placeholder="locale === 'zh-CN' ? '搜索技能名 / id / 版本' : 'Search skill name / id / version'" />
                    <button class="button" @click="selectAllFilteredSkills">{{ locale === "zh-CN" ? "全选结果" : "Select Filtered" }}</button>
                    <button class="button" @click="clearSkills">{{ locale === "zh-CN" ? "清空已选" : "Clear" }}</button>
                    <button class="button" @click="goToSkillRepo">{{ locale === "zh-CN" ? "前往技能仓库" : "Go Skill Repo" }}</button>
                  </div>
                  <div class="mcp-pool">
                    <label v-for="skill in filteredSkillPool" :key="`pool-skill-${skill.id}`" class="pool-item">
                      <input type="checkbox" :checked="newSkillIds.includes(skill.id)" @change="toggleSkill(skill.id)" />
                      <span class="pool-main">{{ skill.name }}</span>
                      <span class="pool-sub">{{ skill.id }} · {{ skill.version }}</span>
                    </label>
                    <p v-if="filteredSkillPool.length === 0" class="muted">{{ locale === "zh-CN" ? "无匹配技能" : "No matched skills" }}</p>
                  </div>
                </div>
              </div>
              <div class="form-block">
                <h4 class="block-title">{{ locale === "zh-CN" ? "工具 (ACTIVE)" : "Tools (ACTIVE)" }}</h4>
                <div class="mcp-picker">
                  <div class="mcp-selected">
                    <span v-if="newMcpIds.length === 0" class="muted">{{ locale === "zh-CN" ? "尚未选择 MCP。" : "No MCP selected." }}</span>
                    <span v-for="mcpId in newMcpIds" :key="`picked-${mcpId}`" class="tag">
                      {{ getMcpDisplay(mcpId) }}
                      <button class="remove-chip" @click="removeSelectedMcp(mcpId)">x</button>
                    </span>
                  </div>
                  <div class="mcp-picker-actions">
                    <input v-model.trim="mcpKeyword" class="input" :placeholder="locale === 'zh-CN' ? '搜索工具名 / id / 协议' : 'Search tool name / id / transport'" />
                    <button class="button" @click="selectAllFilteredMcps">{{ locale === "zh-CN" ? "全选结果" : "Select Filtered" }}</button>
                    <button class="button" @click="clearMcps">{{ locale === "zh-CN" ? "清空已选" : "Clear" }}</button>
                    <button class="button" @click="goToMcpRepo">{{ locale === "zh-CN" ? "前往工具仓库" : "Go Tools Repo" }}</button>
                  </div>
                  <div class="mcp-pool">
                    <label v-for="mcp in filteredMcpPool" :key="`pool-mcp-${mcp.id}`" class="pool-item">
                      <input type="checkbox" :checked="newMcpIds.includes(mcp.id)" @change="toggleMcp(mcp.id)" />
                      <span class="pool-main">{{ mcp.name }}</span>
                      <span class="pool-sub">{{ mcp.id }} · {{ mcp.transport }}</span>
                    </label>
                    <p v-if="filteredMcpPool.length === 0" class="muted">{{ locale === "zh-CN" ? "无匹配工具" : "No matched tools" }}</p>
                  </div>
                </div>
              </div>
            </div>

            <div id="agent-block-docs" class="docs-card form-block">
              <label>{{ locale === "zh-CN" ? "Agent 文档（点击查看/编辑）" : "Agent Docs (click to view/edit)" }}</label>
              <div class="doc-row">
                <div>
                  <strong>AGENTS.md</strong>
                  <p class="muted">{{ summarizeDoc(newAgentsMarkdown) }}</p>
                </div>
                <div class="doc-actions">
                  <button class="button" @click="openDocEditor('agents', 'view')">{{ t("common.view") }}</button>
                  <button class="button" @click="openDocEditor('agents', 'edit')">{{ t("common.edit") }}</button>
                </div>
              </div>
              <div class="doc-row">
                <div>
                  <strong>User.md 人物说明</strong>
                  <p class="muted">{{ summarizeDoc(newUserMarkdown) }}</p>
                </div>
                <div class="doc-actions">
                  <button class="button" @click="openDocEditor('user', 'view')">{{ t("common.view") }}</button>
                  <button class="button" @click="openDocEditor('user', 'edit')">{{ t("common.edit") }}</button>
                </div>
              </div>
              <div class="doc-row">
                <div>
                  <strong>SOUL.md</strong>
                  <p class="muted">{{ summarizeDoc(newSoulMarkdown) }}</p>
                </div>
                <div class="doc-actions">
                  <button class="button" @click="openDocEditor('soul', 'view')">{{ t("common.view") }}</button>
                  <button class="button" @click="openDocEditor('soul', 'edit')">{{ t("common.edit") }}</button>
                </div>
              </div>
            </div>

            <p v-if="createError" class="error-text">{{ createError }}</p>
            <div class="modal-actions sticky-actions">
              <button class="button" @click="closeCreateModal">{{ t("common.cancel") }}</button>
              <button class="button primary" @click="submitAgent">{{ editingAgentId ? `${t("common.save")} Agent` : `${t("common.create")} Agent` }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="docEditorOpen" class="modal-backdrop" @click.self="closeDocEditor">
      <div class="modal-panel">
        <h3 class="section-title">{{ currentDocTitle }} - {{ docEditorMode === "view" ? t("common.view") : t("common.edit") }}</h3>
        <MarkdownEditor
          v-model="docEditorContent"
          :label="currentDocTitle"
          :rows="12"
          :readonly="docEditorMode === 'view'"
          :preview-only="docEditorMode === 'view'"
        />
        <div class="modal-actions">
          <button class="button" @click="closeDocEditor">{{ t("common.close") }}</button>
          <button v-if="docEditorMode === 'edit'" class="button primary" @click="applyDocEditor">{{ t("common.apply") }}</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { apiGet, apiPatch, apiPost } from "../lib/api";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import PaginationBar from "../components/PaginationBar.vue";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { pushToast } from "../lib/toast";

type Model = { id: string; status: string; tier: "PREMIUM" | "BALANCED" | "ECONOMY" };
type Skill = { id: string; name: string; version: string; status: string };
type Mcp = { id: string; name: string; transport: string; status: string };
type Agent = {
  id: string;
  name: string;
  roleId: string;
  workload: number;
  defaultModelId?: string | null;
  skillIds: string[];
  workflow?: Record<string, unknown> | null;
  createdBy: string;
  updatedAt?: string;
};

const agents = ref<Agent[]>([]);
const { t, locale } = useI18n();
const { user, isLoggedIn } = useAuth();
const activeMcps = ref<Mcp[]>([]);
const activeModels = ref<Model[]>([]);
const activeSkills = ref<Skill[]>([]);
const tableError = ref("");
const createError = ref("");

const createModalOpen = ref(false);
const editingAgentId = ref("");
const docEditorOpen = ref(false);
const docEditorMode = ref<"view" | "edit">("edit");
const editingDocKey = ref<"agents" | "user" | "soul">("agents");
const docEditorContent = ref("");

const newAgentId = ref("");
const newAgentName = ref("");
const newWorkload = ref(50);
const newDefaultModelId = ref("");
const newSkillIds = ref<string[]>([]);
const newMcpIds = ref<string[]>([]);
const skillKeyword = ref("");
const mcpKeyword = ref("");
const newAgentsMarkdown = ref("## Behavior\n- Always verify assumptions\n- Communicate constraints clearly");
const newUserMarkdown = ref("## User Profile\n- Team size:\n- Domain:\n- Preferred communication:");
const newSoulMarkdown = ref("## Personality\n- Calm, precise, pragmatic\n- Enjoys elegant solutions");
const newAvatarData = ref("");
const avatarInputRef = ref<HTMLInputElement | null>(null);
const defaultAgentAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
      <rect width='120' height='120' fill='white'/>
      <circle cx='60' cy='38' r='22' fill='white' stroke='black' stroke-width='3'/>
      <circle cx='52' cy='36' r='3' fill='black'/>
      <circle cx='68' cy='36' r='3' fill='black'/>
      <path d='M50 48 Q60 56 70 48' fill='none' stroke='black' stroke-width='3' stroke-linecap='round'/>
      <rect x='30' y='66' width='60' height='38' rx='12' fill='white' stroke='black' stroke-width='3'/>
      <path d='M16 22 h88 M16 98 h88' stroke='black' stroke-width='2' stroke-dasharray='4 4'/>
    </svg>`,
  );

const router = useRouter();
const formSideRef = ref<HTMLElement | null>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const skillById = computed(() => Object.fromEntries(activeSkills.value.map((s) => [s.id, s] as const)));
const mcpById = computed(() => Object.fromEntries(activeMcps.value.map((m) => [m.id, m] as const)));
const filteredSkillPool = computed(() => {
  const keyword = skillKeyword.value.toLowerCase();
  return activeSkills.value.filter((skill) => {
    if (!keyword) return true;
    return [skill.id, skill.name, skill.version].join(" ").toLowerCase().includes(keyword);
  });
});
const filteredMcpPool = computed(() => {
  const keyword = mcpKeyword.value.toLowerCase();
  return activeMcps.value.filter((mcp) => {
    if (!keyword) return true;
    return [mcp.id, mcp.name, mcp.transport].join(" ").toLowerCase().includes(keyword);
  });
});
const totalPages = computed(() => Math.max(1, Math.ceil(agents.value.length / pageSize.value)));
const pagedAgents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return agents.value.slice(start, start + pageSize.value);
});
const currentDocTitle = computed(() => {
  if (editingDocKey.value === "agents") return "AGENTS.md";
  if (editingDocKey.value === "user") return locale.value === "zh-CN" ? "User.md 人物说明" : "User.md Profile";
  return "SOUL.md";
});
const canManageAgent = (agent: Agent) => isLoggedIn.value && agent.createdBy === user.value?.id;

const extractMcpIds = (agent: Agent): string[] => {
  const raw = agent.workflow && typeof agent.workflow === "object" ? (agent.workflow as Record<string, unknown>).mcpIds : [];
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
};

const extractPersonaSummary = (agent: Agent): string => {
  const workflow = agent.workflow && typeof agent.workflow === "object" ? (agent.workflow as Record<string, unknown>) : null;
  const persona = workflow && typeof workflow.persona === "object" ? (workflow.persona as Record<string, unknown>) : null;
  if (!persona) return locale.value === "zh-CN" ? "无人格配置" : "No persona";
  const markers = [
    typeof persona.agents === "string" && (persona.agents as string).trim().length > 0 ? "AGENTS" : "",
    typeof persona.user === "string" && (persona.user as string).trim().length > 0 ? "USER" : "",
    typeof persona.soul === "string" && (persona.soul as string).trim().length > 0 ? "SOUL" : "",
  ].filter(Boolean);
  return markers.length > 0 ? markers.join(" / ") : locale.value === "zh-CN" ? "无人格配置" : "No persona";
};
const extractPersonaDocs = (agent: Agent): { agents: string; user: string; soul: string; avatar: string } => {
  const workflow = agent.workflow && typeof agent.workflow === "object" ? (agent.workflow as Record<string, unknown>) : null;
  const persona = workflow && typeof workflow.persona === "object" ? (workflow.persona as Record<string, unknown>) : null;
  return {
    agents: persona && typeof persona.agents === "string" ? persona.agents : "",
    user: persona && typeof persona.user === "string" ? persona.user : "",
    soul: persona && typeof persona.soul === "string" ? persona.soul : "",
    avatar: persona && typeof persona.avatar === "string" ? persona.avatar : "",
  };
};
const pickAvatarFile = () => {
  avatarInputRef.value?.click();
};

const handleAvatarFile = (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") newAvatarData.value = reader.result;
  };
  reader.readAsDataURL(file);
  input.value = "";
};

const resetAvatar = () => {
  newAvatarData.value = "";
};

const getSkillDisplay = (skillId: string) => {
  const skill = skillById.value[skillId];
  return skill ? `${skill.name}@${skill.version}` : skillId;
};

const getMcpDisplay = (mcpId: string) => {
  const mcp = mcpById.value[mcpId];
  return mcp ? `${mcp.name} (${mcp.transport})` : mcpId;
};

const summarizeSkills = (skillIds: string[]) => {
  if (skillIds.length === 0) return "0";
  const labels = skillIds.slice(0, 2).map(getSkillDisplay).join(", ");
  const suffix = skillIds.length > 2 ? ` +${skillIds.length - 2}` : "";
  return `${skillIds.length}: ${labels}${suffix}`;
};

const summarizeMcps = (mcpIds: string[]) => {
  if (mcpIds.length === 0) return "0";
  const labels = mcpIds.slice(0, 2).map(getMcpDisplay).join(", ");
  const suffix = mcpIds.length > 2 ? ` +${mcpIds.length - 2}` : "";
  return `${mcpIds.length}: ${labels}${suffix}`;
};

const formatDateTime = (input?: string) => {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const load = async () => {
  tableError.value = "";
  createError.value = "";
  try {
    agents.value = await apiGet<Agent[]>("/agents");
    activeMcps.value = await apiGet<Mcp[]>("/mcps?status=ACTIVE");
    const models = await apiGet<Model[]>("/models");
    const skills = await apiGet<Skill[]>("/skills?status=ACTIVE");
    activeModels.value = models.filter((m) => m.status === "ACTIVE");
    activeSkills.value = skills;
  } catch (e) {
    tableError.value = String(e);
  }
};

watch(totalPages, (next) => {
  if (currentPage.value > next) currentPage.value = next;
});

const openCreateModal = () => {
  createError.value = isLoggedIn.value ? "" : locale.value === "zh-CN" ? "可先填写，保存时需要登录。" : "You can fill form first; login is required when saving.";
  if (!isLoggedIn.value) pushToast(createError.value, "warning");
  editingAgentId.value = "";
  resetForm();
  createModalOpen.value = true;
};

const closeCreateModal = () => {
  createModalOpen.value = false;
};
const openEditModal = (agent: Agent) => {
  if (!canManageAgent(agent)) {
    tableError.value = locale.value === "zh-CN" ? "仅创建者可编辑。" : "Only creator can edit.";
    pushToast(tableError.value, "warning");
    return;
  }
  createError.value = "";
  editingAgentId.value = agent.id;
  newAgentId.value = agent.id;
  newAgentName.value = agent.name;
  newWorkload.value = agent.workload;
  newDefaultModelId.value = agent.defaultModelId || "";
  newSkillIds.value = [...agent.skillIds];
  newMcpIds.value = extractMcpIds(agent);
  skillKeyword.value = "";
  mcpKeyword.value = "";
  const persona = extractPersonaDocs(agent);
  newAgentsMarkdown.value = persona.agents || "## Behavior\n- Always verify assumptions\n- Communicate constraints clearly";
  newUserMarkdown.value = persona.user || "## User Profile\n- Team size:\n- Domain:\n- Preferred communication:";
  newSoulMarkdown.value = persona.soul || "## Personality\n- Calm, precise, pragmatic\n- Enjoys elegant solutions";
  newAvatarData.value = persona.avatar || "";
  createModalOpen.value = true;
};

const toggleSkill = (skillId: string) => {
  if (newSkillIds.value.includes(skillId)) {
    newSkillIds.value = newSkillIds.value.filter((id) => id !== skillId);
    return;
  }
  newSkillIds.value = [...newSkillIds.value, skillId];
};

const removeSelectedSkill = (skillId: string) => {
  newSkillIds.value = newSkillIds.value.filter((id) => id !== skillId);
};

const selectAllFilteredSkills = () => {
  const merged = new Set([...newSkillIds.value, ...filteredSkillPool.value.map((item) => item.id)]);
  newSkillIds.value = [...merged];
};

const clearSkills = () => {
  newSkillIds.value = [];
};

const toggleMcp = (mcpId: string) => {
  if (newMcpIds.value.includes(mcpId)) {
    newMcpIds.value = newMcpIds.value.filter((id) => id !== mcpId);
    return;
  }
  newMcpIds.value = [...newMcpIds.value, mcpId];
};

const removeSelectedMcp = (mcpId: string) => {
  newMcpIds.value = newMcpIds.value.filter((id) => id !== mcpId);
};

const selectAllFilteredMcps = () => {
  const merged = new Set([...newMcpIds.value, ...filteredMcpPool.value.map((item) => item.id)]);
  newMcpIds.value = [...merged];
};

const clearMcps = () => {
  newMcpIds.value = [];
};

const goToMcpRepo = () => {
  createModalOpen.value = false;
  router.push("/mcps");
};

const goToSkillRepo = () => {
  createModalOpen.value = false;
  router.push("/skills");
};

const summarizeDoc = (doc: string) => {
  const flat = doc.replace(/\s+/g, " ").trim();
  if (!flat) return t("common.empty");
  return flat.length > 92 ? `${flat.slice(0, 92)}...` : flat;
};

const getDocValue = (key: "agents" | "user" | "soul") => {
  if (key === "agents") return newAgentsMarkdown.value;
  if (key === "user") return newUserMarkdown.value;
  return newSoulMarkdown.value;
};

const setDocValue = (key: "agents" | "user" | "soul", value: string) => {
  if (key === "agents") newAgentsMarkdown.value = value;
  else if (key === "user") newUserMarkdown.value = value;
  else newSoulMarkdown.value = value;
};

const openDocEditor = (key: "agents" | "user" | "soul", mode: "view" | "edit") => {
  editingDocKey.value = key;
  docEditorMode.value = mode;
  docEditorContent.value = getDocValue(key);
  docEditorOpen.value = true;
};

const closeDocEditor = () => {
  docEditorOpen.value = false;
};

const applyDocEditor = () => {
  setDocValue(editingDocKey.value, docEditorContent.value);
  docEditorOpen.value = false;
};

const resetForm = () => {
  newAgentId.value = "";
  newAgentName.value = "";
  newWorkload.value = 50;
  newDefaultModelId.value = "";
  newSkillIds.value = [];
  newMcpIds.value = [];
  skillKeyword.value = "";
  mcpKeyword.value = "";
  newAgentsMarkdown.value = "## Behavior\n- Always verify assumptions\n- Communicate constraints clearly";
  newUserMarkdown.value = "## User Profile\n- Team size:\n- Domain:\n- Preferred communication:";
  newSoulMarkdown.value = "## Personality\n- Calm, precise, pragmatic\n- Enjoys elegant solutions";
  newAvatarData.value = "";
};

const scrollToBlock = (key: "basic" | "model" | "capability" | "docs") => {
  const host = formSideRef.value;
  if (!host) return;
  const target = host.querySelector<HTMLElement>(`#agent-block-${key}`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
};

const pickSmartModelId = () => {
  if (newDefaultModelId.value.trim()) return newDefaultModelId.value.trim();
  const preferBalanced = activeModels.value.find((m) => m.tier === "BALANCED");
  if (preferBalanced) return preferBalanced.id;
  const preferPremium = activeModels.value.find((m) => m.tier === "PREMIUM");
  if (preferPremium) return preferPremium.id;
  return activeModels.value[0]?.id ?? "";
};

const submitAgent = async () => {
  createError.value = "";
  if (!isLoggedIn.value) {
    createError.value = locale.value === "zh-CN" ? "请先登录再保存智能体。" : "Please login before saving agent.";
    return;
  }
  const id = newAgentId.value.trim();
  const name = newAgentName.value.trim();
  const workload = Number(newWorkload.value);
  if (!id || !name || Number.isNaN(workload)) {
    createError.value = locale.value === "zh-CN" ? "请填写 id、name 和 workload。" : "Please provide id, name and workload.";
    return;
  }
  if (workload < 0 || workload > 100) {
    createError.value = locale.value === "zh-CN" ? "Workload 需要在 0-100 之间。" : "Workload must be between 0 and 100.";
    return;
  }
  const selectedModelId = pickSmartModelId();
  if (!selectedModelId) {
    createError.value = locale.value === "zh-CN" ? "请先至少发布一个 ACTIVE 模型。" : "Please publish at least one ACTIVE model first.";
    return;
  }
  try {
    if (!editingAgentId.value) {
      await apiPost("/agents", {
        id,
        name,
        workload,
        roleId: "general",
        defaultModelId: selectedModelId,
        skillIds: newSkillIds.value,
        mcpIds: newMcpIds.value,
        agentsMarkdown: newAgentsMarkdown.value,
        userMarkdown: newUserMarkdown.value,
        soulMarkdown: newSoulMarkdown.value,
        avatar: newAvatarData.value || undefined,
        workflow: {},
      });
    } else {
      await apiPatch(`/agents/${editingAgentId.value}`, {
        name,
        workload,
        roleId: "general",
        defaultModelId: selectedModelId,
        skillIds: newSkillIds.value,
        mcpIds: newMcpIds.value,
        agentsMarkdown: newAgentsMarkdown.value,
        userMarkdown: newUserMarkdown.value,
        soulMarkdown: newSoulMarkdown.value,
        avatar: newAvatarData.value || "",
      });
    }
    resetForm();
    editingAgentId.value = "";
    createModalOpen.value = false;
    pushToast(locale.value === "zh-CN" ? "智能体已保存" : "Agent saved", "success");
    await load();
  } catch (e) {
    createError.value = String(e);
    pushToast(createError.value, "error");
  }
};

onMounted(load);
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

.mcp-picker {
  border: 1px solid #ece7dd;
  border-radius: 10px;
  padding: 8px;
  background: #fff;
}

.mcp-selected {
  min-height: 34px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.remove-chip {
  margin-left: 6px;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
}

.mcp-picker-actions {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 8px;
}

.mcp-pool {
  margin-top: 8px;
  border: 1px dashed #d8d2c8;
  border-radius: 8px;
  padding: 8px;
  max-height: 190px;
  overflow: auto;
  display: grid;
  gap: 6px;
}

.pool-item {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 4px 8px;
  align-items: start;
  border: 1px solid #ece7dd;
  border-radius: 8px;
  padding: 6px 8px;
  background: #fff;
}

.pool-main {
  font-weight: 600;
}

.pool-sub {
  grid-column: 2 / -1;
  font-size: 12px;
  color: var(--text-secondary);
}

.docs-card {
  margin-top: 10px;
  border: 1px solid #ece7dd;
  border-radius: 10px;
  padding: 8px;
  background: #fff;
}

.doc-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
  border: 1px dashed #efe8dc;
  border-radius: 8px;
  padding: 8px;
  margin-top: 8px;
}

.doc-row p {
  margin: 4px 0 0;
  font-size: 12px;
}

.doc-actions {
  display: flex;
  gap: 6px;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(22, 18, 36, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 16px;
}

.modal-panel {
  width: min(1200px, 100%);
  max-height: calc(100vh - 40px);
  overflow: auto;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow);
  padding: 14px;
}

.fancy-modal {
  background: linear-gradient(180deg, #fffdf8 0%, #ffffff 100%);
}

.create-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 14px;
}

.persona-side {
  border: 1px solid #1f1f1f;
  border-radius: 12px;
  padding: 12px;
  background: repeating-linear-gradient(45deg, #fff, #fff 8px, #f6f6f6 8px, #f6f6f6 16px);
  text-align: center;
}

.builder-title {
  margin: 0 0 4px;
}

.builder-note {
  margin: 0;
}

.avatar-card {
  margin: 10px 0;
  border: 1px dashed #333;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
  text-align: center;
}

.agent-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 2px solid #111;
  background: #fff;
  object-fit: cover;
}

.avatar-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.hidden-input {
  display: none;
}

.persona-name {
  margin: 0 0 2px;
}

.persona-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
}

.form-side {
  border: 1px solid #efeae2;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
  display: grid;
  gap: 10px;
  max-height: calc(100vh - 90px);
  overflow: auto;
  min-width: 0;
}

.anchor-nav {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  padding: 6px 0 8px;
  background: linear-gradient(180deg, #fff 70%, rgba(255, 255, 255, 0.85) 100%);
}

.tiny-pill {
  min-height: 30px;
  padding: 5px 10px;
  font-size: 12px;
}

.form-block {
  border: 1px solid #ece7dd;
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.block-title {
  margin: 0 0 8px;
  font-size: 14px;
}

.form-grid-two {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.form-grid-two.single-col {
  grid-template-columns: 1fr;
}

.capability-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.sticky-actions {
  position: sticky;
  bottom: 0;
  background: #fff;
  padding-top: 8px;
  border-top: 1px solid #eee;
}

.modal-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 980px) {
  .create-layout {
    grid-template-columns: 1fr;
  }

  .form-grid-two,
  .capability-grid {
    grid-template-columns: 1fr;
  }

  .mcp-picker-actions {
    grid-template-columns: 1fr;
  }

  .anchor-nav {
    position: static;
    padding-top: 0;
  }

  .doc-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .avatar-actions {
    flex-direction: column;
  }
}
</style>
