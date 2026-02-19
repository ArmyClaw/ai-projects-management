import { FastifyInstance } from 'fastify'
import { prisma } from '../app'

/**
 * 通知列表响应类型
 */
interface NotificationListResponse {
  success: boolean
  data: {
    notifications: NotificationItem[]
    total: number
    unreadCount: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * 通知项
 */
interface NotificationItem {
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
 * 通知查询参数
 */
interface NotificationQueryParams {
  page?: string
  pageSize?: string
  type?: string
  isRead?: string
}

/**
 * 获取通知列表
 * GET /api/v1/notifications
 * 
 * 查询参数：
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 10，最大 100）
 * - type: 通知类型筛选（可选）
 * - isRead: 已读状态筛选（可选，true/false）
 */
export async function getNotificationsRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Querystring: {
      page?: string
      pageSize?: string
      type?: string
      isRead?: string
    }
  }>('/api/v1/notifications', {
    schema: {
      description: '获取通知列表',
      tags: ['notifications'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1', description: '页码' },
          pageSize: { type: 'string', default: '10', description: '每页数量' },
          type: { type: 'string', enum: ['TASK_UPDATE', 'SETTLEMENT', 'DISPUTE', 'SYSTEM'], description: '通知类型筛选' },
          isRead: { type: 'string', enum: ['true', 'false'], description: '已读状态筛选' }
        }
      },
      response: {
        200: {
          description: '成功返回通知列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                notifications: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string' },
                      title: { type: 'string' },
                      message: { type: 'string' },
                      data: { type: 'object' },
                      isRead: { type: 'boolean' },
                      readAt: { type: ['string', 'null'] },
                      createdAt: { type: 'string' }
                    }
                  }
                },
                total: { type: 'number' },
                unreadCount: { type: 'number' },
                page: { type: 'number' },
                pageSize: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // 验证JWT
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: '未授权访问'
        })
      }

      const userId = (request.user as { id: string }).id

      // 解析分页参数
      const page = parseInt(request.query.page || '1', 10)
      const pageSize = Math.min(parseInt(request.query.pageSize || '10', 10), 100)
      const type = request.query.type
      const isRead = request.query.isRead

      // 验证参数
      if (page < 1) {
        return reply.status(400).send({
          success: false,
          error: '页码必须大于 0'
        })
      }

      if (pageSize < 1) {
        return reply.status(400).send({
          success: false,
          error: '每页数量必须大于 0'
        })
      }

      // 构建查询条件
      const where: { userId: string; type?: string; isRead?: boolean } = { userId }
      if (type) {
        where.type = type
      }
      if (isRead !== undefined) {
        where.isRead = isRead === 'true'
      }

      // 查询总数
      const total = await prisma.notification.count({ where })

      // 查询未读数量
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
      })

      // 查询通知列表
      const notifications = await prisma.notification.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createdAt: 'desc'
        }
      })

      // 格式化响应数据
      const formattedNotifications: NotificationItem[] = notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data as Record<string, any> | null,
        isRead: notification.isRead,
        readAt: notification.readAt?.toISOString() || null,
        createdAt: notification.createdAt.toISOString()
      }))

      // 计算总页数
      const totalPages = Math.ceil(total / pageSize)

      // 返回响应
      const response: NotificationListResponse = {
        success: true,
        data: {
          notifications: formattedNotifications,
          total,
          unreadCount,
          page,
          pageSize,
          totalPages
        }
      }

      return reply.status(200).send(response)
    } catch (error) {
      fastify.log.error('获取通知列表失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 获取未读通知数量
 * GET /api/v1/notifications/unread-count
 */
export async function getUnreadCountRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/v1/notifications/unread-count', {
    schema: {
      description: '获取未读通知数量',
      tags: ['notifications'],
      response: {
        200: {
          description: '成功返回未读数量',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                unreadCount: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // 验证JWT
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: '未授权访问'
        })
      }

      const userId = (request.user as any).id

      // 查询未读数量
      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
      })

      return reply.status(200).send({
        success: true,
        data: {
          unreadCount
        }
      })
    } catch (error) {
      fastify.log.error('获取未读通知数量失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 标记通知为已读
 * PUT /api/v1/notifications/:id/read
 */
export async function markAsReadRoute(fastify: FastifyInstance): Promise<void> {
  fastify.put<{
    Params: {
      id: string
    }
  }>('/api/v1/notifications/:id/read', {
    schema: {
      description: '标记通知为已读',
      tags: ['notifications'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '通知ID' }
        }
      },
      response: {
        200: {
          description: '标记成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // 验证JWT
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: '未授权访问'
        })
      }

      const userId = (request.user as any).id
      const { id } = request.params

      // 查询通知是否存在
      const notification = await prisma.notification.findUnique({
        where: { id }
      })

      if (!notification) {
        return reply.status(404).send({
          success: false,
          error: '通知不存在'
        })
      }

      // 验证通知归属
      if (notification.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: '无权操作此通知'
        })
      }

      // 标记为已读
      await prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      return reply.status(200).send({
        success: true,
        message: '标记成功'
      })
    } catch (error) {
      fastify.log.error('标记通知已读失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 批量标记通知为已读
 * PUT /api/v1/notifications/read-all
 */
export async function markAllAsReadRoute(fastify: FastifyInstance): Promise<void> {
  fastify.put('/api/v1/notifications/read-all', {
    schema: {
      description: '批量标记所有通知为已读',
      tags: ['notifications'],
      response: {
        200: {
          description: '标记成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // 验证JWT
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: '未授权访问'
        })
      }

      const userId = (request.user as any).id

      // 批量标记为已读
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: {
          isRead: true,
          readAt: new Date()
        }
      })

      return reply.status(200).send({
        success: true,
        message: '标记成功'
      })
    } catch (error) {
      fastify.log.error('批量标记通知已读失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 删除通知
 * DELETE /api/v1/notifications/:id
 */
export async function deleteNotificationRoute(fastify: FastifyInstance): Promise<void> {
  fastify.delete<{
    Params: {
      id: string
    }
  }>('/api/v1/notifications/:id', {
    schema: {
      description: '删除通知',
      tags: ['notifications'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '通知ID' }
        }
      },
      response: {
        200: {
          description: '删除成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // 验证JWT
      if (!request.user) {
        return reply.status(401).send({
          success: false,
          error: '未授权访问'
        })
      }

      const userId = (request.user as any).id
      const { id } = request.params

      // 查询通知是否存在
      const notification = await prisma.notification.findUnique({
        where: { id }
      })

      if (!notification) {
        return reply.status(404).send({
          success: false,
          error: '通知不存在'
        })
      }

      // 验证通知归属
      if (notification.userId !== userId) {
        return reply.status(403).send({
          success: false,
          error: '无权操作此通知'
        })
      }

      // 删除通知
      await prisma.notification.delete({
        where: { id }
      })

      return reply.status(200).send({
        success: true,
        message: '删除成功'
      })
    } catch (error) {
      fastify.log.error('删除通知失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

export default { 
  getNotificationsRoute, 
  getUnreadCountRoute, 
  markAsReadRoute, 
  markAllAsReadRoute,
  deleteNotificationRoute 
}
