/**
 * GitHub OAuth认证API路由
 * 
 * 提供GitHub OAuth认证功能：
 * - GET /api/v1/auth/github - 获取GitHub OAuth URL
 * - GET /api/v1/auth/github/callback - OAuth回调处理
 * - POST /api/v1/auth/github/token - 交换Access Token
 * - POST /api/v1/auth/github/user - 获取GitHub用户信息
 */

import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * GitHub OAuth配置
 */
const GITHUB_CONFIG = {
  clientId: process.env.GITHUB_CLIENT_ID || 'demo-client-id',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || 'demo-client-secret',
  redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/auth/github/callback',
  apiBaseUrl: 'https://api.github.com',
  oauthBaseUrl: 'https://github.com/login/oauth'
}

/**
 * GET /api/v1/auth/github - 获取GitHub OAuth URL
 */
export async function getGitHubAuthUrlRoute(fastify: FastifyInstance) {
  fastify.get('/api/v1/auth/github', {
    schema: {
      description: '获取GitHub OAuth授权URL',
      tags: ['github'],
      response: {
        200: {
          description: '成功返回OAuth URL',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                oauthUrl: { type: 'string' },
                state: { type: 'string' },
                expiresIn: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // 生成随机state防止CSRF
      const state = generateState()
      
      // 构建OAuth URL
      const oauthUrl = buildOAuthUrl(state)
      
      // 存储state到cookie或session（简化处理用state参数）
      reply.setCookie('oauth_state', state, {
        path: '/',
        httpOnly: true,
        maxAge: 600  // 10分钟过期
      })

      return {
        success: true,
        data: {
          oauthUrl,
          state,
          expiresIn: 600
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '生成OAuth URL失败' }
    }
  })
}

/**
 * GET /api/v1/auth/github/callback - OAuth回调处理
 */
export async function handleGitHubCallbackRoute(fastify: FastifyInstance) {
  fastify.get('/api/v1/auth/github/callback', {
    schema: {
      description: 'GitHub OAuth回调处理',
      tags: ['github'],
      querystring: {
        type: 'object',
        properties: {
          code: { type: 'string', description: '授权码' },
          state: { type: 'string', description: '状态参数' },
          error: { type: 'string', description: '错误信息' }
        }
      },
      response: {
        200: {
          description: '授权成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    email: { type: 'string' },
                    avatar: { type: 'string' },
                    githubId: { type: 'string' }
                  }
                },
                token: { type: 'string' },
                tokenType: { type: 'string' },
                expiresIn: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { code, state, error } = request.query as {
      code?: string
      state?: string
      error?: string
    }

    // 处理错误情况
    if (error) {
      reply.status(400)
      return {
        success: false,
        error: `OAuth错误: ${error}`
      }
    }

    if (!code) {
      reply.status(400)
      return { success: false, error: '缺少授权码' }
    }

    try {
      // 验证state（简化处理）
      const cookieState = request.cookies?.oauth_state
      if (state && cookieState && state !== cookieState) {
        reply.status(400)
        return { success: false, error: 'State不匹配' }
      }

      // 1. 交换code获取access_token
      const tokenResponse = await exchangeCodeForToken(code)
      
      if (!tokenResponse.success) {
        reply.status(400)
        return { success: false, error: tokenResponse.error }
      }

      // 2. 获取GitHub用户信息
      const userInfo = await getGitHubUserInfo(tokenResponse.data!.accessToken)

      // 3. 创建或更新用户
      const user = await upsertGitHubUser(userInfo.data!)

      // 4. 生成JWT Token
      const jwtToken = fastify.jwt.sign({
        userId: user.id,
        githubId: user.githubId,
        email: user.email
      }, {
        expiresIn: '7d'
      })

      // 5. 清除cookie
      reply.clearCookie('oauth_state')

      // 返回用户信息和token
      return {
        success: true,
        data: {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            githubId: user.githubId
          },
          token: jwtToken,
          tokenType: 'bearer',
          expiresIn: 604800  // 7天
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: 'OAuth回调处理失败' }
    }
  })
}

/**
 * POST /api/v1/auth/github/token - 交换Access Token
 */
export async function exchangeGitHubTokenRoute(fastify: FastifyInstance) {
  fastify.post<{
    Body: {
      code?: string
      clientId?: string
      clientSecret?: string
    }
  }>('/api/v1/auth/github/token', {
    schema: {
      description: '交换GitHub Access Token',
      tags: ['github'],
      body: {
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', description: '授权码' },
          clientId: { type: 'string', description: '客户端ID' },
          clientSecret: { type: 'string', description: '客户端密钥' }
        }
      },
      response: {
        200: {
          description: '交换成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                accessToken: { type: 'string' },
                tokenType: { type: 'string' },
                scope: { type: 'string' },
                expiresIn: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { code } = request.body as {
      code?: string
      clientId?: string
      clientSecret?: string
    }

    if (!code) {
      reply.status(400)
      return { success: false, error: '缺少授权码' }
    }

    try {
      const result = await exchangeCodeForToken(code)
      return result
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '交换Token失败' }
    }
  })
}

/**
 * POST /api/v1/auth/github/user - 获取GitHub用户信息
 */
export async function getGitHubUserRoute(fastify: FastifyInstance) {
  fastify.post('/api/v1/auth/github/user', {
    schema: {
      description: '获取GitHub用户信息',
      tags: ['github'],
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          description: '成功返回用户信息',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                login: { type: 'string' },
                email: { type: 'string' },
                name: { type: 'string' },
                avatar_url: { type: 'string' },
                created_at: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const authHeader = request.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401)
      return { success: false, error: '未授权访问' }
    }

    const token = authHeader.split(' ')[1]

    try {
      const result = await getGitHubUserInfo(token)
      return result
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '获取用户信息失败' }
    }
  })
}

// ============ 辅助函数 ============

/**
 * 生成随机state
 */
function generateState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * 构建OAuth URL
 */
function buildOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GITHUB_CONFIG.clientId,
    redirect_uri: GITHUB_CONFIG.redirectUri,
    scope: 'read:user user:email',
    state: state
  })

  return `${GITHUB_CONFIG.oauthBaseUrl}/authorize?${params.toString()}`
}

/**
 * 交换code获取access_token
 */
async function exchangeCodeForToken(_code: string): Promise<{
  success: boolean
  data?: {
    accessToken: string
    tokenType: string
    scope: string
    expiresIn?: number
  }
  error?: string
}> {
  // 模拟API调用（实际需要调用GitHub API）
  // 实际实现：
  // const response = await fetch(`${GITHUB_CONFIG.oauthBaseUrl}/access_token`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Accept: 'application/json'
  //   },
  //   body: JSON.stringify({
  //     client_id: GITHUB_CONFIG.clientId,
  //     client_secret: GITHUB_CONFIG.clientSecret,
  //     code
  //   })
  // })
  
  // 模拟返回
  return {
    success: true,
    data: {
      accessToken: `gho_${generateState().substring(0, 36)}`,
      tokenType: 'bearer',
      scope: 'read:user,user:email',
      expiresIn: 3600
    }
  }
}

/**
 * 获取GitHub用户信息
 */
async function getGitHubUserInfo(_accessToken: string): Promise<{
  success: boolean
  data?: {
    id: number
    login: string
    email: string | null
    name: string | null
    avatar_url: string
    created_at: string
  }
  error?: string
}> {
  // 模拟API调用（实际需要调用GitHub API）
  // 实际实现：
  // const response = await fetch(`${GITHUB_CONFIG.apiBaseUrl}/user`, {
  //   headers: {
  //     Authorization: `Bearer ${accessToken}`,
  //     Accept: 'application/json'
  //   }
  // })
  
  // 模拟返回
  return {
    success: true,
    data: {
      id: 123456 + Math.floor(Math.random() * 10000),
      login: `github_user_${Date.now()}`,
      email: `user_${Date.now()}@example.com`,
      name: 'GitHub User',
      avatar_url: `https://github.com/avatars/u/${Date.now()}`,
      created_at: new Date().toISOString()
    }
  }
}

/**
 * 创建或更新GitHub用户
 */
async function upsertGitHubUser(userInfo: {
  id: number
  login: string
  email: string | null
  name: string | null
  avatar_url: string
}): Promise<{
  id: string
  name: string
  email: string
  avatar: string | null
  githubId: string
}> {
  const githubId = userInfo.id.toString()
  
  // 查找现有用户
  let user = await prisma.user.findUnique({
    where: { githubId }
  })

  if (user) {
    // 更新用户信息
    user = await prisma.user.update({
      where: { githubId },
      data: {
        name: userInfo.name || userInfo.login,
        avatar: userInfo.avatar_url,
        email: userInfo.email || user.email
      }
    })
  } else {
    // 创建新用户
    user = await prisma.user.create({
      data: {
        githubId,
        email: userInfo.email || `user_${userInfo.id}@github.local`,
        name: userInfo.name || userInfo.login,
        avatar: userInfo.avatar_url,
        status: 'ACTIVE',
        points: 0
      }
    })
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    githubId: user.githubId!
  }
}

/**
 * GitHub OAuth路由注册
 */
export default async function githubOAuthRoutes(fastify: FastifyInstance) {
  await getGitHubAuthUrlRoute(fastify)
  await handleGitHubCallbackRoute(fastify)
  await exchangeGitHubTokenRoute(fastify)
  await getGitHubUserRoute(fastify)
}
