/**
 * 争议仲裁系统API路由
 * 
 * 提供争议和仲裁API：
 * - POST /api/v1/disputes - 发起争议
 * - GET /api/v1/disputes - 查询争议列表
 * - POST /api/v1/disputes/:id/arbitrate - 仲裁裁决
 */

import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/v1/disputes - 发起争议
 */
interface CreateDisputeBody {
  taskId: string
  initiatorId: string
  reason: string
  evidence?: string
  evidenceUrls?: string[]
}

export async function createDisputeRoute(fastify: FastifyInstance) {
  fastify.post<{
    Body: CreateDisputeBody
  }>('/api/v1/disputes', {
    schema: {
      description: '发起争议',
      tags: ['dispute'],
      body: {
        type: 'object',
        required: ['taskId', 'initiatorId', 'reason'],
        properties: {
          taskId: { type: 'string', description: '任务ID' },
          initiatorId: { type: 'string', description: '发起人ID' },
          reason: { type: 'string', description: '争议原因' },
          evidence: { type: 'string', description: '证据描述' },
          evidenceUrls: { type: 'array', items: { type: 'string' }, description: '证据链接' }
        }
      },
      response: {
        201: {
          description: '争议创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                taskId: { type: 'string' },
                projectId: { type: 'string' },
                initiatorId: { type: 'string' },
                respondentId: { type: 'string' },
                reason: { type: 'string' },
                status: { type: 'string' },
                createdAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { taskId, initiatorId, reason, evidence, evidenceUrls } = request.body as CreateDisputeBody

    // 验证必填字段
    if (!taskId || !initiatorId || !reason) {
      reply.status(400)
      return { success: false, error: '缺少必填字段' }
    }

    try {
      // 验证任务是否存在
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true }
      })

      if (!task) {
        reply.status(404)
        return { success: false, error: '任务不存在' }
      }

      // 验证发起人是否是任务参与者
      if (task.assigneeId !== initiatorId && task.project.initiatorId !== initiatorId) {
        reply.status(403)
        return { success: false, error: '无权发起此争议' }
      }

      // 确定应诉方
      const respondentId = task.assigneeId === initiatorId 
        ? task.project.initiatorId 
        : task.assigneeId

      // 创建争议记录
      const dispute = await prisma.dispute.create({
        data: {
          taskId,
          projectId: task.projectId,
          initiatorId,
          respondentId,
          reason,
          evidence,
          evidenceUrls: evidenceUrls || [],
          status: 'OPEN'
        }
      })

      return {
        success: true,
        data: {
          id: dispute.id,
          taskId: dispute.taskId,
          projectId: dispute.projectId,
          initiatorId: dispute.initiatorId,
          respondentId: dispute.respondentId,
          reason: dispute.reason,
          status: dispute.status,
          createdAt: dispute.createdAt.toISOString()
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '发起争议失败' }
    }
  })
}

/**
 * GET /api/v1/disputes - 查询争议列表
 */
interface DisputesQueryParams {
  status?: string
  userId?: string
  page?: string
  pageSize?: string
}

interface DisputeWhereInput {
  status?: string
  OR?: Array<{ initiatorId: string } | { respondentId: string }>
}

export async function getDisputesRoute(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: {
      status?: string
      userId?: string
      page?: string
      pageSize?: string
    }
  }>('/api/v1/disputes', {
    schema: {
      description: '查询争议列表',
      tags: ['dispute'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['OPEN', 'ARBITRATING', 'CLOSED'], description: '状态筛选' },
          userId: { type: 'string', description: '用户ID筛选' },
          page: { type: 'string', default: '1', description: '页码' },
          pageSize: { type: 'string', default: '10', description: '每页数量' }
        }
      },
      response: {
        200: {
          description: '成功返回争议列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                disputes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      taskId: { type: 'string' },
                      taskTitle: { type: 'string' },
                      initiatorId: { type: 'string' },
                      initiatorName: { type: 'string' },
                      respondentId: { type: 'string' },
                      respondentName: { type: 'string' },
                      reason: { type: 'string' },
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
    const { status, userId, page, pageSize } = request.query as DisputesQueryParams

    const pageNum = Math.max(1, Number(page) || 1)
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 10))

    try {
      // 构建查询条件
      const where: DisputeWhereInput = {}
      if (status) {
        where.status = status
      }
      if (userId) {
        where.OR = [
          { initiatorId: userId },
          { respondentId: userId }
        ]
      }

      // 查询争议列表
      const [disputes, total] = await Promise.all([
        prisma.dispute.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * pageSizeNum,
          take: pageSizeNum,
          include: {
            task: {
              select: { id: true, title: true }
            },
            initiator: {
              select: { id: true, name: true }
            },
            respondent: {
              select: { id: true, name: true }
            }
          }
        }),
        prisma.dispute.count({ where })
      ])

      const totalPages = Math.ceil(total / pageSizeNum)

      return {
        success: true,
        data: {
          disputes: disputes.map(d => ({
            id: d.id,
            taskId: d.taskId,
            taskTitle: d.task.title,
            initiatorId: d.initiatorId,
            initiatorName: d.initiator.name,
            respondentId: d.respondentId,
            respondentName: d.respondent.name,
            reason: d.reason,
            status: d.status,
            createdAt: d.createdAt.toISOString()
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
      return { success: false, error: '查询争议列表失败' }
    }
  })
}

/**
 * POST /api/v1/disputes/:id/arbitrate - 仲裁裁决
 */
export async function arbitrateDisputeRoute(fastify: FastifyInstance) {
  fastify.post<{
    Params: { id: string }
    Body: {
      decision: 'SUSTAIN_INITIATOR' | 'OVERTURN_INITIATOR' | 'COMPROMISE'
      decisionReason: string
      refundAmount?: number
      penaltyAmount?: number
      arbitratorId?: string
    }
  }>('/api/v1/disputes/:id/arbitrate', {
    schema: {
      description: '仲裁裁决',
      tags: ['dispute'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '争议ID' }
        }
      },
      body: {
        type: 'object',
        required: ['decision', 'decisionReason'],
        properties: {
          decision: { type: 'string', enum: ['SUSTAIN_INITIATOR', 'OVERTURN_INITIATOR', 'COMPROMISE'], description: '裁决结果' },
          decisionReason: { type: 'string', description: '裁决理由' },
          refundAmount: { type: 'number', description: '退款金额' },
          penaltyAmount: { type: 'number', description: '罚款金额' },
          arbitratorId: { type: 'string', description: '仲裁员ID' }
        }
      },
      response: {
        200: {
          description: '仲裁成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                decision: { type: 'string' },
                decisionReason: { type: 'string' },
                refundAmount: { type: 'number' },
                creditChanges: { type: 'object' },
                status: { type: 'string' },
                arbitratedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const disputeId = (request.params as { id: string }).id
    const { decision, decisionReason, refundAmount, penaltyAmount, arbitratorId } = request.body as {
      decision: 'SUSTAIN_INITIATOR' | 'OVERTURN_INITIATOR' | 'COMPROMISE'
      decisionReason: string
      refundAmount?: number
      penaltyAmount?: number
      arbitratorId?: string
    }

    // 验证必填字段
    if (!decision || !decisionReason) {
      reply.status(400)
      return { success: false, error: '缺少仲裁结果或理由' }
    }

    try {
      // 验证争议是否存在
      const dispute = await prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          task: true,
          initiator: true,
          respondent: true
        }
      })

      if (!dispute) {
        reply.status(404)
        return { success: false, error: '争议不存在' }
      }

      if (dispute.status !== 'OPEN' && dispute.status !== 'ARBITRATING') {
        reply.status(400)
        return { success: false, error: '争议已关闭，不能仲裁' }
      }

      // 更新争议状态
      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'CLOSED',
          decision,
          decisionReason,
          refundAmount,
          penaltyAmount,
          arbitratorId,
          arbitratedAt: new Date(),
          closedAt: new Date()
        }
      })

      // 根据裁决调整信用分
      const creditChanges = {
        initiator: 0,
        respondent: 0
      }

      switch (decision) {
        case 'SUSTAIN_INITIATOR':
          // 维持发起人决定，参与者信用-5，发起人信用不变
          creditChanges.respondent = -5
          break
        case 'OVERTURN_INITIATOR':
          // 推翻发起人决定，参与者信用+10，发起人信用-5
          creditChanges.initiator = -5
          creditChanges.respondent = 10
          break
        case 'COMPROMISE':
          // 各退一步，双方信用-3
          creditChanges.initiator = -3
          creditChanges.respondent = -3
          break
      }

      // 更新参与者信用
      if (creditChanges.initiator !== 0) {
        await updateUserCredit(dispute.initiatorId, creditChanges.initiator, '争议仲裁')
      }
      if (creditChanges.respondent !== 0) {
        await updateUserCredit(dispute.respondentId, creditChanges.respondent, '争议仲裁')
      }

      // 如果有退款，处理退款
      if (refundAmount && refundAmount > 0) {
        await handleRefund(dispute.taskId, refundAmount)
      }

      return {
        success: true,
        data: {
          id: disputeId,
          decision,
          decisionReason,
          refundAmount,
          creditChanges,
          status: 'CLOSED',
          arbitratedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '仲裁失败' }
    }
  })
}

/**
 * 更新用户信用分
 */
async function updateUserCredit(userId: string, change: number, reason: string) {
  try {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) return

    // 记录信用历史
    await prisma.userCreditHistory.create({
      data: {
        userId,
        creditType: 'PARTICIPANT_CREDIT',
        change,
        previousScore: 0, // 简化处理，实际应查询当前分数
        newScore: change,
        sourceType: 'PUNISHMENT',
        description: reason
      }
    })
  } catch (error) {
    console.error('更新信用失败:', error)
  }
}

/**
 * 处理退款
 */
async function handleRefund(taskId: string, amount: number) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true }
    })

    if (!task) return

    // 退还部分预算给发起人
    await prisma.pointTransaction.create({
      data: {
        userId: task.project.initiatorId,
        amount,
        balanceBefore: 0,
        balanceAfter: amount,
        type: 'REFUND',
        description: `争议退款`,
        taskId
      }
    })

    // 更新发起人积分
    const initiator = await prisma.user.findUnique({
      where: { id: task.project.initiatorId }
    })

    if (initiator) {
      await prisma.user.update({
        where: { id: task.project.initiatorId },
        data: { points: initiator.points + amount }
      })
    }
  } catch (error) {
    console.error('处理退款失败:', error)
  }
}

/**
 * 争议仲裁系统API路由注册
 */
export default async function disputeRoutes(fastify: FastifyInstance) {
  await createDisputeRoute(fastify)
  await getDisputesRoute(fastify)
  await arbitrateDisputeRoute(fastify)
}
