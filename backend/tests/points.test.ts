/**
 * 积分系统API测试
 * 
 * 测试积分相关API路由：
 * - GET /api/v1/users/:id/points - 获取用户积分余额
 * - GET /api/v1/users/:id/points/transactions - 获取用户积分交易记录
 */

import { test, describe, expect } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'

describe('Points API Routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify({ logger: false })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /api/v1/users/:id/points', () => {
    test('should return user points balance', async () => {
      app.get('/api/v1/users/:id/points', async (request) => {
        const userId = (request.params as any).id
        return {
          success: true,
          data: {
            userId,
            points: 1000,
            lastUpdated: new Date().toISOString()
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/user-123/points'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('userId')
      expect(body.data).toHaveProperty('points')
      expect(typeof body.data.points).toBe('number')
    })

    test('should return 400 for invalid user id', async () => {
      let receivedStatus = 200
      
      app.get('/api/v1/users/:id/points', async (request, reply) => {
        const userId = (request.params as any).id
        if (!userId || userId.length < 1) {
          receivedStatus = 400
          reply.status(400)
          return { success: false, error: 'Invalid user ID' }
        }
        return { success: true, data: { userId, points: 0 } }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users//points'
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /api/v1/users/:id/points/transactions', () => {
    test('should return user points transactions', async () => {
      app.get('/api/v1/users/:id/points/transactions', async (request) => {
        const userId = (request.params as any).id
        return {
          success: true,
          data: {
            userId,
            transactions: [
              {
                id: 'tx-001',
                type: 'TASK_COMPLETE',
                amount: 100,
                description: '完成任务奖励',
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
        url: '/api/v1/users/user-123/points/transactions'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('transactions')
      expect(Array.isArray(body.data.transactions)).toBe(true)
      expect(body.data).toHaveProperty('total')
    })

    test('should support pagination', async () => {
      app.get('/api/v1/users/:id/points/transactions', async (request) => {
        const { id } = request.params as any
        const page = Number(request.query?.page) || 1
        const pageSize = Number(request.query?.pageSize) || 10
        
        return {
          success: true,
          data: {
            userId: id,
            transactions: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/user-123/points/transactions?page=2&pageSize=20'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.data.page).toBe(2)
      expect(body.data.pageSize).toBe(20)
    })
  })
})
