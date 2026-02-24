/**
 * Vue Router 配置
 * 
 * 功能：
 * - 定义应用路由
 * - 支持懒加载视图组件
 * - 配置历史模式
 * - 添加预加载策略优化性能
 */

import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

// 懒加载视图组件
const loadView = (view: string) => () => import(`@/views/${view}.vue`)

// 路由配置
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: loadView('HomeView'),
    meta: { title: '首页', keepAlive: false }
  },
  {
    path: '/projects',
    name: 'Projects',
    component: loadView('ProjectsView'),
    meta: { title: '项目管理', keepAlive: true }
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: loadView('TasksView'),
    meta: { title: '任务管理', keepAlive: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: loadView('ReportsView'),
    meta: { title: '数据报表', keepAlive: true }
  },
  {
    path: '/skills',
    name: 'Skills',
    component: loadView('SkillsView'),
    meta: { title: '技能市场', keepAlive: false }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: loadView('ProfileView'),
    meta: { title: '个人档案', keepAlive: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 路由切换时滚动到顶部
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由预获取策略：用户悬停时预加载
const prefetchRoute = (to: RouteRecordRaw) => {
  const component = to.component
  if (typeof component === 'function' && 'then' in component) {
    // 组件已被预加载，无需重复加载
    return
  }
  // 触发路由组件加载
  if (typeof component === 'function') {
    component()
  }
}

// 全局前置守卫：页面标题设置
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = (to.meta.title as string) || 'AI Project Manager'
  
  // 性能监控：记录路由切换时间
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Router] Navigating from ${from.path} to ${to.path}`)
  }
  
  next()
})

// 后置守卫：路由切换完成后处理
router.afterEach((to, from) => {
  // 可以在这里添加页面访问统计等
})

export default router
