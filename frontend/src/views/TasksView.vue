<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { NCard, NButton, NTag, NGrid, NGi, NEmpty, NBadge } from 'naive-ui'
import axios, { AxiosError } from 'axios'
import SkeletonList from '@/components/SkeletonList.vue'

/**
 * 任务大厅视图
 * 
 * 功能：
 * - 展示可认领任务列表
 * - 显示任务状态和预算
 * - 支持筛选和搜索
 */

interface Task {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'CLAIMED' | 'COMPLETED'
  budget: number
  requiredSkills: string[]
  projectTitle: string
  assignee?: {
    name: string
  }
  createdAt: string
}

const tasks = ref<Task[]>([])
const loading = ref(true)
const activeTab = ref('all')
const error = ref<string | null>(null)

/**
 * 任务标签配置
 */
const statusConfig: Record<string, { type: 'success' | 'info' | 'warning'; text: string }> = {
  OPEN: { type: 'success', text: '可认领' },
  CLAIMED: { type: 'info', text: '已认领' },
  COMPLETED: { type: 'warning', text: '已完成' }
}

/**
 * 过滤任务列表
 */
const filteredTasks = computed(() => {
  if (activeTab.value === 'all') return tasks.value
  if (activeTab.value === 'open') return tasks.value.filter(t => t.status === 'OPEN')
  if (activeTab.value === 'claimed') return tasks.value.filter(t => t.status === 'CLAIMED')
  return tasks.value
})

/**
 * 获取任务列表
 */
async function fetchTasks() {
  loading.value = true
  error.value = null
  
  try {
    const response = await axios.get('http://localhost:4000/api/v1/tasks')
    if (response.data.success) {
      tasks.value = response.data.data.tasks
    }
  } catch (err) {
    const axiosError = err as AxiosError
    error.value = axiosError.message || '获取任务列表失败'
    tasks.value = mockTasks
  } finally {
    loading.value = false
  }
}

/**
 * 获取任务状态配置
 */
function getStatusConfig(status: string) {
  return statusConfig[status] || { type: 'info', text: status }
}

/**
 * 获取技能标签类型
 */
function getSkillType(skill: string): 'default' | 'primary' | 'error' | 'warning' | 'info' {
  const types: Array<'default' | 'primary' | 'error' | 'warning' | 'info'> = ['default', 'primary', 'error', 'warning', 'info']
  const index = skill.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return types[index % types.length]
}

// 模拟数据
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: '用户认证API开发',
    description: '开发RESTful API，包含注册、登录、密码重置功能',
    status: 'OPEN',
    budget: 3000,
    requiredSkills: ['Python', 'FastAPI', 'JWT'],
    projectTitle: 'AI代码审查工具',
    createdAt: new Date().toISOString()
  },
  {
    id: 'task-2',
    title: '前端界面开发',
    description: '使用Vue 3开发任务管理界面',
    status: 'CLAIMED',
    budget: 5000,
    requiredSkills: ['Vue 3', 'TypeScript', 'Naive UI'],
    projectTitle: 'AI代码审查工具',
    assignee: { name: '王五' },
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'task-3',
    title: '单元测试编写',
    description: '为后端API编写pytest单元测试',
    status: 'OPEN',
    budget: 2000,
    requiredSkills: ['Python', 'pytest'],
    projectTitle: 'AI代码审查工具',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  }
]

onMounted(() => {
  fetchTasks()
})
</script>

<template>
  <div class="tasks-view">
    <div class="container">
      <!-- 头部 -->
      <header class="header">
        <div class="header-content">
          <h1>任务大厅</h1>
          <p>选择感兴趣的任务，用Skill高效完成</p>
        </div>
      </header>

      <!-- 标签页 -->
      <div class="tabs">
        <n-badge :value="tasks.filter(t => t.status === 'OPEN').length" :max="99">
          <n-button 
            :type="activeTab === 'all' ? 'primary' : 'default'"
            @click="activeTab = 'all'"
          >
            全部任务
          </n-button>
        </n-badge>
        <n-badge :value="tasks.filter(t => t.status === 'OPEN').length" :max="99">
          <n-button 
            :type="activeTab === 'open' ? 'primary' : 'default'"
            @click="activeTab = 'open'"
          >
            可认领
          </n-button>
        </n-badge>
        <n-badge :value="tasks.filter(t => t.status === 'CLAIMED').length" :max="99">
          <n-button 
            :type="activeTab === 'claimed' ? 'primary' : 'default'"
            @click="activeTab = 'claimed'"
          >
            已认领
          </n-button>
        </n-badge>
      </div>

      <!-- 加载状态 - 骨架屏 -->
      <div v-if="loading" class="loading">
        <SkeletonList :count="3" />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <n-button @click="fetchTasks">重试</n-button>
      </div>

      <!-- 任务列表 -->
      <div v-else-if="filteredTasks.length > 0" class="tasks-grid">
        <n-grid :cols="1" :y-gap="16">
          <n-gi v-for="task in filteredTasks" :key="task.id">
            <n-card hoverable class="task-card">
              <div class="task-content">
                <div class="task-main">
                  <div class="task-header">
                    <h3>{{ task.title }}</h3>
                    <n-tag :type="getStatusConfig(task.status).type" size="small">
                      {{ getStatusConfig(task.status).text }}
                    </n-tag>
                  </div>
                  
                  <p class="description">{{ task.description }}</p>
                  
                  <div class="task-meta">
                    <span class="project">
                      <span class="label">项目：</span>
                      {{ task.projectTitle }}
                    </span>
                    <span class="budget">
                      <span class="label">预算：</span>
                      ¥{{ task.budget.toLocaleString() }}
                    </span>
                  </div>

                  <!-- 技能标签 -->
                  <div class="skills">
                    <n-tag 
                      v-for="skill in task.requiredSkills" 
                      :key="skill"
                      :type="getSkillType(skill)"
                      size="small"
                      round
                    >
                      {{ skill }}
                    </n-tag>
                  </div>
                </div>

                <div class="task-actions">
                  <n-button v-if="task.status === 'OPEN'" type="primary">
                    立即认领
                  </n-button>
                  <n-button v-else-if="task.assignee">
                    {{ task.assignee.name }} 正在做
                  </n-button>
                  <n-button>查看详情</n-button>
                </div>
              </div>
            </n-card>
          </n-gi>
        </n-grid>
      </div>

      <!-- 空状态 -->
      <n-empty v-else description="暂无任务" class="empty-state">
        <template #extra>
          <p>暂时没有符合条件任务</p>
        </template>
      </n-empty>
    </div>
  </div>
</template>

<style scoped>
.tasks-view {
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
  margin-bottom: 32px;
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
}

.header p {
  color: #666;
}

.tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.loading,
.error {
  text-align: center;
  padding: 60px 0;
}

.error {
  color: #f56c6c;
}

.task-card {
  border-radius: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.task-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.task-main {
  flex: 1;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.task-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.description {
  color: #666;
  margin-bottom: 16px;
  line-height: 1.6;
}

.task-meta {
  display: flex;
  gap: 24px;
  color: #999;
  font-size: 14px;
  margin-bottom: 16px;
}

.task-meta .label {
  color: #666;
}

.skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.task-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  padding: 80px 0;
}
</style>
