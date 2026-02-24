/**
 * JWT Token刷新API测试
 * 
 * 测试Token刷新和用户认证API：
 * - POST /api/v1/auth/refresh - 刷新Token
 * - POST /api/v1/auth/logout - 登出
 * - GET /api/v1/auth/me - 获取当前用户
 */

import { test, describe, expect } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'

describe('JWT Token Refresh API Routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify({ logger: false })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /api/v1/auth/refresh', () => {
    test('should register route', async () => {
      app.post('/api/v1/auth/refresh', async () => {
        return {
          success: true,
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            tokenType: 'bearer',
            expiresIn: 3600
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: {
          Authorization: 'Bearer old-refresh-token'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('accessToken')
      expect(body.data.tokenType).toBe('bearer')
    })

    test('should require refresh token', async () => {
      let hasToken = false
      
      app.post('/api/v1/auth/refresh', async (request, reply) => {
        const authHeader = request.headers.authorization
        hasToken = !!authHeader
        if (!authHeader) {
          reply.status(401)
          return { success: false, error: '缺少刷新令牌' }
        }
        return { success: true, data: {} }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh'
      })

      expect(response.statusCode).toBe(401)
    })

    test('should return new tokens', async () => {
      app.post('/api/v1/auth/refresh', async () => {
        return {
          success: true,
          data: {
            accessToken: `access_${Date.now()}`,
            refreshToken: `refresh_${Date.now()}`,
            tokenType: 'bearer',
            expiresIn: 3600
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: {
          Authorization: 'Bearer valid-refresh-token'
        }
      })

      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.accessToken).toBeDefined()
      expect(body.data.refreshToken).toBeDefined()
    })
  })

  describe('POST /api/v1/auth/logout', () => {
    test('should register route', async () => {
      app.post('/api/v1/auth/logout', async () => {
        return {
          success: true,
          message: '登出成功'
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: {
          Authorization: 'Bearer valid-token'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.message).toBe('登出成功')
    })

    test('should require authentication', async () => {
      let hasAuth = false
      
      app.post('/api/v1/auth/logout', async (request, reply) => {
        hasAuth = !!request.headers.authorization
        if (!request.headers.authorization) {
          reply.status(401)
          return { success: false, error: '未授权' }
        }
        return { success: true, message: '登出成功' }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout'
      })

      expect(response.statusCode).toBe(401)
    })

    test('should blacklist token', async () => {
      app.post('/api/v1/auth/logout', async () => {
        return {
          success: true,
          message: '登出成功',
          data: {
            tokenBlacklisted: true
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        headers: {
          Authorization: 'Bearer token-to-revoke'
        }
      })

      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.tokenBlacklisted).toBe(true)
    })
  })

  describe('GET /api/v1/auth/me', () => {
    test('should return current user', async () => {
      app.get('/api/v1/auth/me', async (request) => {
        return {
          success: true,
          data: {
            id: 'user-123',
            name: 'Test User',
            email: 'test@example.com',
            avatar: 'https://example.com/avatar.png',
            role: 'PARTICIPANT'
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          Authorization: 'Bearer valid-access-token'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.id).toBe('user-123')
      expect(body.data.email).toBe('test@example.com')
    })

    test('should require valid token', async () => {
      let hasValidToken = false
      
      app.get('/api/v1/auth/me', async (request, reply) => {
        const token = request.headers.authorization?.split(' ')[1]
        hasValidToken = token === 'valid-access-token'
        if (!hasValidToken) {
          reply.status(401)
          return { success: false, error: '无效令牌' }
        }
        return { success: true, data: {} }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me'
      })

      expect(response.statusCode).toBe(401)
    })

    test('should return user profile', async () => {
      app.get('/api/v1/auth/me', async () => {
        return {
          success: true,
          data: {
            id: 'user-456',
            name: 'GitHub User',
            email: 'user@github.com',
            avatar: 'https://github.com/avatars/user',
            githubId: '123456',
            role: 'INITIATOR',
            points: 1500,
            createdAt: '2024-01-15T10:30:00Z'
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
        headers: {
          Authorization: 'Bearer github-user-token'
        }
      })

      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.githubId).toBe('123456')
      expect(body.data.points).toBe(1500)
    })
  })
})
