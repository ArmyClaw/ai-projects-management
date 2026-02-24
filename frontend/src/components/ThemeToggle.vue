<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NDropdown, NTooltip } from 'naive-ui'
import { useThemeStore } from '@/stores/theme'

/**
 * 主题切换组件
 * 
 * 功能：
 * - 显示当前主题图标
 * - 下拉切换主题选项
 * - 显示主题文字说明
 * - 平滑的主题切换动画
 */

const themeStore = useThemeStore()

/**
 * 下拉菜单选项
 */
const options = [
  {
    label: '浅色模式',
    key: 'light'
  },
  {
    label: '深色模式',
    key: 'dark'
  },
  {
    label: '跟随系统',
    key: 'auto'
  }
]

/**
 * 获取当前主题标签
 */
const currentThemeLabel = computed(() => {
  switch (themeStore.theme) {
    case 'light':
      return '浅色模式'
    case 'dark':
      return '深色模式'
    case 'auto':
      return '跟随系统'
    default:
      return '浅色模式'
  }
})

/**
 * 处理主题切换
 */
function handleSelect(key: string) {
  themeStore.setTheme(key as 'light' | 'dark' | 'auto')
}

/**
 * 获取主题图标
 */
function getThemeIcon() {
  return themeStore.getThemeIcon()
}
</script>

<template>
  <div class="theme-toggle" :class="{ 'is-dark': themeStore.isDark }">
    <n-dropdown
      :options="options"
      @select="handleSelect"
      trigger="click"
    >
      <n-button quaternary circle class="theme-button">
        <template #icon>
          <span class="theme-icon-wrapper">
            <span class="theme-icon">{{ getThemeIcon() }}</span>
          </span>
        </template>
      </n-button>
    </n-dropdown>
    
    <!-- 主题切换提示 -->
    <n-tooltip trigger="hover">
      <template #trigger>
        <div class="theme-indicator" :class="themeStore.theme">
          <span class="indicator-dot"></span>
        </div>
      </template>
      {{ currentThemeLabel }}
    </n-tooltip>
  </div>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* 主题按钮 */
.theme-button {
  position: relative;
  overflow: hidden;
}

.theme-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
}

.theme-toggle:hover .theme-icon-wrapper {
  transform: rotate(15deg);
}

/* 主题图标 */
.theme-icon {
  font-size: 18px;
  display: inline-block;
  transition: all 0.3s ease;
}

/* 主题指示器 */
.theme-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #18a058;
  position: relative;
  transition: all 0.3s ease;
}

.theme-indicator.dark {
  background-color: #e94560;
}

.theme-indicator.auto {
  background-color: #2080f0;
}

.indicator-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.5);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

/* 深色模式适配 */
html.dark .theme-button {
  background-color: rgba(255, 255, 255, 0.08);
}

html.dark .theme-button:hover {
  background-color: rgba(255, 255, 255, 0.12);
}

/* 主题切换动画 - 平滑过渡 */
.theme-toggle,
.theme-button,
.theme-icon {
  transition: all 0.3s ease;
}
</style>
