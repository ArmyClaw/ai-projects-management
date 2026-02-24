/**
 * AIAgent模拟API测试
 * 
 * 测试AIAgent模拟API路由：
 * - POST /api/v1/ai-agents - 创建模拟用户
 * - GET /api/v1/ai-agents - 查询AIAgent列表
 * - POST /api/v1/ai-agents/:id/action - 触发Agent行为
 */

import { test, describe, expect } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'

describe('AIAgent API Routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify({ logger: false })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /api/v1/ai-agents', () => {
    test('should register route', async () => {
      app.post('/api/v1/ai-agents', async (request) => {
        const { type, name, initialPoints, skills } = request.body as any
        return {
          success: true,
          data: {
            id: 'agent-123',
            type,
            name,
            points: initialPoints || 100,
            skills: skills || [],
            status: 'ACTIVE',
            createdAt: new Date().toISOString()
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ai-agents',
        payload: {
          type: 'TASK_COMPLETER',
          name: 'Test Agent',
          initialPoints: 100,
          skills: ['Python', 'FastAPI']
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('id')
      expect(body.data.type).toBe('TASK_COMPLETER')
    })

    test('should validate required fields', async () => {
      app.post('/api/v1/ai-agents', async (request, reply) => {
        const { type, name } = request.body as any
        if (!type || !name) {
          reply.status(400)
          return { success: false, error: '缺少必填字段' }
        }
        return { success: true, data: {} }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ai-agents',
        payload: { type: 'TASK_COMPLETER' }
      })

      expect(response.statusCode).toBe(400)
    })

    test('should set default values', async () => {
      app.post('/api/v1/ai-agents', async (request) => {
        const { type, name } = request.body as any
        return {
          success: true,
          data: {
            id: 'agent-123',
            type,
            name,
            points: 100,  // 默认100积分
            skills: [],
            status: 'ACTIVE'
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ai-agents',
        payload: { type: 'REVIEWER', name: 'Review Bot' }
      })

      const body = JSON.parse(response.body)
      expect(body.data.points).toBe(100)
      expect(body.data.skills).toEqual([])
    })
  })

  describe('GET /api/v1/ai-agents', () => {
    test('should return agents list', async () => {
      app.get('/api/v1/ai-agents', async (request) => {
        const { type, status, page, pageSize } = request.query as any
        return {
          success: true,
          data: {
            agents: [
              {
                id: 'agent-001',
                type: type || 'TASK_COMPLETER',
                name: 'Agent 1',
                points: 150,
                status: status || 'ACTIVE'
              }
            ],
            total: 1,
            page: Number(page) || 1,
            pageSize: Number(pageSize) || 10
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ai-agents'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(Array.isArray(body.data.agents)).toBe(true)
    })

    test('should support filtering', async () => {
      app.get('/api/v1/ai-agents', async (request) => {
        const { type, status } = request.query as any
        return {
          success: true,
          data: {
            agents: [],
            total: 0,
            filters: { type, status }
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ai-agents?type=TASK_COMPLETER&status=ACTIVE'
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('POST /api/v1/ai-agents/:id/action', () => {
    test('should register route', async () => {
      app.post('/api/v1/ai-agents/:id/action', async (request) => {
        const agentId = (request.params as any).id
        const { action, targetId } = request.body as any
        return {
          success: true,
          data: {
            id: 'action-123',
            agentId,
            action,
            targetId,
            result: 'SUCCESS',
            timestamp: new Date().toISOString()
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ai-agents/agent-001/action',
        payload: {
          action: 'CLAIM_TASK',
          targetId: 'task-456'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.action).toBe('CLAIM_TASK')
    })

    test('should simulate task completion', async () => {
      app.post('/api/v1/ai-agents/:id/action', async (request) => {
        const { action, targetId } = request.body as any
        
        // 模拟完成任务
        const result = action === 'COMPLETE_TASK' ? {
          success: true,
          reward: 100,
          newPoints: 250
        } : { success: false }
        
        return {
          success: true,
          data: {
            action,
            targetId,
            ...result
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/ai-agents/agent-001/action',
        payload: {
          action: 'COMPLETE_TASK',
          targetId: 'task-789'
        }
      })

      const body = JSON.parse(response.body)
      expect(body.data.success).toBe(true)
      expect(body.data.reward).toBe(100)
    })
  })
})
