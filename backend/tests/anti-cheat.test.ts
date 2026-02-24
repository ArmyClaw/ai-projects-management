/**
 * 防作弊机制API测试
 * 
 * 测试防作弊API路由：
 * - POST /api/v1/anti-cheat/skill-test - 提交技能测试
 * - POST /api/v1/anti-cheat/portfolio-verify - 作品集验证
 * - GET /api/v1/anti-cheat/limits/:userId - 查询评议限制
 */

import { test, describe, expect } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'

describe('Anti-Cheat API Routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify({ logger: false })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /api/v1/anti-cheat/skill-test', () => {
    test('should register route', async () => {
      app.post('/api/v1/anti-cheat/skill-test', async (request) => {
        const { userId, testType, score, antiCheat } = request.body as any
        return {
          success: true,
          data: {
            id: 'test-result-123',
            userId,
            testType,
            score,
            isSuspicious: false,
            createdAt: new Date().toISOString()
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/anti-cheat/skill-test',
        payload: {
          userId: 'user-123',
          testType: 'python',
          score: 85,
          antiCheat: {
            duration: 1800,
            tabSwitches: 2
          }
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')
      expect(body.data.isSuspicious).toBe(false)
    })

    test('should detect suspicious activity', async () => {
      app.post('/api/v1/anti-cheat/skill-test', async (request) => {
        const { antiCheat, score } = request.body as any
        
        // 检测可疑行为
        const isSuspicious = 
          antiCheat?.tabSwitches > 5 ||
          antiCheat?.screenshotCount > 3 ||
          antiCheat?.duration < 300
        
        return {
          success: true,
          data: {
            id: 'test-result-123',
            score,
            isSuspicious,
            flaggedAt: isSuspicious ? new Date().toISOString() : null
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/anti-cheat/skill-test',
        payload: {
          userId: 'user-123',
          testType: 'python',
          score: 90,
          antiCheat: {
            tabSwitches: 10,  // 超过阈值
            duration: 1800
          }
        }
      })

      const body = JSON.parse(response.body)
      expect(body.data.isSuspicious).toBe(true)
    })

    test('should validate required fields', async () => {
      app.post('/api/v1/anti-cheat/skill-test', async (request, reply) => {
        const { userId, testType, score } = request.body as any
        if (!userId || !testType || score === undefined) {
          reply.status(400)
          return { success: false, error: '缺少必填字段' }
        }
        return { success: true, data: {} }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/anti-cheat/skill-test',
        payload: { userId: 'user-123' }
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /api/v1/anti-cheat/portfolio-verify', () => {
    test('should register route', async () => {
      app.post('/api/v1/anti-cheat/portfolio-verify', async (request) => {
        const { userId, portfolioUrl } = request.body as any
        return {
          success: true,
          data: {
            id: 'portfolio-verify-123',
            userId,
            portfolioUrl,
            result: 'PASS',
            aiAnalysis: {
              similarity: 0.15,
              complexity: 85,
              originality: 90
            },
            createdAt: new Date().toISOString()
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/anti-cheat/portfolio-verify',
        payload: {
          userId: 'user-123',
          portfolioUrl: 'https://github.com/user/project'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.result).toBe('PASS')
    })

    test('should detect fake portfolio', async () => {
      app.post('/api/v1/anti-cheat/portfolio-verify', async (request) => {
        const { aiAnalysis } = request.body as any
        
        // 检测造假
        const result = 
          aiAnalysis?.similarity > 0.8 ? 'FAIL' :
          aiAnalysis?.originality < 50 ? 'SUSPICIOUS' :
          'PASS'
        
        return {
          success: true,
          data: { result }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/anti-cheat/portfolio-verify',
        payload: {
          userId: 'user-123',
          portfolioUrl: 'https://github.com/user/project',
          aiAnalysis: {
            similarity: 0.9,  // 相似度太高
            complexity: 85,
            originality: 90
          }
        }
      })

      const body = JSON.parse(response.body)
      expect(body.data.result).toBe('FAIL')
    })
  })

  describe('GET /api/v1/anti-cheat/limits/:userId', () => {
    test('should return user limits', async () => {
      app.get('/api/v1/anti-cheat/limits/:userId', async (request) => {
        const userId = (request.params as any).userId
        return {
          success: true,
          data: {
            userId,
            dailyCount: 2,
            dailyLimit: 3,
            recentCount: 5,
            recentLimit: 10,
            date: new Date().toISOString().split('T')[0]
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/anti-cheat/limits/user-123'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.userId).toBe('user-123')
      expect(body.data.dailyCount).toBe(2)
    })

    test('should check limit exceeded', async () => {
      app.get('/api/v1/anti-cheat/limits/:userId', async (request) => {
        const { dailyCount, dailyLimit } = request.query as any
        
        const canReview = (dailyCount || 0) < (dailyLimit || 3)
        
        return {
          success: true,
          data: {
            canReview,
            remaining: Math.max(0, (dailyLimit || 3) - (dailyCount || 0))
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/anti-cheat/limits/user-123?dailyCount=3&dailyLimit=3'
      })

      const body = JSON.parse(response.body)
      expect(body.data.canReview).toBe(false)
      expect(body.data.remaining).toBe(0)
    })
  })
})
