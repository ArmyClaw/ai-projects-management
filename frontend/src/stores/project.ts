/**
 * 项目Store
 * 
 * 管理项目列表和项目状态
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'
import { useUserStore } from './user'

/**
 * 项目接口
 */
export interface Project {
  id: string
  title: string
  description: string
  mode: 'COMMUNITY' | 'ENTERPRISE'
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  budget: number
  platformFee: number
  initiatorId: string
  initiator?: {
    id: string
    name: string
  }
  createdAt: string
  updatedAt: string
}

/**
 * 项目列表响应
 */
export interface ProjectListResponse {
  success: boolean
  error?: string
  data: {
    projects: Project[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * 创建项目请求
 */
export interface CreateProjectRequest {
  title: string
  description: string
  mode: 'COMMUNITY' | 'ENTERPRISE'
  budget: number
}

/**
 * 使用项目Store
 */
export const useProjectStore = defineStore('project', () => {
  // 状态
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
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
   * 获取项目列表
   */
  async function fetchProjects(params?: {
    page?: number
    pageSize?: number
    status?: string
    mode?: string
  }): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get<ProjectListResponse>('/api/v1/projects', {
        params: {
          page: params?.page || pagination.value.page,
          pageSize: params?.pageSize || pagination.value.pageSize,
          status: params?.status,
          mode: params?.mode
        }
      })

      if (response.data.success) {
        projects.value = response.data.data.projects
        pagination.value = {
          page: response.data.data.page,
          pageSize: response.data.data.pageSize,
          total: response.data.data.total,
          totalPages: response.data.data.totalPages
        }
        return true
      } else {
        error.value = response.data.error || '获取项目列表失败'
        return false
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '获取项目列表失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取项目详情
   */
  async function fetchProject(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.get<{
        success: boolean
        error?: string
        data: Project
      }>(`/api/v1/projects/${id}`)

      if (response.data.success) {
        currentProject.value = response.data.data
        return true
      } else {
        error.value = response.data.error || '获取项目详情失败'
        return false
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '获取项目详情失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建项目
   */
  async function createProject(data: CreateProjectRequest): Promise<string | null> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post<{
        success: boolean
        error?: string
        data: { id: string }
      }>('/api/v1/projects', data, {
        headers: getHeaders()
      })

      if (response.data.success) {
        // 添加到列表开头
        await fetchProjects()
        return response.data.data.id
      } else {
        error.value = response.data.error || '创建项目失败'
        return null
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '创建项目失败'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新项目
   */
  async function updateProject(id: string, data: Partial<CreateProjectRequest>): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.put<{
        success: boolean
        error?: string
        data: Project
      }>(`/api/v1/projects/${id}`, data, {
        headers: getHeaders()
      })

      if (response.data.success) {
        // 更新列表中的项目
        const index = projects.value.findIndex(p => p.id === id)
        if (index !== -1) {
          projects.value[index] = response.data.data
        }
        // 更新当前项目
        if (currentProject.value?.id === id) {
          currentProject.value = response.data.data
        }
        return true
      } else {
        error.value = response.data.error || '更新项目失败'
        return false
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '更新项目失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除项目
   */
  async function deleteProject(id: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.delete<{
        success: boolean
        error?: string
        message?: string
      }>(`/api/v1/projects/${id}`, {
        headers: getHeaders()
      })

      if (response.data.success) {
        // 从列表中移除
        projects.value = projects.value.filter(p => p.id !== id)
        // 清除当前项目
        if (currentProject.value?.id === id) {
          currentProject.value = null
        }
        return true
      } else {
        error.value = response.data.error || '删除项目失败'
        return false
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '删除项目失败'
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
    fetchProjects({ page })
  }

  /**
   * 重置状态
   */
  function reset() {
    projects.value = []
    currentProject.value = null
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
    projects,
    currentProject,
    loading,
    error,
    pagination,
    
    // 方法
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
    setPage,
    reset
  }
})
