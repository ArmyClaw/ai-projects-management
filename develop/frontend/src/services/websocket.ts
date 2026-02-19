/**
 * WebSocket 客户端服务
 * 
 * 管理WebSocket连接和事件处理
 */

import { io, Socket } from 'socket.io-client'
import { useNotificationStore, type Notification } from '@/stores/notification'

// WebSocket配置
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000'
const RECONNECT_DELAY = 1000 // 初始重连延迟（毫秒）
const MAX_RECONNECT_DELAY = 30000 // 最大重连延迟（毫秒）

// 通知类型
export type NotificationType = 'task:update' | 'settlement' | 'dispute' | 'system'

// 通知事件
export const NOTIFICATION_EVENTS = {
  TASK_UPDATE: 'notification:task:update',
  SETTLEMENT: 'notification:settlement',
  DISPUTE: 'notification:dispute',
  SYSTEM: 'notification:system'
} as const

// WebSocket实例
let socket: Socket | null = null
let reconnectAttempts = 0
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null
let isManuallyDisconnected = false

// 获取认证token
function getAuthToken(): string | null {
  return localStorage.getItem('token')
}

// 通知负载接口
interface NotificationPayload {
  id: string
  title: string
  message: string
  data?: Record<string, unknown>
  createdAt: string
}

/**
 * 创建Socket连接
 * @returns Socket实例
 */
export function createConnection(): Socket {
  if (socket?.connected) {
    return socket
  }

  const token = getAuthToken()

  socket = io(WS_URL, {
    path: '/ws',
    auth: token ? { token } : undefined,
    transports: ['websocket', 'polling'],
    reconnection: false, // 手动管理重连
    reconnectionAttempts: 0,
    timeout: 10000,
    autoConnect: true
  })

  // 连接成功
  socket.on('connect', () => {
    console.log('WebSocket已连接:', socket?.id)
    reconnectAttempts = 0
    
    // 重新订阅通知（如果已登录）
    if (getAuthToken()) {
      subscribeToNotifications()
    }
  })

  // 连接错误
  socket.on('connect_error', (error: Error) => {
    console.error('WebSocket连接错误:', error.message)
    scheduleReconnect()
  })

  // 断开连接
  socket.on('disconnect', (reason: string) => {
    console.log('WebSocket断开:', reason)
    
    if (reason === 'io server disconnect') {
      // 服务器主动断开，需要手动重连
      scheduleReconnect()
    }
  })

  // 监听所有通知事件
  setupNotificationListeners()

  return socket
}

/**
 * 设置通知事件监听
 */
function setupNotificationListeners(): void {
  if (!socket) return

  const notificationStore = useNotificationStore()

  // 创建通知对象的辅助函数
  const createNotificationObj = (payload: NotificationPayload, type: Notification['type']): Notification => ({
    id: payload.id,
    type,
    title: payload.title,
    message: payload.message,
    data: payload.data || null,
    isRead: false,
    readAt: null,
    createdAt: payload.createdAt
  })

  // 任务更新通知
  socket.on(NOTIFICATION_EVENTS.TASK_UPDATE, (payload: NotificationPayload) => {
    console.log('收到任务更新通知:', payload)
    notificationStore.addNotification(createNotificationObj(payload, 'TASK_UPDATE'))
  })

  // 结算通知
  socket.on(NOTIFICATION_EVENTS.SETTLEMENT, (payload: NotificationPayload) => {
    console.log('收到结算通知:', payload)
    notificationStore.addNotification(createNotificationObj(payload, 'SETTLEMENT'))
  })

  // 争议通知
  socket.on(NOTIFICATION_EVENTS.DISPUTE, (payload: NotificationPayload) => {
    console.log('收到争议通知:', payload)
    notificationStore.addNotification(createNotificationObj(payload, 'DISPUTE'))
  })

  // 系统通知
  socket.on(NOTIFICATION_EVENTS.SYSTEM, (payload: NotificationPayload) => {
    console.log('收到系统通知:', payload)
    notificationStore.addNotification(createNotificationObj(payload, 'SYSTEM'))
  })
}

/**
 * 订阅通知
 */
export function subscribeToNotifications(): void {
  if (!socket?.connected) {
    console.warn('WebSocket未连接，无法订阅')
    return
  }

  const userId = localStorage.getItem('userId')
  if (userId) {
    socket.emit('subscribe', `user:${userId}`)
    console.log('已订阅用户通知:', userId)
  }
}

/**
 * 取消订阅
 */
export function unsubscribeFromNotifications(): void {
  if (!socket?.connected) return

  const userId = localStorage.getItem('userId')
  if (userId) {
    socket.emit('unsubscribe', `user:${userId}`)
    console.log('已取消订阅用户通知:', userId)
  }
}

/**
 * 调度重连（指数退避）
 */
function scheduleReconnect(): void {
  if (isManuallyDisconnected) return
  if (reconnectTimeout) return

  // 计算延迟（指数退避）
  const delay = Math.min(RECONNECT_DELAY * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY)
  reconnectAttempts++

  console.log(`${delay}ms 后尝试重连 (第 ${reconnectAttempts} 次)`)

  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null
    if (!isManuallyDisconnected) {
      createConnection()
    }
  }, delay)
}

/**
 * 手动连接
 */
export function connect(): void {
  isManuallyDisconnected = false
  createConnection()
}

/**
 * 手动断开
 */
export function disconnect(): void {
  isManuallyDisconnected = true
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = null
  }

  if (socket) {
    socket.disconnect()
    socket = null
    console.log('WebSocket已手动断开')
  }
}

/**
 * 获取连接状态
 * @returns 是否已连接
 */
export function getConnectionStatus(): boolean {
  return socket?.connected ?? false
}

/**
 * 监听连接状态变化
 * @param callback - 状态变化回调
 * @returns 取消监听函数
 */
export function onConnectionChange(callback: (connected: boolean) => void): () => void {
  if (!socket) {
    setTimeout(() => callback(false), 0)
    return () => {}
  }

  const handleConnect = () => callback(true)
  const handleDisconnect = () => callback(false)

  socket.on('connect', handleConnect)
  socket.on('disconnect', handleDisconnect)

  return () => {
    socket?.off('connect', handleConnect)
    socket?.off('disconnect', handleDisconnect)
  }
}

/**
 * 监听特定通知类型
 * @param type - 通知类型
 * @param callback - 回调函数
 * @returns 取消监听函数
 */
export function onNotification(
  type: NotificationType,
  callback: (payload: NotificationPayload) => void
): () => void {
  if (!socket) {
    return () => {}
  }

  const eventMap: Record<NotificationType, string> = {
    'task:update': NOTIFICATION_EVENTS.TASK_UPDATE,
    'settlement': NOTIFICATION_EVENTS.SETTLEMENT,
    'dispute': NOTIFICATION_EVENTS.DISPUTE,
    'system': NOTIFICATION_EVENTS.SYSTEM
  }

  const event = eventMap[type]
  socket.on(event, callback)

  return () => {
    socket?.off(event, callback)
  }
}

export default {
  createConnection,
  connect,
  disconnect,
  getConnectionStatus,
  onConnectionChange,
  onNotification,
  subscribeToNotifications,
  unsubscribeFromNotifications
}
