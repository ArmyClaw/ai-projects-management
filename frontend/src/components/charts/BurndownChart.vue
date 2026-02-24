<template>
  <div ref="chartRef" class="burndown-chart"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

interface BurndownPoint {
  date: string
  remaining: number
  ideal: number
}

interface Props {
  data: BurndownPoint[]
  title?: string
  height?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '燃尽图',
  height: '350px'
})

const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const renderChart = () => {
  if (!chartRef.value || !props.data.length) return

  if (!chart) {
    chart = echarts.init(chartRef.value)
  }

  const dates = props.data.map(d => d.date)
  const remainingData = props.data.map(d => d.remaining)
  const idealData = props.data.map(d => d.ideal)

  const option: echarts.EChartsOption = {
    title: {
      text: props.title,
      left: 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'normal'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: (params: any) => {
        let result = `<b>${params[0].axisValue}</b><br/>`
        params.forEach((param: any) => {
          result += `${param.marker} ${param.seriesName}: ${Math.round(param.value)}<br/>`
        })
        return result
      }
    },
    legend: {
      data: ['实际剩余', '理想剩余'],
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
      boundaryGap: false,
      data: dates,
      axisLabel: {
        formatter: (value: string) => {
          return value.split('-').slice(1).join('/')
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '任务数',
      min: 0,
      axisLabel: {
        formatter: (value: number) => Math.round(value)
      }
    },
    series: [
      {
        name: '实际剩余',
        type: 'line',
        data: remainingData,
        smooth: true,
        lineStyle: {
          width: 3,
          color: '#1890ff'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
          ])
        },
        itemStyle: {
          color: '#1890ff'
        },
        markPoint: {
          data: [
            { type: 'max', name: '最大值' },
            { type: 'min', name: '最小值' }
          ]
        }
      },
      {
        name: '理想剩余',
        type: 'line',
        data: idealData,
        smooth: true,
        lineStyle: {
          width: 2,
          type: 'dashed',
          color: '#52c41a'
        },
        itemStyle: {
          color: '#52c41a'
        }
      }
    ]
  }

  chart.setOption(option)
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
.burndown-chart {
  width: 100%;
  min-height: 350px;
}
</style>
