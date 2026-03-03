<template>
  <section>
    <div class="page-head">
      <span class="page-icon models" aria-hidden="true" />
      <h1 class="page-title">Models</h1>
    </div>

    <div class="card">
      <div class="row">
        <input v-model="form.id" class="input" placeholder="id (e.g. model-premium-1)" />
        <input v-model="form.name" class="input" placeholder="name" />
      </div>
      <div class="row" style="margin-top: 10px">
        <input v-model="form.provider" class="input" placeholder="provider" />
        <input v-model="form.modelId" class="input" placeholder="modelId" />
      </div>
      <div class="row" style="margin-top: 10px">
        <select v-model="form.tier" class="select">
          <option>PREMIUM</option>
          <option>BALANCED</option>
          <option>ECONOMY</option>
        </select>
        <button class="button primary" @click="create">Create Model</button>
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Tier</th>
            <th>Health</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in models" :key="m.id">
            <td>{{ m.id }}</td>
            <td>{{ m.name }}</td>
            <td>{{ m.tier }}</td>
            <td>{{ m.healthStatus }}</td>
            <td>{{ m.status }}</td>
            <td>
              <button class="button" style="max-width: 120px; margin-right: 6px" @click="healthCheck(m.id)">
                Health
              </button>
              <button class="button" style="max-width: 120px" @click="publish(m.id)">Publish</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { apiGet, apiPost } from "../lib/api";

type Model = {
  id: string;
  name: string;
  tier: string;
  healthStatus: string;
  status: string;
};

const models = ref<Model[]>([]);
const form = reactive({
  id: "",
  name: "",
  provider: "OpenAI",
  modelId: "",
  tier: "BALANCED",
});

const load = async () => {
  models.value = await apiGet<Model[]>("/models");
};

const create = async () => {
  await apiPost("/models", form);
  await load();
};

const healthCheck = async (id: string) => {
  await apiPost(`/models/${id}/health-check`, {});
  await load();
};

const publish = async (id: string) => {
  await apiPost(`/models/${id}/publish`, {});
  await load();
};

onMounted(load);
</script>
