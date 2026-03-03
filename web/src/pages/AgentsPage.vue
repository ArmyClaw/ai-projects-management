<template>
  <section>
    <h1 class="page-title">Agents</h1>
    <p class="muted page-subtitle">Role-group configuration: shared skills, markdown workload plan, and separate PRIMARY/ASSISTANT models.</p>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Skills</th>
            <th>Workload (Markdown)</th>
            <th>PRIMARY Model</th>
            <th>ASSISTANT Model</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="g in groups" :key="g.roleId">
            <td>
              <span class="tag">{{ g.roleId }}</span>
            </td>
            <td>
              <div class="skill-list">
                <label v-for="s in activeSkills" :key="`${g.roleId}-${s.id}`" class="skill-item">
                  <input
                    type="checkbox"
                    :checked="selectedSkills[g.roleId]?.includes(s.id)"
                    @change="toggleSkill(g.roleId, s.id, ($event.target as HTMLInputElement).checked)"
                  />
                  <span class="skill-text">{{ s.name }}@{{ s.version }}</span>
                </label>
              </div>
            </td>
            <td class="workload-col">
              <textarea
                v-model="workloadMarkdown[g.roleId]"
                class="input"
                rows="6"
                placeholder="## Sprint Workload&#10;- PRIMARY: API design / code review&#10;- ASSISTANT: task delivery / test fix"
              />
              <details class="preview">
                <summary>Preview</summary>
                <div class="md-preview" v-html="renderMarkdown(workloadMarkdown[g.roleId] || '')" />
              </details>
            </td>
            <td>
              <select v-model="primaryModels[g.roleId]" class="select">
                <option disabled value="">Choose ACTIVE model</option>
                <option v-for="m in activeModels" :key="m.id" :value="m.id">{{ m.id }}</option>
              </select>
            </td>
            <td>
              <select v-model="assistantModels[g.roleId]" class="select">
                <option disabled value="">Choose ACTIVE model</option>
                <option v-for="m in activeModels" :key="m.id" :value="m.id">{{ m.id }}</option>
              </select>
            </td>
            <td>
              <button class="button primary action-btn" @click="saveGroup(g.roleId)">
                Save Role Config
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="tableError" class="error-text">{{ tableError }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { apiGet, apiPut } from "../lib/api";

type RoleGroupConfig = {
  roleId: string;
  config: {
    roleId: string;
    skillIds: string[];
    workflow?: Record<string, unknown>;
    workloadMarkdown?: string;
    primaryModelId: string;
    assistantModelId: string;
  } | null;
};
type Model = { id: string; status: string };
type Skill = { id: string; name: string; version: string; status: string };

const groups = ref<RoleGroupConfig[]>([]);
const activeModels = ref<Model[]>([]);
const activeSkills = ref<Skill[]>([]);
const primaryModels = ref<Record<string, string>>({});
const assistantModels = ref<Record<string, string>>({});
const selectedSkills = ref<Record<string, string[]>>({});
const workloadMarkdown = ref<Record<string, string>>({});
const tableError = ref("");

const load = async () => {
  tableError.value = "";
  groups.value = await apiGet<RoleGroupConfig[]>("/agents/role-groups");
  const models = await apiGet<Model[]>("/models");
  const skills = await apiGet<Skill[]>("/skills?status=ACTIVE");
  activeModels.value = models.filter((m) => m.status === "ACTIVE");
  activeSkills.value = skills;

  const fallbackPrimary = activeModels.value.find((m) => true)?.id ?? "";
  const fallbackAssistant = activeModels.value.find((m) => true)?.id ?? "";
  const nextPrimary: Record<string, string> = {};
  const nextAssistant: Record<string, string> = {};
  const nextSkills: Record<string, string[]> = {};
  const nextWorkload: Record<string, string> = {};
  for (const g of groups.value) {
    nextPrimary[g.roleId] = g.config?.primaryModelId || fallbackPrimary;
    nextAssistant[g.roleId] = g.config?.assistantModelId || fallbackAssistant;
    nextSkills[g.roleId] = [...(g.config?.skillIds || [])];
    nextWorkload[g.roleId] = g.config?.workloadMarkdown || "## Workload\n- PRIMARY:\n- ASSISTANT:";
  }
  primaryModels.value = nextPrimary;
  assistantModels.value = nextAssistant;
  selectedSkills.value = nextSkills;
  workloadMarkdown.value = nextWorkload;
};

const toggleSkill = (roleId: string, skillId: string, checked: boolean) => {
  const existing = selectedSkills.value[roleId] || [];
  selectedSkills.value[roleId] = checked
    ? Array.from(new Set([...existing, skillId]))
    : existing.filter((id) => id !== skillId);
};

const saveGroup = async (roleId: string) => {
  tableError.value = "";
  try {
    await apiPut(`/agents/role-groups/${roleId}/config`, {
      skillIds: selectedSkills.value[roleId] || [],
      workflow: {},
      workloadMarkdown: workloadMarkdown.value[roleId] || "",
      primaryModelId: primaryModels.value[roleId],
      assistantModelId: assistantModels.value[roleId],
    });
    await load();
  } catch (e) {
    tableError.value = String(e);
  }
};

const escapeHtml = (input: string) =>
  input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const renderMarkdown = (md: string) => {
  const lines = escapeHtml(md).split("\n");
  return lines
    .map((line) => {
      if (line.startsWith("### ")) return `<h4>${line.slice(4)}</h4>`;
      if (line.startsWith("## ")) return `<h3>${line.slice(3)}</h3>`;
      if (line.startsWith("# ")) return `<h2>${line.slice(2)}</h2>`;
      if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
      return line.trim() ? `<p>${line}</p>` : "<br />";
    })
    .join("")
    .replace(/(<li>.*<\/li>)/g, "<ul>$1</ul>")
    .replace(/<\/ul><ul>/g, "");
};

onMounted(load);
</script>

<style scoped>
.page-subtitle {
  margin: 0 0 14px;
}

.skill-list {
  display: grid;
  gap: 6px;
  min-width: 220px;
}

.skill-item {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 10px;
  background: #fffcf7;
}

.skill-text {
  font-size: 13px;
}

.workload-col {
  min-width: 260px;
}

.action-btn {
  min-width: 136px;
}

.preview {
  margin-top: 6px;
}

.preview summary {
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 12px;
}

.md-preview {
  margin-top: 6px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 8px;
  background: #fff;
}

.md-preview :deep(h2),
.md-preview :deep(h3),
.md-preview :deep(h4) {
  margin: 0 0 6px;
}

.md-preview :deep(p),
.md-preview :deep(ul) {
  margin: 0 0 4px;
}
</style>
