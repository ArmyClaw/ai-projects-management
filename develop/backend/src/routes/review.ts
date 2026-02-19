/**
 * 验收系统API路由
 * 
 * 提供任务交付和验收API：
 * - POST /api/v1/tasks/:id/submit - 提交任务交付
 * - POST /api/v1/tasks/:id/review - 发起人验收任务
 */

import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/v1/tasks/:id/submit - 提交任务交付
 */
export async function submitTaskRoute(fastify: FastifyInstance) {
  fastify.post('/api/v1/tasks/:id/submit', async (request, reply) => {
    const taskId = (request.params as { id: string }).id
    const { repoUrl, description, branch, commitHash } = request.body as {
      repoUrl: string
      description?: string
      branch?: string
      commitHash?: string
    }

    // 验证必填字段
    if (!repoUrl) {
      reply.status(400)
      return { success: false, error: '缺少仓库地址' }
    }

    try {
      // 验证任务是否存在且可提交
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: { project: true }
      })

      if (!task) {
        reply.status(404)
        return { success: false, error: '任务不存在' }
      }

      if (task.status !== 'CLAIMED' && task.status !== 'IN_PROGRESS') {
        reply.status(400)
        return { success: false, error: '任务当前状态不允许提交' }
      }

      // 创建交付记录
      const submission = await prisma.taskSubmission.create({
        data: {
          taskId,
          repoUrl,
          description,
          branch,
          commitHash,
          status: 'SUBMITTED'
        }
      })

      // 更新任务状态
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'SUBMITTED',
          submissions: {
            connect: { id: submission.id }
          }
        }
      })

      return {
        success: true,
        data: {
          taskId,
          submissionId: submission.id,
          status: submission.status,
          submittedAt: submission.submittedAt.toISOString()
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '提交失败' }
    }
  })
}

/**
 * POST /api/v1/tasks/:id/review - 发起人验收任务
 */
export async function reviewTaskRoute(fastify: FastifyInstance) {
  fastify.post('/api/v1/tasks/:id/review', async (request, reply) => {
    const taskId = (request.params as { id: string }).id
    const { result, scores, comment, reviewerId } = request.body as {
      result: 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED'
      scores: number[]
      comment?: string
      reviewerId?: string
    }

    // 验证必填字段
    if (!result || !scores || scores.length === 0) {
      reply.status(400)
      return { success: false, error: '缺少验收结果或评分' }
    }

    try {
      // 验证任务是否存在
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          project: true,
          submissions: {
            where: { status: 'SUBMITTED' },
            orderBy: { submittedAt: 'desc' },
            take: 1
          }
        }
      })

      if (!task) {
        reply.status(404)
        return { success: false, error: '任务不存在' }
      }

      if (task.submissions.length === 0) {
        reply.status(400)
        return { success: false, error: '该任务没有待验收的交付' }
      }

      const submission = task.submissions[0]

      // 计算总分
      const totalScore = scores.reduce((a, b) => a + b, 0) / scores.length

      // 创建验收记录
      const review = await prisma.taskReview.create({
        data: {
          taskId,
          submissionId: submission.id,
          reviewerId: reviewerId || task.project.initiatorId,
          scores,
          totalScore,
          comment,
          result
        }
      })

      // 更新任务状态
      const newTaskStatus = result === 'APPROVED' ? 'COMPLETED' 
        : result === 'REJECTED' ? 'REJECTED' 
        : 'PENDING'

      await prisma.task.update({
        where: { id: taskId },
        data: { status: newTaskStatus }
      })

      // 更新交付状态
      await prisma.taskSubmission.update({
        where: { id: submission.id },
        data: { 
          status: result === 'APPROVED' ? 'APPROVED' 
            : result === 'REJECTED' ? 'REJECTED' 
            : 'REVISION_REQUESTED'
        }
      })

      return {
        success: true,
        data: {
          taskId,
          reviewId: review.id,
          result: review.result,
          totalScore: review.totalScore,
          comment: review.comment,
          reviewedAt: review.createdAt.toISOString()
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '验收失败' }
    }
  })
}

/**
 * 验收系统API路由注册
 */
export default async function reviewRoutes(fastify: FastifyInstance) {
  await submitTaskRoute(fastify)
  await reviewTaskRoute(fastify)
}
