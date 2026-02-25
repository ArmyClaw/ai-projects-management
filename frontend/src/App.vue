<script setup lang="ts">
import { NMessageProvider } from 'naive-ui'
import AppShell from './AppShell.vue'
</script>

<template>
  <n-message-provider>
    <AppShell />
  </n-message-provider>
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
  height: 64px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-primary);
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
  font-size: 18px;
  font-weight: bold;
  color: var(--accent-color);
  white-space: nowrap;
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

/* ========================
   全局CSS变量
   ======================== */
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

/* ========================
   主内容区响应式
   ======================== */
.main-content {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 1200px) {
  .main-content {
    max-width: 100%;
  }
}
</style>
