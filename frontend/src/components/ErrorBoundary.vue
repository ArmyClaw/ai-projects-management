<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { NCard, NButton, NIcon, NSpace } from 'naive-ui'
import { Refresh, Warning } from '@vicons/ionicons5'

/**
 * 错误边界组件
 * 
 * 功能：
 * - 捕获子组件渲染错误
 * - 显示友好的错误提示
 * - 提供重试功能
 */

interface Props {
  fallback?: string
  showDetails?: boolean
  resetKey?: string | number
}

const _props = defineProps<Props>()

// 错误状态
const error = ref<Error | null>(null)
const errorInfo = ref<string>('')

// 错误捕获钩子
onErrorCaptured((err: Error, _instance, info: string) => {
  error.value = err
  errorInfo.value = info
  emit('error', err)
  
  // 返回 false 阻止错误继续传播
  return false
})

/**
 * 重置错误状态
 */
function reset() {
  error.value = null
  errorInfo.value = ''
  emit('retry')
}

// 定义emits
const emit = defineEmits<{
  (e: 'error', error: Error): void
  (e: 'retry'): void
}>()

/**
 * 格式化错误信息
 */
function formatErrorMessage(err: Error): string {
  if (err.message) {
    return err.message
  }
  return '未知错误'
}
</script>

<template>
  <div class="error-boundary">
    <!-- 正常渲染内容 -->
    <template v-if="!error">
      <slot />
    </template>
    
    <!-- 错误状态 -->
    <template v-else>
      <n-card class="error-card">
        <div class="error-content">
          <!-- 错误图标 -->
          <div class="error-icon">
            <n-icon :size="48" color="#d03050">
              <Warning />
            </n-icon>
          </div>
          
          <!-- 错误标题 -->
          <h3 class="error-title">出错了</h3>
          
          <!-- 错误消息 -->
          <p class="error-message">
            {{ formatErrorMessage(error) }}
          </p>
          
          <!-- 错误详情（可选） -->
          <div v-if="showDetails && errorInfo" class="error-details">
            <details>
              <summary>查看详情</summary>
              <pre>{{ errorInfo }}</pre>
            </details>
          </div>
          
          <!-- 操作按钮 -->
          <n-space class="error-actions">
            <n-button @click="reset">
              <template #icon>
                <n-icon><Refresh /></n-icon>
              </template>
              重试
            </n-button>
          </n-space>
        </div>
      </n-card>
    </template>
  </div>
</template>

<style scoped>
.error-boundary {
  width: 100%;
}

.error-card {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
}

.error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
}

.error-icon {
  margin-bottom: 16px;
}

.error-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.error-message {
  font-size: 14px;
  color: #666;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.error-details {
  width: 100%;
  text-align: left;
  margin-bottom: 16px;
}

.error-details summary {
  cursor: pointer;
  color: #999;
  font-size: 13px;
  margin-bottom: 8px;
}

.error-details pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  color: #666;
}

.error-actions {
  margin-top: 8px;
}
</style>
