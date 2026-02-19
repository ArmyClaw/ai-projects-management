/**
 * 用户认证Store
 * 
 * 管理用户认证状态和用户信息
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

/**
 * 用户信息接口
 */
export interface User {
  id: string
  email: string
  name: string
  avatar: string | null
  role: 'INITIATOR' | 'PARTICIPANT' | 'ADMIN'
  githubId: string | null
  points: number
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

/**
 * 登录响应接口
 */
export interface LoginResponse {
  success: boolean
  data: {
    user: User
    token: string
    tokenType: string
    expiresIn: number
  }
}

/**
 * 使用用户认证Store
 */
export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isInitiator = computed(() => user.value?.role === 'INITIATOR')
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const userPoints = computed(() => user.value?.points || 0)

  /**
   * 登录
   */
  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      const response = await axios.post<LoginResponse>('/api/v1/auth/login', {
        email,
        password
      })

      if (response.data.success) {
        token.value = response.data.data.token
        user.value = response.data.data.user
        
        // 存储到localStorage
        localStorage.setItem('token', token.value)
        
        return true
      } else {
        error.value = response.data.error || '登录失败'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || '登录失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * GitHub登录
   */
  async function loginWithGitHub(): Promise<boolean> {
    loading.value = true
    error.value = null

    try {
      // 获取OAuth URL
      const oauthResponse = await axios.get('/api/v1/auth/github')
      
      if (oauthResponse.data.success) {
        // 跳转到GitHub授权页面
        window.location.href = oauthResponse.data.data.oauthUrl
        return true
      } else {
        error.value = oauthResponse.data.error || 'GitHub登录失败'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || 'GitHub登录失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取当前用户信息
   */
  async function fetchCurrentUser(): Promise<boolean> {
    if (!token.value) {
      // 尝试从localStorage获取token
      token.value = localStorage.getItem('token')
    }

    if (!token.value) {
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await axios.get('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (response.data.success) {
        user.value = response.data.data
        return true
      } else {
        // Token无效，清除状态
        logout()
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || '获取用户信息失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 登出
   */
  async function logout(): Promise<void> {
    try {
      await axios.post('/api/v1/auth/logout', {}, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })
    } catch {
      // 忽略登出错误
    } finally {
      // 清除状态
      user.value = null
      token.value = null
      error.value = null
      
      // 清除localStorage
      localStorage.removeItem('token')
    }
  }

  /**
   * 刷新Token
   */
  async function refreshToken(): Promise<boolean> {
    if (!token.value) {
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await axios.post('/api/v1/auth/refresh', {}, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (response.data.success) {
        token.value = response.data.data.accessToken
        localStorage.setItem('token', token.value)
        return true
      } else {
        error.value = response.data.error || '刷新Token失败'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || '刷新Token失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新用户信息
   */
  async function updateProfile(data: Partial<User>): Promise<boolean> {
    if (!token.value) {
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await axios.put('/api/v1/users/profile', data, {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      if (response.data.success) {
        user.value = { ...user.value!, ...response.data.data }
        return true
      } else {
        error.value = response.data.error || '更新失败'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.error || '更新失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 初始化（页面加载时）
   */
  async function initialize(): Promise<void> {
    // 尝试恢复登录状态
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      token.value = savedToken
      await fetchCurrentUser()
    }
  }

  return {
    // 状态
    user,
    token,
    loading,
    error,
    
    // 计算属性
    isAuthenticated,
    isInitiator,
    isAdmin,
    userPoints,
    
    // 方法
    login,
    loginWithGitHub,
    fetchCurrentUser,
    logout,
    refreshToken,
    updateProfile,
    initialize
  }
})
