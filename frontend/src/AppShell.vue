<script setup lang="ts">
import { onMounted, computed, h, provide, ref } from 'vue'
import { NConfigProvider, darkTheme, NLayout, NLayoutHeader, NMenu, NIcon, NAvatar, NDropdown, NButton, NDrawer, NDrawerContent, NSpace } from 'naive-ui'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useThemeStore } from '@/stores/theme'
import { useNotificationStore } from '@/stores/notification'
import ThemeToggle from '@/components/ThemeToggle.vue'
import NotificationCenter from '@/components/NotificationCenter.vue'
import LanguageSelector from '@/components/LanguageSelector.vue'
import { setGlobalMessage, setGlobalUserStore } from '@/services/api'
import { useMessage } from 'naive-ui'

/**
 * 应用入口组件
 * 
 * 功能：
 * - 初始化Pinia状态管理
 * - 尝试恢复用户登录状态
 * - 初始化主题设置
 * - 配置路由过渡动画
 * - 配置错误边界
 */

const userStore = useUserStore()
const themeStore = useThemeStore()
const notificationStore = useNotificationStore()
const router = useRouter()
const route = useRoute()

// 获取 Naive UI message 实例
const naiveMessage = useMessage()

// 提供 message 给全局
provide('message', naiveMessage)
setGlobalMessage(naiveMessage)
setGlobalUserStore(userStore)

// 计算当前Naive UI主题
const naiveTheme = computed(() => {
  return themeStore.isDark ? darkTheme : null
})

// 移动端抽屉状态
const mobileMenuVisible = ref(false)

// 导航菜单
const menuOptions = [
  {
    label: '首页',
    key: '/',
    icon: () => h(NIcon, null, { default: () => h('span', '🏠') })
  },
  {
    label: '项目',
    key: '/projects',
    icon: () => h(NIcon, null, { default: () => h('span', '📁') })
  },
  {
    label: '任务',
    key: '/tasks',
    icon: () => h(NIcon, null, { default: () => h('span', '📋') })
  },
  {
    label: '报表',
    key: '/reports',
    icon: () => h(NIcon, null, { default: () => h('span', '📊') })
  },
  {
    label: '技能',
    key: '/skills',
    icon: () => h(NIcon, null, { default: () => h('span', '🛠️') })
  }
]

// 用户下拉菜单
const userMenuOptions = [
  {
    label: '个人档案',
    key: '/profile'
  },
  {
    label: '退出登录',
    key: 'logout'
  }
]

// 处理菜单选择
function handleMenuUpdate(key: string) {
  mobileMenuVisible.value = false
  if (key === 'logout') {
    userStore.logout()
    router.push('/login')
  } else {
    router.push(key)
  }
}

// 处理用户菜单选择
function handleUserMenuUpdate(key: string) {
  if (key === 'logout') {
    userStore.logout()
    router.push('/login')
  } else {
    router.push(key)
  }
}

// 打开移动端菜单
function openMobileMenu() {
  mobileMenuVisible.value = true
}

// 初始化应用
onMounted(async () => {
  // 初始化主题
  themeStore.initialize()
  
  // 尝试恢复登录状态
  await userStore.initialize()
  
  // 如果已登录，获取未读通知数量并初始化WebSocket
  if (userStore.isAuthenticated) {
    await notificationStore.fetchUnreadCount()
    // 初始化WebSocket实时通知
    notificationStore.initWebSocket()
  }
})
</script>

<template>
  <n-config-provider :theme="naiveTheme">
    <n-layout has-header style="min-height: 100vh;">
      <!-- 顶部导航 -->
      <n-layout-header class="app-header">
        <div class="app-header-inner">
          <!-- 左侧：Logo和菜单 -->
          <div class="header-left">
            <!-- 汉堡菜单按钮（移动端） -->
            <n-button class="hamburger-btn" circle @click="openMobileMenu">
              <template #icon>
                <span class="hamburger-icon">☰</span>
              </template>
            </n-button>
            
            <!-- Logo -->
            <div class="logo">
              <span class="logo-mark">◎</span>
              <div class="logo-text">
                <div class="logo-title">AI Project Manager</div>
                <div class="logo-subtitle">Warm, calm, focused</div>
              </div>
            </div>
            
            <!-- 桌面端导航菜单 -->
            <n-menu 
              class="desktop-menu"
              mode="horizontal" 
              :options="menuOptions" 
              :value="route.path"
              @update:value="handleMenuUpdate"
              style="border-bottom: none;"
            />
          </div>

          <!-- 右侧：通知、主题切换、语言切换、用户 -->
          <div class="header-right">
            <!-- 通知中心 -->
            <NotificationCenter />

            <!-- 主题切换 -->
            <ThemeToggle />

            <!-- 语言切换 -->
            <LanguageSelector />

            <!-- 用户菜单 -->
            <n-dropdown :options="userMenuOptions" @select="handleUserMenuUpdate" v-if="userStore.user">
              <div class="user-menu-trigger">
                <n-avatar 
                  :size="32" 
                  :src="userStore.user.avatar" 
                  round
                >
                  {{ userStore.user.name.charAt(0) }}
                </n-avatar>
                <span class="user-name">{{ userStore.user.name }}</span>
              </div>
            </n-dropdown>
            <n-button v-else type="primary" size="small" class="login-btn" @click="router.push('/login')">
              登录
            </n-button>
          </div>
        </div>
      </n-layout-header>

      <!-- 移动端抽屉菜单 -->
      <n-drawer v-model:show="mobileMenuVisible" :width="280" placement="left">
        <n-drawer-content title="导航菜单" closable>
          <n-menu 
            mode="vertical" 
            :options="menuOptions" 
            :value="route.path"
            @update:value="handleMenuUpdate"
          />
          <n-divider />
          <n-space vertical style="width: 100%; gap: 12px;">
            <div v-if="userStore.user" style="padding: 12px; background: var(--bg-secondary); border-radius: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px;">{{ userStore.user.name }}</div>
              <n-button block @click="handleUserMenuUpdate('/profile')">个人档案</n-button>
              <n-button block style="margin-top: 8px;" @click="handleUserMenuUpdate('logout')">退出登录</n-button>
            </div>
            <n-button v-else type="primary" block @click="router.push('/login')">
              登录
            </n-button>
          </n-space>
        </n-drawer-content>
      </n-drawer>

      <!-- 主内容区 - 路由过渡动画 -->
      <div class="main-content">
        <div class="page-surface">
        <RouterView v-slot="{ Component }">
          <Transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
        </div>
      </div>
    </n-layout>
  </n-config-provider>
</template>

<style>
#app {
  width: 100%;
  min-height: 100vh;
}

/* ========================
   响应式头部布局
   ======================== */
.app-header {
  height: 72px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background: linear-gradient(180deg, rgba(255, 247, 240, 0.96), rgba(255, 241, 230, 0.92));
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.app-header-inner {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--accent-color);
  white-space: nowrap;
}

.logo-mark {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #ffe7d6;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #d16a6a;
  font-size: 18px;
}

.logo-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.logo-title {
  font-size: 16px;
  font-weight: 700;
}

.logo-subtitle {
  font-size: 11px;
  color: var(--text-secondary);
}

/* 汉堡菜单按钮 */
.hamburger-btn {
  display: none;
}

.hamburger-icon {
  font-size: 20px;
}

/* 用户菜单 */
.user-menu-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 8px;
}

.user-name {
  font-size: 14px;
  white-space: nowrap;
}

.login-btn {
  border-radius: 999px;
  padding: 0 16px;
}

/* ========================
   响应式断点 (768px)
   ======================== */
@media (max-width: 768px) {
  .app-header {
    padding: 0 12px;
  }
  
  .hamburger-btn {
    display: flex;
  }
  
  .logo {
    font-size: 16px;
  }
  
  .header-left {
    gap: 12px;
  }
  
  .header-right {
    gap: 8px;
  }
  
  .user-name {
    display: none;
  }
  
  .desktop-menu {
    display: none;
  }
  
  .main-content {
    padding: 16px !important;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 8px;
  }
  
  .logo {
    font-size: 14px;
  }
  
  .header-right {
    gap: 4px;
  }
  
  .main-content {
    padding: 12px !important;
  }
}

/* ========================
   路由过渡动画 - fade-slide
   ======================== */

/* 入场动画 */
.fade-slide-enter-active {
  animation: fadeSlideIn 0.3s ease-out;
}

/* 出场动画 */
.fade-slide-leave-active {
  animation: fadeSlideOut 0.3s ease-in;
}

/* 定义关键帧 */
@keyframes fadeSlideIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeSlideOut {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* ========================
   全局过渡动画
   ======================== */

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ========================
   深色模式样式覆盖
   ======================== */
html.dark {
  --bg-primary: #2b1d16;
  --bg-secondary: #241812;
  --bg-tertiary: #1d130e;
  --text-primary: #f6eadf;
  --text-secondary: #c8b2a3;
  --border-color: #3a261c;
  --accent-color: #e07a47;
  --success-color: #6aa476;
  --warning-color: #f0b36a;
  --error-color: #d36b6b;
}

html:not(.dark) {
  --bg-primary: #fff7f0;
  --bg-secondary: #fff1e6;
  --bg-tertiary: #ffe7d6;
  --text-primary: #3a2a1f;
  --text-secondary: #6f564a;
  --border-color: #f2d4c2;
  --accent-color: #e07a47;
  --success-color: #5f9c73;
  --warning-color: #e6a35a;
  --error-color: #d16a6a;
}

/* ========================
   全局CSS变量
   ======================== */
:root {
  --bg-primary: #fff7f0;
  --bg-secondary: #fff1e6;
  --bg-tertiary: #ffe7d6;
  --text-primary: #3a2a1f;
  --text-secondary: #6f564a;
  --border-color: #f2d4c2;
  --accent-color: #e07a47;
  --success-color: #5f9c73;
  --warning-color: #e6a35a;
  --error-color: #d16a6a;
}

/* 深色模式覆盖 */
@media (prefers-color-scheme: dark) {
  html:not(.light) {
    --bg-primary: #2b1d16;
    --bg-secondary: #241812;
    --bg-tertiary: #1d130e;
    --text-primary: #f6eadf;
    --text-secondary: #c8b2a3;
    --border-color: #3a261c;
  }
}

/* ========================
   主内容区响应式
   ======================== */
.main-content {
  padding: 24px 16px 48px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-surface {
  background: #fffaf6;
  border: 1px solid #f2d4c2;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 18px 40px rgba(90, 54, 35, 0.08);
}

@media (max-width: 1200px) {
  .main-content {
    max-width: 100%;
  }
}
</style>
