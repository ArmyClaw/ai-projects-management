<template>
  <div class="pager-wrap" :class="{ compact: total === 0 }">
    <div class="pager-meta">
      <span class="muted">{{ locale === "zh-CN" ? "共" : "Total" }} {{ total }}</span>
      <span class="dot">•</span>
      <span class="muted">
        {{ locale === "zh-CN" ? "第" : "Page" }}
        {{ safePage }}/{{ totalPages }}
        {{ locale === "zh-CN" ? "页" : "" }}
      </span>
    </div>

    <div class="pager-controls">
      <label class="size-label" for="page-size">{{ locale === "zh-CN" ? "每页" : "Size" }}</label>
      <select id="page-size" class="size-select" :value="pageSize" @change="onPageSizeChange">
        <option v-for="size in mergedPageSizes" :key="size" :value="size">{{ size }}</option>
      </select>

      <button class="pager-btn" :disabled="safePage <= 1" @click="goTo(1)">«</button>
      <button class="pager-btn" :disabled="safePage <= 1" @click="goTo(safePage - 1)">‹</button>
      <button class="pager-btn current">{{ safePage }}</button>
      <button class="pager-btn" :disabled="safePage >= totalPages" @click="goTo(safePage + 1)">›</button>
      <button class="pager-btn" :disabled="safePage >= totalPages" @click="goTo(totalPages)">»</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  total: number;
  page: number;
  pageSize: number;
  pageSizes?: number[];
  locale?: string;
}>();

const emit = defineEmits<{
  "update:page": [value: number];
  "update:pageSize": [value: number];
}>();

const mergedPageSizes = computed(() => {
  const base = props.pageSizes && props.pageSizes.length > 0 ? props.pageSizes : [5, 10, 20, 50];
  return [...new Set(base)].sort((a, b) => a - b);
});

const totalPages = computed(() => Math.max(1, Math.ceil(Math.max(0, props.total) / Math.max(1, props.pageSize))));
const safePage = computed(() => Math.min(Math.max(1, props.page), totalPages.value));

const goTo = (next: number) => {
  const normalized = Math.min(Math.max(1, next), totalPages.value);
  emit("update:page", normalized);
};

const onPageSizeChange = (event: Event) => {
  const next = Number((event.target as HTMLSelectElement).value);
  if (!Number.isFinite(next) || next <= 0) return;
  emit("update:pageSize", next);
  emit("update:page", 1);
};
</script>

<style scoped>
.pager-wrap {
  margin-top: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px 10px;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  background: linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%);
}

.pager-wrap.compact {
  opacity: 0.8;
}

.pager-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.dot {
  color: var(--text-secondary);
}

.pager-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.size-label {
  margin: 0;
  font-size: 11px;
}

.size-select {
  height: 28px;
  border: 1px solid color-mix(in srgb, var(--border) 58%, transparent);
  border-radius: 999px;
  padding: 0 10px;
  background: var(--surface);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 700;
}

.pager-btn {
  min-width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border) 58%, transparent);
  background: var(--surface);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 700;
}

.pager-btn.current {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary-soft) 70%, var(--surface) 30%);
}

.pager-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

@media (max-width: 760px) {
  .pager-wrap {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
