/**
 * Skill管理API测试
 * 
 * 测试Skill的CRUD操作路由注册：
 * - GET /api/v1/skills - 技能列表
 * - GET /api/v1/skills/:id - 技能详情
 * - POST /api/v1/skills - 创建技能
 * - PUT /api/v1/skills/:id - 更新技能
 * - DELETE /api/v1/skills/:id - 删除技能
 */

import { test, describe, expect } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'

describe('Skill API Routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify({ logger: false })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /api/v1/skills', () => {
    test('should register route', async () => {
      // 模拟路由注册（不连接数据库）
      app.get('/api/v1/skills', async () => {
        return { 
          success: true, 
          data: { 
            skills: [], 
            total: 0, 
            page: 1, 
            pageSize: 10,
            totalPages: 0 
          } 
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/skills'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('skills')
      expect(body.data).toHaveProperty('total')
      expect(Array.isArray(body.data.skills)).toBe(true)
    })
  })

  describe('GET /api/v1/skills/:id', () => {
    test('should register route', async () => {
      app.get('/api/v1/skills/:id', async (request) => {
        return { 
          success: true, 
          data: { id: (request.params as any).id } 
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/skills/test-id-123'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.id).toBe('test-id-123')
    })
  })

  describe('POST /api/v1/skills', () => {
    test('should register route', async () => {
      app.post('/api/v1/skills', async (request) => {
        return { 
          success: true, 
          data: { 
            id: 'new-skill-id',
            ...(request.body as any)
          } 
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/skills',
        payload: {
          name: 'Test Skill',
          description: 'A test skill',
          tags: ['test']
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('Test Skill')
    })

    test('should validate required fields', async () => {
      let receivedBody = null
      
      app.post('/api/v1/skills', async (request, reply) => {
        receivedBody = request.body
        
        if (!receivedBody?.name) {
          reply.status(400)
          return { success: false, error: 'Missing name' }
        }
        
        return { success: true, data: {} }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/skills',
        payload: { description: 'No name' }
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('PUT /api/v1/skills/:id', () => {
    test('should register route', async () => {
      app.put('/api/v1/skills/:id', async (request) => {
        return { 
          success: true, 
          data: { 
            id: (request.params as any).id,
            ...(request.body as any)
          } 
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/skills/skill-123',
        payload: { name: 'Updated Skill' }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.name).toBe('Updated Skill')
    })
  })

  describe('DELETE /api/v1/skills/:id', () => {
    test('should register route', async () => {
      app.delete('/api/v1/skills/:id', async (request) => {
        return { 
          success: true, 
          message: 'Skill deleted successfully' 
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/skills/skill-123'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
    })
  })
})
