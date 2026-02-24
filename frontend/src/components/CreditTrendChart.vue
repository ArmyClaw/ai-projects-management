<template>
  <div class="credit-trend-chart">
    <n-card title="信用趋势" class="chart-card">
      <!-- 时间范围选择 -->
      <div class="time-range">
        <n-radio-group v-model:value="selectedDays" size="small">
          <n-radio-button value="7">近7天</n-radio-button>
          <n-radio-button value="30">近30天</n-radio-button>
          <n-radio-button value="90">近90天</n-radio-button>
        </n-radio-group>
      </div>

      <!-- 信用分数概览 -->
      <div class="credit-overview">
        <div class="score-display">
          <div class="current-score">
            <span class="score-value" :style="{ color: scoreColor }">{{ creditTrend.currentCreditScore }}</span>
            <span class="score-label">当前信用分</span>
          </div>
          <div class="credit-level" :class="levelClass">
            {{ creditTrend.creditLevel }}
          </div>
        </div>
        <div class="score-change" :class="changeClass">
          <n-icon v-if="lastChange !== 0">
            <component :is="lastChange > 0 ? 'TrendingUp' : 'TrendingDown'" />
          </n-icon>
          <span>{{ lastChange > 0 ? '+' : '' }}{{ lastChange }} 分</span>
        </div>
      </div>

      <!-- 趋势图表 -->
      <div ref="chartRef" class="chart"></div>
    </n-card>

    <!-- 信用影响因素 -->
    <CreditFactors :factors="creditTrend.factors" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  NCard,
  NRadioGroup,
  NRadioButton,
  NIcon,
  useMessage
} from 'naive-ui'
import * as echarts from 'echarts'
import { getUserCreditTrend, type UserCreditTrend } from '@/services/api'
import CreditFactors from './CreditFactors.vue'

const props = defineProps<{
  userId: string
}>()

const message = useMessage()

const selectedDays = ref('30')
const creditTrend = ref<UserCreditTrend>({
  userId: '',
  userName: '',
  currentCreditScore: 0,
  creditLevel: '',
  history: [],
  factors: []
})
const loading = ref(true)
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

// 计算分数颜色
const scoreColor = computed(() => {
  const score = creditTrend.value.currentCreditScore
  if (score >= 800) return '#52c41a' // 优秀 - 绿色
  if (score >= 700) return '#1890ff' // 良好 - 蓝色
  if (score >= 600) return '#faad14' // 一般 - 黄色
  if (score >= 500) return '#ff7a45' // 较差 - 橙色
  return '#ff4d4f' // 极差 - 红色
})

// 计算等级样式类
const levelClass = computed(() => {
  const level = creditTrend.value.creditLevel
  return {
    'level-excellent': level === '优秀',
    'level-good': level === '良好',
    'level-average': level === '一般',
    'level-poor': level === '较差',
    'level-terrible': level === '极差'
  }
})

// 计算分数变化
const lastChange = computed(() => {
  const history = creditTrend.value.history
  if (history.length < 2) return 0
  return history[history.length - 1].change
})

// 计算变化样式类
const changeClass = computed(() => ({
  'change-up': lastChange.value > 0,
  'change-down': lastChange.value < 0,
  'change-stable': lastChange.value === 0
}))

// 获取信用趋势数据
const fetchCreditTrend = async () => {
  loading.value = true
  try {
    creditTrend.value = await getUserCreditTrend(props.userId, parseInt(selectedDays.value))
    message.success('获取信用趋势成功')
    
    // 延迟渲染图表，确保DOM已更新
    setTimeout(() => {
      renderChart()
    }, 100)
  } catch (error) {
    message.error('获取信用趋势失败')
  } finally {
    loading.value = false
  }
}

// 渲染图表
const renderChart = () => {
  if (!chartRef.value || creditTrend.value.history.length === 0) return

  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  const history = creditTrend.value.history
  const dates = history.map(h => h.date)
  const scores = history.map(h => h.score)
  const avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)

  chart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const data = params[0]
        return `${data.axisValue}<br/>信用分: <strong>${data.value}</strong>`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e8e8e8'
        }
      },
      axisLabel: {
        color: '#666',
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }
      }
    },
    yAxis: {
      type: 'value',
      min: 300,
      max: 850,
      axisLine: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      },
      axisLabel: {
        color: '#666'
      }
    },
    series: [
      {
        name: '信用分',
        type: 'line',
        data: scores,
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: '#52c41a' },
            { offset: 0.5, color: '#1890ff' },
            { offset: 1, color: '#52c41a' }
          ])
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
          ])
        },
        markLine: {
          silent: true,
          data: [
            {
              yAxis: avgScore,
              lineStyle: {
                color: '#999',
                type: 'dashed'
              },
              label: {
                formatter: `平均: ${avgScore}`,
                color: '#999'
              }
            }
          ]
        }
      }
    ]
  })
}

// 监听时间范围变化
watch(selectedDays, () => {
  fetchCreditTrend()
})

// 监听窗口大小变化
const handleResize = () => {
  chart?.resize()
}

// 生命周期
onMounted(() => {
  fetchCreditTrend()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chart?.dispose()
})
</script>

<style scoped>
.credit-trend-chart {
  width: 100%;
}

.chart-card {
  border-radius: 12px;
  margin-bottom: 16px;
}

.time-range {
  margin-bottom: 16px;
}

.credit-overview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
  border-radius: 12px;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.current-score {
  display: flex;
  flex-direction: column;
}

.score-value {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}

.score-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.credit-level {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.level-excellent {
  background: #f6ffed;
  color: #52c41a;
}

.level-good {
  background: #e6f7ff;
  color: #1890ff;
}

.level-average {
  background: #fffbe6;
  color: #faad14;
}

.level-poor {
  background: #fff2e8;
  color: #ff7a45;
}

.level-terrible {
  background: #fff1f0;
  color: #ff4d4f;
}

.score-change {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 16px;
  font-weight: 500;
}

.change-up {
  color: #52c41a;
}

.change-down {
  color: #ff4d4f;
}

.change-stable {
  color: #999;
}

.chart {
  width: 100%;
  height: 300px;
}
</style>
