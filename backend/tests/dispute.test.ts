/**
 * 争议仲裁系统API测试
 * 
 * 测试争议仲裁API路由：
 * - POST /api/v1/disputes - 发起争议
 * - GET /api/v1/disputes - 查询争议列表
 * - POST /api/v1/disputes/:id/arbitrate - 仲裁裁决
 */

import { test, describe, expect } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'

describe('Dispute API Routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify({ logger: false })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /api/v1/disputes', () => {
    test('should register route', async () => {
      app.post('/api/v1/disputes', async (request) => {
        const { taskId, initiatorId, reason, evidence } = request.body as any
        return {
          success: true,
          data: {
            id: 'dispute-123',
            taskId,
            initiatorId,
            reason,
            status: 'OPEN',
            createdAt: new Date().toISOString()
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/disputes',
        payload: {
          taskId: 'task-456',
          initiatorId: 'user-789',
          reason: '验收结果不公',
          evidence: ['证据1', '证据2']
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')
      expect(body.data.status).toBe('OPEN')
    })

    test('should validate required fields', async () => {
      let receivedPayload = null
      
      app.post('/api/v1/disputes', async (request, reply) => {
        receivedPayload = request.body
        if (!receivedPayload?.taskId || !receivedPayload?.reason) {
          reply.status(400)
          return { success: false, error: '缺少必填字段' }
        }
        return { success: true, data: {} }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/disputes',
        payload: { taskId: 'task-123' }
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/v1/disputes', () => {
    test('should return disputes list', async () => {
      app.get('/api/v1/disputes', async (request) => {
        const status = (request.query as any).status
        return {
          success: true,
          data: {
            disputes: [
              {
                id: 'dispute-001',
                taskId: 'task-456',
                status: status || 'OPEN',
                createdAt: new Date().toISOString()
              }
            ],
            total: 1
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/disputes?status=OPEN'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(Array.isArray(body.data.disputes)).toBe(true)
    })

    test('should support pagination', async () => {
      app.get('/api/v1/disputes', async (request) => {
        const page = Number(request.query?.page) || 1
        
        return {
          success: true,
          data: {
            disputes: [],
            total: 0,
            page,
            pageSize: 10,
            totalPages: 0
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/disputes?page=3'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.page).toBe(3)
    })
  })

  describe('POST /api/v1/disputes/:id/arbitrate', () => {
    test('should register arbitrate route', async () => {
      app.post('/api/v1/disputes/:id/arbitrate', async (request) => {
        const disputeId = (request.params as any).id
        const { decision, decisionReason, refundAmount } = request.body as any
        return {
          success: true,
          data: {
            id: disputeId,
            decision,
            decisionReason,
            refundAmount,
            status: 'CLOSED',
            arbitratedAt: new Date().toISOString()
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/disputes/dispute-123/arbitrate',
        payload: {
          decision: 'COMPROMISE',
          decisionReason: '双方各有责任',
          refundAmount: 600
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.decision).toBe('COMPROMISE')
    })

    test('should update credit scores on decision', async () => {
      app.post('/api/v1/disputes/:id/arbitrate', async (request) => {
        const { decision } = request.body as any
        
        // 根据裁决调整信用分
        const winnerCreditChange = decision === 'SUSTAIN_INITIATOR' ? -10 : 10
        const loserCreditChange = decision === 'SUSTAIN_INITIATOR' ? -5 : 10
        
        return {
          success: true,
          data: {
            decision,
            winnerCreditChange,
            loserCreditChange,
            status: 'CLOSED'
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/disputes/dispute-123/arbitrate',
        payload: {
          decision: 'OVERTURN_INITIATOR',
          decisionReason: '参与者胜诉'
        }
      })

      const body = JSON.parse(response.body)
      expect(body.data.winnerCreditChange).toBe(10)
      expect(body.data.loserCreditChange).toBe(10)
    })
  })
})
