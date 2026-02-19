<script setup lang="ts">
import { onMounted } from 'vue'
import { NMessageProvider, NConfigProvider, darkTheme } from 'naive-ui'
import { RouterView } from 'vue-router'
import { useUserStore } from '@/stores/user'

/**
 * 应用入口组件
 * 
 * 功能：
 * - 初始化Pinia状态管理
 * - 尝试恢复用户登录状态
 */

const userStore = useUserStore()

// 初始化应用
onMounted(async () => {
  // 尝试恢复登录状态
  await userStore.initialize()
})
</script>

<template>
  <n-config-provider>
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
</style>
