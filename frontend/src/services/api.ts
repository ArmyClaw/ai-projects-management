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

// ========== 报表分析 API ==========

/**
 * 项目进度响应
 */
export interface ProjectProgress {
  id: string
  title: string
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  totalTasks: number
  completedTasks: number
  progressPercentage: number
  totalMilestones: number
  completedMilestones: number
  startDate: string | null
  endDate: string | null
  daysRemaining: number | null
}

/**
 * 甘特图任务
 */
export interface GanttTask {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  progress: number
  dependencies: string[]
}

/**
 * 甘特图里程碑
 */
export interface GanttMilestone {
  id: string
  name: string
  dueDate: string
  status: string
}

/**
 * 甘特图数据
 */
export interface GanttData {
  projectId: string
  projectName: string
  tasks: GanttTask[]
  milestones: GanttMilestone[]
  startDate: string
  endDate: string
}

/**
 * 里程碑数据
 */
export interface Milestone {
  id: string
  name: string
  description: string
  dueDate: string
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE'
  completedAt: string | null
}

/**
 * 创建里程碑请求
 */
export interface CreateMilestoneRequest {
  name: string
  description: string
  dueDate: string
}

/**
 * 个人贡献
 */
export interface UserContribution {
  userId: string
  userName: string
  totalTasks: number
  completedTasks: number
  completionRate: number
  totalPoints: number
  rank: number
  weeklyActivity: {
    date: string
    taskCount: number
  }[]
}

/**
 * 财务记录
 */
export interface FinanceRecord {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  description: string
  projectId: string | null
  projectName: string | null
  createdAt: string
}

/**
 * 用户财务
 */
export interface UserFinance {
  userId: string
  totalIncome: number
  totalExpense: number
  balance: number
  pendingSettlement: number
  transactions: FinanceRecord[]
}

/**
 * 数据看板
 */
export interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
  completedTasks: number
  totalUsers: number
  activeUsers: number
  totalPoints: number
  recentActivity: {
    date: string
    projectCount: number
    taskCount: number
  }[]
}

/**
 * 项目对比数据项
 */
export interface ProjectCompareItem {
  id: string
  title: string
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  totalTasks: number
  completedTasks: number
  completionRate: number
  averageCycleDays: number
  budget: number
  budgetDeviation: number
  satisfaction: number | null
  startDate: string | null
  endDate: string | null
}

/**
 * 项目对比响应
 */
export interface ProjectCompareResponse {
  projects: ProjectCompareItem[]
  comparedAt: string
}

/**
 * 信用趋势数据点
 */
export interface CreditTrendPoint {
  date: string
  score: number
  change: number
}

/**
 * 信用影响因素
 */
export interface CreditFactor {
  name: string
  score: number
  weight: number
  trend: 'up' | 'down' | 'stable'
}

/**
 * 用户信用趋势响应
 */
export interface UserCreditTrend {
  userId: string
  userName: string
  currentCreditScore: number
  creditLevel: string
  history: CreditTrendPoint[]
  factors: CreditFactor[]
}

/**
 * 获取项目进度
 * GET /api/v1/projects/:id/progress
 */
export async function getProjectProgress(projectId: string): Promise<ProjectProgress> {
  const response = await api.get<{ success: boolean; data: ProjectProgress }>(
    `/projects/${projectId}/progress`
  )
  return response.data.data
}

/**
 * 获取甘特图数据
 * GET /api/v1/projects/:id/gantt
 */
export async function getProjectGantt(projectId: string): Promise<GanttData> {
  const response = await api.get<{ success: boolean; data: GanttData }>(
    `/projects/${projectId}/gantt`
  )
  return response.data.data
}

/**
 * 获取里程碑列表
 * GET /api/v1/projects/:id/milestones
 */
export async function getProjectMilestones(
  projectId: string,
  status?: string
): Promise<Milestone[]> {
  const params = status ? { status } : {}
  const response = await api.get<{ success: boolean; data: Milestone[] }>(
    `/projects/${projectId}/milestones`,
    { params }
  )
  return response.data.data
}

/**
 * 创建里程碑
 * POST /api/v1/projects/:id/milestones
 */
export async function createProjectMilestone(
  projectId: string,
  data: CreateMilestoneRequest
): Promise<Milestone> {
  const response = await api.post<{ success: boolean; data: Milestone }>(
    `/projects/${projectId}/milestones`,
    data
  )
  return response.data.data
}

/**
 * 获取用户贡献统计
 * GET /api/v1/users/:id/contributions
 */
export async function getUserContributions(userId: string): Promise<UserContribution> {
  const response = await api.get<{ success: boolean; data: UserContribution }>(
    `/users/${userId}/contributions`
  )
  return response.data.data
}

/**
 * 获取用户财务信息
 * GET /api/v1/users/:id/finance
 */
export async function getUserFinance(userId: string): Promise<UserFinance> {
  const response = await api.get<{ success: boolean; data: UserFinance }>(
    `/users/${userId}/finance`
  )
  return response.data.data
}

/**
 * 获取数据看板
 * GET /api/v1/analytics/dashboard
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await api.get<{ success: boolean; data: DashboardStats }>(
    '/analytics/dashboard'
  )
  return response.data.data
}

/**
 * 项目对比分析
 * GET /api/v1/analytics/projects/compare
 * @param projectIds - 项目ID数组（最多5个）
 */
export async function getProjectsCompare(projectIds: string[]): Promise<ProjectCompareResponse> {
  if (projectIds.length > 5) {
    throw new Error('最多支持5个项目对比')
  }
  if (projectIds.length === 0) {
    throw new Error('请提供至少一个项目ID')
  }

  const response = await api.get<{ success: boolean; data: ProjectCompareResponse }>(
    '/analytics/projects/compare',
    {
      params: {
        projects: projectIds.join(',')
      }
    }
  )
  return response.data.data
}

/**
 * 获取用户信用趋势
 * GET /api/v1/users/:id/credit-trend
 * @param userId - 用户ID
 * @param days - 查询天数（默认30天）
 */
export async function getUserCreditTrend(userId: string, days: number = 30): Promise<UserCreditTrend> {
  const response = await api.get<{ success: boolean; data: UserCreditTrend }>(
    `/users/${userId}/credit-trend`,
    {
      params: {
        days
      }
    }
  )
  return response.data.data
}

// ========== 报表导出 ==========

/**
 * 导出类型
 */
export type ExportType = 
  | 'project-progress' 
  | 'project-compare' 
  | 'dashboard' 
  | 'user-contribution'

/**
 * 导出请求参数
 */
export interface ExportParams {
  type: ExportType
  projectId?: string
  projectIds?: string[]
  userId?: string
  filename?: string
}

/**
 * 导出为PDF
 * POST /api/v1/analytics/export/pdf
 */
export async function exportToPdf(params: ExportParams): Promise<void> {
  const { type, projectId, projectIds, userId, filename = 'report' } = params

  const response = await api.post(
    '/analytics/export/pdf',
    {
      type,
      projectId,
      projectIds,
      userId
    },
    {
      responseType: 'blob'
    }
  )

  // 下载PDF文件
  const blob = response.data as Blob
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 导出为Excel
 * POST /api/v1/analytics/export/excel
 */
export async function exportToExcel(params: ExportParams): Promise<void> {
  const { type, projectId, projectIds, userId, filename = 'report' } = params

  const response = await api.post(
    '/analytics/export/excel',
    {
      type,
      projectId,
      projectIds,
      userId
    },
    {
      responseType: 'blob'
    }
  )

  // 下载Excel文件
  const blob = response.data as Blob
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default api

// 类型声明
declare global {
  interface Window {
    __GLOBAL_MESSAGE__: unknown
    __USER_STORE__: unknown
  }
}
