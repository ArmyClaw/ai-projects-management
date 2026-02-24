/**
 * WebSocket 服务
 * 
 * 提供实时通知推送功能
 */

import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { FastifyInstance } from 'fastify'

// 通知类型
export type NotificationType = 'task:update' | 'settlement' | 'dispute' | 'system'

// 通知接口
export interface NotificationPayload {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  createdAt: string
}

// WebSocket配置
export interface WebSocketConfig {
  corsOrigin: string | string[]
  jwtSecret: string
}

// 连接用户信息
interface AuthenticatedSocket extends Socket {
  userId?: string
  userEmail?: string
}

// 全局Fastify实例引用
let globalFastifyInstance: FastifyInstance | undefined

/**
 * 设置全局Fastify实例（供WebSocket使用）
 * @param instance - Fastify实例
 */
export function setGlobalFastifyInstance(instance: FastifyInstance): void {
  globalFastifyInstance = instance
}

/**
 * 创建WebSocket服务器实例
 * @param httpServer - HTTP服务器实例
 * @param config - WebSocket配置
 * @returns Socket.IO服务器实例
 */
export function createWebSocketServer(httpServer: HttpServer, config: WebSocketConfig): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/ws'
  })

  // JWT认证中间件
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token

      if (!token) {
        // 允许匿名连接（只用于公开事件）
        return next()
      }

      // 获取Fastify JWT实例
      const fastifyInstance = (socket as { request?: { server?: FastifyInstance } }).request?.server || globalFastifyInstance
      if (fastifyInstance?.jwt) {
        try {
          const decoded = fastifyInstance.jwt.verify(token) as { userId?: string; sub?: string; email?: string }
          socket.userId = decoded.userId || decoded.sub
          socket.userEmail = decoded.email
        } catch {
          fastifyInstance.log.warn('WebSocket JWT验证失败，允许匿名连接')
        }
      }

      next()
    } catch {
      // Token无效，但允许连接（降级为匿名）
      globalFastifyInstance?.log.warn('WebSocket JWT验证错误，允许匿名连接')
      next()
    }
  })

  // 连接事件
  io.on('connection', (socket: AuthenticatedSocket) => {
    globalFastifyInstance?.log.info(`客户端连接: ${socket.id}, 用户ID: ${socket.userId || '匿名'}`)

    // 用户加入自己的房间
    if (socket.userId) {
      socket.join(`user:${socket.userId}`)
      globalFastifyInstance?.log.info(`用户 ${socket.userId} 加入个人房间`)
    }

    // 监听连接事件
    socket.on('subscribe', (room: string) => {
      socket.join(room)
      globalFastifyInstance?.log.info(`客户端 ${socket.id} 订阅房间: ${room}`)
    })

    // 监听取消订阅
    socket.on('unsubscribe', (room: string) => {
      socket.leave(room)
      globalFastifyInstance?.log.info(`客户端 ${socket.id} 取消订阅房间: ${room}`)
    })

    // 断开连接
    socket.on('disconnect', (reason) => {
      globalFastifyInstance?.log.info(`客户端断开: ${socket.id}, 原因: ${reason}`)
    })
  })

  return io
}

/**
 * 推送给特定用户
 * @param io - Socket.IO服务器实例
 * @param userId - 用户ID
 * @param event - 事件名称
 * @param payload - 通知数据
 */
export function sendToUser(io: Server, userId: string, event: string, payload: NotificationPayload): void {
  io.to(`user:${userId}`).emit(event, payload)
}

/**
 * 推送给特定房间
 * @param io - Socket.IO服务器实例
 * @param room - 房间名称
 * @param event - 事件名称
 * @param payload - 通知数据
 */
export function sendToRoom(io: Server, room: string, event: string, payload: NotificationPayload): void {
  io.to(room).emit(event, payload)
}

/**
 * 广播给所有连接
 * @param io - Socket.IO服务器实例
 * @param event - 事件名称
 * @param payload - 通知数据
 */
export function broadcast(io: Server, event: string, payload: NotificationPayload): void {
  io.emit(event, payload)
}

/**
 * 创建通知辅助函数
 * @param id - 通知ID
 * @param type - 通知类型
 * @param title - 通知标题
 * @param message - 通知消息
 * @param data - 附加数据
 * @returns 通知负载对象
 */
export function createNotificationPayload(
  id: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>
): NotificationPayload {
  return {
    id,
    type,
    title,
    message,
    data,
    createdAt: new Date().toISOString()
  }
}

export default {
  createWebSocketServer,
  sendToUser,
  sendToRoom,
  broadcast,
  createNotificationPayload
}
