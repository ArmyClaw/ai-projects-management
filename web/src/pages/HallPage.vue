<template>
  <section class="hall-shell">
    <header class="hero-stage">
      <div class="hero-main">
        <p class="hero-kicker">{{ locale === "zh-CN" ? "世界大厅" : "World Lobby" }}</p>
        <h1 class="hero-title">{{ locale === "zh-CN" ? "指挥中心 Panel" : "Command Center Panel" }}</h1>
        <p class="hero-sub">
          {{
            locale === "zh-CN"
              ? "像游戏大厅一样看全局：谁冲榜、谁统治工具仓、谁在豪华编排。"
              : "A game-lobby style overview: who climbs, who rules tools, and who drives premium orchestrations."
          }}
        </p>
        <div class="hero-tags">
          <span>{{ locale === "zh-CN" ? "模型" : "Models" }} {{ hall?.totals.models ?? 0 }}</span>
          <span>{{ locale === "zh-CN" ? "技能" : "Skills" }} {{ hall?.totals.skills ?? 0 }}</span>
          <span>MCP {{ hall?.totals.mcps ?? 0 }}</span>
          <span>Agents {{ hall?.totals.agents ?? 0 }}</span>
          <span>{{ locale === "zh-CN" ? "项目" : "Projects" }} {{ hall?.totals.projects ?? 0 }}</span>
        </div>
      </div>
      <div class="hero-side">
        <div class="total-ring">
          <small>{{ locale === "zh-CN" ? "总战力" : "Total Power" }}</small>
          <strong>{{ totalPower }}</strong>
        </div>
        <div class="refresh-card">
          <span class="muted">{{ locale === "zh-CN" ? "最后刷新" : "Refreshed" }}</span>
          <strong>{{ formatDateTime(hall?.generatedAt) }}</strong>
        </div>
      </div>
    </header>

    <section class="lobby-grid">
      <article class="panel side-mission">
        <h3>{{ locale === "zh-CN" ? "今日冲榜" : "Today Rush" }}</h3>
        <div class="today-orbs">
          <div class="orb">
            <span>{{ locale === "zh-CN" ? "模型" : "Models" }}</span>
            <strong>{{ hall?.today.modelsCreated ?? 0 }}</strong>
          </div>
          <div class="orb">
            <span>{{ locale === "zh-CN" ? "技能" : "Skills" }}</span>
            <strong>{{ hall?.today.skillsCreated ?? 0 }}</strong>
          </div>
          <div class="orb">
            <span>MCP</span>
            <strong>{{ hall?.today.mcpsCreated ?? 0 }}</strong>
          </div>
          <div class="orb">
            <span>{{ locale === "zh-CN" ? "项目" : "Projects" }}</span>
            <strong>{{ hall?.today.projectsCreated ?? 0 }}</strong>
          </div>
        </div>
        <div class="boss-card">
          <p>{{ locale === "zh-CN" ? "本周豪华项目" : "Weekly Premium Project" }}</p>
          <h3>{{ featuredProject?.name || "-" }}</h3>
          <small>{{ (featuredProject?.assignmentsCount ?? 0) + (locale === "zh-CN" ? " 条编排" : " assignments") }}</small>
        </div>
      </article>

      <div class="center-stage">
        <section class="war-ticker" aria-label="war ticker">
          <div class="ticker-track">
            <div class="ticker-list">
              <span class="ticker-item" v-for="(item, idx) in tickerMessages" :key="`a-${idx}`">{{ item }}</span>
            </div>
            <div class="ticker-list" aria-hidden="true">
              <span class="ticker-item" v-for="(item, idx) in tickerMessages" :key="`b-${idx}`">{{ item }}</span>
            </div>
          </div>
        </section>

        <article class="panel podium-panel">
          <h3>{{ locale === "zh-CN" ? "王者领奖台" : "Champion Podium" }}</h3>
          <div class="podium-row" v-for="entry in podiumEntries" :key="entry.label">
            <label>{{ entry.label }}</label>
            <b>{{ entry.name || "-" }}</b>
            <em>{{ entry.value }}</em>
          </div>
        </article>
      </div>

      <article class="panel channel-panel">
        <h3>{{ locale === "zh-CN" ? "世界频道" : "World Channel" }}</h3>
        <div class="chat-list">
          <div class="chat-line" v-for="(msg, idx) in hall?.worldChannel ?? []" :key="`${idx}-${msg.at}`">
            <span class="time">{{ formatShortTime(msg.at) }}</span>
            <p>{{ msg.message }}</p>
          </div>
          <div v-if="(hall?.worldChannel?.length ?? 0) === 0" class="chat-line empty-line">
            <span class="time">--:--</span>
            <p>{{ locale === "zh-CN" ? "世界频道暂时安静，等待新的任务与编排日志。" : "World channel is calm now, waiting for new quest and pipeline logs." }}</p>
          </div>
        </div>
      </article>
    </section>

    <section class="board-grid">
      <article class="panel radar-panel">
        <h3>{{ locale === "zh-CN" ? "资源热力条" : "Resource Heat" }}</h3>
        <div class="radar-row" v-for="item in radarItems" :key="item.key">
          <label>{{ item.label }}</label>
          <div class="radar-track">
            <div class="radar-fill" :style="{ width: `${item.width}%` }" />
          </div>
          <strong>{{ item.value }}</strong>
        </div>
      </article>
      <article class="panel luxury-panel">
        <h3>{{ locale === "zh-CN" ? "豪华项目展台" : "Luxury Project Showcase" }}</h3>
        <div class="luxury-stack">
          <div class="luxury-card" v-for="p in hall?.projectLuxuryTop ?? []" :key="p.id">
            <div>
              <strong>{{ p.name }}</strong>
              <p class="muted">{{ p.id }}</p>
            </div>
            <span class="luxury-badge">{{ p.assignmentsCount }}</span>
          </div>
          <div v-if="(hall?.projectLuxuryTop?.length ?? 0) === 0" class="luxury-card empty-luxury">
            <div>
              <strong>{{ locale === "zh-CN" ? "暂无项目展台" : "No Luxury Project Yet" }}</strong>
              <p class="muted">{{ locale === "zh-CN" ? "先去项目编排创建一支队伍，再回来冲榜。" : "Create a team in Bootstrap first, then come back for ranking." }}</p>
            </div>
            <span class="luxury-badge">0</span>
          </div>
        </div>
      </article>
    </section>

    <p v-if="loadError" class="error-text">{{ loadError }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { apiGet } from "../lib/api";
import { useI18n } from "../lib/i18n";

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

const featuredProject = computed(() => hall.value?.projectLuxuryTop?.[0] ?? null);
const totalPower = computed(() => {
  const totals = hall.value?.totals;
  if (!totals) return 0;
  return totals.models + totals.skills + totals.mcps + totals.agents + totals.projects + totals.projectAssignments;
});

const radarItems = computed(() => {
  const totals = hall.value?.totals;
  const values = [
    { key: "models", label: locale.value === "zh-CN" ? "模型" : "Models", value: totals?.models ?? 0 },
    { key: "skills", label: locale.value === "zh-CN" ? "技能" : "Skills", value: totals?.skills ?? 0 },
    { key: "mcps", label: "MCPs", value: totals?.mcps ?? 0 },
    { key: "agents", label: "Agents", value: totals?.agents ?? 0 },
    { key: "projects", label: locale.value === "zh-CN" ? "项目" : "Projects", value: totals?.projects ?? 0 },
    { key: "assignments", label: locale.value === "zh-CN" ? "编排" : "Assignments", value: totals?.projectAssignments ?? 0 },
  ];
  const max = Math.max(...values.map((x) => x.value), 1);
  return values.map((item) => ({ ...item, width: Math.round((item.value / max) * 100) }));
});

const podiumEntries = computed(() => {
  const champions = hall.value?.champions;
  return [
    {
      label: locale.value === "zh-CN" ? "技能大师" : "Skill Master",
      name: champions?.skillMaster?.name ?? "",
      value: `${champions?.skillMaster?.skillCount ?? 0}${locale.value === "zh-CN" ? " 技能" : " skills"}`,
    },
    {
      label: locale.value === "zh-CN" ? "MCP 大师" : "MCP Master",
      name: champions?.mcpMaster?.name ?? "",
      value: `${champions?.mcpMaster?.mcpCount ?? 0}${locale.value === "zh-CN" ? " 工具" : " tools"}`,
    },
    {
      label: locale.value === "zh-CN" ? "最常上阵 Agent" : "Top Agent",
      name: champions?.mostUsedAgent?.agentName ?? "",
      value: `${champions?.mostUsedAgent?.usageCount ?? 0}${locale.value === "zh-CN" ? " 次" : " uses"}`,
    },
    {
      label: locale.value === "zh-CN" ? "热门模型" : "Hot Model",
      name: champions?.mostUsedModel?.modelName ?? "",
      value: `${champions?.mostUsedModel?.usageCount ?? 0}${locale.value === "zh-CN" ? " 次" : " uses"}`,
    },
  ];
});

const tickerMessages = computed(() => {
  const list: string[] = [];
  if (hall.value) {
    const t = hall.value.today;
    list.push(
      locale.value === "zh-CN"
        ? `今日新增 模型 ${t.modelsCreated} / 技能 ${t.skillsCreated} / MCP ${t.mcpsCreated} / 项目 ${t.projectsCreated}`
        : `Today + Models ${t.modelsCreated} / Skills ${t.skillsCreated} / MCPs ${t.mcpsCreated} / Projects ${t.projectsCreated}`,
    );
    list.push(...podiumEntries.value.map((x) => `${x.label}: ${x.name || "-"} (${x.value})`));
    list.push(...hall.value.worldChannel.slice(0, 6).map((x) => x.message));
  }
  if (list.length === 0) {
    return [
      locale.value === "zh-CN"
        ? "战报频道已就绪，等待你的第一波编排行动。"
        : "Battle ticker is online, waiting for your first orchestration move.",
    ];
  }
  return list;
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
  gap: 12px;
}

.hero-stage {
  display: grid;
  grid-template-columns: 1.35fr 0.65fr;
  gap: 12px;
  border: 2px solid #161616;
  border-radius: 18px;
  padding: 14px;
  background:
    radial-gradient(circle at 10px 10px, #101010 1px, transparent 1px) 0 0 / 16px 16px,
    linear-gradient(130deg, #fff 0%, #fafafa 56%, #f2f2f2 100%);
}

.hero-main {
  border: 1px solid #1a1a1a;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  position: relative;
  overflow: hidden;
}

.hero-main::after {
  content: "";
  position: absolute;
  right: -40px;
  bottom: -30px;
  width: 170px;
  height: 130px;
  border-radius: 45% 55% 60% 40%;
  border: 2px dashed #232323;
  opacity: 0.28;
}

.hero-side {
  display: grid;
  gap: 10px;
  align-content: start;
}

.total-ring {
  min-height: 128px;
  border: 1px solid #1f1f1f;
  border-radius: 14px;
  padding: 10px;
  display: grid;
  place-items: center;
  text-align: center;
  background:
    conic-gradient(from 140deg, #111 0deg, #111 22deg, #fff 22deg, #fff 50deg, #111 50deg, #111 72deg, #fff 72deg, #fff 360deg);
}

.total-ring small,
.total-ring strong {
  background: #fff;
  border: 1px solid #1f1f1f;
  border-radius: 999px;
  padding: 4px 12px;
}

.total-ring strong {
  font-size: 26px;
  margin-top: 8px;
}

.hero-kicker {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #666;
}

.hero-title {
  margin: 6px 0;
  font-size: 30px;
  line-height: 1.15;
}

.hero-sub {
  margin: 0;
  color: #5f5f5f;
}

.hero-tags {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hero-tags span {
  border: 1px solid #1c1c1c;
  border-radius: 999px;
  padding: 4px 10px;
  font-weight: 700;
  font-size: 12px;
  background: #fff;
}

.refresh-card,
.boss-card {
  border: 1px solid #1f1f1f;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
}

.boss-card {
  position: relative;
  overflow: hidden;
}

.boss-card::after {
  content: "";
  position: absolute;
  right: -18px;
  top: -18px;
  width: 58px;
  height: 58px;
  border: 2px dashed #161616;
  border-radius: 50%;
  opacity: 0.45;
  animation: spin 10s linear infinite;
}

.boss-card p,
.boss-card small {
  margin: 0;
}

.boss-card h3 {
  margin: 6px 0;
}

.war-ticker {
  border: 2px solid #151515;
  border-radius: 14px;
  padding: 8px 0;
  overflow: hidden;
  background: linear-gradient(180deg, #fff 0%, #f8f8f8 100%);
}

.ticker-track {
  display: flex;
  width: max-content;
  animation: ticker-move 30s linear infinite;
}

.ticker-list {
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 16px;
  padding-right: 16px;
  border-right: 1px dashed #cfcfcf;
  font-size: 13px;
  font-weight: 700;
}

.ticker-item::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #141414;
  display: inline-block;
}

.lobby-grid {
  display: grid;
  grid-template-columns: 0.86fr 1.25fr 0.89fr;
  gap: 12px;
}

.center-stage {
  display: grid;
  gap: 12px;
}

.board-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.panel {
  border: 1px solid #1f1f1f;
  border-radius: 14px;
  padding: 12px;
  background:
    linear-gradient(180deg, #fff 0%, #fbfbfb 100%),
    radial-gradient(circle at 14px 14px, #111 1px, transparent 1px) 0 0 / 14px 14px;
}

.panel h3 {
  margin: 0 0 10px;
}

.today-orbs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.orb {
  border: 1px dashed #202020;
  border-radius: 12px;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.orb strong {
  font-size: 24px;
}

.side-mission {
  display: grid;
  gap: 10px;
  align-content: start;
}

.podium-row {
  display: grid;
  grid-template-columns: 92px 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #e2e2e2;
}

.podium-row:last-child {
  border-bottom: 0;
}

.podium-row b {
  font-size: 15px;
}

.podium-row em {
  font-style: normal;
  font-size: 12px;
  color: #666;
}

.radar-row {
  display: grid;
  grid-template-columns: 84px 1fr 44px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.radar-track {
  height: 12px;
  border-radius: 999px;
  border: 1px solid #202020;
  overflow: hidden;
  background: #fff;
}

.radar-fill {
  height: 100%;
  background: repeating-linear-gradient(90deg, #111, #111 7px, #fff 7px, #fff 13px);
}

.luxury-stack {
  max-height: 315px;
  overflow: auto;
  display: grid;
  gap: 8px;
}

.luxury-card {
  border: 1px dashed #d9d9d9;
  border-radius: 10px;
  padding: 9px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
}

.luxury-card p {
  margin: 2px 0 0;
}

.luxury-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #171717;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.chat-list {
  max-height: 420px;
  overflow: auto;
  display: grid;
  gap: 8px;
}

.chat-line {
  display: grid;
  grid-template-columns: 58px 1fr;
  gap: 8px;
  border: 1px dashed #dcdcdc;
  border-radius: 10px;
  padding: 8px;
  background: #fff;
}

.chat-line p {
  margin: 0;
  line-height: 1.35;
  word-break: break-word;
}

.empty-line,
.empty-luxury {
  border-style: solid;
}

.time {
  font-family: monospace;
  color: #666;
}

@media (max-width: 1200px) {
  .hero-stage {
    grid-template-columns: 1fr;
  }

  .lobby-grid {
    grid-template-columns: 1fr;
  }

  .board-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .hero-title {
    font-size: 24px;
  }

  .today-orbs {
    grid-template-columns: 1fr;
  }
}

@keyframes ticker-move {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
