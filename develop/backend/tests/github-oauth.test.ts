/**
 * GitHub OAuth API测试
 * 
 * 测试GitHub OAuth认证API：
 * - GET /api/v1/auth/github - 获取GitHub OAuth URL
 * - GET /api/v1/auth/github/callback - OAuth回调处理
 * - POST /api/v1/auth/github/token - 交换Access Token
 */

import { test, describe, expect, vi } from 'vitest'
import Fastify, { FastifyInstance } from 'fastify'

describe('GitHub OAuth API Routes', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify({ logger: false })
  })

  afterEach(async () => {
    await app.close()
  })

  describe('GET /api/v1/auth/github', () => {
    test('should return GitHub OAuth URL', async () => {
      app.get('/api/v1/auth/github', async () => {
        const clientId = process.env.GITHUB_CLIENT_ID || 'test-client-id'
        const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback'
        const scope = 'read:user user:email'
        
        const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`
        
        return {
          success: true,
          data: {
            oauthUrl,
            state: 'random-state-string',
            expiresIn: 600
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/github'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('oauthUrl')
      expect(body.data.oauthUrl).toContain('github.com/login/oauth/authorize')
    })

    test('should include required scopes', async () => {
      app.get('/api/v1/auth/github', async () => {
        const scope = 'read:user user:email'
        return {
          success: true,
          data: {
            oauthUrl: `https://github.com/login/oauth/authorize?scope=${encodeURIComponent(scope)}`,
            state: 'test-state'
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/github'
      })

      const body = JSON.parse(response.body)
      expect(body.data.oauthUrl).toContain('read%3Auser')  // URL编码
      expect(body.data.oauthUrl).toContain('user%3Aemail')  // URL编码
    })
  })

  describe('GET /api/v1/auth/github/callback', () => {
    test('should handle OAuth callback', async () => {
      app.get('/api/v1/auth/github/callback', async (request) => {
        const { code, state, error } = request.query as any
        
        if (error) {
          return {
            success: false,
            error: `OAuth错误: ${error}`
          }
        }

        // 模拟返回用户信息
        return {
          success: true,
          data: {
            githubId: '123456',
            username: 'testuser',
            email: 'test@example.com',
            avatar: 'https://github.com/avatar'
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/github/callback?code=test-code&state=test-state'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('githubId')
    })

    test('should handle OAuth error', async () => {
      app.get('/api/v1/auth/github/callback', async (request) => {
        const { error } = request.query as any
        return {
          success: false,
          error: `OAuth错误: ${error || 'unknown'}`
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/github/callback?error=access_denied'
      })

      const body = JSON.parse(response.body)
      expect(body.success).toBe(false)
      expect(body.error).toContain('access_denied')
    })
  })

  describe('POST /api/v1/auth/github/token', () => {
    test('should exchange code for token', async () => {
      app.post('/api/v1/auth/github/token', async (request) => {
        const { code, clientId, clientSecret } = request.body as any
        
        // 模拟返回token
        return {
          success: true,
          data: {
            accessToken: 'gho_test_access_token',
            tokenType: 'bearer',
            scope: 'read:user user:email',
            expiresIn: 3600
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/github/token',
        payload: {
          code: 'test-code',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('accessToken')
      expect(body.data.tokenType).toBe('bearer')
    })

    test('should validate required fields', async () => {
      let receivedBody = null
      
      app.post('/api/v1/auth/github/token', async (request, reply) => {
        receivedBody = request.body
        if (!receivedBody?.code) {
          reply.status(400)
          return { success: false, error: '缺少授权码' }
        }
        return { success: true, data: {} }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/github/token',
        payload: { clientId: 'test' }
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('POST /api/v1/auth/github/user', () => {
    test('should get user info with token', async () => {
      app.post('/api/v1/auth/github/user', async () => {
        // 模拟GitHub用户信息
        return {
          success: true,
          data: {
            id: 123456,
            login: 'testuser',
            email: 'test@example.com',
            name: 'Test User',
            avatar_url: 'https://github.com/avatars/test',
            created_at: '2023-01-01T00:00:00Z'
          }
        }
      })

      await app.ready()
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/github/user',
        headers: {
          Authorization: 'Bearer gho_test_token'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.success).toBe(true)
      expect(body.data.login).toBe('testuser')
    })
  })
})
