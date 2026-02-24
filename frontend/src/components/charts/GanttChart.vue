<template>
  <div ref="chartRef" class="gantt-chart"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import type { GanttData, GanttTask, GanttMilestone } from '@/services/api'

interface Props {
  data: GanttData
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  height: '400px'
})

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const renderChart = () => {
  if (!chartRef.value || !props.data) return

  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  // 处理数据
  const tasks = props.data.tasks
  const milestones = props.data.milestones

  // 创建任务数据
  const taskData = tasks.map((task, index) => ({
    name: task.name,
    start: new Date(task.startDate).getTime(),
    end: new Date(task.endDate).getTime(),
    progress: task.progress,
    status: task.status,
    itemStyle: {
      color: getStatusColor(task.status)
    }
  }))

  // 创建里程碑数据
  const milestoneData = milestones.map(m => ({
    name: m.name,
    xAxis: new Date(m.dueDate).getTime(),
    status: m.status,
    itemStyle: {
      color: m.status === 'COMPLETED' ? '#52c41a' : '#faad14'
    }
  }))

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        if (params[0]?.seriesName === '里程碑') {
          const milestone = params[0]
          return `<b>${milestone.name}</b><br/>
                  日期: ${new Date(milestone.value).toLocaleDateString()}<br/>
                  状态: ${milestone.data.status}`
        }
        const task = params[0]
        return `<b>${task.name}</b><br/>
                开始: ${new Date(task.data.start).toLocaleDateString()}<br/>
                结束: ${new Date(task.data.end).toLocaleDateString()}<br/>
                进度: ${task.data.progress}%<br/>
                状态: ${task.data.status}`
      }
    },
    legend: {
      data: ['任务进度', '里程碑'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      axisLabel: {
        formatter: '{MM}-{dd}'
      }
    },
    yAxis: {
      type: 'category',
      data: tasks.map(t => t.name)
    },
    series: [
      {
        name: '任务进度',
        type: 'custom',
        renderItem: (params: any, api: any) => {
          const task = taskData[params.dataIndex]
          const start = api.coord([task.start, 0])
          const end = api.coord([task.end, 0])
          const height = api.size([0, 1])[1] * 0.6

          return {
            type: 'rect',
            shape: {
              x: start[0],
              y: start[1] - height / 2,
              width: end[0] - start[0],
              height
            },
            style: {
              fill: task.itemStyle.color,
              opacity: 0.8
            }
          }
        },
        itemStyle: {
          opacity: 0.8
        },
        encode: {
          x: [0, 1],
          y: 2
        },
        data: taskData
      },
      {
        name: '里程碑',
        type: 'scatter',
        symbol: 'diamond',
        symbolSize: 15,
        data: milestoneData,
        tooltip: {
          formatter: (params: any) => {
            return `<b>${params.name}</b><br/>
                    日期: ${new Date(params.value).toLocaleDateString()}<br/>
                    状态: ${params.data.status}`
          }
        }
      }
    ]
  }

  chart.setOption(option)
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED':
      return '#52c41a'
    case 'IN_PROGRESS':
      return '#1890ff'
    case 'PENDING':
      return '#d9d9d9'
    case 'CANCELLED':
      return '#ff4d4f'
    default:
      return '#1890ff'
  }
}

const handleResize = () => {
  chart?.resize()
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})

watch(() => props.data, renderChart, { deep: true })
</script>

<style scoped>
.gantt-chart {
  width: 100%;
  min-height: 400px;
}
</style>
