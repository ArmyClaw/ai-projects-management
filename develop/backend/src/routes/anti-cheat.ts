/**
 * 防作弊机制API路由
 * 
 * 提供防作弊API：
 * - POST /api/v1/anti-cheat/skill-test - 提交技能测试
 * - POST /api/v1/anti-cheat/portfolio-verify - 作品集验证
 * - GET /api/v1/anti-cheat/limits/:userId - 查询评议限制
 */

import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * POST /api/v1/anti-cheat/skill-test - 提交技能测试
 */
export async function submitSkillTestRoute(fastify: FastifyInstance) {
  fastify.post('/api/v1/anti-cheat/skill-test', async (request, reply) => {
    const { userId, testType, score, antiCheat } = request.body as {
      userId: string
      testType: string
      score: number
      antiCheat?: {
        duration?: number
        tabSwitches?: number
        screenshotCount?: number
        copyAttempts?: number
      }
    }

    // 验证必填字段
    if (!userId || !testType || score === undefined) {
      reply.status(400)
      return { success: false, error: '缺少必填字段' }
    }

    try {
      // 检测可疑行为
      const isSuspicious = detectSuspiciousActivity(antiCheat)

      // 创建测试记录
      const testResult = await prisma.skillTestResult.create({
        data: {
          userId,
          testType,
          score,
          antiCheat: antiCheat || {},
          suspicious: isSuspicious,
          flaggedAt: isSuspicious ? new Date() : null
        }
      })

      return {
        success: true,
        data: {
          id: testResult.id,
          userId: testResult.userId,
          testType: testResult.testType,
          score: testResult.score,
          isSuspicious: testResult.suspicious,
          flaggedAt: testResult.flaggedAt?.toISOString() || null,
          createdAt: testResult.createdAt.toISOString()
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '提交技能测试失败' }
    }
  })
}

/**
 * 检测可疑行为
 */
function detectSuspiciousActivity(antiCheat?: {
  duration?: number
  tabSwitches?: number
  screenshotCount?: number
  copyAttempts?: number
}): boolean {
  if (!antiCheat) return false

  // 切换标签次数过多
  if (antiCheat.tabSwitches && antiCheat.tabSwitches > 5) return true
  
  // 截图次数过多
  if (antiCheat.screenshotCount && antiCheat.screenshotCount > 3) return true
  
  // 测试时间过短（小于5分钟）
  if (antiCheat.duration && antiCheat.duration < 300) return true
  
  // 复制尝试过多
  if (antiCheat.copyAttempts && antiCheat.copyAttempts > 5) return true

  return false
}

/**
 * POST /api/v1/anti-cheat/portfolio-verify - 作品集验证
 */
export async function verifyPortfolioRoute(fastify: FastifyInstance) {
  fastify.post('/api/v1/anti-cheat/portfolio-verify', async (request, reply) => {
    const { userId, portfolioUrl, aiAnalysis, gitVerified } = request.body as {
      userId: string
      portfolioUrl: string
      aiAnalysis?: {
        similarity: number
        complexity: number
        originality: number
      }
      gitVerified?: boolean
    }

    // 验证必填字段
    if (!userId || !portfolioUrl) {
      reply.status(400)
      return { success: false, error: '缺少必填字段' }
    }

    try {
      // AI分析检测
      const result = analyzePortfolio(aiAnalysis, gitVerified)

      // 创建验证记录
      const verification = await prisma.portfolioVerification.create({
        data: {
          userId,
          portfolioUrl,
          verificationType: aiAnalysis ? 'AI_AUTO' : 'MANUAL',
          result: result.status,
          aiAnalysis: aiAnalysis || {},
          gitVerified: gitVerified || false,
          manualReview: !aiAnalysis
        }
      })

      return {
        success: true,
        data: {
          id: verification.id,
          userId: verification.userId,
          portfolioUrl: verification.portfolioUrl,
          result: verification.result,
          aiAnalysis: verification.aiAnalysis,
          gitVerified: verification.gitVerified,
          createdAt: verification.createdAt.toISOString()
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '验证作品集失败' }
    }
  })
}

/**
 * 分析作品集
 */
function analyzePortfolio(aiAnalysis?: {
  similarity: number
  complexity: number
  originality: number
}, gitVerified?: boolean): { status: 'PASS' | 'FAIL' | 'SUSPICIOUS' | 'NEED_REVIEW' } {
  // 没有AI分析，需要人工审核
  if (!aiAnalysis) {
    return { status: 'NEED_REVIEW' }
  }

  // 相似度太高（抄袭）
  if (aiAnalysis.similarity > 0.8) {
    return { status: 'FAIL' }
  }

  // 原创性太低
  if (aiAnalysis.originality < 50) {
    return { status: 'SUSPICIOUS' }
  }

  // Git未验证且复杂度低
  if (!gitVerified && aiAnalysis.complexity < 50) {
    return { status: 'SUSPICIOUS' }
  }

  return { status: 'PASS' }
}

/**
 * GET /api/v1/anti-cheat/limits/:userId - 查询评议限制
 */
export async function getUserLimitsRoute(fastify: FastifyInstance) {
  fastify.get('/api/v1/anti-cheat/limits/:userId', async (request, reply) => {
    const { userId } = request.params as { userId: string }
    const { date } = request.query as { date?: string }

    try {
      const targetDate = date ? new Date(date) : new Date()
      const dateStr = targetDate.toISOString().split('T')[0]

      // 查询当日评议数量
      const dailyCount = await prisma.peerReviewLimit.count({
        where: {
          reviewerId: userId,
          date: {
            gte: new Date(dateStr),
            lt: new Date(dateStr + 'T23:59:59')
          }
        }
      })

      // 查询最近7天评议数量
      const recentStart = new Date()
      recentStart.setDate(recentStart.getDate() - 7)
      
      const recentCount = await prisma.peerReviewLimit.count({
        where: {
          reviewerId: userId,
          date: { gte: recentStart }
        }
      })

      const dailyLimit = 3
      const recentLimit = 10

      return {
        success: true,
        data: {
          userId,
          dailyCount,
          dailyLimit,
          recentCount,
          recentLimit,
          date: dateStr,
          canReview: dailyCount < dailyLimit,
          remaining: Math.max(0, dailyLimit - dailyCount)
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '查询评议限制失败' }
    }
  })
}

/**
 * POST /api/v1/anti-cheat/report - 举报作弊
 */
export async function reportCheatingRoute(fastify: FastifyInstance) {
  fastify.post('/api/v1/anti-cheat/report', async (request, reply) => {
    const { reportedUserId, reporterId, type, evidence, evidenceUrls } = request.body as {
      reportedUserId: string
      reporterId: string
      type: 'TEST_CHEATING' | 'PORTFOLIO_FAKE' | 'FAKE_REVIEW' | 'OTHER'
      evidence: string
      evidenceUrls?: string[]
    }

    // 验证必填字段
    if (!reportedUserId || !reporterId || !type || !evidence) {
      reply.status(400)
      return { success: false, error: '缺少必填字段' }
    }

    try {
      // 创建举报记录
      const report = await prisma.cheatingReport.create({
        data: {
          reportedUserId,
          reporterId,
          reportType: type,
          evidence,
          evidenceUrls: evidenceUrls || [],
          status: 'PENDING'
        }
      })

      return {
        success: true,
        data: {
          id: report.id,
          reportedUserId: report.reportedUserId,
          reporterId: report.reporterId,
          type: report.reportType,
          status: report.status,
          reportedAt: report.reportedAt.toISOString()
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '提交举报失败' }
    }
  })
}

/**
 * 防作弊机制API路由注册
 */
export default async function antiCheatRoutes(fastify: FastifyInstance) {
  await submitSkillTestRoute(fastify)
  await verifyPortfolioRoute(fastify)
  await getUserLimitsRoute(fastify)
  await reportCheatingRoute(fastify)
}
