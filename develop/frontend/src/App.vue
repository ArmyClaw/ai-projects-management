<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { NMessageProvider, NConfigProvider, darkTheme } from 'naive-ui'
import { RouterView } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'

/**
 * 应用入口组件
 * 
 * 功能：
 * - 初始化Pinia状态管理
 * - 尝试恢复用户登录状态
 * - 初始化主题设置
 */

const userStore = useUserStore()
const themeStore = useThemeStore()

// 计算当前Naive UI主题
const naiveTheme = computed(() => {
  return themeStore.isDark ? darkTheme : null
})

// 初始化应用
onMounted(async () => {
  // 初始化主题
  themeStore.initialize()
  
  // 尝试恢复登录状态
  await userStore.initialize()
})
</script>

<template>
  <n-config-provider :theme="naiveTheme">
    <n-message-provider>
      <RouterView />
    </n-message-provider>
  </n-config-provider>
</template>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}

/* 全局过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 深色模式样式覆盖 */
html.dark {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-tertiary: #0f3460;
  --text-primary: #eaeaea;
  --text-secondary: #a0a0a0;
  --border-color: #2d2d44;
  --accent-color: #e94560;
  --success-color: #18a058;
  --warning-color: #f0a020;
  --error-color: #d03050;
}

html:not(.dark) {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f0f2f5;
  --text-primary: #333639;
  --text-secondary: #666;
  --border-color: #e8e8e8;
  --accent-color: #18a058;
  --success-color: #18a058;
  --warning-color: #f0a020;
  --error-color: #d03050;
}

/* 全局CSS变量 */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f0f2f5;
  --text-primary: #333639;
  --text-secondary: #666;
  --border-color: #e8e8e8;
  --accent-color: #18a058;
  --success-color: #18a058;
  --warning-color: #f0a020;
  --error-color: #d03050;
}

/* 深色模式覆盖 */
@media (prefers-color-scheme: dark) {
  html:not(.light) {
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --bg-tertiary: #0f3460;
    --text-primary: #eaeaea;
    --text-secondary: #a0a0a0;
    --border-color: #2d2d44;
  }
}
</style>
