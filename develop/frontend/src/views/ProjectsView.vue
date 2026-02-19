<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { NCard, NButton, NTag, NGrid, NGi, NEmpty, NSpin } from 'naive-ui'
import { useProjectStore, type Project } from '@/stores/project'

/**
 * 项目列表视图
 * 
 * 功能：
 * - 从API获取项目列表（使用Project Store）
 * - 展示项目卡片
 * - 显示项目状态和进度
 */

const projectStore = useProjectStore()

/**
 * 计算项目进度（如果没有返回进度，则估算）
 */
function calculateProgress(status: string): number {
  const progressMap: Record<string, number> = {
    DRAFT: 0,
    ACTIVE: 50,
    COMPLETED: 100,
    CANCELLED: 0
  }
  return progressMap[status] || 0
}

/**
 * 获取状态标签类型
 */
function getStatusType(status: string): 'success' | 'info' | 'warning' | 'error' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    DRAFT: 'warning',
    ACTIVE: 'info',
    COMPLETED: 'success',
    CANCELLED: 'error'
  }
  return map[status] || 'info'
}

/**
 * 获取状态文本
 */
function getStatusText(status: string): string {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    ACTIVE: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

onMounted(() => {
  projectStore.fetchProjects()
})
}

/**
 * 获取状态标签类型
 */
function getStatusType(status: string): 'success' | 'info' | 'warning' | 'error' {
  const map: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
    DRAFT: 'warning',
    ACTIVE: 'info',
    COMPLETED: 'success',
    CANCELLED: 'error'
  }
  return map[status] || 'info'
}

/**
 * 获取状态文本
 */
function getStatusText(status: string): string {
  const map: Record<string, string> = {
    DRAFT: '草稿',
    ACTIVE: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消'
  }
  return map[status] || status
}

// 模拟数据
const mockProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'AI代码审查工具',
    description: '基于AI的自动化代码审查工具',
    status: 'ACTIVE',
    budget: 10000,
    progress: 66,
    initiator: { name: '张三' },
    createdAt: new Date().toISOString()
  },
  {
    id: 'proj-2',
    title: '智能客服系统',
    description: '基于大语言模型的智能客服',
    status: 'COMPLETED',
    budget: 15000,
    progress: 100,
    initiator: { name: '李四' },
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  }
]

onMounted(() => {
  fetchProjects()
})
</script>

<template>
  <div class="projects-view">
    <div class="container">
      <!-- 头部 -->
      <header class="header">
        <div class="header-content">
          <h1>我的项目</h1>
          <p>管理您发起和参与的项目</p>
        </div>
        <n-button type="primary">发起新项目</n-button>
      </header>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <n-spin size="large" />
        <p>加载中...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="projectStore.error" class="error">
        <p>{{ projectStore.error }}</p>
        <n-button @click="projectStore.fetchProjects()">重试</n-button>
      </div>

      <!-- 项目列表 -->
      <div v-else-if="projectStore.projects.length > 0" class="projects-grid">
        <n-grid :cols="2" :x-gap="24" :y-gap="24">
          <n-gi v-for="project in projectStore.projects" :key="project.id">
            <n-card hoverable class="project-card">
              <template #header>
                <div class="project-header">
                  <h3>{{ project.title }}</h3>
                  <n-tag :type="getStatusType(project.status)" size="small">
                    {{ getStatusText(project.status) }}
                  </n-tag>
                </div>
              </template>
              
              <div class="project-content">
                <p class="description">{{ project.description }}</p>
                
                <div class="project-meta">
                  <span>预算：¥{{ project.budget.toLocaleString() }}</span>
                  <span>发起人：{{ project.initiator.name }}</span>
                </div>
                
                <!-- 进度条 -->
                <div class="progress-section">
                  <div class="progress-label">
                    <span>进度：{{ calculateProgress(project.status) }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: calculateProgress(project.status) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>

              <template #footer>
                <div class="project-actions">
                  <n-button size="small">查看详情</n-button>
                  <n-button size="small" type="primary">管理</n-button>
                </div>
              </template>
            </n-card>
          </n-gi>
        </n-grid>
      </div>

      <!-- 空状态 -->
      <n-empty v-else description="暂无项目" class="empty-state">
        <template #extra>
          <n-button type="primary">发起第一个项目</n-button>
        </template>
      </n-empty>
    </div>
  </div>
</template>

<style scoped>
.projects-view {
  min-height: 100vh;
  background: #f5f7f9;
  padding: 24px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.header-content h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.header-content p {
  color: #666;
}

.loading,
.error {
  text-align: center;
  padding: 60px 0;
}

.error {
  color: #f56c6c;
}

.projects-grid {
  margin-top: 24px;
}

.project-card {
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.project-content {
  padding: 8px 0;
}

.description {
  color: #666;
  margin-bottom: 16px;
  line-height: 1.6;
}

.project-meta {
  display: flex;
  gap: 24px;
  color: #999;
  font-size: 14px;
  margin-bottom: 16px;
}

.progress-section {
  margin-top: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.progress-bar {
  height: 6px;
  background: #e8e8e8;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #18a058, #36ad6a);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.project-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.empty-state {
  padding: 80px 0;
}
</style>
