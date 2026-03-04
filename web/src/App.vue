<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-top">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">
            <span class="eye left"></span>
            <span class="eye right"></span>
            <span class="smile"></span>
          </span>
          <span class="brand-text">Agent Team Builder</span>
        </div>
        <nav>
          <RouterLink to="/hall" class="nav-link">{{ t("nav.hall") }}</RouterLink>
          <RouterLink to="/models" class="nav-link">{{ t("nav.models") }}</RouterLink>
          <RouterLink to="/skills" class="nav-link">{{ t("nav.skills") }}</RouterLink>
          <RouterLink to="/mcps" class="nav-link">{{ t("nav.mcps") }}</RouterLink>
          <RouterLink to="/agents" class="nav-link">{{ t("nav.agents") }}</RouterLink>
          <RouterLink to="/bootstrap" class="nav-link">{{ t("nav.bootstrap") }}</RouterLink>
        </nav>
      </div>
      <div class="sidebar-locale">
        <label class="locale-label" for="locale-select">{{ locale === "zh-CN" ? "语言" : "Language" }}</label>
        <select id="locale-select" class="locale-select" :value="locale" @change="onLocaleChange">
          <option value="zh-CN">{{ t("lang.zh") }}</option>
          <option value="en-US">{{ t("lang.en") }}</option>
        </select>
      </div>
    </aside>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import type { Locale } from "./lib/i18n";
import { useI18n } from "./lib/i18n";

const { t, locale, setLocale } = useI18n();

const onLocaleChange = (event: Event) => {
  const value = (event.target as HTMLSelectElement).value as Locale;
  if (value === "zh-CN" || value === "en-US") setLocale(value);
};
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
}

.sidebar-top {
  display: grid;
  gap: 10px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 9px;
  line-height: 1;
}

.brand-text {
  display: inline-block;
  transform: translateY(1px);
}

.brand-mark {
  width: 22px;
  height: 16px;
  border: 1.5px solid #2f2a39;
  border-radius: 999px;
  display: inline-block;
  position: relative;
  flex: 0 0 auto;
  background: #fff;
}

.eye {
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: #2f2a39;
  position: relative;
  top: 4px;
  display: inline-block;
}

.eye.left {
  left: 6px;
}

.eye.right {
  left: 10px;
}

.smile {
  position: absolute;
  left: 7px;
  top: 7px;
  width: 7px;
  height: 4px;
  border: 1.5px solid #2f2a39;
  border-top: 0;
  border-radius: 0 0 8px 8px;
}

.sidebar-locale {
  margin-top: auto;
  border-top: 1px dashed #d6d6d6;
  padding-top: 10px;
  display: grid;
  gap: 6px;
}

.locale-label {
  margin: 0;
  font-size: 11px;
  color: #646464;
  font-weight: 700;
}

.locale-select {
  width: 100%;
  height: 30px;
  border: 1px solid #d9d9d9;
  border-radius: 999px;
  background: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 0 10px;
}

@media (max-width: 900px) {
  .sidebar-locale {
    margin-top: 8px;
  }
}
</style>
