/**
 * 任务Store
 * 
 * 管理任务列表和任务状态
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useUserStore } from './user'

/**
 * 任务接口
 */
export interface Task {
  id: string
  projectId: string
  milestoneId: string | null
  title: string
  description: string
  requiredSkills: string[]
  budget: number
  status: 'OPEN' | 'CLAIMED' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'
  assigneeId: string | null
  assignee?: {
    id: string
    name: string
  }
  project?: {
    id: string
    title: string
  }
  dueAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * 任务列表响应
 */
export interface TaskListResponse {
  success: boolean
  error?: string
  data: {
    tasks: Task[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * 创建任务请求
 */
export interface CreateTaskRequest {
  title: string
  description: string
  requiredSkills: string[]
  budget: number
  projectId: string
  milestoneId?: string
  dueAt?: string
}

/**
 * 认领任务请求
 */
export interface ClaimTaskRequest {
  taskId: string
}

/**
 * 提交任务请求
 */
export interface SubmitTaskRequest {
  taskId: string
  repoUrl: string
  description?: string
  branch?: string
  commitHash?: string
}

/**
 * 使用任务Store
 */
export const useTaskStore = defineStore('task', () => {
  // 状态
  const tasks = ref<Task[]>([])
  const currentTask = ref<Task | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })

  /**
   * 获取请求头（带认证）
   */
  function getHeaders() {
    const userStore = useUserStore()
    return userStore.token
      ? { Authorization: `Bearer ${userStore.token}` }
      : {}
  }

  /**
   * 获取任务列表
   */
  async function fetchTasks(params?: {
    page?: number
    pageSize?: number
    status?: string
    projectId?: string
  }): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get<TaskListResponse>('/api/v1/tasks', {
        params: {
          page: params?.page || pagination.value.page,
          pageSize: params?.pageSize || pagination.value.pageSize,
          status: params?.status,
          projectId: params?.projectId
        }
      })

      if (response.data.success) {
        tasks.value = response.data.data.tasks
        pagination.value = {
          page: response.data.data.page,
          pageSize: response.data.data.pageSize,
          total: response.data.data.total,
          totalPages: response.data.data.totalPages
        }
        return true
      } else {
        error.value = response.data.error || '获取任务列表失败'
        return false
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '获取任务列表失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取任务详情
   */
  async function fetchTask(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get<{
        success: boolean
        error?: string
        data: Task
      }>(`/api/v1/tasks/${id}`)

      if (response.data.success) {
        currentTask.value = response.data.data
        return true
      } else {
        error.value = response.data.error || '获取任务详情失败'
        return false
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '获取任务详情失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建任务
   */
  async function createTask(data: CreateTaskRequest): Promise<string | null> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post<{
        success: boolean
        error?: string
        data: { id: string }
      }>('/api/v1/tasks', data, {
        headers: getHeaders()
      })

      if (response.data.success) {
        await fetchTasks()
        return response.data.data.id
      } else {
        error.value = response.data.error || '创建任务失败'
        return null
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '创建任务失败'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 认领任务
   */
  async function claimTask(taskId: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post<{
        success: boolean
        error?: string
        data: Task
      }>(`/api/v1/tasks/${taskId}/claim`, {}, {
        headers: getHeaders()
      })

      if (response.data.success) {
        // 更新列表中的任务
        const index = tasks.value.findIndex(t => t.id === taskId)
        if (index !== -1) {
          tasks.value[index] = response.data.data
        }
        return true
      } else {
        error.value = response.data.error || '认领任务失败'
        return false
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '认领任务失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 提交任务
   */
  async function submitTask(taskId: string, data: {
    repoUrl: string
    description?: string
    branch?: string
    commitHash?: string
  }): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post<{
        success: boolean
        error?: string
        data: Task
      }>(`/api/v1/tasks/${taskId}/submit`, data, {
        headers: getHeaders()
      })

      if (response.data.success) {
        // 更新列表中的任务
        const index = tasks.value.findIndex(t => t.id === taskId)
        if (index !== -1) {
          tasks.value[index] = response.data.data
        }
        return true
      } else {
        error.value = response.data.error || '提交任务失败'
        return false
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '提交任务失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新任务
   */
  async function updateTask(taskId: string, data: Partial<CreateTaskRequest>): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.put<{
        success: boolean
        error?: string
        data: Task
      }>(`/api/v1/tasks/${taskId}`, data, {
        headers: getHeaders()
      })

      if (response.data.success) {
        // 更新列表中的任务
        const index = tasks.value.findIndex(t => t.id === taskId)
        if (index !== -1) {
          tasks.value[index] = response.data.data
        }
        // 更新当前任务
        if (currentTask.value?.id === taskId) {
          currentTask.value = response.data.data
        }
        return true
      } else {
        error.value = response.data.error || '更新任务失败'
        return false
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '更新任务失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除任务
   */
  async function deleteTask(taskId: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.delete<{
        success: boolean
        error?: string
        message?: string
      }>(`/api/v1/tasks/${taskId}`, {
        headers: getHeaders()
      })

      if (response.data.success) {
        // 从列表中移除
        tasks.value = tasks.value.filter(t => t.id !== taskId)
        // 清除当前任务
        if (currentTask.value?.id === taskId) {
          currentTask.value = null
        }
        return true
      } else {
        error.value = response.data.error || '删除任务失败'
        return false
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '删除任务失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 切换页码
   */
  function setPage(page: number) {
    pagination.value.page = page
    fetchTasks({ page })
  }

  /**
   * 重置状态
   */
  function reset() {
    tasks.value = []
    currentTask.value = null
    error.value = null
    pagination.value = {
      page: 1,
      pageSize: 10,
      total: 0,
      totalPages: 0
    }
  }

  return {
    // 状态
    tasks,
    currentTask,
    loading,
    error,
    pagination,

    // 方法
    fetchTasks,
    fetchTask,
    createTask,
    claimTask,
    submitTask,
    updateTask,
    deleteTask,
    setPage,
    reset
  }
})
