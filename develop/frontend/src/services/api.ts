/**
 * API 错误处理配置
 *
 * 功能：
 * - Axios 请求/响应拦截器
 * - 统一错误处理
 * - 401 认证跳转
 * - 错误 Toast 提示
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 显示错误消息
 * @param message - 错误消息
 */
function showError(messageText: string): void {
  console.error(messageText)
  const globalMessage = window.__GLOBAL_MESSAGE__ as { error?: (msg: string) => void } | undefined
  if (globalMessage?.error) {
    globalMessage.error(messageText)
  } else {
    alert(messageText)
  }
}

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')

    // 如果有 token，添加到请求头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加时间戳防止缓存（GET 请求）
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      }
    }

    return config
  },
  (error: AxiosError) => {
    // 请求错误处理
    console.error('请求错误:', error.message)
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器
 */
api.interceptors.response.use(
  (response) => {
    // 2xx 响应处理
    return response
  },
  async (error: AxiosError) => {
    // 错误响应处理
    const { response } = error

    // 网络错误处理
    if (!response) {
      if (error.code === 'ECONNABORTED') {
        showError('请求超时，请稍后重试')
      } else {
        showError('网络连接失败，请检查网络')
      }
      return Promise.reject(error)
    }

    // 根据状态码处理
    switch (response.status) {
      case 400:
        showError(getErrorMessage(response.data) || '请求参数错误')
        break

      case 401:
        // 401 未认证，跳转到登录页
        handleUnauthorized()
        break

      case 403:
        showError('没有权限访问此资源')
        break

      case 404:
        showError('请求的资源不存在')
        break

      case 422:
        // 验证错误
        showError(getErrorMessage(response.data) || '数据验证失败')
        break

      case 429:
        showError('请求过于频繁，请稍后重试')
        break

      case 500:
        showError('服务器错误，请稍后重试')
        break

      case 502:
        showError('网关错误，请稍后重试')
        break

      case 503:
        showError('服务不可用，请稍后重试')
        break

      default:
        showError(getErrorMessage(response.data) || '请求失败')
    }

    return Promise.reject(error)
  }
)

/**
 * 获取错误消息
 * @param data - 响应数据
 * @returns 错误消息或null
 */
function getErrorMessage(data: unknown): string | null {
  if (typeof data === 'string') {
    return data
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    // 常见错误格式
    if (obj.error && typeof obj.error === 'string') return obj.error
    if (obj.message && typeof obj.message === 'string') return obj.message
    if (obj.msg && typeof obj.msg === 'string') return obj.msg
    if (obj.detail) {
      const detail = obj.detail
      if (Array.isArray(detail)) return detail[0] as string
      if (typeof detail === 'string') return detail
    }
    if (obj.details) {
      const details = obj.details
      if (Array.isArray(details)) return details[0] as string
      if (typeof details === 'string') return details
    }

    // 尝试获取第一个错误消息
    const firstKey = Object.keys(obj)[0]
    if (firstKey && Array.isArray(obj[firstKey])) {
      const value = obj[firstKey]
      if (Array.isArray(value) && value.length > 0) {
        return value[0] as string
      }
    }
  }

  return null
}

/**
 * 处理未授权错误
 */
interface UserStore {
  user: unknown
  token: unknown
}

function handleUnauthorized(): void {
  // 清除本地存储的 token
  localStorage.removeItem('token')

  // 清除用户状态
  const userStore = window.__USER_STORE__ as UserStore | undefined
  if (userStore) {
    userStore.user = null
    userStore.token = null
  }

  // 跳转到登录页
  const currentPath = window.location.pathname
  const loginPath = '/login'

  if (currentPath !== loginPath) {
    window.location.href = `${loginPath}?redirect=${encodeURIComponent(currentPath)}`
  } else {
    window.location.href = loginPath
  }
}

/**
 * 设置全局 message 实例
 * @param msgInstance - Message实例
 */
export function setGlobalMessage(msgInstance: unknown): void {
  window.__GLOBAL_MESSAGE__ = msgInstance
}

/**
 * 设置全局 user store
 * @param store - User store
 */
export function setGlobalUserStore(store: unknown): void {
  window.__USER_STORE__ = store
}

export default api

// 类型声明
declare global {
  interface Window {
    __GLOBAL_MESSAGE__: unknown
    __USER_STORE__: unknown
  }
}
