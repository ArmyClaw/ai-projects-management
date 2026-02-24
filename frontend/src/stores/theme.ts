/**
 * 主题Store
 * 
 * 管理应用主题（浅色/深色/自动）
 */

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

/**
 * 主题类型
 */
export type Theme = 'light' | 'dark' | 'auto'

/**
 * 使用主题Store
 */
export const useThemeStore = defineStore('theme', () => {
  // 状态
  const theme = ref<Theme>('auto')
  const systemPrefersDark = ref(false)

  // 计算属性
  const isDark = computed(() => {
    if (theme.value === 'dark') return true
    if (theme.value === 'light') return false
    // auto模式：跟随系统
    return systemPrefersDark.value
  })

  const currentTheme = computed(() => {
    return isDark.value ? 'dark' : 'light'
  })

  /**
   * 初始化主题
   */
  function initialize() {
    // 从localStorage恢复主题设置
    const savedTheme = localStorage.getItem('app-theme') as Theme | null
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      theme.value = savedTheme
    }

    // 检测系统主题偏好
    detectSystemTheme()

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      systemPrefersDark.value = e.matches
      if (theme.value === 'auto') {
        applyTheme()
      }
    })
  }

  /**
   * 检测系统主题偏好
   */
  function detectSystemTheme() {
    systemPrefersDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  /**
   * 设置主题
   */
  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    localStorage.setItem('app-theme', newTheme)
    applyTheme()
  }

  /**
   * 切换主题
   */
  function toggleTheme() {
    const themeOrder: Theme[] = ['light', 'dark', 'auto']
    const currentIndex = themeOrder.indexOf(theme.value)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    setTheme(themeOrder[nextIndex])
  }

  /**
   * 应用主题到DOM
   */
  function applyTheme() {
    const html = document.documentElement
    if (isDark.value) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  /**
   * 获取主题图标
   */
  function getThemeIcon(): string {
    switch (theme.value) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'auto':
        return '🔄'
      default:
        return '🎨'
    }
  }

  /**
   * 获取主题文本
   */
  function getThemeText(): string {
    switch (theme.value) {
      case 'light':
        return '浅色'
      case 'dark':
        return '深色'
      case 'auto':
        return '跟随系统'
      default:
        return '自动'
    }
  }

  // 监听主题变化，自动应用
  watch(theme, () => {
    applyTheme()
  })

  return {
    // 状态
    theme,
    systemPrefersDark,
    
    // 计算属性
    isDark,
    currentTheme,
    
    // 方法
    initialize,
    setTheme,
    toggleTheme,
    applyTheme,
    detectSystemTheme,
    getThemeIcon,
    getThemeText
  }
})
