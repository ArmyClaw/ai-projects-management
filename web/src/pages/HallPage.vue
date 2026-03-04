<template>
  <section
    class="hall-shell"
    :class="{ 'dungeon-mode': theme === 'dungeon', 'storybook-mode': theme === 'storybook', 'cyber-mode': theme === 'cyber' }"
  >
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
        <div class="hero-emblems">
          <span>{{ locale === "zh-CN" ? "战报" : "Battle Log" }}</span>
          <span>{{ locale === "zh-CN" ? "排行榜" : "Ranking" }}</span>
          <span>{{ locale === "zh-CN" ? "世界频道" : "World Chat" }}</span>
        </div>
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
        <article class="panel strategy-map">
          <h3>{{ locale === "zh-CN" ? "今日远征地图" : "Today Expedition Map" }}</h3>
          <div class="map-lines">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </article>
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
  gap: 14px;
  position: relative;
}

.dungeon-mode .hall-shell::before {
  content: "";
  position: absolute;
  inset: -6px -6px auto -6px;
  height: 160px;
  border-radius: 20px;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(circle at 12% 35%, rgba(255, 207, 120, 0.25), transparent 38%),
    radial-gradient(circle at 85% 30%, rgba(95, 197, 255, 0.16), transparent 40%),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05) 10px, transparent 10px, transparent 20px);
}

.dungeon-mode .hall-shell > * {
  position: relative;
  z-index: 1;
}

.hero-stage {
  display: grid;
  grid-template-columns: 1.35fr 0.65fr;
  gap: 12px;
  border: 2px solid #161616;
  border-radius: 20px;
  padding: 14px;
  background:
    radial-gradient(circle at 10px 10px, #101010 1px, transparent 1px) 0 0 / 16px 16px,
    linear-gradient(130deg, #fff 0%, #fafafa 56%, #f2f2f2 100%);
  box-shadow: 0 8px 24px rgba(20, 20, 20, 0.08);
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

.hero-main::before {
  content: "";
  position: absolute;
  left: 12px;
  top: 10px;
  width: 72px;
  height: 12px;
  border-radius: 999px;
  background: repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.12) 8px, transparent 8px, transparent 14px);
}

.hero-side {
  display: grid;
  gap: 10px;
  align-content: start;
}

.total-ring {
  min-height: 128px;
  border: 1px solid #1f1f1f;
  border-radius: 16px;
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
  font-size: 32px;
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

.hero-emblems {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.hero-emblems span {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px dashed #3a3a3a;
  background: #fff;
  font-size: 11px;
  font-weight: 700;
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
  border: 2px solid #1f1f1f;
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
  gap: 14px;
}

.center-stage {
  display: grid;
  gap: 12px;
}

.strategy-map {
  padding-bottom: 10px;
}

.map-lines {
  border: 2px dashed #242424;
  border-radius: 10px;
  padding: 10px;
  background:
    linear-gradient(180deg, #fff 0%, #f7f7f7 100%);
  display: grid;
  gap: 6px;
}

.map-lines span {
  display: block;
  height: 8px;
  border-radius: 999px;
  background: repeating-linear-gradient(90deg, #222, #222 8px, #fff 8px, #fff 16px);
}

.map-lines span:nth-child(2) {
  width: 82%;
}

.map-lines span:nth-child(3) {
  width: 65%;
}

.map-lines span:nth-child(4) {
  width: 90%;
}

.board-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.panel {
  border: 2px solid #1f1f1f;
  border-radius: 14px;
  padding: 12px;
  background:
    linear-gradient(180deg, #fff 0%, #fbfbfb 100%),
    radial-gradient(circle at 14px 14px, #111 1px, transparent 1px) 0 0 / 14px 14px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.panel:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(20, 20, 20, 0.12);
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
  border: 2px dashed #202020;
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
  border: 2px solid #202020;
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
  border: 2px dashed #d9d9d9;
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
  border: 2px dashed #dcdcdc;
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

.dungeon-mode .hero-stage {
  border-color: #5e4422;
  background:
    radial-gradient(circle at 12px 12px, rgba(255, 255, 255, 0.08) 1px, transparent 1px) 0 0 / 16px 16px,
    linear-gradient(130deg, #2b2138 0%, #241a33 56%, #1a1329 100%);
  box-shadow: 0 12px 28px rgba(7, 4, 18, 0.45);
}

.dungeon-mode .hero-main,
.dungeon-mode .panel,
.dungeon-mode .refresh-card,
.dungeon-mode .boss-card {
  background: linear-gradient(180deg, #fff9eb 0%, #f3e4c6 100%);
  border-color: #6b4f2d;
  box-shadow: 0 8px 18px rgba(59, 35, 12, 0.2);
}

.dungeon-mode .hero-main {
  background:
    radial-gradient(circle at 86% 16%, rgba(255, 202, 102, 0.18), transparent 30%),
    linear-gradient(180deg, #fff9ef 0%, #f3e6ca 100%);
}

.dungeon-mode .hero-title {
  color: #3b2511;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.72),
    0 2px 8px rgba(78, 45, 12, 0.16);
}

.dungeon-mode .hero-kicker {
  color: #7a5730;
}

.dungeon-mode .hero-sub {
  color: #5b4228;
}

.dungeon-mode .hero-tags span,
.dungeon-mode .tag {
  background: linear-gradient(180deg, #ffefbe 0%, #f6d890 100%);
  border-color: #7a5a2f;
  color: #3e2a11;
}

.dungeon-mode .hero-emblems span {
  background: linear-gradient(180deg, #f2ebff 0%, #d9cbff 100%);
  border-color: #7a6bb2;
  color: #2f235d;
}

.dungeon-mode .map-lines {
  border-color: #6d532f;
  background:
    radial-gradient(circle at 18% 16%, rgba(104, 206, 255, 0.2), transparent 26%),
    linear-gradient(180deg, #fff7e4 0%, #efdfbe 100%);
}

.dungeon-mode .map-lines span {
  background: repeating-linear-gradient(90deg, #4a371f, #4a371f 8px, #f8e8bf 8px, #f8e8bf 16px);
}

.dungeon-mode .side-mission {
  background:
    radial-gradient(circle at 20% 16%, rgba(255, 182, 99, 0.22), transparent 28%),
    linear-gradient(180deg, #fff4dd 0%, #efd7ad 100%);
  border-color: #8e6026;
}

.dungeon-mode .strategy-map {
  background:
    radial-gradient(circle at 86% 16%, rgba(93, 208, 255, 0.2), transparent 28%),
    linear-gradient(180deg, #eef8ff 0%, #d9ebf7 100%);
  border-color: #3d6d86;
}

.dungeon-mode .podium-panel {
  background:
    radial-gradient(circle at 14% 20%, rgba(173, 139, 255, 0.22), transparent 30%),
    linear-gradient(180deg, #f7f1ff 0%, #ebddff 100%);
  border-color: #7561ad;
}

.dungeon-mode .channel-panel {
  background:
    radial-gradient(circle at 86% 14%, rgba(120, 255, 214, 0.22), transparent 28%),
    linear-gradient(180deg, #effff9 0%, #dbf4ea 100%);
  border-color: #2d8a72;
}

.dungeon-mode .radar-panel {
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 216, 112, 0.24), transparent 30%),
    linear-gradient(180deg, #fff8e8 0%, #f4e6bf 100%);
  border-color: #9b772a;
}

.dungeon-mode .luxury-panel {
  background:
    radial-gradient(circle at 82% 18%, rgba(255, 166, 166, 0.2), transparent 28%),
    linear-gradient(180deg, #fff0f0 0%, #f7dede 100%);
  border-color: #b86262;
}

.dungeon-mode .orb {
  background: linear-gradient(180deg, #fff6dc 0%, #f8e8c2 100%);
  border-color: #72552c;
  color: #3d2a12;
}

.dungeon-mode .orb:nth-child(2n) {
  background: linear-gradient(180deg, #ecf6ff 0%, #d5e9ff 100%);
  border-color: #4f6d9a;
}

.dungeon-mode .orb strong {
  color: #6a2b14;
}

.dungeon-mode .orb:nth-child(2n) strong {
  color: #1f4e8b;
}

.dungeon-mode .chat-line {
  background: linear-gradient(180deg, #f3fff8 0%, #e2f6ea 100%);
  border-color: #8bc0a6;
}

.dungeon-mode .chat-line:nth-child(2n) {
  background: linear-gradient(180deg, #f8f1ff 0%, #e8dbfa 100%);
  border-color: #b49add;
}

.dungeon-mode .luxury-card {
  background: linear-gradient(180deg, #fff8f8 0%, #fbe2e2 100%);
  border-color: #da9b9b;
}

.dungeon-mode .luxury-badge {
  background: linear-gradient(180deg, #ffe9be 0%, #ffc878 100%);
  border-color: #8c5a21;
  color: #3f250f;
}

.dungeon-mode .total-ring {
  border-color: #8d6a2f;
  background:
    conic-gradient(from 140deg, #7a5525 0deg, #7a5525 22deg, #fff8e1 22deg, #fff8e1 50deg, #7a5525 50deg, #7a5525 72deg, #fff8e1 72deg, #fff8e1 360deg);
}

.dungeon-mode .total-ring small,
.dungeon-mode .total-ring strong {
  border-color: #8d6a2f;
  background: #fff3d5;
  color: #4a2d12;
}

.dungeon-mode .podium-row {
  border-bottom-color: rgba(73, 50, 113, 0.25);
}

.dungeon-mode .podium-row b {
  color: #492a7f;
}

.dungeon-mode .ticker-item {
  color: #ffeac2;
  border-right-color: rgba(255, 222, 165, 0.35);
}

.dungeon-mode .ticker-item::before {
  background: #ffc97d;
}

.dungeon-mode .war-ticker {
  border-color: #7a5a2b;
  background: linear-gradient(180deg, #2f2344 0%, #201733 100%);
}

.dungeon-mode .radar-track {
  border-color: #6b512b;
}

.dungeon-mode .luxury-badge {
  background: #fff1ca;
  border-color: #4f391f;
}

.storybook-mode .hero-stage {
  border-color: #83a79b;
  background:
    radial-gradient(circle at 10px 10px, rgba(54, 93, 83, 0.1) 1px, transparent 1px) 0 0 / 16px 16px,
    linear-gradient(130deg, #e8f6f2 0%, #ddf0eb 52%, #d1e8e2 100%);
  box-shadow: 0 12px 26px rgba(67, 115, 103, 0.2);
}

.storybook-mode .hero-main,
.storybook-mode .panel,
.storybook-mode .refresh-card,
.storybook-mode .boss-card {
  background: linear-gradient(180deg, #fffef8 0%, #eef8f3 100%);
  border-color: #92b2a7;
  box-shadow: 0 8px 18px rgba(103, 136, 126, 0.16);
}

.storybook-mode .hero-main {
  background:
    radial-gradient(circle at 86% 16%, rgba(255, 222, 168, 0.34), transparent 30%),
    linear-gradient(180deg, #fffef8 0%, #eef9f4 100%);
}

.storybook-mode .hero-title {
  color: #304b43;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
}

.storybook-mode .hero-kicker {
  color: #58736a;
}

.storybook-mode .hero-sub {
  color: #4d6961;
}

.storybook-mode .hero-tags span,
.storybook-mode .tag {
  background: linear-gradient(180deg, #fff6df 0%, #e8f5f1 100%);
  border-color: #7ea497;
  color: #335148;
}

.storybook-mode .hero-emblems span {
  background: linear-gradient(180deg, #f8fff9 0%, #e6f3ed 100%);
  border-color: #8caea2;
  color: #3b6157;
}

.storybook-mode .map-lines {
  border-color: #8eaea3;
  background:
    radial-gradient(circle at 18% 16%, rgba(255, 226, 172, 0.3), transparent 26%),
    linear-gradient(180deg, #fffef8 0%, #ecf8f2 100%);
}

.storybook-mode .map-lines span {
  background: repeating-linear-gradient(90deg, #557c70, #557c70 8px, #ecf8f2 8px, #ecf8f2 16px);
}

.storybook-mode .side-mission {
  background:
    radial-gradient(circle at 20% 16%, rgba(255, 223, 169, 0.32), transparent 30%),
    linear-gradient(180deg, #fffaf0 0%, #f0faf5 100%);
  border-color: #98b6aa;
}

.storybook-mode .strategy-map {
  background:
    radial-gradient(circle at 86% 16%, rgba(174, 216, 201, 0.34), transparent 28%),
    linear-gradient(180deg, #f8fffd 0%, #e5f3ee 100%);
  border-color: #8bac9f;
}

.storybook-mode .podium-panel {
  background:
    radial-gradient(circle at 14% 20%, rgba(255, 219, 170, 0.3), transparent 30%),
    linear-gradient(180deg, #fffef8 0%, #edf7f1 100%);
  border-color: #98b5aa;
}

.storybook-mode .channel-panel {
  background:
    radial-gradient(circle at 86% 14%, rgba(160, 218, 200, 0.3), transparent 28%),
    linear-gradient(180deg, #f7fffc 0%, #e7f5ef 100%);
  border-color: #89ac9f;
}

.storybook-mode .radar-panel {
  background:
    radial-gradient(circle at 18% 20%, rgba(255, 229, 177, 0.34), transparent 30%),
    linear-gradient(180deg, #fffef8 0%, #edf8f2 100%);
  border-color: #96b5aa;
}

.storybook-mode .luxury-panel {
  background:
    radial-gradient(circle at 82% 18%, rgba(255, 214, 170, 0.3), transparent 28%),
    linear-gradient(180deg, #fffaf1 0%, #eef7f2 100%);
  border-color: #9ab7ab;
}

.storybook-mode .orb {
  background: linear-gradient(180deg, #fff9ea 0%, #ecf8f3 100%);
  border-color: #8faea3;
  color: #35544b;
}

.storybook-mode .orb:nth-child(2n) {
  background: linear-gradient(180deg, #f4fffa 0%, #e5f3ed 100%);
  border-color: #8cade0;
}

.storybook-mode .orb strong,
.storybook-mode .orb:nth-child(2n) strong {
  color: #36554b;
}

.storybook-mode .chat-line {
  background: linear-gradient(180deg, #f8fffc 0%, #eaf6f1 100%);
  border-color: #acd0c2;
}

.storybook-mode .chat-line:nth-child(2n) {
  background: linear-gradient(180deg, #fffef8 0%, #f0f8f3 100%);
  border-color: #c1dbc7;
}

.storybook-mode .luxury-card {
  background: linear-gradient(180deg, #fffdf6 0%, #edf7f2 100%);
  border-color: #bfd8ce;
}

.storybook-mode .luxury-badge {
  background: linear-gradient(180deg, #fff0cf 0%, #f7dbb2 100%);
  border-color: #8ca99f;
  color: #39554d;
}

.storybook-mode .total-ring {
  border-color: #8eaea2;
  background:
    conic-gradient(from 140deg, #7ea295 0deg, #7ea295 22deg, #f9fff8 22deg, #f9fff8 50deg, #7ea295 50deg, #7ea295 72deg, #f9fff8 72deg, #f9fff8 360deg);
}

.storybook-mode .total-ring small,
.storybook-mode .total-ring strong {
  border-color: #8eaea2;
  background: #f9fffc;
  color: #315147;
}

.storybook-mode .podium-row {
  border-bottom-color: rgba(90, 133, 120, 0.24);
}

.storybook-mode .podium-row b {
  color: #33584f;
}

.storybook-mode .ticker-item {
  color: #34574f;
  border-right-color: rgba(95, 143, 130, 0.3);
}

.storybook-mode .ticker-item::before {
  background: #6f9b8f;
}

.storybook-mode .war-ticker {
  border-color: #8eaea2;
  background: linear-gradient(180deg, #f7fffd 0%, #e6f3ee 100%);
}

.storybook-mode .radar-track {
  border-color: #89a99d;
}

.cyber-mode .hero-stage {
  border-color: #2f6c98;
  background:
    linear-gradient(90deg, rgba(25, 213, 255, 0.08) 1px, transparent 1px) 0 0 / 22px 22px,
    linear-gradient(rgba(25, 213, 255, 0.05) 1px, transparent 1px) 0 0 / 22px 22px,
    linear-gradient(130deg, #091127 0%, #0a132a 55%, #070e20 100%);
  box-shadow: 0 12px 30px rgba(2, 8, 28, 0.72);
}

.cyber-mode .hero-main,
.cyber-mode .panel,
.cyber-mode .refresh-card,
.cyber-mode .boss-card {
  background: linear-gradient(180deg, #101a31 0%, #0c152c 100%);
  border-color: #2d6992;
  box-shadow: 0 8px 18px rgba(3, 10, 34, 0.56);
}

.cyber-mode .hero-main {
  background:
    radial-gradient(circle at 88% 16%, rgba(70, 111, 255, 0.2), transparent 30%),
    linear-gradient(180deg, #101a31 0%, #0c152c 100%);
}

.cyber-mode .hero-main::before {
  background: repeating-linear-gradient(90deg, rgba(95, 245, 255, 0.24), rgba(95, 245, 255, 0.24) 8px, transparent 8px, transparent 14px);
}

.cyber-mode .hero-main::after {
  border-color: rgba(82, 203, 255, 0.35);
}

.cyber-mode .hero-title {
  color: #bdfbff;
  text-shadow: 0 0 14px rgba(32, 220, 255, 0.34);
}

.cyber-mode .hero-kicker {
  color: #75b7d6;
}

.cyber-mode .hero-sub {
  color: #8ac5dd;
}

.cyber-mode .hero-tags span,
.cyber-mode .tag {
  background: linear-gradient(180deg, #132947 0%, #11223f 100%);
  border-color: #3278ab;
  color: #b6f5ff;
}

.cyber-mode .hero-emblems span {
  background: linear-gradient(180deg, #112541 0%, #0d1c35 100%);
  border-color: #3a7eb0;
  color: #9fefff;
}

.cyber-mode .map-lines {
  border-color: #2f6f9c;
  background:
    radial-gradient(circle at 18% 16%, rgba(72, 108, 255, 0.24), transparent 26%),
    linear-gradient(180deg, #0f1a32 0%, #0d172d 100%);
}

.cyber-mode .map-lines span {
  background: repeating-linear-gradient(90deg, #64edff, #64edff 8px, #0c1b32 8px, #0c1b32 16px);
}

.cyber-mode .side-mission,
.cyber-mode .strategy-map,
.cyber-mode .podium-panel,
.cyber-mode .channel-panel,
.cyber-mode .radar-panel,
.cyber-mode .luxury-panel {
  border-color: #2f6f9c;
}

.cyber-mode .side-mission {
  background:
    radial-gradient(circle at 20% 16%, rgba(14, 210, 255, 0.2), transparent 30%),
    linear-gradient(180deg, #101a31 0%, #0d152b 100%);
}

.cyber-mode .strategy-map {
  background:
    radial-gradient(circle at 86% 16%, rgba(100, 88, 255, 0.24), transparent 28%),
    linear-gradient(180deg, #111b35 0%, #0d172f 100%);
}

.cyber-mode .podium-panel {
  background:
    radial-gradient(circle at 14% 20%, rgba(0, 220, 255, 0.2), transparent 30%),
    linear-gradient(180deg, #111c35 0%, #0d172e 100%);
}

.cyber-mode .channel-panel {
  background:
    radial-gradient(circle at 86% 14%, rgba(67, 115, 255, 0.2), transparent 28%),
    linear-gradient(180deg, #0f1a32 0%, #0c152a 100%);
}

.cyber-mode .radar-panel {
  background:
    radial-gradient(circle at 18% 20%, rgba(0, 220, 255, 0.2), transparent 30%),
    linear-gradient(180deg, #0f1a31 0%, #0c1429 100%);
}

.cyber-mode .luxury-panel {
  background:
    radial-gradient(circle at 82% 18%, rgba(112, 72, 255, 0.22), transparent 28%),
    linear-gradient(180deg, #101a33 0%, #0c142a 100%);
}

.cyber-mode .orb {
  background: linear-gradient(180deg, #122543 0%, #10203b 100%);
  border-color: #3277ab;
  color: #a8efff;
}

.cyber-mode .orb:nth-child(2n) {
  background: linear-gradient(180deg, #13284a 0%, #112241 100%);
  border-color: #3e84b8;
}

.cyber-mode .orb strong,
.cyber-mode .orb:nth-child(2n) strong {
  color: #c3feff;
}

.cyber-mode .chat-line {
  background: linear-gradient(180deg, #132746 0%, #11213d 100%);
  border-color: #3a7eb0;
}

.cyber-mode .chat-line:nth-child(2n) {
  background: linear-gradient(180deg, #162c4e 0%, #11213d 100%);
  border-color: #4a8abc;
}

.cyber-mode .chat-line p,
.cyber-mode .time,
.cyber-mode .podium-row em {
  color: #8ec9df;
}

.cyber-mode .luxury-card {
  background: linear-gradient(180deg, #132746 0%, #10213d 100%);
  border-color: #4387ba;
}

.cyber-mode .luxury-badge {
  background: linear-gradient(180deg, #13dfff 0%, #07b0ff 100%);
  border-color: #5cf2ff;
  color: #071226;
}

.cyber-mode .total-ring {
  border-color: #3379ac;
  background:
    conic-gradient(from 140deg, #10d9ff 0deg, #10d9ff 22deg, #0d1f3d 22deg, #0d1f3d 50deg, #10d9ff 50deg, #10d9ff 72deg, #0d1f3d 72deg, #0d1f3d 360deg);
}

.cyber-mode .total-ring small,
.cyber-mode .total-ring strong {
  border-color: #3379ac;
  background: #0d1b35;
  color: #bcf9ff;
}

.cyber-mode .podium-row {
  border-bottom-color: rgba(74, 138, 188, 0.34);
}

.cyber-mode .podium-row b {
  color: #b6f6ff;
}

.cyber-mode .ticker-item {
  color: #a7f2ff;
  border-right-color: rgba(83, 183, 227, 0.35);
}

.cyber-mode .ticker-item::before {
  background: #43e4ff;
  box-shadow: 0 0 8px rgba(67, 228, 255, 0.72);
}

.cyber-mode .war-ticker {
  border-color: #2f6f9c;
  background: linear-gradient(180deg, #0f1b34 0%, #0b1429 100%);
}

.cyber-mode .radar-track {
  border-color: #3679ab;
  background: #0b162d;
}

.cyber-mode .radar-fill {
  background: repeating-linear-gradient(90deg, #18dcff, #18dcff 7px, #0c1730 7px, #0c1730 13px);
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

