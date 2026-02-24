<script setup lang="ts">
import { NSkeleton } from 'naive-ui'

/**
 * 骨架屏列表组件
 * 用于任务列表等加载状态展示
 */

interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 3
})
</script>

<template>
  <div class="skeleton-list">
    <n-skeleton v-for="i in count" :key="i" class="skeleton-item">
      <template #default>
        <div class="skeleton-content">
          <div class="skeleton-header">
            <n-skeleton text :width="`${40 + Math.random() * 20}%`" />
            <n-skeleton text :width="60" height="24" style="border-radius: 4px;" />
          </div>
          <n-skeleton text :width="`${70 + Math.random() * 25}%`" style="margin-top: 12px;" />
          <div class="skeleton-meta">
            <n-skeleton text :width="100" />
            <n-skeleton text :width="80" />
          </div>
          <div class="skeleton-skills">
            <n-skeleton text :width="60" height="20" style="border-radius: 10px;" />
            <n-skeleton text :width="70" height="20" style="border-radius: 10px;" />
            <n-skeleton text :width="50" height="20" style="border-radius: 10px;" />
          </div>
        </div>
      </template>
    </n-skeleton>
  </div>
</template>

<style scoped>
.skeleton-list {
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

.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skeleton-meta {
  display: flex;
  gap: 24px;
}

.skeleton-skills {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
</style>
