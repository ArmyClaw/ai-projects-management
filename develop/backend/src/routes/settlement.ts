/**
 * 结算系统API路由
 * 
 * 提供积分结算API：
 * - POST /api/v1/settlements - 创建结算记录
 * - GET /api/v1/settlements - 查询结算记录
 */

import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/v1/settlements - 创建结算记录
 */
export async function createSettlementRoute(fastify: FastifyInstance) {
  fastify.post<{
    Body: {
      userId: string
      taskId?: string
      amount: number
      type: 'TASK_COMPLETE' | 'REVIEW_REWARD' | 'BONUS' | 'PENALTY' | 'PLATFORM_FEE' | 'REFUND'
      mode?: 'COMMUNITY' | 'ENTERPRISE'
      description?: string
    }
  }>('/api/v1/settlements', {
    schema: {
      description: '创建结算记录',
      tags: ['settlement'],
      body: {
        type: 'object',
        required: ['userId', 'amount', 'type'],
        properties: {
          userId: { type: 'string', description: '用户ID' },
          taskId: { type: 'string', description: '任务ID' },
          amount: { type: 'number', description: '结算金额' },
          type: { type: 'string', enum: ['TASK_COMPLETE', 'REVIEW_REWARD', 'BONUS', 'PENALTY', 'PLATFORM_FEE', 'REFUND'], description: '结算类型' },
          mode: { type: 'string', enum: ['COMMUNITY', 'ENTERPRISE'], description: '项目模式' },
          description: { type: 'string', description: '结算描述' }
        }
      },
      response: {
        201: {
          description: '结算成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                userId: { type: 'string' },
                taskId: { type: 'string' },
                amount: { type: 'number' },
                platformFee: { type: 'number' },
                netAmount: { type: 'number' },
                type: { type: 'string' },
                status: { type: 'string' },
                createdAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { userId, taskId, amount, type, mode, description } = request.body as {
      userId: string
      taskId?: string
      amount: number
      type: 'TASK_COMPLETE' | 'REVIEW_REWARD' | 'BONUS' | 'PENALTY' | 'PLATFORM_FEE' | 'REFUND'
      mode?: 'COMMUNITY' | 'ENTERPRISE'
      description?: string
    }

    // 验证必填字段
    if (!userId || !amount || amount <= 0) {
      reply.status(400)
      return { success: false, error: '无效结算参数' }
    }

    try {
      // 验证用户是否存在
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        reply.status(404)
        return { success: false, error: '用户不存在' }
      }

      // 计算平台抽成
      const feeRate = mode === 'ENTERPRISE' ? 0.03 : 0.05
      const platformFee = Math.round(amount * feeRate * 100) / 100
      const netAmount = Math.round((amount - platformFee) * 100) / 100

      // 计算新的积分余额
      const newBalance = user.points + netAmount

      // 创建结算记录
      const settlement = await prisma.settlement.create({
        data: {
          userId,
          taskId,
          amount,
          platformFee,
          netAmount,
          currency: 'POINT',
          type,
          description,
          status: 'COMPLETED',
          settledAt: new Date()
        }
      })

      // 更新用户积分
      await prisma.user.update({
        where: { id: userId },
        data: { points: newBalance }
      })

      return {
        success: true,
        data: {
          id: settlement.id,
          userId: settlement.userId,
          taskId: settlement.taskId,
          amount: settlement.amount,
          platformFee: settlement.platformFee,
          netAmount: settlement.netAmount,
          type: settlement.type,
          status: settlement.status,
          createdAt: settlement.createdAt.toISOString()
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '结算失败' }
    }
  })
}

/**
 * GET /api/v1/settlements - 查询结算记录
 */
export async function getSettlementsRoute(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: {
      userId?: string
      page?: string
      pageSize?: string
    }
  }>('/api/v1/settlements', {
    schema: {
      description: '查询结算记录',
      tags: ['settlement'],
      querystring: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: '用户ID筛选' },
          page: { type: 'string', default: '1', description: '页码' },
          pageSize: { type: 'string', default: '10', description: '每页数量' }
        }
      },
      response: {
        200: {
          description: '成功返回结算记录',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                settlements: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      userId: { type: 'string' },
                      taskId: { type: 'string' },
                      amount: { type: 'number' },
                      platformFee: { type: 'number' },
                      netAmount: { type: 'number' },
                      type: { type: 'string' },
                      status: { type: 'string' },
                      createdAt: { type: 'string' }
                    }
                  }
                },
                total: { type: 'number' },
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
    const { userId, page, pageSize } = request.query as {
      userId?: string
      page?: string
      pageSize?: string
    }

    const pageNum = Math.max(1, Number(page) || 1)
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 10))

    try {
      // 构建查询条件
      const where: any = {}
      if (userId) {
        where.userId = userId
      }

      // 查询结算记录
      const [settlements, total] = await Promise.all([
        prisma.settlement.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * pageSizeNum,
          take: pageSizeNum
        }),
        prisma.settlement.count({ where })
      ])

      const totalPages = Math.ceil(total / pageSizeNum)

      return {
        success: true,
        data: {
          settlements: settlements.map(s => ({
            id: s.id,
            userId: s.userId,
            taskId: s.taskId,
            amount: s.amount,
            platformFee: s.platformFee,
            netAmount: s.netAmount,
            type: s.type,
            status: s.status,
            createdAt: s.createdAt.toISOString()
          })),
          total,
          page: pageNum,
          pageSize: pageSizeNum,
          totalPages
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '查询结算记录失败' }
    }
  })
}

/**
 * 结算系统API路由注册
 */
export default async function settlementRoutes(fastify: FastifyInstance) {
  await createSettlementRoute(fastify)
  await getSettlementsRoute(fastify)
}
