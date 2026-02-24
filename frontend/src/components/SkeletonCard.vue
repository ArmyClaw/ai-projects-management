<script setup lang="ts">
import { NSkeleton } from 'naive-ui'

/**
 * 骨架屏卡片组件
 * 用于列表页面加载状态展示
 */

interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 3
})
</script>

<template>
  <div class="skeleton-card">
    <n-skeleton v-for="i in count" :key="i" class="skeleton-item">
      <template #avatar>
        <n-skeleton circle size="large" />
      </template>
      <template #default>
        <n-skeleton text :width="`${60 + Math.random() * 30}%`" />
        <n-skeleton text :width="`${80 + Math.random() * 15}%`" style="margin-top: 8px;" />
        <n-skeleton text :width="`${40 + Math.random() * 20}%`" style="margin-top: 8px;" />
      </template>
    </n-skeleton>
  </div>
</template>

<style scoped>
.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-item {
  padding: 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
</style>
