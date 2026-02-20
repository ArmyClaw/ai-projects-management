<template>
  <div class="project-compare">
    <div class="compare-header">
      <h2>项目对比分析</h2>
      <div class="compare-actions">
        <n-select
          v-model:value="selectedProjects"
          multiple
          :options="projectOptions"
          placeholder="选择项目进行对比（最多5个）"
          :max-tag-count="5"
          style="width: 350px"
          @update:value="handleProjectChange"
        />
        <n-button type="primary" :disabled="selectedProjects.length < 2" @click="fetchCompareData">
          开始对比
        </n-button>
      </div>
    </div>

    <!-- 对比数据表格 -->
    <n-card v-if="compareData.projects.length > 0" title="对比数据" class="compare-card">
      <n-data-table
        :columns="tableColumns"
        :data="compareData.projects"
        :bordered="false"
        :single-line="false"
      />
    </n-card>

    <!-- 对比图表 -->
    <div v-if="compareData.projects.length > 0" class="charts-container">
      <!-- 完成率对比 -->
      <n-card title="完成率对比" class="chart-card">
        <div ref="completionChartRef" class="chart"></div>
      </n-card>

      <!-- 任务数对比 -->
      <n-card title="任务数对比" class="chart-card">
        <div ref="tasksChartRef" class="chart"></div>
      </n-card>

      <!-- 预算偏差对比 -->
      <n-card title="预算偏差对比" class="chart-card">
        <div ref="budgetChartRef" class="chart"></div>
      </n-card>

      <!-- 平均周期对比 -->
      <n-card title="平均周期对比" class="chart-card">
        <div ref="cycleChartRef" class="chart"></div>
      </n-card>
    </div>

    <!-- 满意度对比 -->
    <n-card v-if="hasSatisfactionData" title="满意度对比" class="compare-card">
      <div ref="satisfactionChartRef" class="chart"></div>
    </n-card>

    <!-- 空状态 -->
    <n-empty v-if="!loading && compareData.projects.length === 0" description="请选择至少2个项目进行对比" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  NCard,
  NSelect,
  NButton,
  NDataTable,
  NEmpty,
  useMessage,
  type DataTableColumns
} from 'naive-ui'
import { getProjectsCompare, type ProjectCompareItem, type ProjectCompareResponse } from '@/services/api'
import * as echarts from 'echarts'

const message = useMessage()

// 模拟项目列表
const projectOptions = ref([
  { label: 'AI 项目管理系统', value: 'project-1' },
  { label: '智能客服系统', value: 'project-2' },
  { label: '数据分析平台', value: 'project-3' },
  { label: '电商平台重构', value: 'project-4' },
  { label: '移动端应用', value: 'project-5' },
  { label: '区块链平台', value: 'project-6' }
])

const selectedProjects = ref<string[]>([])
const loading = ref(false)
const compareData = ref<ProjectCompareResponse>({
  projects: [],
  comparedAt: ''
})

// Chart refs
const completionChartRef = ref<HTMLElement>()
const tasksChartRef = ref<HTMLElement>()
const budgetChartRef = ref<HTMLElement>()
const cycleChartRef = ref<HTMLElement>()
const satisfactionChartRef = ref<HTMLElement>()

let completionChart: echarts.ECharts | null = null
let tasksChart: echarts.ECharts | null = null
let budgetChart: echarts.ECharts | null = null
let cycleChart: echarts.ECharts | null = null
let satisfactionChart: echarts.ECharts | null = null

// 检查是否有满意度数据
const hasSatisfactionData = computed(() => {
  return compareData.value.projects.some(p => p.satisfaction !== null)
})

// 表格列定义
const tableColumns: DataTableColumns<ProjectCompareItem> = [
  {
    title: '项目名称',
    key: 'title',
    width: 180
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      const statusMap: Record<string, { label: string; type: string }> = {
        DRAFT: { label: '草稿', type: 'default' },
        ACTIVE: { label: '进行中', type: 'info' },
        COMPLETED: { label: '已完成', type: 'success' },
        CANCELLED: { label: '已取消', type: 'error' }
      }
      return statusMap[row.status]?.label || row.status
    }
  },
  {
    title: '总任务',
    key: 'totalTasks',
    width: 100
  },
  {
    title: '已完成',
    key: 'completedTasks',
    width: 100
  },
  {
    title: '完成率',
    key: 'completionRate',
    width: 100,
    render: (row) => `${row.completionRate}%`
  },
  {
    title: '平均周期(天)',
    key: 'averageCycleDays',
    width: 120
  },
  {
    title: '预算',
    key: 'budget',
    width: 120,
    render: (row) => row.budget ? `¥${row.budget.toLocaleString()}` : '-'
  },
  {
    title: '预算偏差',
    key: 'budgetDeviation',
    width: 100,
    render: (row) => {
      const deviation = row.budgetDeviation
      const color = deviation > 0 ? '#ff4d4f' : '#52c41a'
      return deviation !== 0 ? `<span style="color: ${color}">${deviation > 0 ? '+' : ''}${deviation}%</span>` : '-'
    }
  },
  {
    title: '满意度',
    key: 'satisfaction',
    width: 100,
    render: (row) => row.satisfaction !== null ? `${row.satisfaction}%` : '-'
  }
]

const handleProjectChange = (values: string[]) => {
  if (values.length > 5) {
    message.warning('最多选择5个项目')
    selectedProjects.value = values.slice(0, 5)
  }
}

const fetchCompareData = async () => {
  if (selectedProjects.value.length < 2) {
    message.warning('请选择至少2个项目进行对比')
    return
  }

  loading.value = true
  try {
    compareData.value = await getProjectsCompare(selectedProjects.value)
    message.success('获取对比数据成功')
    
    // 延迟渲染图表，确保DOM已更新
    setTimeout(() => {
      renderCharts()
    }, 100)
  } catch (error) {
    message.error('获取对比数据失败')
  } finally {
    loading.value = false
  }
}

const renderCharts = () => {
  const projects = compareData.value.projects
  const projectNames = projects.map(p => p.title)

  // 完成率对比
  if (completionChartRef.value) {
    if (!completionChart) {
      completionChart = echarts.init(completionChartRef.value)
    }
    completionChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: projectNames },
      yAxis: { type: 'value', max: 100, name: '完成率(%)' },
      series: [{
        data: projects.map(p => ({
          value: p.completionRate,
          itemStyle: {
            color: p.completionRate >= 80 ? '#52c41a' : 
                   p.completionRate >= 50 ? '#1890ff' : '#faad14'
          }
        })),
        type: 'bar',
        label: { show: true, position: 'top', formatter: '{c}%' }
      }]
    })
  }

  // 任务数对比
  if (tasksChartRef.value) {
    if (!tasksChart) {
      tasksChart = echarts.init(tasksChartRef.value)
    }
    tasksChart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['总任务', '已完成'], bottom: 0 },
      xAxis: { type: 'category', data: projectNames },
      yAxis: { type: 'value', name: '任务数' },
      series: [
        {
          name: '总任务',
          data: projects.map(p => p.totalTasks),
          type: 'bar',
          itemStyle: { color: '#1890ff' }
        },
        {
          name: '已完成',
          data: projects.map(p => p.completedTasks),
          type: 'bar',
          itemStyle: { color: '#52c41a' }
        }
      ]
    })
  }

  // 预算偏差对比
  if (budgetChartRef.value) {
    if (!budgetChart) {
      budgetChart = echarts.init(budgetChartRef.value)
    }
    budgetChart.setOption({
      tooltip: { 
        trigger: 'axis',
        formatter: (params: any) => {
          const val = params[0].value
          return `${params[0].name}<br/>偏差: <span style="color: ${val > 0 ? '#ff4d4f' : '#52c41a'}">${val > 0 ? '+' : ''}${val}%</span>`
        }
      },
      xAxis: { type: 'category', data: projectNames },
      yAxis: { type: 'value', name: '偏差(%)' },
      series: [{
        data: projects.map(p => ({
          value: p.budgetDeviation,
          itemStyle: {
            color: p.budgetDeviation > 0 ? '#ff4d4f' : '#52c41a'
          }
        })),
        type: 'bar',
        label: { show: true, position: 'top', formatter: '{c}%' }
      }]
    })
  }

  // 平均周期对比
  if (cycleChartRef.value) {
    if (!cycleChart) {
      cycleChart = echarts.init(cycleChartRef.value)
    }
    cycleChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: projectNames },
      yAxis: { type: 'value', name: '天数' },
      series: [{
        data: projects.map(p => p.averageCycleDays),
        type: 'bar',
        itemStyle: { color: '#722ed1' },
        label: { show: true, position: 'top' }
      }]
    })
  }

  // 满意度对比
  if (satisfactionChartRef.value && hasSatisfactionData.value) {
    if (!satisfactionChart) {
      satisfactionChart = echarts.init(satisfactionChartRef.value)
    }
    const satisfactionProjects = projects.filter(p => p.satisfaction !== null)
    satisfactionChart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: satisfactionProjects.map(p => p.title) },
      yAxis: { type: 'value', max: 100, name: '满意度(%)' },
      series: [{
        data: satisfactionProjects.map(p => ({
          value: p.satisfaction,
          itemStyle: {
            color: p.satisfaction! >= 80 ? '#52c41a' : 
                   p.satisfaction! >= 60 ? '#1890ff' : '#faad14'
          }
        })),
        type: 'bar',
        label: { show: true, position: 'top', formatter: '{c}%' }
      }]
    })
  }
}

// 监听窗口大小变化
const handleResize = () => {
  completionChart?.resize()
  tasksChart?.resize()
  budgetChart?.resize()
  cycleChart?.resize()
  satisfactionChart?.resize()
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  completionChart?.dispose()
  tasksChart?.dispose()
  budgetChart?.dispose()
  cycleChart?.dispose()
  satisfactionChart?.dispose()
})
</script>

<style scoped>
.project-compare {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.compare-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.compare-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.compare-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.compare-card {
  margin-bottom: 24px;
  border-radius: 12px;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.chart-card {
  border-radius: 12px;
}

.chart {
  width: 100%;
  height: 300px;
}

@media (max-width: 768px) {
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .compare-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .compare-actions {
    width: 100%;
    flex-direction: column;
  }
  
  .compare-actions .n-select,
  .compare-actions .n-button {
    width: 100%;
  }
}
</style>
