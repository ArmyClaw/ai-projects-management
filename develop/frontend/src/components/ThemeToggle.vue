<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NDropdown, NIcon } from 'naive-ui'
import { useThemeStore } from '@/stores/theme'

/**
 * 主题切换组件
 * 
 * 功能：
 * - 显示当前主题图标
 * - 下拉切换主题选项
 * - 显示主题文字说明
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
 * 处理主题切换
 */
function handleSelect(key: string) {
  themeStore.setTheme(key as 'light' | 'dark' | 'auto')
}
</script>

<template>
  <div class="theme-toggle">
    <n-dropdown
      :options="options"
      @select="handleSelect"
      trigger="click"
    >
      <n-button quaternary circle>
        <template #icon>
          <span class="theme-icon">{{ themeStore.getThemeIcon() }}</span>
        </template>
      </n-button>
    </n-dropdown>
  </div>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
}

.theme-icon {
  font-size: 18px;
}
</style>
