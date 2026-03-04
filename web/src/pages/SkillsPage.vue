<template>
  <section>
    <h1 class="page-title">{{ t("skills.title") }}</h1>
    <p class="muted page-subtitle">{{ t("skills.subtitle") }}</p>

    <div class="card">
      <div class="section-head">
        <h3 class="section-title">{{ t("skills.registry") }}</h3>
        <button class="button primary" @click="openCreateModal">{{ t("skills.new") }}</button>
      </div>

      <div class="filters-bar">
        <div class="filter-field">
          <label for="skill-status">{{ t("common.status") }}</label>
          <select id="skill-status" v-model="filters.status" class="select">
            <option value="">{{ t("common.all") }}</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DEPRECATED">DEPRECATED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div class="filter-field">
          <label for="skill-tag">{{ t("common.tag") }}</label>
          <input id="skill-tag" v-model="filters.tag" class="input" placeholder="backend" />
        </div>
        <div class="filter-field search-field">
          <label for="skill-search">{{ t("common.search") }}</label>
          <input id="skill-search" v-model="searchKeyword" class="input" placeholder="id / name / version / tags" />
        </div>
        <div class="filter-actions">
          <button class="button" @click="load">{{ t("common.apply") }}</button>
          <button class="button" @click="resetFilters">{{ t("common.reset") }}</button>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>{{ t("skills.avatar") }}</th>
            <th>{{ t("common.id") }}</th>
            <th>{{ t("common.name") }}</th>
            <th>{{ t("skills.version") }}</th>
            <th>{{ t("common.status") }}</th>
            <th>{{ t("common.tags") }}</th>
            <th>{{ t("mcps.definition") }}</th>
            <th>{{ t("common.updated") }}</th>
            <th>{{ t("common.action") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in pagedSkills" :key="s.id">
            <td>
              <img :src="extractAvatar(s) || defaultAvatar" alt="skill avatar" class="skill-avatar-mini" />
            </td>
            <td><code>{{ s.id }}</code></td>
            <td>{{ s.name }}</td>
            <td>{{ s.version }}</td>
            <td><span class="tag">{{ s.status }}</span></td>
            <td>{{ s.tags.join(", ") || "-" }}</td>
            <td>{{ summarizeDoc(extractDefinitionMarkdown(s)) }}</td>
            <td>{{ formatDateTime(s.updatedAt) }}</td>
            <td>
              <button class="button" style="margin-right: 6px" @click="openEditModal(s)">{{ t("common.edit") }}</button>
              <button v-if="s.status === 'DRAFT'" class="button" style="margin-right: 6px" @click="publish(s.id)">{{ t("common.publish") }}</button>
              <button v-if="s.status === 'ACTIVE'" class="button" @click="deprecate(s.id)">{{ t("common.deprecate") }}</button>
              <span v-if="s.status !== 'DRAFT' && s.status !== 'ACTIVE'" class="muted">-</span>
            </td>
          </tr>
          <tr v-if="filteredSkills.length === 0">
            <td colspan="9" class="muted">{{ t("skills.noFound") }}</td>
          </tr>
        </tbody>
      </table>
      <PaginationBar
        :total="filteredSkills.length"
        :page="currentPage"
        :page-size="pageSize"
        :locale="locale"
        @update:page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
      <p v-if="tableError" class="error-text">{{ tableError }}</p>
    </div>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-panel fancy-modal">
        <div class="create-layout">
          <aside class="template-side">
            <h3>{{ locale === "zh-CN" ? "Skill Create" : "Skill Create" }}</h3>
            <p class="muted">{{ locale === "zh-CN" ? "为技能卡片定义清晰的能力身份。" : "Craft this skill card with a clear capability identity." }}</p>

            <div class="avatar-card">
              <img :src="avatarData || defaultAvatar" alt="skill avatar" class="skill-avatar" />
              <div class="avatar-actions">
                <input ref="avatarInputRef" type="file" class="hidden-input" accept="image/*" @change="handleAvatarFile" />
                <button class="button" @click="pickAvatarFile">{{ locale === "zh-CN" ? "设置头像" : "Set Avatar" }}</button>
                <button class="button" @click="resetAvatar">{{ t("common.reset") }}</button>
              </div>
            </div>

            <div class="template-list">
              <button class="button" @click="applyTemplate('universal')">{{ locale === "zh-CN" ? "通用" : "Universal" }}</button>
              <button class="button" @click="applyTemplate('backend')">{{ locale === "zh-CN" ? "后端" : "Backend" }}</button>
              <button class="button" @click="applyTemplate('research')">{{ locale === "zh-CN" ? "研究" : "Research" }}</button>
            </div>

            <div class="persona-badges">
              <span class="tag">{{ locale === "zh-CN" ? "标签" : "Tags" }}: {{ currentTagsCount }}</span>
              <span class="tag">{{ locale === "zh-CN" ? "字符" : "Chars" }}: {{ definitionMarkdown.length }}</span>
            </div>
          </aside>

          <div class="form-side">
            <h3 class="section-title">{{ editingSkillId ? `${t("common.edit")} ${t("skills.title")}` : `${t("common.create")} ${t("skills.title")}` }}</h3>
            <div class="row">
              <div>
                <label for="skill-id">Skill ID</label>
                <input id="skill-id" v-model="form.id" class="input" :disabled="Boolean(editingSkillId)" placeholder="skill-backend-api-v1" />
              </div>
              <div>
                <label for="skill-name">Name</label>
                <input id="skill-name" v-model="form.name" class="input" placeholder="Backend API Builder" />
              </div>
            </div>
            <div class="row">
              <div>
                <label for="skill-version">Version</label>
                <input id="skill-version" v-model="form.version" class="input" placeholder="1.0.0" />
              </div>
              <div>
                <label for="skill-tags">{{ locale === "zh-CN" ? "标签 CSV" : "Tags CSV" }}</label>
                <input id="skill-tags" v-model="form.tagsText" class="input" placeholder="backend,api,delivery" />
              </div>
            </div>

            <div class="docs-card">
              <label>{{ locale === "zh-CN" ? "SKILL.md（点击查看/编辑）" : "SKILL.md (click to view/edit)" }}</label>
              <div class="doc-row">
                <div>
                  <strong>{{ locale === "zh-CN" ? "定义 Markdown" : "Definition Markdown" }}</strong>
                  <p class="muted">{{ summarizeDoc(definitionMarkdown) }}</p>
                </div>
                <div class="doc-actions">
                  <button class="button" @click="openDocEditor('view')">{{ t("common.view") }}</button>
                  <button class="button" @click="openDocEditor('edit')">{{ t("common.edit") }}</button>
                </div>
              </div>
            </div>

            <p v-if="createError" class="error-text">{{ createError }}</p>
            <div class="modal-actions">
              <button class="button" @click="closeModal">{{ t("common.cancel") }}</button>
              <button class="button primary" @click="submitSkill">{{ editingSkillId ? `${t("common.save")} ${t("skills.title")}` : `${t("common.create")} ${t("skills.title")}` }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="docEditorOpen" class="modal-backdrop" @click.self="closeDocEditor">
      <div class="modal-panel">
        <h3 class="section-title">SKILL.md - {{ docEditorMode === "view" ? t("common.view") : t("common.edit") }}</h3>
        <MarkdownEditor
          v-model="docEditorContent"
          label="SKILL.md"
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
import { computed, onMounted, reactive, ref, watch } from "vue";
import { apiGet, apiPatch, apiPost } from "../lib/api";
import MarkdownEditor from "../components/MarkdownEditor.vue";
import PaginationBar from "../components/PaginationBar.vue";
import { useI18n } from "../lib/i18n";

type Skill = {
  id: string;
  name: string;
  version: string;
  status: string;
  tags: string[];
  definition?: Record<string, unknown> | null;
  updatedAt?: string;
};

const skills = ref<Skill[]>([]);
const { t, locale } = useI18n();
const createError = ref("");
const tableError = ref("");
const searchKeyword = ref("");

const modalOpen = ref(false);
const editingSkillId = ref("");
const definitionMarkdown = ref("# Skill\n## Purpose\n-\n\n## Inputs\n-\n\n## Workflow\n-\n\n## Outputs\n-\n\n## Done Criteria\n-");
const avatarData = ref("");
const avatarInputRef = ref<HTMLInputElement | null>(null);
const docEditorOpen = ref(false);
const docEditorMode = ref<"view" | "edit">("edit");
const docEditorContent = ref("");

const form = reactive({
  id: "",
  name: "",
  version: "1.0.0",
  tagsText: "",
});
const currentPage = ref(1);
const pageSize = ref(10);

const filters = reactive({
  status: "",
  tag: "",
});

const defaultAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
      <rect width='120' height='120' fill='white'/>
      <rect x='18' y='18' width='84' height='84' rx='16' fill='white' stroke='black' stroke-width='3'/>
      <path d='M38 60 h44 M60 38 v44' stroke='black' stroke-width='4' stroke-linecap='round'/>
      <circle cx='60' cy='60' r='18' fill='none' stroke='black' stroke-width='3'/>
      <path d='M20 24 h80 M20 96 h80' stroke='black' stroke-width='2' stroke-dasharray='4 4'/>
    </svg>`,
  );

const currentTagsCount = computed(() =>
  form.tagsText
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean).length,
);

const filteredSkills = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) return skills.value;
  return skills.value.filter((skill) => {
    const haystack = [skill.id, skill.name, skill.version, skill.status, ...skill.tags].join(" ").toLowerCase();
    return haystack.includes(keyword);
  });
});
const totalPages = computed(() => Math.max(1, Math.ceil(filteredSkills.value.length / pageSize.value)));
const pagedSkills = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredSkills.value.slice(start, start + pageSize.value);
});

const extractDefinitionMarkdown = (skill: Skill) => {
  const raw = skill.definition && typeof skill.definition === "object" ? (skill.definition as Record<string, unknown>).markdown : "";
  return typeof raw === "string" ? raw : "";
};

const extractAvatar = (skill: Skill) => {
  const raw = skill.definition && typeof skill.definition === "object" ? (skill.definition as Record<string, unknown>).avatar : "";
  return typeof raw === "string" ? raw : "";
};

const summarizeDoc = (doc: string) => {
  const flat = doc.replace(/\s+/g, " ").trim();
  if (!flat) return t("common.empty");
  return flat.length > 92 ? `${flat.slice(0, 92)}...` : flat;
};

const formatDateTime = (input?: string) => {
  if (!input) return "-";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const defaultTemplate = () => "# Skill\n## Purpose\n-\n\n## Inputs\n-\n\n## Workflow\n-\n\n## Outputs\n-\n\n## Done Criteria\n-";

const applyTemplate = (kind: "universal" | "backend" | "research") => {
  if (kind === "backend") {
    definitionMarkdown.value = "# Backend API Skill\n## Purpose\n- Deliver stable API endpoints\n\n## Inputs\n- API contract\n- Data model constraints\n\n## Workflow\n1. Draft endpoint contract\n2. Implement handlers and validation\n3. Add test cases\n\n## Outputs\n- API handlers\n- Test report\n\n## Done Criteria\n- Test pass rate >= 95%";
    return;
  }
  if (kind === "research") {
    definitionMarkdown.value = "# Research Skill\n## Purpose\n- Collect and synthesize insights\n\n## Inputs\n- Research question\n- Source scope\n\n## Workflow\n1. Gather references\n2. Compare findings\n3. Summarize recommendations\n\n## Outputs\n- Findings summary\n- Risk notes\n\n## Done Criteria\n- Sources are cited and conclusions are actionable";
    return;
  }
  definitionMarkdown.value = defaultTemplate();
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
    if (typeof reader.result === "string") avatarData.value = reader.result;
  };
  reader.readAsDataURL(file);
  input.value = "";
};

const resetAvatar = () => {
  avatarData.value = "";
};

const resetForm = () => {
  form.id = "";
  form.name = "";
  form.version = "1.0.0";
  form.tagsText = "";
  definitionMarkdown.value = defaultTemplate();
  avatarData.value = "";
};

const load = async () => {
  tableError.value = "";
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  if (filters.tag) query.set("tag", filters.tag);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  try {
    skills.value = await apiGet<Skill[]>(`/skills${suffix}`);
  } catch (e) {
    tableError.value = String(e);
  }
};

const resetFilters = async () => {
  filters.status = "";
  filters.tag = "";
  searchKeyword.value = "";
  await load();
};

watch([searchKeyword, () => filters.status, () => filters.tag], () => {
  currentPage.value = 1;
});

watch(totalPages, (next) => {
  if (currentPage.value > next) currentPage.value = next;
});

const openCreateModal = () => {
  createError.value = "";
  editingSkillId.value = "";
  resetForm();
  modalOpen.value = true;
};

const openEditModal = (skill: Skill) => {
  createError.value = "";
  editingSkillId.value = skill.id;
  form.id = skill.id;
  form.name = skill.name;
  form.version = skill.version;
  form.tagsText = skill.tags.join(", ");
  definitionMarkdown.value = extractDefinitionMarkdown(skill) || defaultTemplate();
  avatarData.value = extractAvatar(skill) || "";
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
};

const openDocEditor = (mode: "view" | "edit") => {
  docEditorMode.value = mode;
  docEditorContent.value = definitionMarkdown.value;
  docEditorOpen.value = true;
};

const closeDocEditor = () => {
  docEditorOpen.value = false;
};

const applyDocEditor = () => {
  definitionMarkdown.value = docEditorContent.value;
  docEditorOpen.value = false;
};

const submitSkill = async () => {
  createError.value = "";
  const tags = form.tagsText
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

  try {
    if (!editingSkillId.value) {
      await apiPost("/skills", {
        id: form.id,
        name: form.name,
        version: form.version,
        tags,
        definitionMarkdown: definitionMarkdown.value,
        avatar: avatarData.value || undefined,
      });
    } else {
      await apiPatch(`/skills/${editingSkillId.value}`, {
        name: form.name,
        version: form.version,
        tags,
        definitionMarkdown: definitionMarkdown.value,
        avatar: avatarData.value || "",
      });
    }
    modalOpen.value = false;
    editingSkillId.value = "";
    resetForm();
    await load();
  } catch (e) {
    createError.value = String(e);
  }
};

const publish = async (id: string) => {
  tableError.value = "";
  try {
    await apiPost(`/skills/${id}/publish`, {});
    await load();
  } catch (e) {
    tableError.value = String(e);
  }
};

const deprecate = async (id: string) => {
  tableError.value = "";
  try {
    await apiPost(`/skills/${id}/deprecate`, {});
    await load();
  } catch (e) {
    tableError.value = String(e);
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

.filters-bar {
  display: grid;
  grid-template-columns: 180px 1fr 1.4fr auto;
  gap: 10px;
  margin-bottom: 12px;
  align-items: end;
}

.search-field {
  min-width: 220px;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.skill-avatar-mini {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #1e1e1e;
  background: #fff;
  object-fit: cover;
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
  background: linear-gradient(180deg, #fefefe 0%, #ffffff 100%);
}

.create-layout {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 14px;
}

.template-side {
  border: 1px solid #222;
  border-radius: 12px;
  padding: 12px;
  background: repeating-linear-gradient(45deg, #fff, #fff 8px, #f7f7f7 8px, #f7f7f7 16px);
}

.template-side h3 {
  margin: 0 0 8px;
}

.avatar-card {
  margin: 10px 0;
  border: 1px dashed #333;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
  text-align: center;
}

.skill-avatar {
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

.template-list {
  display: grid;
  gap: 8px;
  margin: 10px 0;
}

.persona-badges {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.form-side {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
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

.modal-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

@media (max-width: 980px) {
  .filters-bar {
    grid-template-columns: 1fr;
  }

  .create-layout {
    grid-template-columns: 1fr;
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
