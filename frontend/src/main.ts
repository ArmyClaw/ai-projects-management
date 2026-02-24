/**
 * 应用入口文件
 * 
 * 功能：
 * - 初始化Vue应用实例
 * - 配置Pinia状态管理
 * - 注册Vue Router路由
 * - 配置i18n国际化
 * - 配置Naive UI组件库
 * - 挂载应用到DOM
 */

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import naive from 'naive-ui'
import App from './App.vue'
import router from './router'
import i18n from './locales'

import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(naive)

app.mount('#app')
