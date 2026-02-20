/**
 * Fastify 应用主入口
 * 
 * 配置中间件、路由和WebSocket服务
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import fastifyCompress from '@fastify/compress'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import { createWebSocketServer, setGlobalFastifyInstance } from './services/websocket.js'

dotenv.config()

const fastify = Fastify({
  logger: true,
  // 优化 JSON 序列化
  serializerOpts: {
    rounding: 'floor'
  },
  // 禁用不必要的日志
  disableRequestLogging: process.env.NODE_ENV === 'production'
})

const prisma = new PrismaClient({
  // 优化 Prisma 日志
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

// 插件注册
await fastify.register(cors, {
  origin: true,
  credentials: true,
  // 优化 CORS 处理
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
})

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'
})

// 启用响应压缩
await fastify.register(fastifyCompress, {
  // 压缩阈值：小于 1KB 不压缩
  threshold: 1024,
  // 压缩算法优先级
  brotliOptions: {
    quality: 6
  },
  gzipOptions: {
    level: 6
  }
})

// Swagger文档配置
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'AI Project Manager API',
      description: 'AI项目管理系统后端API文档',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: '开发服务器'
      }
    ],
    tags: [
      { name: 'projects', description: '项目管理' },
      { name: 'tasks', description: '任务管理' },
      { name: 'analytics', description: '报表分析' },
      { name: 'auth', description: '认证授权' },
      { name: 'skills', description: '技能管理' },
      { name: 'points', description: '积分系统' },
      { name: 'review', description: '验收管理' },
      { name: 'settlement', description: '结算管理' },
      { name: 'dispute', description: '争议处理' },
      { name: 'anti-cheat', description: '防作弊系统' },
      { name: 'ai-agent', description: 'AI代理' },
      { name: 'github', description: 'GitHub集成' },
      { name: 'notifications', description: '通知系统' }
    ]
  }
})

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  },
  staticCSP: true,
  transformSpecification: (swaggerObject) => swaggerObject,
  transformSpecificationClone: true
})

// 添加API JSON文档端点
fastify.get('/docs/json', {
  schema: {
    description: '获取OpenAPI JSON文档',
    tags: ['documentation'],
    response: {
      200: {
        description: 'OpenAPI 3.0规范文档',
        type: 'application/json'
      }
    }
  }
}, async (request, reply) => {
  reply.header('Content-Type', 'application/json').send(fastify.swagger())
})

// 添加JWT认证配置说明
const jwtSecurityScheme = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
  description: 'JWT认证 - 在请求头中添加 Authorization: Bearer <token>'
}

// 更新openapi配置，添加security定义
fastify.ready(() => {
  const swaggerObj = fastify.swagger() as any
  if (!swaggerObj.components) {
    swaggerObj.components = {}
  }
  if (!swaggerObj.components.securitySchemes) {
    swaggerObj.components.securitySchemes = {}
  }
  swaggerObj.components.securitySchemes.bearerAuth = jwtSecurityScheme
  swaggerObj.security = [{ bearerAuth: [] }]
})

// 健康检查端点 - 添加缓存
fastify.get('/health', {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          timestamp: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  // 缓存 60 秒
  reply.header('Cache-Control', 'public, max-age=60')
  return { status: 'healthy', timestamp: new Date().toISOString() }
})

// 就绪检查端点
fastify.get('/ready', {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          ready: { type: 'boolean' }
        }
      }
    }
  }
}, async (request, reply) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    // 缓存 30 秒
    reply.header('Cache-Control', 'public, max-age=30')
    return { ready: true }
  } catch {
    reply.header('Cache-Control', 'no-store')
    return { ready: false }
  }
})

// API路由
fastify.get('/api/v1/health', {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          status: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
  reply.header('Cache-Control', 'public, max-age=60')
  return { status: 'ok' }
})

// 注册项目路由
import { getProjectsRoute, createProjectRoute, updateProjectRoute, deleteProjectRoute } from './routes/projects'
await getProjectsRoute(fastify)
await createProjectRoute(fastify)
await updateProjectRoute(fastify)
await deleteProjectRoute(fastify)

// 注册任务路由
import { getTasksRoute, getTaskDetailRoute, createTaskRoute, updateTaskRoute, deleteTaskRoute } from './routes/tasks'
await getTasksRoute(fastify)
await getTaskDetailRoute(fastify)
await createTaskRoute(fastify)
await updateTaskRoute(fastify)
await deleteTaskRoute(fastify)

// 注册认证路由
import authRoutes from './routes/auth.js'
await fastify.register(authRoutes, { prefix: '/api/v1/auth' })

// 注册技能路由
import { getSkillsRoute, getSkillByIdRoute, createSkillRoute, updateSkillRoute, deleteSkillRoute } from './routes/skills'
await getSkillsRoute(fastify)
await getSkillByIdRoute(fastify)
await createSkillRoute(fastify)
await updateSkillRoute(fastify)
await deleteSkillRoute(fastify)

// 注册积分路由
import pointsRoutes from './routes/points'
await fastify.register(pointsRoutes, { prefix: '/api/v1' })

// 注册验收路由
import reviewRoutes from './routes/review'
await fastify.register(reviewRoutes, { prefix: '/api/v1' })

// 注册结算路由
import settlementRoutes from './routes/settlement'
await fastify.register(settlementRoutes, { prefix: '/api/v1' })

// 注册争议路由
import disputeRoutes from './routes/dispute'
await fastify.register(disputeRoutes, { prefix: '/api/v1' })

// 注册防作弊路由
import antiCheatRoutes from './routes/anti-cheat'
await fastify.register(antiCheatRoutes, { prefix: '/api/v1' })

// 注册AIAgent路由
import aiAgentRoutes from './routes/ai-agent'
await fastify.register(aiAgentRoutes, { prefix: '/api/v1' })

// 注册GitHub OAuth路由
import githubOAuthRoutes from './routes/github-oauth'
await fastify.register(githubOAuthRoutes, { prefix: '/api/v1' })

// 注册JWT刷新路由
import authRefreshRoutes from './routes/auth-refresh'
await fastify.register(authRefreshRoutes, { prefix: '/api/v1/auth' })

// 注册通知路由
import notificationRoutes from './routes/notifications'
await fastify.register(notificationRoutes, { prefix: '/api/v1' })

// 注册报表分析路由
import {
  getProjectProgressRoute,
  getProjectGanttRoute,
  getProjectMilestonesRoute,
  createProjectMilestoneRoute,
  getUserContributionsRoute,
  getUserFinanceRoute,
  getDashboardRoute,
  getProjectsCompareRoute
} from './routes/analytics'
await getProjectProgressRoute(fastify)
await getProjectGanttRoute(fastify)
await getProjectMilestonesRoute(fastify)
await createProjectMilestoneRoute(fastify)
await getUserContributionsRoute(fastify)
await getUserFinanceRoute(fastify)
await getDashboardRoute(fastify)
await getProjectsCompareRoute(fastify)

// 初始化WebSocket服务
createWebSocketServer(fastify.server, {
  corsOrigin: process.env.CORS_ORIGIN || true,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key'
})

// 设置全局Fastify实例供WebSocket使用
setGlobalFastifyInstance(fastify)

// 启动服务器
const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' })
    fastify.log.info('Server running at http://localhost:4000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

export { fastify, prisma }
