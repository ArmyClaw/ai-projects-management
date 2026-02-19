/**
 * 通知Store
 * 
 * 管理用户通知状态
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { createConnection, onConnectionChange, onNotification, type NotificationType } from '@/services/websocket'

/**
 * 通知项接口
 */
export interface Notification {
  id: string
  type: 'TASK_UPDATE' | 'SETTLEMENT' | 'DISPUTE' | 'SYSTEM'
  title: string
  message: string
  data: Record<string, unknown> | null
  isRead: boolean
  readAt: string | null
  createdAt: string
}

/**
 * 实时通知负载接口
 */
interface RealTimePayload {
  id?: string
  title: string
  message: string
  data?: Record<string, unknown>
  createdAt?: string
}

/**
 * 通知列表响应接口
 */
export interface NotificationListResponse {
  success: boolean
  error?: string
  data: {
    notifications: Notification[]
    total: number
    unreadCount: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * 使用通知Store
 */
export const useNotificationStore = defineStore('notification', () => {
  // 状态
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const wsConnected = ref(false)

  // 计算属性
  const hasUnread = computed(() => unreadCount.value > 0)
  const readNotifications = computed(() => notifications.value.filter(n => n.isRead))
  const unreadNotifications = computed(() => notifications.value.filter(n => !n.isRead))

  // 初始化WebSocket连接
  function initWebSocket(): void {
    // 监听连接状态
    onConnectionChange((connected) => {
      wsConnected.value = connected
      console.log('WebSocket连接状态:', connected)
    })

    // 监听实时通知
    setupNotificationListeners()

    // 创建连接
    createConnection()
  }

  // 设置通知监听器
  function setupNotificationListeners(): void {
    // 监听所有类型的通知
    onNotification('task:update' as NotificationType, (payload) => {
      addRealTimeNotification('TASK_UPDATE', payload)
    })
    onNotification('settlement' as NotificationType, (payload) => {
      addRealTimeNotification('SETTLEMENT', payload)
    })
    onNotification('dispute' as NotificationType, (payload) => {
      addRealTimeNotification('DISPUTE', payload)
    })
    onNotification('system' as NotificationType, (payload) => {
      addRealTimeNotification('SYSTEM', payload)
    })
  }

  // 添加实时通知
  function addRealTimeNotification(type: Notification['type'], payload: RealTimePayload): void {
    const notification: Notification = {
      id: payload.id || `ws-${Date.now()}`,
      type,
      title: payload.title,
      message: payload.message,
      data: payload.data || null,
      isRead: false,
      readAt: null,
      createdAt: payload.createdAt || new Date().toISOString()
    }

    notifications.value.unshift(notification)
    unreadCount.value++
  }

  /**
   * 获取通知列表
   */
  async function fetchNotifications(params?: {
    page?: number
    pageSize?: number
    type?: string
    isRead?: boolean
  }): Promise<boolean> {
    const token = localStorage.getItem('token')
    if (!token) {
      error.value = '未登录'
      return false
    }

    loading.value = true
    error.value = null

    try {
      const response = await axios.get<NotificationListResponse>('/api/v1/notifications', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 10,
          type: params?.type,
          isRead: params?.isRead !== undefined ? String(params?.isRead) : undefined
        }
      })

      if (response.data.success) {
        notifications.value = response.data.data.notifications
        unreadCount.value = response.data.data.unreadCount
        return true
      } else {
        error.value = response.data.error || '获取通知失败'
        return false
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } }
      error.value = axiosError.response?.data?.error ?? '获取通知失败'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取未读通知数量
   */
  async function fetchUnreadCount(): Promise<boolean> {
    const token = localStorage.getItem('token')
    if (!token) {
      return false
    }

    try {
      const response = await axios.get('/api/v1/notifications/unread-count', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data.success) {
        unreadCount.value = response.data.data.unreadCount
        return true
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * 标记通知为已读
   */
  async function markAsRead(id: string): Promise<boolean> {
    const token = localStorage.getItem('token')
    if (!token) {
      return false
    }

    try {
      const response = await axios.put(`/api/v1/notifications/${id}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data.success) {
        // 更新本地状态
        const notification = notifications.value.find(n => n.id === id)
        if (notification) {
          notification.isRead = true
          notification.readAt = new Date().toISOString()
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * 批量标记所有通知为已读
   */
  async function markAllAsRead(): Promise<boolean> {
    const token = localStorage.getItem('token')
    if (!token) {
      return false
    }

    try {
      const response = await axios.put('/api/v1/notifications/read-all', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data.success) {
        // 更新本地状态
        notifications.value.forEach(n => {
          n.isRead = true
          n.readAt = new Date().toISOString()
        })
        unreadCount.value = 0
        return true
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * 删除通知
   */
  async function deleteNotification(id: string): Promise<boolean> {
    const token = localStorage.getItem('token')
    if (!token) {
      return false
    }

    try {
      const response = await axios.delete(`/api/v1/notifications/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.data.success) {
        // 从本地移除
        const index = notifications.value.findIndex(n => n.id === id)
        if (index !== -1) {
          const notification = notifications.value[index]
          notifications.value.splice(index, 1)
          if (!notification.isRead) {
            unreadCount.value = Math.max(0, unreadCount.value - 1)
          }
        }
        return true
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * 添加通知（WebSocket推送）
   */
  function addNotification(notification: Notification): void {
    notifications.value.unshift(notification)
    if (!notification.isRead) {
      unreadCount.value++
    }
  }

  /**
   * 清除所有状态
   */
  function clear(): void {
    notifications.value = []
    unreadCount.value = 0
    error.value = null
  }

  return {
    // 状态
    notifications,
    unreadCount,
    loading,
    error,
    wsConnected,

    // 计算属性
    hasUnread,
    readNotifications,
    unreadNotifications,

    // 方法
    initWebSocket,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
    clear
  }
})
