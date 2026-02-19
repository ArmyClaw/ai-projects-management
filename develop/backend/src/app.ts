import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const fastify = Fastify({
  logger: true
})

const prisma = new PrismaClient()

// 插件注册
await fastify.register(cors, {
  origin: true,
  credentials: true
})

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'
})

// 健康检查
fastify.get('/health', async () => {
  return { status: 'healthy', timestamp: new Date().toISOString() }
})

// 就绪检查
fastify.get('/ready', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { ready: true }
  } catch {
    return { ready: false }
  }
})

// API路由
fastify.get('/api/v1/health', async () => {
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

// 启动
const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' })
    console.log('Server running at http://localhost:4000')
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

export { fastify, prisma }
