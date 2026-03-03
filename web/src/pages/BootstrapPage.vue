<template>
  <section>
    <h1 class="page-title">Project Bootstrap Wizard</h1>
    <p class="muted page-subtitle">Template-first bootstrap: phases, roles, instances and responsibilities.</p>

    <div class="card">
      <div class="stepper">
        <span v-for="n in 5" :key="n" :class="['step', { active: step === n }]">Step {{ n }}</span>
      </div>
    </div>

    <div class="card" v-if="step === 1">
      <h3>Step 1: Base Project Info</h3>
      <div class="row">
        <div>
          <label>Template ID</label>
          <input v-model="form.projectTemplateId" class="input" placeholder="project-template-id" />
        </div>
        <div>
          <label>Template Name</label>
          <input v-model="form.templateName" class="input" placeholder="Web Delivery Template" />
        </div>
      </div>
      <div class="row">
        <div>
          <label>Project Name</label>
          <input v-model="form.projectName" class="input" placeholder="AI code review platform" />
        </div>
        <div>
          <label>Start Date</label>
          <input v-model="form.startDate" class="input" placeholder="YYYY-MM-DD" />
        </div>
      </div>
      <div>
        <label>Objective</label>
        <textarea v-model="form.objective" class="input" rows="4" placeholder="MVP objective and delivery boundary" />
      </div>
    </div>

    <div class="card" v-if="step === 2">
      <h3>Step 2: Phase Template Design</h3>
      <p class="muted">Define stage + role + instances + responsibilities for each stage.</p>

      <div class="phase-list">
        <div class="phase-card" v-for="(phase, phaseIndex) in phases" :key="phase.id">
          <div class="phase-head">
            <h4>Phase {{ phaseIndex + 1 }}</h4>
            <button class="button tiny-btn" @click="removePhase(phase.id)">Remove Phase</button>
          </div>
          <div class="row">
            <div>
              <label>Phase ID</label>
              <input v-model="phase.id" class="input" placeholder="phase-requirement" />
            </div>
            <div>
              <label>Phase Name</label>
              <input v-model="phase.name" class="input" placeholder="Requirement / Development / QA / Release" />
            </div>
          </div>
          <div>
            <label>Phase Objective</label>
            <input v-model="phase.objective" class="input" placeholder="Objective for this phase" />
          </div>

          <div class="role-list">
            <div class="role-card" v-for="(role, roleIndex) in phase.roles" :key="`${phase.id}-${roleIndex}`">
              <div class="role-head">
                <h5>Role in Phase</h5>
                <button class="button tiny-btn" @click="removeRole(phase.id, roleIndex)">Remove Role</button>
              </div>
              <div class="row">
                <div>
                  <label>Role ID</label>
                  <input v-model="role.roleId" class="input" placeholder="role-backend" />
                </div>
                <div>
                  <label>Instance Count</label>
                  <input v-model.number="role.instances" type="number" min="1" class="input" />
                </div>
              </div>
              <div>
                <label>Responsibilities (one per line)</label>
                <textarea
                  v-model="role.responsibilitiesText"
                  class="input"
                  rows="4"
                  placeholder="Implement API contracts&#10;Own schema migration&#10;Support integration"
                />
              </div>
            </div>
            <button class="button primary tiny-btn" @click="addRole(phase.id)">Add Role to Phase</button>
          </div>
        </div>
      </div>
      <button class="button primary tiny-btn" @click="addPhase">Add Phase</button>
    </div>

    <div class="card" v-if="step === 3">
      <h3>Step 3: Role Instance Assignment</h3>
      <p class="muted">Each role requires exactly one PRIMARY. Assistants count follows required instances.</p>

      <div class="phase-list">
        <div class="phase-card" v-for="editor in roleEditors" :key="editor.roleId">
          <div class="phase-head">
            <h4>{{ editor.roleId }}</h4>
            <span class="tag">Required {{ editor.requiredInstances }}</span>
          </div>

          <div class="row">
            <div>
              <label>PRIMARY Agent</label>
              <select v-model="editor.primaryAgentId" class="select">
                <option disabled value="">Choose agent</option>
                <option v-for="a in agents" :key="a.id" :value="a.id">{{ a.name }} ({{ a.id }})</option>
              </select>
            </div>
            <div>
              <label>PRIMARY Model</label>
              <select v-model="editor.primaryModelId" class="select">
                <option disabled value="">Choose model</option>
                <option v-for="m in models" :key="m.id" :value="m.id">{{ m.id }} ({{ m.tier }})</option>
              </select>
            </div>
          </div>

          <div class="role-list">
            <div class="role-card" v-for="(assistant, idx) in editor.assistants" :key="`${editor.roleId}-${idx}`">
              <div class="row">
                <div>
                  <label>ASSISTANT {{ idx + 1 }} Agent</label>
                  <select v-model="assistant.agentId" class="select">
                    <option disabled value="">Choose agent</option>
                    <option v-for="a in agents" :key="a.id" :value="a.id">{{ a.name }} ({{ a.id }})</option>
                  </select>
                </div>
                <div>
                  <label>ASSISTANT {{ idx + 1 }} Model</label>
                  <select v-model="assistant.modelId" class="select">
                    <option disabled value="">Choose model</option>
                    <option v-for="m in models" :key="m.id" :value="m.id">{{ m.id }} ({{ m.tier }})</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card" v-if="step === 4">
      <h3>Step 4: Validate</h3>
      <button class="button primary" @click="runValidate">Run Validate</button>
      <pre class="json-result">{{ validateResult }}</pre>
    </div>

    <div class="card" v-if="step === 5">
      <h3>Step 5: Persist Role Agents (Demo)</h3>
      <div class="row">
        <div>
          <label>Project ID</label>
          <input v-model="projectId" class="input" placeholder="project-demo-1" />
        </div>
        <div class="save-cell">
          <button class="button primary" @click="saveAssignments">Save Role Agents</button>
        </div>
      </div>
      <pre class="json-result">{{ saveResult }}</pre>
    </div>

    <div class="card nav-actions">
      <button class="button" :disabled="step === 1" @click="step--">Back</button>
      <button class="button primary" :disabled="step === 5" @click="step++">Next</button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { apiGet, apiPost, apiPut } from "../lib/api";

type Agent = { id: string; name: string };
type Model = { id: string; tier: string };

type PhaseRole = {
  roleId: string;
  instances: number;
  responsibilitiesText: string;
};

type Phase = {
  id: string;
  name: string;
  objective: string;
  roles: PhaseRole[];
};

type RoleEditor = {
  roleId: string;
  requiredInstances: number;
  primaryAgentId: string;
  primaryModelId: string;
  assistants: Array<{ agentId: string; modelId: string }>;
};

const step = ref(1);
const projectId = ref("project-demo-1");
const validateResult = ref("No validation yet");
const saveResult = ref("Not saved");
const agents = ref<Agent[]>([]);
const models = ref<Model[]>([]);
const roleEditors = ref<RoleEditor[]>([]);

const form = reactive({
  projectTemplateId: "project-template-uuid",
  templateName: "web-project-template",
  projectName: "AI code review",
  startDate: "2026-03-10",
  objective: "MVP",
});

const phases = ref<Phase[]>([
  {
    id: "phase-requirement",
    name: "Requirement",
    objective: "Freeze scope and architecture baseline",
    roles: [
      {
        roleId: "role-backend",
        instances: 2,
        responsibilitiesText: "Design API contract\nReview schema boundary",
      },
    ],
  },
]);

const parsedTemplatePhases = computed(() =>
  phases.value.map((phase) => ({
    id: phase.id,
    name: phase.name,
    objective: phase.objective,
    roles: phase.roles.map((role) => ({
      roleId: role.roleId,
      instances: Math.max(1, Number(role.instances) || 1),
      responsibilities: role.responsibilitiesText
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
    })),
  })),
);

const roleRequirementMap = computed(() => {
  const map = new Map<string, number>();
  for (const phase of parsedTemplatePhases.value) {
    for (const role of phase.roles) {
      const prev = map.get(role.roleId) ?? 0;
      map.set(role.roleId, Math.max(prev, role.instances));
    }
  }
  return map;
});

const roleAgentAssignments = computed(() =>
  roleEditors.value.map((editor) => ({
    roleId: editor.roleId,
    agents: [
      {
        agentId: editor.primaryAgentId,
        assignmentRole: "PRIMARY",
        modelId: editor.primaryModelId,
        priority: 1,
      },
      ...editor.assistants.map((a, idx) => ({
        agentId: a.agentId,
        assignmentRole: "ASSISTANT",
        modelId: a.modelId,
        priority: (idx + 1) * 10,
      })),
    ],
  })),
);

const payload = computed(() => ({
  projectTemplateId: form.projectTemplateId,
  projectName: form.projectName,
  startDate: form.startDate,
  objective: form.objective,
  projectTemplate: {
    name: form.templateName,
    phases: parsedTemplatePhases.value,
  },
  roleAgentAssignments: roleAgentAssignments.value,
}));

const addPhase = () => {
  phases.value.push({
    id: `phase-${phases.value.length + 1}`,
    name: "",
    objective: "",
    roles: [
      {
        roleId: "",
        instances: 1,
        responsibilitiesText: "",
      },
    ],
  });
};

const removePhase = (phaseId: string) => {
  phases.value = phases.value.filter((p) => p.id !== phaseId);
};

const addRole = (phaseId: string) => {
  const phase = phases.value.find((x) => x.id === phaseId);
  if (!phase) return;
  phase.roles.push({
    roleId: "",
    instances: 1,
    responsibilitiesText: "",
  });
};

const removeRole = (phaseId: string, roleIndex: number) => {
  const phase = phases.value.find((x) => x.id === phaseId);
  if (!phase) return;
  phase.roles.splice(roleIndex, 1);
  if (phase.roles.length === 0) {
    phase.roles.push({
      roleId: "",
      instances: 1,
      responsibilitiesText: "",
    });
  }
};

const syncRoleEditors = () => {
  const requirements = roleRequirementMap.value;
  const existing = new Map(roleEditors.value.map((x) => [x.roleId, x]));
  const premium = models.value.find((m) => m.tier === "PREMIUM")?.id ?? "";
  const economy = models.value.find((m) => m.tier === "ECONOMY")?.id ?? premium;

  const next: RoleEditor[] = [];
  for (const [roleId, requiredInstances] of requirements.entries()) {
    if (!roleId) continue;
    const old = existing.get(roleId);
    const assistantCount = Math.max(requiredInstances - 1, 0);
    const assistants =
      old?.assistants.slice(0, assistantCount) ??
      Array.from({ length: assistantCount }, () => ({ agentId: "", modelId: economy }));
    while (assistants.length < assistantCount) {
      assistants.push({ agentId: "", modelId: economy });
    }
    next.push({
      roleId,
      requiredInstances,
      primaryAgentId: old?.primaryAgentId ?? "",
      primaryModelId: old?.primaryModelId ?? premium,
      assistants,
    });
  }
  roleEditors.value = next.sort((a, b) => a.roleId.localeCompare(b.roleId));
};

const load = async () => {
  agents.value = await apiGet<Agent[]>("/agents");
  models.value = await apiGet<Model[]>("/models");
  syncRoleEditors();
};

const runValidate = async () => {
  try {
    const res = await apiPost("/projects/bootstrap/validate", payload.value);
    validateResult.value = JSON.stringify(res, null, 2);
  } catch (e) {
    validateResult.value = String(e);
  }
};

const saveAssignments = async () => {
  try {
    const res = await apiPut(`/projects/${projectId.value}/role-agents`, {
      roleAgentAssignments: roleAgentAssignments.value,
    });
    saveResult.value = JSON.stringify(res, null, 2);
  } catch (e) {
    saveResult.value = String(e);
  }
};

watch(
  () => [parsedTemplatePhases.value, models.value],
  () => {
    syncRoleEditors();
  },
  { deep: true },
);

onMounted(load);
</script>

<style scoped>
.page-subtitle {
  margin: 0 0 14px;
}

.stepper {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.step {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 12px;
}

.step.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.phase-list {
  display: grid;
  gap: 12px;
  margin-bottom: 12px;
}

.phase-card {
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px;
  background: #fffdf9;
}

.phase-head,
.role-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.phase-head h4,
.role-head h5 {
  margin: 0;
}

.role-list {
  margin-top: 10px;
  display: grid;
  gap: 10px;
}

.role-card {
  border: 1px dashed var(--border);
  border-radius: 12px;
  padding: 10px;
  background: #fff;
}

.json-result {
  white-space: pre-wrap;
  margin-top: 12px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.save-cell {
  display: flex;
  align-items: end;
}

.tiny-btn {
  min-height: 32px;
  padding: 6px 10px;
}

.nav-actions {
  display: flex;
  justify-content: space-between;
}
</style>
