/**
 * JWT Token刷新和认证API路由
 * 
 * 提供Token管理和用户认证功能：
 * - POST /api/v1/auth/refresh - 刷新Token
 * - POST /api/v1/auth/logout - 登出
 * - GET /api/v1/auth/me - 获取当前用户
 */

import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Token配置
 */
const TOKEN_CONFIG = {
  accessTokenExpiry: '1h',      // Access Token 1小时过期
  refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000,  // Refresh Token 7天
  refreshTokenExpiryCookie: 7 * 24 * 60 * 60  // 7天（Cookie）
}

/**
 * 黑名单（生产环境应使用Redis）
 */
const tokenBlacklist = new Set<string>()

/**
 * POST /api/v1/auth/refresh - 刷新Token
 */
export async function refreshTokenRoute(fastify: FastifyInstance) {
  fastify.post('/api/v1/auth/refresh', async (request, reply) => {
    const authHeader = request.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401)
      return { success: false, error: '缺少刷新令牌' }
    }

    const refreshToken = authHeader.split(' ')[1]

    try {
      // 验证Refresh Token（简化处理，实际应验证签名和过期时间）
      if (!refreshToken || refreshToken.length < 10) {
        reply.status(401)
        return { success: false, error: '无效的刷新令牌' }
      }

      // 检查Token是否在黑名单中
      if (tokenBlacklist.has(refreshToken)) {
        reply.status(401)
        return { success: false, error: '令牌已被撤销' }
      }

      // 从Refresh Token解析用户信息（简化处理）
      // 实际应解密或查询数据库获取用户ID
      const userId = extractUserIdFromToken(refreshToken)
      
      if (!userId) {
        reply.status(401)
        return { success: false, error: '无法解析用户信息' }
      }

      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          githubId: true
        }
      })

      if (!user) {
        reply.status(401)
        return { success: false, error: '用户不存在' }
      }

      // 生成新的Access Token
      const accessToken = fastify.jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role
      }, {
        expiresIn: TOKEN_CONFIG.accessTokenExpiry
      })

      // 生成新的Refresh Token
      const newRefreshToken = fastify.jwt.sign({
        userId: user.id,
        type: 'refresh'
      }, {
        expiresIn: '7d'
      })

      // 设置新的Refresh Token到Cookie
      reply.setCookie('refresh_token', newRefreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: TOKEN_CONFIG.refreshTokenExpiryCookie
      })

      return {
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken,
          tokenType: 'bearer',
          expiresIn: 3600  // 1小时
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '刷新令牌失败' }
    }
  })
}

/**
 * POST /api/v1/auth/logout - 登出
 */
export async function logoutRoute(fastify: FastifyInstance) {
  fastify.post('/api/v1/auth/logout', async (request, reply) => {
    const authHeader = request.headers.authorization

    // 获取Access Token并加入黑名单
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.split(' ')[1]
      tokenBlacklist.add(accessToken)
    }

    // 获取Refresh Token并加入黑名单
    const refreshToken = request.cookies?.refresh_token
    if (refreshToken) {
      tokenBlacklist.add(refreshToken)
    }

    // 清除Cookie
    reply.clearCookie('refresh_token', { path: '/' })

    return {
      success: true,
      message: '登出成功'
    }
  })
}

/**
 * GET /api/v1/auth/me - 获取当前用户
 */
export async function getCurrentUserRoute(fastify: FastifyInstance) {
  fastify.get('/api/v1/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      reply.status(401)
      return { success: false, error: '未授权访问' }
    }

    const accessToken = authHeader.split(' ')[1]

    // 检查Access Token是否在黑名单中
    if (tokenBlacklist.has(accessToken)) {
      reply.status(401)
      return { success: false, error: '令牌已失效' }
    }

    try {
      // 验证并解析Access Token
      const decoded = fastify.jwt.verify<{
        userId: string
        email: string
        role: string
      }>(accessToken)

      // 获取完整用户信息
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          githubId: true,
          points: true,
          status: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!user) {
        reply.status(404)
        return { success: false, error: '用户不存在' }
      }

      if (user.status !== 'ACTIVE') {
        reply.status(403)
        return { success: false, error: '账户已被禁用' }
      }

      return {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
          githubId: user.githubId,
          points: user.points,
          status: user.status,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(401)
      return { success: false, error: '无效的访问令牌' }
    }
  })
}

/**
 * POST /api/v1/auth/verify - 验证Token
 */
export async function verifyTokenRoute(fastify: FastifyInstance) {
  fastify.post('/api/v1/auth/verify', async (request, _reply) => {
    const authHeader = request.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: true,
        data: {
          valid: false,
          message: '未提供令牌'
        }
      }
    }

    const token = authHeader.split(' ')[1]

    // 检查黑名单
    if (tokenBlacklist.has(token)) {
      return {
        success: true,
        data: {
          valid: false,
          message: '令牌已被撤销'
        }
      }
    }

    try {
      const decoded = fastify.jwt.verify(token)
      return {
        success: true,
        data: {
          valid: true,
          userId: decoded.userId,
          expiresAt: decoded.exp
        }
      }
    } catch (error) {
      return {
        success: true,
        data: {
          valid: false,
          message: '令牌无效或已过期'
        }
      }
    }
  })
}

/**
 * 从Token提取用户ID（简化处理）
 */
function extractUserIdFromToken(token: string): string | null {
  try {
    // 这里应该是JWT解码，实际应使用fastify.jwt.decode
    // 简化处理：假设token格式为 "refresh_[userId]_[timestamp]"
    if (token.startsWith('refresh_')) {
      const parts = token.split('_')
      if (parts.length >= 3) {
        return parts[1]
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * JWT认证路由注册
 */
export default async function authRefreshRoutes(fastify: FastifyInstance) {
  await refreshTokenRoute(fastify)
  await logoutRoute(fastify)
  await getCurrentUserRoute(fastify)
  await verifyTokenRoute(fastify)
}
