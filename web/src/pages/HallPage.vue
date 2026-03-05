<template>
  <section class="hall-shell" :class="{ 'dungeon-mode': theme === 'dungeon', 'storybook-mode': theme === 'storybook', 'cyber-mode': theme === 'cyber' }">
    <header class="hero card">
      <div class="hero-main">
        <p class="kicker">{{ locale === "zh-CN" ? "团队大厅" : "Team Hall" }}</p>
        <h1>{{ locale === "zh-CN" ? "Magic 指挥台" : "Magic Mission Console" }}</h1>
        <p class="muted">
          {{
            locale === "zh-CN"
              ? "先看现在该做什么，再决定下一步去哪里。大厅只给你行动线索，不堆数字噪音。"
              : "See what to do now, then choose the next move. This hall gives action clues, not number noise."
          }}
        </p>
        <div class="status-chips">
          <span class="chip" v-for="item in statusChips" :key="item.label">
            <strong>{{ item.label }}</strong>
            <em>{{ item.value }}</em>
          </span>
        </div>
      </div>
      <aside class="hero-side">
        <div class="pulse">{{ dailyBuff }}</div>
        <div class="mini-matrix">
          <div class="mini-cell" v-for="item in quickMetrics" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
        <p class="muted">{{ locale === "zh-CN" ? "最后更新" : "Updated" }} {{ formatDateTime(hall?.generatedAt) }}</p>
        <button class="button primary" @click="go('/tasks')">{{ locale === "zh-CN" ? "进入任务大厅" : "Open Task Hall" }}</button>
      </aside>
    </header>

    <section class="metric-ribbon card">
      <div class="metric-grid">
        <div class="metric-tile" v-for="item in compactMetrics" :key="item.label">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </section>

    <section class="ticker-wrap card">
      <h3>{{ locale === "zh-CN" ? "世界频道" : "World Channel" }}</h3>
      <div class="ticker">
        <div class="ticker-track">
          <span class="ticker-item" v-for="(line, idx) in tickerLines" :key="`a-${idx}`">{{ line }}</span>
          <span class="ticker-item" v-for="(line, idx) in tickerLines" :key="`b-${idx}`">{{ line }}</span>
        </div>
      </div>
    </section>

    <section class="main-grid">
      <article class="card panel">
        <h3>{{ locale === "zh-CN" ? "下一步建议" : "Next Moves" }}</h3>
        <div class="move-list">
          <button class="move" v-for="item in nextMoves" :key="item.title" @click="go(item.path)">
            <strong>{{ item.title }}</strong>
            <p>{{ item.desc }}</p>
          </button>
        </div>
      </article>

      <article class="card panel action-panel">
        <h3>{{ locale === "zh-CN" ? "行动工位" : "Action Desk" }}</h3>
        <div class="action-grid">
          <button class="button" @click="go('/bootstrap')">{{ locale === "zh-CN" ? "团队编排" : "Team Plan" }}</button>
          <button class="button" @click="go('/agents')">{{ locale === "zh-CN" ? "智能体配置" : "Agents" }}</button>
          <button class="button" @click="go('/models')">{{ locale === "zh-CN" ? "模型库" : "Models" }}</button>
          <button class="button" @click="go('/skills')">{{ locale === "zh-CN" ? "技能库" : "Skills" }}</button>
          <button class="button" @click="go('/mcps')">{{ locale === "zh-CN" ? "工具库" : "Tools" }}</button>
          <button class="button" @click="go('/tasks')">{{ locale === "zh-CN" ? "任务进度" : "Task Progress" }}</button>
        </div>
        <div class="focus-box">
          <p class="focus-title">{{ locale === "zh-CN" ? "今日焦点" : "Today Focus" }}</p>
          <ul>
            <li v-for="item in focusList" :key="item">{{ item }}</li>
          </ul>
        </div>
      </article>

      <article class="card panel">
        <h3>{{ locale === "zh-CN" ? "队伍热点" : "Hot Spots" }}</h3>
        <div class="project-list">
          <div class="project-item" v-for="project in hotProjects" :key="project.id">
            <div>
              <strong>{{ project.name }}</strong>
              <p class="muted">{{ project.id }}</p>
            </div>
            <span class="pill">{{ formatLoad(project.assignmentsCount) }}</span>
          </div>
          <p v-if="!hotProjects.length" class="muted">{{ locale === "zh-CN" ? "暂无项目动态" : "No project activity yet." }}</p>
        </div>
      </article>
    </section>

    <p v-if="loadError" class="error-text">{{ loadError }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { apiGet } from "../lib/api";
import { useI18n } from "../lib/i18n";
import { useTheme } from "../lib/theme";

type HallOverview = {
  generatedAt: string;
  today: { modelsCreated: number; skillsCreated: number; mcpsCreated: number; projectsCreated: number };
  totals: { models: number; skills: number; mcps: number; agents: number; projects: number; projectAssignments: number };
  champions: {
    skillMaster: { id: string; name: string; skillCount: number } | null;
    mcpMaster: { id: string; name: string; mcpCount: number } | null;
    projectTycoon: { id: string; name: string; assignmentsCount: number } | null;
    mostUsedModel: { modelId: string; modelName: string; usageCount: number } | null;
    mostUsedAgent: { agentId: string; agentName: string; usageCount: number } | null;
  };
  projectLuxuryTop: Array<{ id: string; name: string; assignmentsCount: number }>;
  worldChannel: Array<{ message: string; at: string }>;
};

const hall = ref<HallOverview | null>(null);
const loadError = ref("");
const { locale } = useI18n();
const { theme } = useTheme();
const router = useRouter();

const statusChips = computed(() => {
  const t = hall.value?.totals;
  if (!t) {
    return [
      { label: locale.value === "zh-CN" ? "模型" : "Models", value: "--" },
      { label: locale.value === "zh-CN" ? "技能" : "Skills", value: "--" },
      { label: locale.value === "zh-CN" ? "任务态势" : "Task State", value: locale.value === "zh-CN" ? "加载中" : "Loading" },
    ];
  }
  return [
    { label: locale.value === "zh-CN" ? "模型" : "Models", value: `${t.models}` },
    { label: locale.value === "zh-CN" ? "技能" : "Skills", value: `${t.skills}` },
    { label: locale.value === "zh-CN" ? "任务态势" : "Task State", value: t.projects > 0 ? (locale.value === "zh-CN" ? "执行中" : "Active") : (locale.value === "zh-CN" ? "待启动" : "Pending") },
  ];
});

const hotProjects = computed(() => hall.value?.projectLuxuryTop?.slice(0, 5) ?? []);

const quickMetrics = computed(() => {
  const t = hall.value?.totals;
  return [
    { label: locale.value === "zh-CN" ? "项目" : "Projects", value: `${t?.projects ?? 0}` },
    { label: locale.value === "zh-CN" ? "编排" : "Assignments", value: `${t?.projectAssignments ?? 0}` },
    { label: locale.value === "zh-CN" ? "工具" : "Tools", value: `${t?.mcps ?? 0}` },
    { label: locale.value === "zh-CN" ? "智能体" : "Agents", value: `${t?.agents ?? 0}` },
  ];
});

const compactMetrics = computed(() => {
  const t = hall.value?.totals;
  const d = hall.value?.today;
  return [
    { label: locale.value === "zh-CN" ? "总模型" : "Total Models", value: `${t?.models ?? 0}` },
    { label: locale.value === "zh-CN" ? "总技能" : "Total Skills", value: `${t?.skills ?? 0}` },
    { label: locale.value === "zh-CN" ? "总工具" : "Total Tools", value: `${t?.mcps ?? 0}` },
    { label: locale.value === "zh-CN" ? "总智能体" : "Total Agents", value: `${t?.agents ?? 0}` },
    { label: locale.value === "zh-CN" ? "总项目" : "Total Projects", value: `${t?.projects ?? 0}` },
    { label: locale.value === "zh-CN" ? "总编排" : "Total Plans", value: `${t?.projectAssignments ?? 0}` },
    { label: locale.value === "zh-CN" ? "今日新模型" : "Today Models", value: `${d?.modelsCreated ?? 0}` },
    { label: locale.value === "zh-CN" ? "今日新技能" : "Today Skills", value: `${d?.skillsCreated ?? 0}` },
    { label: locale.value === "zh-CN" ? "今日新工具" : "Today Tools", value: `${d?.mcpsCreated ?? 0}` },
    { label: locale.value === "zh-CN" ? "今日新项目" : "Today Projects", value: `${d?.projectsCreated ?? 0}` },
  ];
});

const tickerLines = computed(() => {
  const items = hall.value?.worldChannel ?? [];
  if (!items.length) {
    return [locale.value === "zh-CN" ? "暂无广播，先发布任务并让团队开始汇报。" : "No broadcast yet. Publish a task and start team reports."];
  }
  return items.map((msg) => `[${formatShortTime(msg.at)}] ${msg.message}`);
});

const nextMoves = computed(() => {
  const t = hall.value?.totals;
  const hasModels = (t?.models ?? 0) > 0;
  const hasSkills = (t?.skills ?? 0) > 0;
  const hasProjects = (t?.projects ?? 0) > 0;
  const hasAssignments = (t?.projectAssignments ?? 0) > 0;

  return [
    {
      title: locale.value === "zh-CN" ? "先备战模型与技能" : "Prepare Models & Skills",
      desc: hasModels && hasSkills ? (locale.value === "zh-CN" ? "基础资产已具备，可进入编排。" : "Core assets ready. Proceed to planning.") : (locale.value === "zh-CN" ? "建议先补齐核心能力资产。" : "Build core capability assets first."),
      path: hasModels && hasSkills ? "/bootstrap" : "/models",
    },
    {
      title: locale.value === "zh-CN" ? "组建行动小队" : "Assemble Squad",
      desc: hasProjects ? (locale.value === "zh-CN" ? "已有项目，可继续细化任务攻略。" : "Projects exist. Refine execution strategy.") : (locale.value === "zh-CN" ? "创建首个团队编排，明确目标与计划。" : "Create first team plan with goals and execution."),
      path: "/bootstrap",
    },
    {
      title: locale.value === "zh-CN" ? "进入任务大厅推进" : "Push In Task Hall",
      desc: hasAssignments ? (locale.value === "zh-CN" ? "可直接查看进展、汇报、撤退或出发。" : "Track progress, report, retreat, or depart now.") : (locale.value === "zh-CN" ? "先生成编排，再发布任务执行。" : "Create assignments before mission execution."),
      path: "/tasks",
    },
  ];
});

const focusList = computed(() => {
  const c = hall.value?.champions;
  const lines = [
    locale.value === "zh-CN"
      ? `热门模型：${c?.mostUsedModel?.modelName ?? "暂无"}`
      : `Hot model: ${c?.mostUsedModel?.modelName ?? "N/A"}`,
    locale.value === "zh-CN"
      ? `热门智能体：${c?.mostUsedAgent?.agentName ?? "暂无"}`
      : `Hot agent: ${c?.mostUsedAgent?.agentName ?? "N/A"}`,
    locale.value === "zh-CN"
      ? `技能达人：${c?.skillMaster?.name ?? "暂无"}`
      : `Skill master: ${c?.skillMaster?.name ?? "N/A"}`,
  ];
  return lines;
});

const dailyBuff = computed(() => {
  const seed = new Date().toISOString().slice(0, 10).split("-").reduce((acc, part) => acc + Number(part), 0);
  const buffs = locale.value === "zh-CN"
    ? ["今日彩蛋: 任务推进命中 +12%", "今日彩蛋: 协同沟通效率 +10%", "今日彩蛋: 风险发现速度 +15%", "今日彩蛋: 工具调用稳定度 +18%"]
    : ["Daily buff: +12% task precision", "Daily buff: +10% team coordination", "Daily buff: +15% risk detection", "Daily buff: +18% tool stability"];
  return buffs[seed % buffs.length];
});

const formatDateTime = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

const formatShortTime = (value?: string) => {
  if (!value) return "--:--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatLoad = (count: number) => {
  if (count >= 12) return locale.value === "zh-CN" ? "高负载" : "High";
  if (count >= 6) return locale.value === "zh-CN" ? "中负载" : "Medium";
  return locale.value === "zh-CN" ? "轻负载" : "Low";
};

const go = (path: string) => {
  router.push(path);
};

const load = async () => {
  loadError.value = "";
  try {
    hall.value = await apiGet<HallOverview>("/hall/overview");
  } catch (error) {
    loadError.value = String(error);
  }
};

onMounted(load);
</script>

<style scoped>
.hall-shell {
  display: grid;
  gap: 8px;
  max-width: 100%;
  overflow-x: clip;
  height: calc(100vh - 84px);
  overflow-y: hidden;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 300px);
  gap: 10px;
  border-radius: 16px;
  border: 1px solid #202020;
  background: #fff;
  padding: 10px;
}

.hero-main,
.hero-side,
.metric-ribbon,
.ticker-wrap,
.panel,
.move-list,
.project-list {
  min-width: 0;
}

.hero-main h1 {
  margin: 4px 0;
  font-size: 25px;
}

.kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.14em;
  color: #666;
}

.status-chips {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  border: 1px solid #222;
  border-radius: 999px;
  padding: 4px 9px;
  background: #fff;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chip strong {
  font-size: 12px;
}

.chip em {
  font-style: normal;
  font-weight: 700;
}

.hero-side {
  border: 1px dashed #9c9c9c;
  border-radius: 12px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.84);
  display: grid;
  align-content: start;
  gap: 6px;
}

.pulse {
  border: 1px solid #1f1f1f;
  border-radius: 10px;
  padding: 6px;
  background: #fff;
  font-weight: 700;
  font-size: 12px;
}

.mini-matrix {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.mini-cell {
  border: 1px dashed #b7b7b7;
  border-radius: 8px;
  padding: 4px 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.mini-cell strong {
  font-size: 13px;
}

.metric-ribbon {
  padding-top: 6px;
  padding-bottom: 6px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, 1fr));
  gap: 4px;
}

.metric-tile {
  border: 1px solid #bdbdbd;
  border-radius: 8px;
  padding: 5px;
  display: grid;
  gap: 2px;
  min-height: 42px;
  background: #fff;
}

.metric-tile span {
  font-size: 11px;
  color: #525252;
  line-height: 1.1;
}

.metric-tile strong {
  font-size: 13px;
  line-height: 1;
}

.ticker-wrap {
  border-radius: 14px;
  padding-top: 8px;
  padding-bottom: 8px;
}

.ticker-wrap h3 {
  margin: 0 0 4px;
  font-size: 14px;
}

.ticker {
  border: 1px dashed #9f9f9f;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  width: 100%;
  max-width: 100%;
}

.ticker-track {
  display: flex;
  gap: 24px;
  padding: 6px 0;
  width: max-content;
  max-width: none;
  animation: world-scroll 36s linear infinite;
}

.ticker:hover .ticker-track {
  animation-play-state: paused;
}

.ticker-item {
  flex: 0 0 auto;
  white-space: nowrap;
  font-size: 12px;
  padding-left: 14px;
  position: relative;
}

.ticker-item::before {
  content: "";
  position: absolute;
  left: 2px;
  top: 7px;
  width: 6px;
  height: 6px;
  border-radius: 999px;
  border: 1px solid #444;
}

.main-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 8px;
  min-height: 0;
}

.panel {
  min-height: 0;
  max-height: 100%;
  overflow: auto;
  padding: 10px;
}

.action-panel {
  overflow: visible;
  max-height: none;
}

.panel h3 {
  margin: 0 0 6px;
  font-size: 14px;
}

.move-list {
  display: grid;
  gap: 6px;
}

.move {
  border: 1px solid #c5c5c5;
  border-radius: 12px;
  text-align: left;
  padding: 8px;
  background: #fff;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.move:hover {
  transform: translateY(-1px);
  border-color: #a9a9a9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.move strong {
  font-size: 13px;
}

.move p {
  margin: 4px 0 0;
  color: #555;
  font-size: 12px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.focus-box {
  margin-top: 6px;
  border: 1px dashed #b4b4b4;
  border-radius: 10px;
  padding: 6px 8px;
  background: #fcfcfc;
}

.focus-title {
  margin: 0 0 4px;
  font-size: 12px;
  letter-spacing: 0.1em;
  color: #666;
}

.focus-box ul {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 4px;
}

.focus-box li {
  font-size: 12px;
}

.project-list {
  display: grid;
  gap: 6px;
}

.project-item {
  border: 1px solid #cbcbcb;
  border-radius: 10px;
  padding: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.project-item p {
  margin: 3px 0 0;
}

.pill {
  border: 1px solid #212121;
  border-radius: 999px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.dungeon-mode .hero,
.dungeon-mode .card {
  background:
    radial-gradient(circle at 85% 20%, rgba(218, 145, 43, 0.2), transparent 46%),
    linear-gradient(145deg, #fff5df 0%, #f5e6bf 100%);
}

.storybook-mode .hero,
.storybook-mode .card {
  background:
    radial-gradient(circle at 86% 18%, rgba(136, 205, 171, 0.22), transparent 44%),
    linear-gradient(145deg, #f7fff9 0%, #eaf4ef 100%);
}

.cyber-mode .hero,
.cyber-mode .card {
  background:
    radial-gradient(circle at 85% 16%, rgba(44, 193, 255, 0.2), transparent 44%),
    linear-gradient(145deg, #0f1b32 0%, #0b1224 100%);
  color: #c4f3ff;
  border-color: #2f6d98;
}

.cyber-mode .muted,
.cyber-mode .kicker,
.cyber-mode .move p,
.cyber-mode .focus-title {
  color: #8ac0da;
}

.cyber-mode .chip,
.cyber-mode .hero-side,
.cyber-mode .pulse,
.cyber-mode .mini-cell,
.cyber-mode .metric-tile,
.cyber-mode .ticker,
.cyber-mode .move,
.cyber-mode .focus-box,
.cyber-mode .project-item,
.cyber-mode .pill {
  background: rgba(10, 21, 40, 0.82);
  border-color: #3c81af;
  color: #c4f3ff;
}

@keyframes world-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@media (max-width: 1180px) {
  .hero,
  .main-grid {
    grid-template-columns: 1fr;
  }

  .hall-shell {
    height: auto;
    overflow-y: visible;
  }
}

@media (max-width: 1400px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
