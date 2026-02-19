/**
 * 积分系统API路由
 * 
 * 提供用户积分查询和交易记录API：
 * - GET /api/v1/users/:id/points - 获取用户积分余额
 * - GET /api/v1/users/:id/points/transactions - 获取用户积分交易记录
 */

import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 积分交易记录类型
 */
interface PointTransaction {
  id: string
  type: string
  amount: number
  description: string | null
  balanceBefore: number
  balanceAfter: number
  createdAt: string
}

/**
 * GET /api/v1/users/:id/points - 获取用户积分余额
 */
export async function getUserPointsRoute(fastify: FastifyInstance) {
  fastify.get('/api/v1/users/:id/points', async (request, reply) => {
    const { id } = request.params as { id: string }

    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, points: true, updatedAt: true }
      })

      if (!user) {
        reply.status(404)
        return { success: false, error: '用户不存在' }
      }

      return {
        success: true,
        data: {
          userId: user.id,
          points: user.points,
          lastUpdated: user.updatedAt.toISOString()
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '获取积分失败' }
    }
  })
}

/**
 * GET /api/v1/users/:id/points/transactions - 获取用户积分交易记录
 */
export async function getUserPointsTransactionsRoute(fastify: FastifyInstance) {
  fastify.get('/api/v1/users/:id/points/transactions', async (request, reply) => {
    const { id } = request.params as { id: string }
    const query = request.query as { page?: string; pageSize?: string }
    const page = Math.max(1, Number(query?.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(query?.pageSize) || 10))

    try {
      // 验证用户是否存在
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true }
      })

      if (!user) {
        reply.status(404)
        return { success: false, error: '用户不存在' }
      }

      // 查询交易记录
      const [transactions, total] = await Promise.all([
        prisma.pointTransaction.findMany({
          where: { userId: id },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize
        }),
        prisma.pointTransaction.count({
          where: { userId: id }
        })
      ])

      const totalPages = Math.ceil(total / pageSize)

      return {
        success: true,
        data: {
          userId: id,
          transactions: transactions.map(tx => ({
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            balanceBefore: tx.balanceBefore,
            balanceAfter: tx.balanceAfter,
            createdAt: tx.createdAt.toISOString()
          })),
          total,
          page,
          pageSize,
          totalPages
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '获取交易记录失败' }
    }
  })
}

/**
 * 积分系统API路由注册
 */
export default async function pointsRoutes(fastify: FastifyInstance) {
  await getUserPointsRoute(fastify)
  await getUserPointsTransactionsRoute(fastify)
}
