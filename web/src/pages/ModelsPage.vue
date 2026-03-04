<template>
  <section>
    <h1 class="page-title">{{ t("models.title") }}</h1>
    <p class="muted page-subtitle">{{ t("models.subtitle") }}</p>

    <div class="card">
      <div class="section-head">
        <h3 class="section-title">{{ t("models.registry") }}</h3>
        <button class="button primary" @click="openCreateModal">{{ t("models.new") }}</button>
      </div>

      <div class="filters-bar">
        <div class="filter-field">
          <label for="model-filter-status">{{ t("common.status") }}</label>
          <select id="model-filter-status" v-model="filters.status" class="select">
            <option value="ALL">{{ t("common.all") }}</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DEPRECATED">DEPRECATED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div class="filter-field">
          <label for="model-filter-health">{{ t("models.health") }}</label>
          <select id="model-filter-health" v-model="filters.health" class="select">
            <option value="ALL">{{ t("common.all") }}</option>
            <option value="HEALTHY">HEALTHY</option>
            <option value="DEGRADED">DEGRADED</option>
            <option value="UNHEALTHY">UNHEALTHY</option>
            <option value="UNKNOWN">UNKNOWN</option>
          </select>
        </div>
        <div class="filter-field">
          <label for="model-filter-tier">{{ t("models.tier") }}</label>
          <select id="model-filter-tier" v-model="filters.tier" class="select">
            <option value="ALL">{{ t("common.all") }}</option>
            <option value="PREMIUM">PREMIUM</option>
            <option value="BALANCED">BALANCED</option>
            <option value="ECONOMY">ECONOMY</option>
          </select>
        </div>
        <div class="filter-field search-field">
          <label for="model-search">{{ t("common.search") }}</label>
          <input id="model-search" v-model="searchKeyword" class="input" placeholder="id / name / provider / modelId" />
        </div>
        <div class="filter-actions">
          <button class="button" @click="resetFilters">{{ t("common.reset") }}</button>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>{{ t("models.type") }}</th>
            <th>{{ t("common.id") }}</th>
            <th>{{ t("common.name") }}</th>
            <th>{{ t("models.provider") }}</th>
            <th>{{ t("models.modelId") }}</th>
            <th>{{ t("models.tier") }}</th>
            <th>{{ t("models.health") }}</th>
            <th>{{ t("common.status") }}</th>
            <th>{{ t("common.updated") }}</th>
            <th>{{ t("common.action") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in pagedModels" :key="m.id">
            <td><img :src="getTierAvatar(m.tier)" alt="model icon" class="model-avatar-mini" /></td>
            <td><code>{{ m.id }}</code></td>
            <td>{{ m.name }}</td>
            <td>{{ m.provider }}</td>
            <td class="modelid-cell">{{ m.modelId }}</td>
            <td><span class="tag">{{ m.tier }}</span></td>
            <td><span :class="healthClass(m.healthStatus)">{{ m.healthStatus }}</span></td>
            <td><span class="tag">{{ m.status }}</span></td>
            <td>{{ formatDateTime(m.updatedAt) }}</td>
            <td>
              <button class="button" style="margin-right: 6px" @click="healthCheck(m.id)">{{ t("models.health") }}</button>
              <button
                class="button"
                :disabled="m.status === 'ACTIVE'"
                @click="publish(m.id)"
              >
                {{ t("common.publish") }}
              </button>
            </td>
          </tr>
          <tr v-if="filteredModels.length === 0">
            <td colspan="10" class="muted">{{ t("models.noFound") }}</td>
          </tr>
        </tbody>
      </table>
      <PaginationBar
        :total="filteredModels.length"
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
            <h3 class="builder-title">{{ t("models.builder") }}</h3>
            <p class="muted builder-note">{{ t("models.builderNote") }}</p>

            <div class="avatar-card">
              <img :src="getTierAvatar(form.tier)" alt="model tier avatar" class="model-avatar" />
              <p class="muted">{{ locale === "zh-CN" ? "层级图标会自动更新。" : "Tier style updates automatically." }}</p>
            </div>
            <h3 class="persona-name">{{ modelPreviewName }}</h3>
            <p class="muted">{{ modelPreviewProvider }}</p>

            <div class="builder-meter">
              <span class="muted">{{ t("models.readiness") }}</span>
              <div class="meter-track">
                <div class="meter-fill" :style="{ width: `${modelReadiness}%` }" />
              </div>
            </div>

            <div class="template-list">
              <button class="button" @click="applyTemplate('openai')">{{ t("models.openai") }}</button>
              <button class="button" @click="applyTemplate('anthropic')">{{ t("models.anthropic") }}</button>
              <button class="button" @click="applyTemplate('google')">{{ t("models.google") }}</button>
              <button class="button" @click="applyTemplate('local')">{{ t("models.local") }}</button>
            </div>

            <div class="persona-badges">
              <span class="tag">{{ locale === "zh-CN" ? "提供方" : "Provider" }}: {{ form.provider || '-' }}</span>
              <span class="tag">{{ t("models.tier") }}: {{ form.tier }}</span>
            </div>
          </aside>

          <div class="form-side">
            <h3 class="section-title">{{ t("common.create") }} {{ t("models.title") }}</h3>
            <div class="row">
              <div>
                <label for="model-id">{{ t("models.modelId") }}</label>
                <input id="model-id" v-model="form.id" class="input" placeholder="model-openai-balanced" />
              </div>
              <div>
                <label for="model-name">{{ t("common.name") }}</label>
                <input id="model-name" v-model="form.name" class="input" placeholder="OpenAI Balanced" />
              </div>
            </div>
            <div class="row">
              <div>
                <label for="model-provider">{{ t("models.provider") }}</label>
                <input id="model-provider" v-model="form.provider" class="input" placeholder="OpenAI" />
              </div>
              <div>
                <label for="model-modelid">{{ t("models.modelId") }}</label>
                <input id="model-modelid" v-model="form.modelId" class="input" placeholder="gpt-5-mini" />
              </div>
            </div>
            <div class="row">
              <div>
                <label for="model-tier">{{ t("models.tier") }}</label>
                <select id="model-tier" v-model="form.tier" class="select">
                  <option value="PREMIUM">PREMIUM</option>
                  <option value="BALANCED">BALANCED</option>
                  <option value="ECONOMY">ECONOMY</option>
                </select>
              </div>
            </div>

            <p v-if="createError" class="error-text">{{ createError }}</p>
            <div class="modal-actions">
              <button class="button" @click="closeModal">{{ t("common.cancel") }}</button>
              <button class="button primary" @click="createModel">{{ t("common.create") }} {{ t("models.title") }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { apiGet, apiPost } from "../lib/api";
import PaginationBar from "../components/PaginationBar.vue";
import { useI18n } from "../lib/i18n";

type Model = {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  tier: "PREMIUM" | "BALANCED" | "ECONOMY";
  healthStatus: string;
  status: string;
  updatedAt?: string;
};

const models = ref<Model[]>([]);
const { t, locale } = useI18n();
const modalOpen = ref(false);
const createError = ref("");
const tableError = ref("");
const searchKeyword = ref("");
const currentPage = ref(1);
const pageSize = ref(10);

const filters = reactive({
  status: "ALL",
  health: "ALL",
  tier: "ALL",
});

const form = reactive({
  id: "",
  name: "",
  provider: "OpenAI",
  modelId: "",
  tier: "BALANCED" as "PREMIUM" | "BALANCED" | "ECONOMY",
});
const modelPreviewName = computed(() => form.name.trim() || "Unnamed Model");
const modelPreviewProvider = computed(() => `${form.provider || "Provider"} / ${form.tier}`);
const modelReadiness = computed(() => {
  let score = 16;
  if (form.id.trim()) score += 28;
  if (form.name.trim()) score += 28;
  if (form.provider.trim()) score += 16;
  if (form.modelId.trim()) score += 12;
  return Math.min(100, score);
});

const premiumAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
      <rect width='120' height='120' fill='white'/>
      <circle cx='60' cy='60' r='42' fill='white' stroke='black' stroke-width='3'/>
      <path d='M34 74 60 28 86 74z' fill='white' stroke='black' stroke-width='3'/>
      <path d='M60 38 67 54 84 56 71 68 75 86 60 77 45 86 49 68 36 56 53 54z' fill='white' stroke='black' stroke-width='2'/>
      <circle cx='47' cy='84' r='2' fill='black'/>
      <circle cx='73' cy='84' r='2' fill='black'/>
      <path d='M46 92 Q60 100 74 92' fill='none' stroke='black' stroke-width='2' stroke-linecap='round'/>
    </svg>`,
  );

const balancedAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
      <rect width='120' height='120' fill='white'/>
      <circle cx='60' cy='60' r='42' fill='white' stroke='black' stroke-width='3'/>
      <path d='M30 62 h60' stroke='black' stroke-width='3'/>
      <path d='M40 62 v24 h16 v-24 M64 62 v24 h16 v-24' fill='white' stroke='black' stroke-width='3'/>
      <path d='M60 30 v32' stroke='black' stroke-width='3'/>
      <circle cx='46' cy='86' r='2' fill='black'/>
      <circle cx='74' cy='86' r='2' fill='black'/>
      <path d='M48 94 h24' stroke='black' stroke-width='2' stroke-linecap='round'/>
    </svg>`,
  );

const economyAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
      <rect width='120' height='120' fill='white'/>
      <circle cx='60' cy='60' r='42' fill='white' stroke='black' stroke-width='3'/>
      <path d='M36 80 h48 v-8 H36z M44 68 h32 v-8 H44z M50 56 h20 v-8 H50z' fill='white' stroke='black' stroke-width='3'/>
      <path d='M30 92 h60' stroke='black' stroke-width='2' stroke-dasharray='4 4'/>
      <circle cx='48' cy='86' r='2' fill='black'/>
      <circle cx='72' cy='86' r='2' fill='black'/>
      <path d='M50 93 Q60 97 70 93' fill='none' stroke='black' stroke-width='2' stroke-linecap='round'/>
    </svg>`,
  );

const getTierAvatar = (tier: string) => {
  if (tier === "PREMIUM") return premiumAvatar;
  if (tier === "ECONOMY") return economyAvatar;
  return balancedAvatar;
};

const healthClass = (health: string) => {
  if (health === "HEALTHY") return "health healthy";
  if (health === "DEGRADED") return "health degraded";
  if (health === "UNHEALTHY") return "health unhealthy";
  return "health";
};

const filteredModels = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  return models.value.filter((model) => {
    if (filters.status !== "ALL" && model.status !== filters.status) return false;
    if (filters.health !== "ALL" && model.healthStatus !== filters.health) return false;
    if (filters.tier !== "ALL" && model.tier !== filters.tier) return false;
    if (!keyword) return true;
    const haystack = [model.id, model.name, model.provider, model.modelId, model.tier, model.status, model.healthStatus]
      .join(" ")
      .toLowerCase();
    return haystack.includes(keyword);
  });
});
const totalPages = computed(() => Math.max(1, Math.ceil(filteredModels.value.length / pageSize.value)));
const pagedModels = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredModels.value.slice(start, start + pageSize.value);
});

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const resetForm = () => {
  form.id = "";
  form.name = "";
  form.provider = "OpenAI";
  form.modelId = "";
  form.tier = "BALANCED";
};

const openCreateModal = () => {
  createError.value = "";
  resetForm();
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
};

const applyTemplate = (kind: "openai" | "anthropic" | "google" | "local") => {
  if (kind === "anthropic") {
    form.provider = "Anthropic";
    form.modelId = "claude-sonnet-4";
    form.tier = "PREMIUM";
    if (!form.name) form.name = "Anthropic Sonnet";
    return;
  }
  if (kind === "google") {
    form.provider = "Google";
    form.modelId = "gemini-2.0-flash";
    form.tier = "BALANCED";
    if (!form.name) form.name = "Gemini Flash";
    return;
  }
  if (kind === "local") {
    form.provider = "Local";
    form.modelId = "llama3.1:8b";
    form.tier = "ECONOMY";
    if (!form.name) form.name = "Local Llama";
    return;
  }
  form.provider = "OpenAI";
  form.modelId = "gpt-5-mini";
  form.tier = "BALANCED";
  if (!form.name) form.name = "OpenAI Balanced";
};

const resetFilters = () => {
  filters.status = "ALL";
  filters.health = "ALL";
  filters.tier = "ALL";
  searchKeyword.value = "";
};

watch([searchKeyword, () => filters.status, () => filters.health, () => filters.tier], () => {
  currentPage.value = 1;
});

watch(totalPages, (next) => {
  if (currentPage.value > next) currentPage.value = next;
});

const load = async () => {
  tableError.value = "";
  try {
    models.value = await apiGet<Model[]>("/models");
  } catch (error) {
    tableError.value = String(error);
  }
};

const createModel = async () => {
  createError.value = "";
  try {
    await apiPost("/models", {
      id: form.id,
      name: form.name,
      provider: form.provider,
      modelId: form.modelId,
      tier: form.tier,
    });
    closeModal();
    await load();
  } catch (error) {
    createError.value = String(error);
  }
};

const healthCheck = async (id: string) => {
  tableError.value = "";
  try {
    await apiPost(`/models/${id}/health-check`, {});
    await load();
  } catch (error) {
    tableError.value = String(error);
  }
};

const publish = async (id: string) => {
  tableError.value = "";
  try {
    await apiPost(`/models/${id}/publish`, {});
    await load();
  } catch (error) {
    tableError.value = String(error);
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
  grid-template-columns: 160px 160px 160px 1fr auto;
  gap: 10px;
  margin-bottom: 12px;
  align-items: end;
}

.filter-field {
  min-width: 0;
}

.search-field {
  min-width: 220px;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.model-avatar-mini {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 1px solid #1e1e1e;
  background: #fff;
}

.modelid-cell {
  max-width: 260px;
  word-break: break-all;
}

.health {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid #d4d4d4;
}

.health.healthy {
  border-color: #0f766e;
  color: #0f766e;
}

.health.degraded {
  border-color: #a16207;
  color: #a16207;
}

.health.unhealthy {
  border-color: #991b1b;
  color: #991b1b;
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
  width: min(1080px, 100%);
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

.template-side {
  border: 2px solid #222;
  border-radius: 12px;
  padding: 12px;
  background:
    radial-gradient(circle at 14px 14px, #101010 1px, transparent 1px) 0 0 / 12px 12px,
    repeating-linear-gradient(45deg, #fff, #fff 8px, #f7f7f7 8px, #f7f7f7 16px);
}

.builder-title {
  margin: 0;
  font-size: 18px;
}

.builder-note {
  margin: 4px 0 0;
}

.persona-name {
  margin: 8px 0 0;
  font-size: 18px;
}

.avatar-card {
  margin: 10px 0;
  border: 2px dashed #333;
  border-radius: 12px;
  padding: 10px;
  background: linear-gradient(180deg, #fff 0%, #fbfbfb 100%);
  text-align: center;
}

.model-avatar {
  width: 110px;
  height: 110px;
  border-radius: 50%;
  border: 2px solid #111;
  background: #fff;
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

.builder-meter {
  margin-top: 10px;
  border: 1px dashed #cfcfcf;
  border-radius: 10px;
  padding: 8px;
  background: #fff;
}

.meter-track {
  margin-top: 6px;
  width: 100%;
  height: 10px;
  border-radius: 999px;
  border: 1px solid #1e1e1e;
  background: #fff;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  background: repeating-linear-gradient(90deg, #111, #111 6px, #fff 6px, #fff 12px);
}

.form-side {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.modal-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.error-text {
  margin-top: 8px;
  color: #b42318;
  font-size: 13px;
}

@media (max-width: 1080px) {
  .filters-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .create-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .filters-bar {
    grid-template-columns: 1fr;
  }
}
</style>
