<template>
  <section>
    <h1 class="page-title">Skills</h1>
    <p class="muted">Create, publish and deprecate skill capabilities.</p>

    <div class="card">
      <div class="row">
        <input v-model="form.id" class="input" placeholder="id (e.g. skill-backend-api-v1)" />
        <input v-model="form.name" class="input" placeholder="name" />
      </div>
      <div class="row" style="margin-top: 10px">
        <input v-model="form.version" class="input" placeholder="version (e.g. 1.0.0)" />
        <input v-model="form.tagsText" class="input" placeholder="tags csv (e.g. backend,api)" />
      </div>
      <div style="margin-top: 10px">
        <textarea
          v-model="form.definitionMarkdown"
          class="input"
          rows="8"
          placeholder="# Skill Purpose&#10;- Scope: ...&#10;- Inputs: ...&#10;- Outputs: ..."
        />
      </div>
      <div class="card" style="margin-top: 10px; margin-bottom: 0">
        <label>Markdown Preview</label>
        <div class="md-preview" v-html="renderMarkdown(form.definitionMarkdown)" />
      </div>
      <div style="margin-top: 10px">
        <button class="button primary" @click="create">Create Skill</button>
      </div>
      <p v-if="createError" class="muted" style="color: #b00020; margin-top: 8px">{{ createError }}</p>
    </div>

    <div class="card">
      <div class="row" style="align-items: end">
        <div>
          <label>Status</label>
          <select v-model="filters.status" class="select">
            <option value="">ALL</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DEPRECATED">DEPRECATED</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
        <div>
          <label>Tag</label>
          <input v-model="filters.tag" class="input" placeholder="backend" />
        </div>
      </div>
      <div style="margin-top: 10px">
        <button class="button" @click="load">Apply Filters</button>
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Version</th>
            <th>Status</th>
            <th>Tags</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in skills" :key="s.id">
            <td>{{ s.id }}</td>
            <td>{{ s.name }}</td>
            <td>{{ s.version }}</td>
            <td>{{ s.status }}</td>
            <td>{{ (s.tags || []).join(", ") || "-" }}</td>
            <td>
              <button class="button" style="max-width: 120px; margin-right: 6px" @click="publish(s.id)">Publish</button>
              <button class="button" style="max-width: 120px" @click="deprecate(s.id)">Deprecate</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="tableError" class="muted" style="color: #b00020; margin-top: 8px">{{ tableError }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { apiGet, apiPost } from "../lib/api";

type Skill = {
  id: string;
  name: string;
  version: string;
  status: string;
  tags: string[];
};

const skills = ref<Skill[]>([]);
const createError = ref("");
const tableError = ref("");

const form = reactive({
  id: "",
  name: "",
  version: "1.0.0",
  tagsText: "",
  definitionMarkdown: "# Skill\n- Purpose:\n- Workflow:\n- Done criteria:",
});

const filters = reactive({
  status: "",
  tag: "",
});

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

const create = async () => {
  createError.value = "";
  try {
    const tags = form.tagsText
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    await apiPost("/skills", {
      id: form.id,
      name: form.name,
      version: form.version,
      tags,
      definitionMarkdown: form.definitionMarkdown,
    });
    await load();
  } catch (e) {
    createError.value = String(e);
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
.md-preview {
  min-height: 72px;
  border: 1px dashed var(--border);
  border-radius: 10px;
  padding: 10px;
  background: #fff;
}

.md-preview :deep(h2),
.md-preview :deep(h3),
.md-preview :deep(h4) {
  margin: 0 0 8px;
}

.md-preview :deep(p),
.md-preview :deep(ul) {
  margin: 0 0 6px;
}
</style>
