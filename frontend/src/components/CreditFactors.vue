<template>
  <n-card title="信用影响因素分析" class="factors-card">
    <div class="factors-container">
      <!-- 雷达图 -->
      <div ref="radarChartRef" class="radar-chart"></div>
      
      <!-- 因素列表 -->
      <div class="factors-list">
        <div 
          v-for="(factor, index) in sortedFactors" 
          :key="factor.name" 
          class="factor-item"
        >
          <div class="factor-header">
            <span class="factor-name">{{ factor.name }}</span>
            <span class="factor-score" :style="{ color: getScoreColor(factor.score) }">
              {{ factor.score }}分
            </span>
          </div>
          <n-progress
            type="line"
            :percentage="factor.score"
            :color="getScoreColor(factor.score)"
            :show-indicator="false"
            :height="8"
            :border-radius="4"
          />
          <div class="factor-meta">
            <span class="factor-weight">权重: {{ (factor.weight * 100).toFixed(0) }}%</span>
            <span class="factor-trend" :class="factor.trend">
              <n-icon>
                <component :is="getTrendIcon(factor.trend)" />
              </n-icon>
              {{ getTrendText(factor.trend) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 改善建议 -->
    <div class="improvement-tips">
      <n-alert type="info" title="提升信用建议">
        <template #header>
          <n-icon><component :is="Lightbulb" /></n-icon>
          <span style="margin-left: 8px">提升信用建议</span>
        </template>
        <ul class="tips-list">
          <li v-for="tip in improvementTips" :key="tip">{{ tip }}</li>
        </ul>
      </n-alert>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import {
  NCard,
  NProgress,
  NIcon,
  NAlert
} from 'naive-ui'
import * as echarts from 'echarts'
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Minus
} from '@vicons/ionicons5'
import type { CreditFactor } from '@/services/api'

const props = defineProps<{
  factors: CreditFactor[]
}>()

const radarChartRef = ref<HTMLElement>()
let radarChart: echarts.ECharts | null = null

// 按分数排序的因素
const sortedFactors = computed(() => {
  return [...props.factors].sort((a, b) => b.score - a.score)
})

// 根据分数获取颜色
const getScoreColor = (score: number): string => {
  if (score >= 80) return '#52c41a' // 优秀 - 绿色
  if (score >= 60) return '#1890ff' // 良好 - 蓝色
  if (score >= 40) return '#faad14' // 一般 - 黄色
  return '#ff4d4f' // 较差 - 红色
}

// 获取趋势图标
const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return TrendingUp
    case 'down':
      return TrendingDown
    default:
      return Minus
  }
}

// 获取趋势文本
const getTrendText = (trend: string): string => {
  switch (trend) {
    case 'up':
      return '上升'
    case 'down':
      return '下降'
    default:
      return '稳定'
  }
}

// 改善建议
const improvementTips = computed(() => {
  const tips: string[] = []
  
  props.factors.forEach(factor => {
    if (factor.score < 60) {
      switch (factor.name) {
        case '任务完成率':
          tips.push('建议提高任务完成率，确保每个分配的任务都能按时完成')
          break
        case '准时交付率':
          tips.push('建议提前规划任务时间，预留足够的缓冲时间')
          break
        case '项目质量评分':
          tips.push('建议注重工作质量，加强自检和同行评审')
          break
        case '协作评价':
          tips.push('建议加强与团队成员的沟通协作，提升协作能力')
          break
        case '信用历史':
          tips.push('建议保持良好的信用记录，避免逾期和违规行为')
          break
      }
    }
  })

  // 如果没有低于60分的因素，给出积极建议
  if (tips.length === 0) {
    tips.push('您的信用表现优秀！继续保持良好的工作习惯')
    tips.push('建议帮助团队成员提升，共同创造更好的项目成果')
  }

  return tips
})

// 渲染雷达图
const renderRadarChart = () => {
  if (!radarChartRef.value || props.factors.length === 0) return

  if (!radarChart) {
    radarChart = echarts.init(radarChartRef.value)
  }

  const indicator = props.factors.map(f => ({
    name: f.name,
    max: 100
  }))

  const data = props.factors.map(f => f.score)

  radarChart.setOption({
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator,
      center: ['50%', '50%'],
      radius: '65%',
      startAngle: 90,
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#666',
        fontSize: 12
      },
      splitArea: {
        areaStyle: {
          color: ['#f8f9fa', '#f1f3f5', '#e9ecef', '#dee2e6']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#dee2e6'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#dee2e6'
        }
      }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: data,
            name: '信用因素',
            areaStyle: {
              color: new echarts.graphic.RadialGradient(0.5, 0.5, 0.8, [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
              ])
            },
            lineStyle: {
              width: 2,
              color: '#1890ff'
            },
            itemStyle: {
              color: '#1890ff'
            }
          }
        ]
      }
    ]
  })
}

// 监听因素变化
watch(() => props.factors, () => {
  setTimeout(() => {
    renderRadarChart()
  }, 100)
}, { deep: true })

// 监听窗口大小变化
const handleResize = () => {
  radarChart?.resize()
}

// 生命周期
onMounted(() => {
  setTimeout(() => {
    renderRadarChart()
  }, 100)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  radarChart?.dispose()
})
</script>

<style scoped>
.factors-card {
  border-radius: 12px;
}

.factors-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.radar-chart {
  width: 100%;
  height: 300px;
}

.factors-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.factor-item {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}

.factor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.factor-name {
  font-weight: 500;
  color: #333;
}

.factor-score {
  font-weight: 600;
  font-size: 16px;
}

.factor-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: #999;
}

.factor-trend {
  display: flex;
  align-items: center;
  gap: 4px;
}

.factor-trend.up {
  color: #52c41a;
}

.factor-trend.down {
  color: #ff4d4f;
}

.factor-trend.stable {
  color: #999;
}

.improvement-tips {
  margin-top: 16px;
}

.tips-list {
  margin: 0;
  padding-left: 20px;
}

.tips-list li {
  margin: 4px 0;
  color: #666;
}

@media (max-width: 768px) {
  .factors-container {
    grid-template-columns: 1fr;
  }
}
</style>
