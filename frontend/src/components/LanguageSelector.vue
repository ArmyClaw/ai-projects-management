<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NDropdown } from 'naive-ui'

/**
 * 语言切换组件
 * 
 * 功能：
 * - 支持中英文切换
 * - 下拉选择语言
 * - 自动保存语言偏好
 * - 响应式图标显示
 */

const { locale } = useI18n()

/**
 * 语言选项接口
 */
interface LanguageOption {
  label: string
  key: string
  icon: string
}

/**
 * 可用语言列表
 */
const languageOptions: LanguageOption[] = [
  {
    label: '中文',
    key: 'zh-CN',
    icon: '🇨🇳'
  },
  {
    label: 'English',
    key: 'en-US',
    icon: '🇺🇸'
  }
]

/**
 * 获取当前语言显示文本
 */
const currentLanguage = computed(() => {
  const lang = languageOptions.find(l => l.key === locale.value)
  return lang?.label ?? '中文'
})

/**
 * 获取当前语言图标
 */
const currentIcon = computed(() => {
  const lang = languageOptions.find(l => l.key === locale.value)
  return lang?.icon ?? '🇨🇳'
})

/**
 * 切换语言
 * @param key - 语言key
 */
function handleLanguageChange(key: string): void {
  locale.value = key
  localStorage.setItem('locale', key)
}
</script>

<template>
  <n-dropdown 
    :options="languageOptions" 
    @select="handleLanguageChange"
    trigger="click"
  >
    <div class="language-switcher">
      <span class="icon">{{ currentIcon }}</span>
      <span class="label">{{ currentLanguage }}</span>
    </div>
  </n-dropdown>
</template>

<style scoped>
.language-switcher {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.language-switcher:hover {
  background-color: var(--bg-tertiary, #f0f2f5);
}

.icon {
  font-size: 16px;
}

.label {
  font-size: 14px;
  color: var(--text-primary, #333);
}
</style>
