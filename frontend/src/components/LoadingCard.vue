<script setup lang="ts">
import { NCard, NSkeleton } from 'naive-ui'

/**
 * 卡片加载动画组件
 * 
 * 功能：
 * - 提供多种卡片骨架屏样式
 * - 支持自定义加载行数
 * - 平滑的加载动画
 */

interface Props {
  loading?: boolean
  title?: boolean
  rows?: number
  avatar?: boolean
  actions?: number
  showFooter?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: true,
  title: true,
  rows: 3,
  avatar: true,
  actions: 1,
  showFooter: false
})

// Props 用于模板中
</script>

<template>
  <n-card class="loading-card">
    <template #header>
      <!-- 标题区域 -->
      <div v-if="title" class="loading-header">
        <n-skeleton v-if="avatar" circle size="medium" />
        <div class="loading-title">
          <n-skeleton v-if="title" text style="width: 60%" />
        </div>
      </div>
    </template>

    <!-- 内容区域 -->
    <div class="loading-content">
      <n-skeleton v-for="i in rows" :key="i" :sharpness="90" height="16px" 
                  :style="{ width: i === rows ? '70%' : '100%' }" />
    </div>

    <!-- 底部区域 -->
    <template #footer>
      <div v-if="showFooter" class="loading-footer">
        <n-skeleton v-for="i in actions" :key="i" width="80px" height="32px" />
      </div>
    </template>
  </n-card>
</template>

<style scoped>
.loading-card {
  width: 100%;
  transition: all 0.3s ease;
}

.loading-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.loading-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.loading-title {
  flex: 1;
}

.loading-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.loading-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 加载动画增强 */
.loading-card :deep(.n-skeleton) {
  animation: skeleton-loading 1.5s ease-in-out infinite;
}

@keyframes skeleton-loading {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 深色模式适配 */
html.dark .loading-card {
  background-color: #16213e;
}

html.dark .loading-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
