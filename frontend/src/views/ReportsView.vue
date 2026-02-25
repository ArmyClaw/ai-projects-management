<template>
  <div class="reports-view">
    <div class="page-header">
      <h1>数据报表</h1>
      <div class="header-actions">
        <n-select
          v-model:value="selectedProject"
          :options="projectOptions"
          placeholder="选择项目"
          clearable
          style="width: 250px"
          @update:value="handleProjectChange"
        />
      </div>
    </div>

    <!-- 数据看板 -->
    <div class="dashboard-cards" v-if="!selectedProject">
      <div class="card">
        <div class="card-title">项目总数</div>
        <div class="card-value">{{ stats.totalProjects }}</div>
        <div class="card-sub">活跃 {{ stats.activeProjects }}</div>
      </div>
      <div class="card">
        <div class="card-title">任务总数</div>
        <div class="card-value">{{ stats.totalTasks }}</div>
        <div class="card-sub">完成 {{ stats.completedTasks }}</div>
      </div>
      <div class="card">
        <div class="card-title">用户总数</div>
        <div class="card-value">{{ stats.totalUsers }}</div>
        <div class="card-sub">活跃 {{ stats.activeUsers }}</div>
      </div>
      <div class="card">
        <div class="card-title">总积分</div>
        <div class="card-value">{{ stats.totalPoints.toLocaleString() }}</div>
      </div>
    </div>

    <!-- 项目详情 -->
    <div v-if="selectedProject" class="project-details">
      <!-- 进度概览 -->
      <n-card title="项目进度" class="detail-card">
        <div class="progress-overview">
          <n-progress
            type="circle"
            :percentage="projectProgress.progressPercentage"
            :color="getProgressColor(projectProgress.progressPercentage)"
          >
            <div class="progress-text">
              <div class="progress-value">{{ projectProgress.progressPercentage }}%</div>
              <div class="progress-label">完成度</div>
            </div>
          </n-progress>
          <div class="progress-stats">
            <div class="stat-item">
              <span class="stat-label">任务</span>
              <span class="stat-value">{{ projectProgress.completedTasks }}/{{ projectProgress.totalTasks }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">里程碑</span>
              <span class="stat-value">{{ projectProgress.completedMilestones }}/{{ projectProgress.totalMilestones }}</span>
            </div>
            <div class="stat-item" v-if="projectProgress.daysRemaining !== null">
              <span class="stat-label">剩余天数</span>
              <span class="stat-value">{{ projectProgress.daysRemaining }}天</span>
            </div>
          </div>
        </div>
      </n-card>

      <!-- 甘特图 -->
      <n-card title="甘特图" class="detail-card">
        <GanttChart v-if="ganttData.tasks.length" :data="ganttData" height="450px" />
        <n-empty v-else description="暂无任务数据" />
      </n-card>

      <!-- 燃尽图 -->
      <n-card title="燃尽图" class="detail-card">
        <BurndownChart
          v-if="burndownData.length"
          :data="burndownData"
          title="任务燃尽图"
          height="350px"
        />
        <n-empty v-else description="暂无数据" />
      </n-card>

      <!-- 里程碑管理 -->
      <n-card title="里程碑管理" class="detail-card">
        <MilestoneManager :project-id="selectedProject" />
      </n-card>
    </div>

    <!-- 整体概览图表 -->
    <n-card title="近7天活动趋势" class="activity-card">
      <div ref="activityChartRef" class="activity-chart"></div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue'
import {
  NCard,
  NSelect,
  NProgress,
  NEmpty,
  useMessage
} from 'naive-ui'
import {
  getDashboardStats,
  getProjectProgress,
  getProjectGantt,
  getProjectMilestones,
  type DashboardStats,
  type ProjectProgress,
  type GanttData,
  type Milestone
} from '@/services/api'
import GanttChart from '@/components/charts/GanttChart.vue'
import BurndownChart from '@/components/charts/BurndownChart.vue'
import MilestoneManager from '@/components/MilestoneManager.vue'
import * as echarts from 'echarts'

const message = useMessage()

const stats = ref<DashboardStats>({
  totalProjects: 0,
  activeProjects: 0,
  completedProjects: 0,
  totalTasks: 0,
  completedTasks: 0,
  totalUsers: 0,
  activeUsers: 0,
  totalPoints: 0,
  recentActivity: []
})

const selectedProject = ref<string | null>(null)
const projectOptions = ref<{ label: string; value: string }[]>([])

const projectProgress = ref<ProjectProgress>({
  id: '',
  title: '',
  status: 'ACTIVE',
  totalTasks: 0,
  completedTasks: 0,
  progressPercentage: 0,
  totalMilestones: 0,
  completedMilestones: 0,
  startDate: null,
  endDate: null,
  daysRemaining: null
})

const ganttData = ref<GanttData>({
  projectId: '',
  projectName: '',
  tasks: [],
  milestones: [],
  startDate: '',
  endDate: ''
})

const milestones = ref<Milestone[]>([])
const activityChartRef = ref<HTMLElement>()

let activityChart: echarts.ECharts | null = null

// 计算燃尽图数据
const burndownData = computed(() => {
  if (!projectProgress.value.totalTasks) return []
  
  const total = projectProgress.value.totalTasks
  const days = 7
  const idealPerDay = total / days
  
  return Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    const remaining = Math.max(0, total - (i + 1) * idealPerDay)
    return {
      date: date.toISOString().split('T')[0],
      remaining: Math.round(remaining),
      ideal: Math.round(total - (i + 1) * idealPerDay)
    }
  })
})

const fetchDashboardStats = async () => {
  try {
    stats.value = await getDashboardStats()
    renderActivityChart()
  } catch (error) {
    message.error('获取统计数据失败')
  }
}

const handleProjectChange = async (projectId: string | null) => {
  if (!projectId) return
  
  try {
    // 获取项目进度
    projectProgress.value = await getProjectProgress(projectId)
    
    // 获取甘特图数据
    ganttData.value = await getProjectGantt(projectId)
    
    // 获取里程碑列表
    milestones.value = await getProjectMilestones(projectId)
  } catch (error) {
    message.error('获取项目数据失败')
  }
}

const getProgressColor = (percentage: number): string => {
  if (percentage >= 80) return '#52c41a'
  if (percentage >= 50) return '#1890ff'
  return '#faad14'
}

const renderActivityChart = () => {
  if (!activityChartRef.value) return
  
  if (!activityChart) {
    activityChart = echarts.init(activityChartRef.value)
  }

  const dates = stats.value.recentActivity.map(a => a.date.slice(5))
  const projectData = stats.value.recentActivity.map(a => a.projectCount)
  const taskData = stats.value.recentActivity.map(a => a.taskCount)

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['新建项目', '完成任务'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '新建项目',
        type: 'bar',
        data: projectData,
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '完成任务',
        type: 'bar',
        data: taskData,
        itemStyle: { color: '#52c41a' }
      }
    ]
  }

  activityChart.setOption(option)
}

// 模拟项目列表（实际应从API获取）
projectOptions.value = [
  { label: 'AI 项目管理系统', value: 'project-1' },
  { label: '智能客服系统', value: 'project-2' },
  { label: '数据分析平台', value: 'project-3' }
]

onMounted(() => {
  fetchDashboardStats()
  window.addEventListener('resize', () => {
    activityChart?.resize()
  })
})

onUnmounted(() => {
  activityChart?.dispose()
})
</script>

<style scoped>
.reports-view {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
}

.card:nth-child(2) {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.card:nth-child(3) {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.card:nth-child(4) {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-title {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}

.card-sub {
  font-size: 13px;
  opacity: 0.8;
}

.project-details {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-card {
  border-radius: 12px;
}

.progress-overview {
  display: flex;
  align-items: center;
  gap: 48px;
}

.progress-text {
  text-align: center;
}

.progress-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
}

.progress-label {
  font-size: 14px;
  color: #666;
}

.progress-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.activity-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.activity-chart {
  width: 100%;
  height: 300px;
}
</style>
