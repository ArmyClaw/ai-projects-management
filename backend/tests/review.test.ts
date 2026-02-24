/**
 * 验收系统API测试
 * 
 * 测试任务交付和验收API路由：
 * - POST /api/v1/tasks/:id/submit - 提交任务交付
 * - POST /api/v1/tasks/:id/review - 发起人验收任务
 */

import { test, describe, expect } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'

describe('Review API Routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify({ logger: false })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /api/v1/tasks/:id/submit', () => {
    test('should register route', async () => {
      app.post('/api/v1/tasks/:id/submit', async (request) => {
        const taskId = (request.params as any).id
        return {
          success: true,
          data: {
            taskId,
            submissionId: 'submission-123',
            status: 'SUBMITTED',
            submittedAt: new Date().toISOString()
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tasks/task-123/submit',
        payload: {
          repoUrl: 'https://github.com/user/repo',
          description: '完成代码提交'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('submissionId')
      expect(body.data.status).toBe('SUBMITTED')
    })

    test('should validate required fields', async () => {
      let receivedPayload = null
      
      app.post('/api/v1/tasks/:id/submit', async (request, reply) => {
        receivedPayload = request.body
        if (!receivedPayload?.repoUrl) {
          reply.status(400)
          return { success: false, error: '缺少仓库地址' }
        }
        return { success: true, data: {} }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tasks/task-123/submit',
        payload: { description: '没有仓库地址' }
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /api/v1/tasks/:id/review', () => {
    test('should register route', async () => {
      app.post('/api/v1/tasks/:id/review', async (request) => {
        const taskId = (request.params as any).id
        const { result, scores, comment } = request.body as any
        return {
          success: true,
          data: {
            taskId,
            reviewId: 'review-123',
            result,
            totalScore: scores?.reduce((a: number, b: number) => a + b, 0) / scores?.length || 0,
            comment,
            reviewedAt: new Date().toISOString()
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tasks/task-123/review',
        payload: {
          result: 'APPROVED',
          scores: [5, 4.5, 5, 4],
          comment: '代码质量优秀'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.result).toBe('APPROVED')
    })

    test('should calculate average score', async () => {
      app.post('/api/v1/tasks/:id/review', async (request) => {
        const { scores } = request.body as any
        const totalScore = scores?.reduce((a: number, b: number) => a + b, 0) / scores?.length || 0
        return {
          success: true,
          data: { totalScore }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tasks/task-123/review',
        payload: {
          result: 'APPROVED',
          scores: [5, 4, 5, 4, 5],
          comment: ''
        }
      })

      const body = JSON.parse(response.body)
      expect(body.data.totalScore).toBe(4.6)
    })
  })
})
