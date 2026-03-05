<template>
  <section>
    <h1 class="page-title">{{ t("mcps.title") }}</h1>
    <p class="muted page-subtitle">{{ t("mcps.subtitle") }}</p>

    <div class="card">
      <div class="section-head">
        <h3 class="section-title">{{ t("mcps.registry") }}</h3>
        <button class="button primary" @click="openCreateModal">{{ t("mcps.new") }}</button>
      </div>

      <div class="filters-bar">
        <div class="filter-field">
          <label for="mcp-filter-status">{{ t("common.status") }}</label>
          <select id="mcp-filter-status" v-model="selectedStatus" class="select">
            <option v-for="status in STATUS_OPTIONS" :key="status" :value="status">{{ status }}</option>
          </select>
        </div>
        <div class="filter-field">
          <label for="mcp-filter-tag">{{ t("common.tag") }}</label>
          <input id="mcp-filter-tag" v-model="tagFilter" class="input" placeholder="tooling" />
        </div>
        <div class="filter-field search-field">
          <label for="mcp-search">{{ t("common.search") }}</label>
          <input id="mcp-search" v-model="searchKeyword" class="input" placeholder="id / name / endpoint / tag" />
        </div>
        <div class="filter-actions">
          <span class="muted">{{ t("common.filtering") }}</span>
          <button class="button" @click="resetFilters">{{ t("common.reset") }}</button>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>{{ t("skills.avatar") }}</th>
            <th>{{ t("common.id") }}</th>
            <th>{{ t("common.name") }}</th>
            <th>{{ t("mcps.transport") }}</th>
            <th>{{ t("mcps.endpoint") }}</th>
            <th>{{ t("common.status") }}</th>
            <th>{{ t("common.tags") }}</th>
            <th>{{ t("mcps.definition") }}</th>
            <th>{{ t("common.action") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in pagedMcps" :key="m.id">
            <td><img :src="extractAvatar(m) || defaultMcpAvatar" alt="mcp avatar" class="mcp-avatar-mini" /></td>
            <td><code>{{ m.id }}</code></td>
            <td>{{ m.name }}</td>
            <td>{{ m.transport }}</td>
            <td class="endpoint-cell">{{ m.endpoint }}</td>
            <td><span class="status-chip" :class="statusClass(m.status)">{{ m.status }}</span></td>
            <td>{{ m.tags.join(", ") || "-" }}</td>
            <td>{{ summarizeDoc(extractDefinitionMarkdown(m)) }}</td>
            <td>
              <button class="button" style="margin-right: 6px" @click="openEditModal(m)">{{ t("common.edit") }}</button>
              <button v-if="m.status === 'DRAFT'" class="button" style="margin-right: 6px" @click="publishMcp(m.id)">{{ t("common.publish") }}</button>
              <button v-if="m.status === 'ACTIVE'" class="button" style="margin-right: 6px" @click="deprecateMcp(m.id)">{{ t("common.deprecate") }}</button>
              <button class="button" @click="copyEndpoint(m.endpoint)">{{ t("mcps.copyEndpoint") }}</button>
            </td>
          </tr>
          <tr v-if="filteredMcps.length === 0">
            <td colspan="9" class="muted">{{ t("mcps.noFound") }}</td>
          </tr>
        </tbody>
      </table>
      <PaginationBar
        :total="filteredMcps.length"
        :page="currentPage"
        :page-size="pageSize"
        :locale="locale"
        @update:page="currentPage = $event"
        @update:page-size="pageSize = $event"
      />
      <p v-if="copyMessage" class="muted">{{ copyMessage }}</p>
      <p v-if="tableError" class="error-text">{{ tableError }}</p>
    </div>

    <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
      <div class="modal-panel fancy-modal">
        <div class="create-layout">
          <aside class="template-side">
            <h3 class="builder-title">{{ t("mcps.builder") }}</h3>
            <p class="muted builder-note">{{ t("mcps.builderNote") }}</p>

            <div class="avatar-card">
              <img :src="avatarData || defaultMcpAvatar" alt="mcp avatar" class="mcp-avatar" />
              <input ref="avatarInputRef" type="file" class="hidden-input" accept="image/*" @change="handleAvatarFile" />
              <div class="avatar-actions">
                <button class="button" @click="pickAvatarFile">{{ locale === "zh-CN" ? "设置头像" : "Set Avatar" }}</button>
                <button class="button" @click="resetAvatar">{{ t("common.reset") }}</button>
              </div>
            </div>
            <h3 class="persona-name">{{ mcpPreviewName }}</h3>
            <p class="muted">{{ mcpPreviewTransport }}</p>

            <div class="builder-meter">
              <span class="muted">{{ t("mcps.docCompleteness") }}</span>
              <div class="meter-track">
                <div class="meter-fill" :style="{ width: `${mcpDocScore}%` }" />
              </div>
            </div>
            <div class="persona-badges">
              <span class="tag">{{ locale === "zh-CN" ? "标签" : "Tags" }}: {{ currentTagsCount }}</span>
              <span class="tag">{{ locale === "zh-CN" ? "就绪度" : "Ready" }}: {{ mcpDocScore }}%</span>
            </div>
          </aside>

          <div class="form-side">
            <h3 class="section-title">{{ editingMcpId ? `${t("common.edit")} MCP` : `${t("common.create")} MCP` }}</h3>
            <div class="row">
              <div>
                <label for="mcp-id">MCP ID</label>
                <input id="mcp-id" v-model="form.id" :disabled="Boolean(editingMcpId)" class="input" placeholder="mcp-jira" />
              </div>
              <div>
                <label for="mcp-name">{{ t("common.name") }}</label>
                <input id="mcp-name" v-model="form.name" class="input" placeholder="Jira MCP" />
              </div>
            </div>
            <div class="row">
              <div>
                <label for="mcp-transport">{{ t("mcps.transport") }}</label>
                <select id="mcp-transport" v-model="form.transport" class="select">
                  <option value="HTTP">HTTP</option>
                  <option value="SSE">SSE</option>
                  <option value="STDIO">STDIO</option>
                </select>
              </div>
              <div>
                <template v-if="form.transport !== 'STDIO'">
                  <label for="mcp-endpoint">{{ t("mcps.endpoint") }}</label>
                  <input id="mcp-endpoint" v-model="form.endpoint" class="input" placeholder="https://mcp.example.com/jira" />
                </template>
                <template v-else>
                  <label for="mcp-command">{{ locale === "zh-CN" ? "本地命令" : "Local Command" }}</label>
                  <input id="mcp-command" v-model="form.command" class="input" placeholder="npx @modelcontextprotocol/server-filesystem" />
                </template>
              </div>
            </div>
            <div class="row">
              <div>
                <label for="mcp-timeout">{{ locale === "zh-CN" ? "超时(ms)" : "Timeout (ms)" }}</label>
                <input id="mcp-timeout" v-model.number="form.timeoutMs" type="number" min="500" max="120000" class="input" />
              </div>
              <div>
                <label for="mcp-args">{{ locale === "zh-CN" ? "命令参数 CSV" : "Command Args CSV" }}</label>
                <input id="mcp-args" v-model="form.argsText" class="input" :disabled="form.transport !== 'STDIO'" placeholder="--path,/workspace,--readonly" />
              </div>
            </div>
            <div v-if="form.transport !== 'STDIO'" class="headers-switch">
              <label class="switch-label">
                <input v-model="form.useHeaders" type="checkbox" />
                {{ locale === "zh-CN" ? "启用请求头 JSON" : "Enable headers JSON" }}
              </label>
            </div>
            <div v-if="form.transport !== 'STDIO' && form.useHeaders">
              <label for="mcp-headers">{{ locale === "zh-CN" ? "请求头 JSON（HTTP/SSE）" : "Headers JSON (HTTP/SSE)" }}</label>
              <textarea id="mcp-headers" v-model="form.headersText" class="input" rows="3" placeholder='{"Authorization":"Bearer ${TOKEN}"}' />
            </div>
            <div>
              <label for="mcp-tags">{{ locale === "zh-CN" ? "标签 CSV" : "Tags CSV" }}</label>
              <input id="mcp-tags" v-model="form.tagsText" class="input" placeholder="dev,tooling" />
            </div>

            <div class="docs-card">
              <div class="doc-row">
                <div>
                  <strong>{{ locale === "zh-CN" ? "最终配置 JSON（实时预览）" : "Final Config JSON (Live Preview)" }}</strong>
                  <p class="muted">
                    {{
                      locale === "zh-CN"
                        ? "按 MCP Server 协议结构实时展示。"
                        : "Live preview in MCP server protocol style."
                    }}
                  </p>
                </div>
                <div class="doc-actions">
                  <button class="button" @click="copyConfigPreview">{{ locale === "zh-CN" ? "复制 JSON" : "Copy JSON" }}</button>
                </div>
              </div>
              <pre class="json-preview">{{ configPreviewText }}</pre>
            </div>

            <p v-if="createError" class="error-text">{{ createError }}</p>
            <div class="modal-actions">
              <button class="button" @click="closeModal">{{ t("common.cancel") }}</button>
              <button class="button primary" @click="submitMcp">{{ editingMcpId ? `${t("common.save")} MCP` : `${t("common.create")} MCP` }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { apiGet, apiPatch, apiPost } from "../lib/api";
import PaginationBar from "../components/PaginationBar.vue";
import { useI18n } from "../lib/i18n";
import { useAuth } from "../lib/auth";
import { pushToast } from "../lib/toast";

type Mcp = {
  id: string;
  name: string;
  transport: string;
  endpoint: string;
  status: string;
  tags: string[];
  definition?: Record<string, unknown> | null;
  createdBy: string;
};

const mcps = ref<Mcp[]>([]);
const { t, locale } = useI18n();
const { user, isLoggedIn } = useAuth();
const tableError = ref("");
const copyMessage = ref("");
const createError = ref("");
const modalOpen = ref(false);
const editingMcpId = ref("");
const selectedStatus = ref("ALL");
const tagFilter = ref("");
const searchKeyword = ref("");
const loadTimer = ref<number | null>(null);
const avatarData = ref("");
const avatarInputRef = ref<HTMLInputElement | null>(null);
const currentPage = ref(1);
const pageSize = ref(10);

const STATUS_OPTIONS = ["ALL", "DRAFT", "ACTIVE", "DEPRECATED", "ARCHIVED"] as const;

const form = reactive({
  id: "",
  name: "",
  transport: "HTTP",
  endpoint: "",
  command: "",
  argsText: "",
  useHeaders: false,
  headersText: "",
  timeoutMs: 30000,
  tagsText: "",
});

const defaultMcpAvatar =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
      <rect width='120' height='120' fill='white'/>
      <path d='M22 36 h76 l-10 48 h-56 z' fill='white' stroke='black' stroke-width='3'/>
      <rect x='46' y='16' width='28' height='18' rx='5' fill='white' stroke='black' stroke-width='3'/>
      <circle cx='60' cy='64' r='12' fill='none' stroke='black' stroke-width='3'/>
      <path d='M20 28 h80 M20 102 h80' stroke='black' stroke-width='2' stroke-dasharray='4 4'/>
      <path d='M60 52 v24 M48 64 h24' stroke='black' stroke-width='3' stroke-linecap='round'/>
    </svg>`,
  );

const currentTagsCount = computed(() =>
  form.tagsText
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean).length,
);
const canManageMcp = (mcp: Mcp) => isLoggedIn.value && mcp.createdBy === user.value?.id;
const statusClass = (value: string) => `status-${value.toLowerCase()}`;
const mcpPreviewName = computed(() => form.name.trim() || "Unnamed MCP");
const mcpPreviewTransport = computed(() => `${form.transport || "HTTP"} transport`);
const mcpDocScore = computed(() => {
  const readyId = form.id.trim().length > 0;
  const readyName = form.name.trim().length > 0;
  const readyRuntime = form.transport === "STDIO" ? form.command.trim().length > 0 : form.endpoint.trim().length > 0;
  const readyHeaders = form.transport === "STDIO" ? true : !form.useHeaders || !parseHeadersText(form.headersText).error;
  const score = [readyId, readyName, readyRuntime, readyHeaders].filter(Boolean).length;
  return Math.round((score / 4) * 100);
});

const parseCsv = (value: string) =>
  value
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const parseHeadersText = (raw: string): { value: Record<string, string>; error: string } => {
  if (!raw.trim()) return { value: {}, error: "" };
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const filtered = Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "string")) as Record<string, string>;
    return { value: filtered, error: "" };
  } catch {
    return { value: {}, error: locale.value === "zh-CN" ? "Headers JSON 解析失败" : "Invalid headers JSON" };
  }
};

const configPreviewText = computed(() => {
  const args = parseCsv(form.argsText);
  const headersResult = parseHeadersText(form.headersText);
  const useHeaders = form.transport !== "STDIO" && form.useHeaders;
  const serverId = form.id.trim() || "<mcp-server-id>";
  const serverConfig: Record<string, unknown> =
    form.transport === "HTTP"
      ? { type: "streamable-http", url: form.endpoint || "", timeoutMs: form.timeoutMs }
      : form.transport === "SSE"
        ? { type: "sse", url: form.endpoint || "", timeoutMs: form.timeoutMs }
        : { type: "stdio", command: form.command || "", args, timeoutMs: form.timeoutMs };
  if (useHeaders && Object.keys(headersResult.value).length > 0) {
    serverConfig.headers = headersResult.value;
  }
  return JSON.stringify(
    {
      mcpServers: {
        [serverId]: serverConfig,
      },
      ...(headersResult.error ? { _warning: headersResult.error } : {}),
    },
    null,
    2,
  );
});

const filteredMcps = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) return mcps.value;
  return mcps.value.filter((m) => {
    const haystack = [m.id, m.name, m.transport, m.endpoint, m.status, ...m.tags].join(" ").toLowerCase();
    return haystack.includes(keyword);
  });
});
const totalPages = computed(() => Math.max(1, Math.ceil(filteredMcps.value.length / pageSize.value)));
const pagedMcps = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredMcps.value.slice(start, start + pageSize.value);
});

const extractDefinitionMarkdown = (mcp: Mcp) => {
  const raw = mcp.definition && typeof mcp.definition === "object" ? (mcp.definition as Record<string, unknown>).markdown : "";
  return typeof raw === "string" ? raw : "";
};

const extractAvatar = (mcp: Mcp) => {
  const raw = mcp.definition && typeof mcp.definition === "object" ? (mcp.definition as Record<string, unknown>).avatar : "";
  return typeof raw === "string" ? raw : "";
};

const extractConfig = (mcp: Mcp) => {
  const raw = mcp.definition && typeof mcp.definition === "object" ? (mcp.definition as Record<string, unknown>).config : null;
  if (!raw || typeof raw !== "object") {
    return {
      command: "",
      argsText: "",
      headersText: "",
      timeoutMs: 30000,
    };
  }
  const cfg = raw as Record<string, unknown>;
  const args = Array.isArray(cfg.args) ? cfg.args.filter((x): x is string => typeof x === "string") : [];
  const headers = cfg.headers && typeof cfg.headers === "object" ? (cfg.headers as Record<string, unknown>) : {};
  const safeHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") safeHeaders[key] = value;
  }
  return {
    command: typeof cfg.command === "string" ? cfg.command : "",
    argsText: args.join(","),
    headersText: Object.keys(safeHeaders).length > 0 ? JSON.stringify(safeHeaders, null, 2) : "",
    timeoutMs: typeof cfg.timeoutMs === "number" ? cfg.timeoutMs : 30000,
  };
};

const summarizeDoc = (doc: string) => {
  const flat = doc.replace(/\s+/g, " ").trim();
  if (!flat) return "Empty";
  return flat.length > 92 ? `${flat.slice(0, 92)}...` : flat;
};

const resetForm = () => {
  form.id = "";
  form.name = "";
  form.transport = "HTTP";
  form.endpoint = "";
  form.command = "";
  form.argsText = "";
  form.useHeaders = false;
  form.headersText = "";
  form.timeoutMs = 30000;
  form.tagsText = "";
  avatarData.value = "";
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

const load = async () => {
  tableError.value = "";
  const params = new URLSearchParams();
  if (selectedStatus.value !== "ALL") params.set("status", selectedStatus.value);
  if (tagFilter.value.trim()) params.set("tag", tagFilter.value.trim());
  const query = params.toString();
  mcps.value = await apiGet<Mcp[]>(query ? `/mcps?${query}` : "/mcps");
};

const resetFilters = async () => {
  selectedStatus.value = "ALL";
  tagFilter.value = "";
  searchKeyword.value = "";
  await load();
};

const openCreateModal = () => {
  createError.value = "";
  editingMcpId.value = "";
  resetForm();
  modalOpen.value = true;
};

const openEditModal = (mcp: Mcp) => {
  if (!canManageMcp(mcp)) {
    tableError.value = locale.value === "zh-CN" ? "仅创建者可编辑。" : "Only creator can edit.";
    pushToast(tableError.value, "warning");
    return;
  }
  createError.value = "";
  editingMcpId.value = mcp.id;
  form.id = mcp.id;
  form.name = mcp.name;
  form.transport = mcp.transport;
  form.endpoint = mcp.transport === "STDIO" ? "" : mcp.endpoint;
  const config = extractConfig(mcp);
  form.command = config.command;
  form.argsText = config.argsText;
  form.useHeaders = config.headersText.trim().length > 0;
  form.headersText = config.headersText;
  form.timeoutMs = config.timeoutMs;
  form.tagsText = mcp.tags.join(", ");
  avatarData.value = extractAvatar(mcp) || "";
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  editingMcpId.value = "";
  createError.value = "";
  resetForm();
};

const submitMcp = async () => {
  createError.value = "";
  if (!isLoggedIn.value) {
    createError.value = locale.value === "zh-CN" ? "请先登录再保存工具。" : "Please login before saving tool.";
    pushToast(createError.value, "warning");
    return;
  }
  try {
    const args = parseCsv(form.argsText);
    const headersResult = parseHeadersText(form.headersText);
    if (headersResult.error) {
      createError.value = headersResult.error;
      return;
    }
    const headers = form.transport !== "STDIO" && form.useHeaders ? headersResult.value : {};
    if ((form.transport === "HTTP" || form.transport === "SSE") && !form.endpoint.trim()) {
      createError.value = locale.value === "zh-CN" ? "HTTP/SSE 必须填写 endpoint。" : "Endpoint is required for HTTP/SSE.";
      return;
    }
    if (form.transport === "STDIO" && !form.command.trim()) {
      createError.value = locale.value === "zh-CN" ? "STDIO 必须填写本地命令。" : "Command is required for STDIO.";
      return;
    }
    const tags = form.tagsText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (!editingMcpId.value) {
      await apiPost("/mcps", {
        id: form.id,
        name: form.name,
        transport: form.transport,
        endpoint: form.transport === "STDIO" ? undefined : form.endpoint,
        command: form.transport === "STDIO" ? form.command : undefined,
        args,
        headers: form.transport !== "STDIO" && form.useHeaders ? headers : undefined,
        timeoutMs: form.timeoutMs,
        tags,
        avatar: avatarData.value || undefined,
      });
    } else {
      await apiPatch(`/mcps/${editingMcpId.value}`, {
        name: form.name,
        transport: form.transport,
        endpoint: form.transport === "STDIO" ? undefined : form.endpoint,
        command: form.transport === "STDIO" ? form.command : undefined,
        args,
        headers: form.transport !== "STDIO" && form.useHeaders ? headers : undefined,
        timeoutMs: form.timeoutMs,
        tags,
        avatar: avatarData.value || "",
      });
    }

    resetForm();
    editingMcpId.value = "";
    modalOpen.value = false;
    pushToast(locale.value === "zh-CN" ? "工具已保存" : "Tool saved", "success");
    await load();
  } catch (e) {
    createError.value = String(e);
    pushToast(createError.value, "error");
  }
};

watch(
  () => form.transport,
  (next) => {
    if (next === "STDIO") {
      form.endpoint = "";
      form.useHeaders = false;
      form.headersText = "";
    } else {
      form.command = "";
      form.argsText = "";
    }
  },
);

watch(
  () => form.useHeaders,
  (enabled) => {
    if (!enabled) form.headersText = "";
  },
);

const publishMcp = async (id: string) => {
  tableError.value = "";
  const mcp = mcps.value.find((item) => item.id === id);
  if (!mcp || !canManageMcp(mcp)) {
    tableError.value = locale.value === "zh-CN" ? "仅创建者可操作。" : "Only creator can operate.";
    pushToast(tableError.value, "warning");
    return;
  }
  try {
    await apiPost(`/mcps/${id}/publish`, {});
    pushToast(locale.value === "zh-CN" ? "工具已发布" : "Tool published", "success");
    await load();
  } catch (e) {
    tableError.value = String(e);
    pushToast(tableError.value, "error");
  }
};

const deprecateMcp = async (id: string) => {
  tableError.value = "";
  const mcp = mcps.value.find((item) => item.id === id);
  if (!mcp || !canManageMcp(mcp)) {
    tableError.value = locale.value === "zh-CN" ? "仅创建者可操作。" : "Only creator can operate.";
    pushToast(tableError.value, "warning");
    return;
  }
  try {
    await apiPost(`/mcps/${id}/deprecate`, {});
    pushToast(locale.value === "zh-CN" ? "工具已弃用" : "Tool deprecated", "success");
    await load();
  } catch (e) {
    tableError.value = String(e);
    pushToast(tableError.value, "error");
  }
};

const copyEndpoint = async (endpoint: string) => {
  copyMessage.value = "";
  tableError.value = "";
  if (!endpoint) {
    tableError.value = "Endpoint is empty.";
    return;
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(endpoint);
    } else {
      const input = document.createElement("textarea");
      input.value = endpoint;
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.focus();
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    copyMessage.value = `Copied: ${endpoint}`;
  } catch (e) {
    tableError.value = `Copy failed: ${String(e)}`;
  }
};

const copyConfigPreview = async () => {
  try {
    await navigator.clipboard.writeText(configPreviewText.value);
    copyMessage.value = locale.value === "zh-CN" ? "已复制配置 JSON" : "Config JSON copied";
  } catch (error) {
    tableError.value = String(error);
  }
};

watch([selectedStatus, tagFilter], () => {
  currentPage.value = 1;
  if (loadTimer.value !== null) window.clearTimeout(loadTimer.value);
  loadTimer.value = window.setTimeout(() => {
    void load();
  }, 300);
});

watch(searchKeyword, () => {
  currentPage.value = 1;
});

watch(totalPages, (next) => {
  if (currentPage.value > next) currentPage.value = next;
});

onBeforeUnmount(() => {
  if (loadTimer.value !== null) window.clearTimeout(loadTimer.value);
});

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
  grid-template-columns: 180px 1fr 1.5fr auto;
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

.endpoint-cell {
  max-width: 360px;
  word-break: break-all;
}

.mcp-avatar-mini {
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

.mcp-avatar {
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

.json-preview {
  margin: 8px 0 0;
  border: 1px solid #ece7dd;
  border-radius: 8px;
  padding: 10px;
  background: #faf9f6;
  max-height: 220px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
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
