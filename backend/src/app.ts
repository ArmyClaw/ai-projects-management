import './env.js'
import fs from 'fs'
import path from 'path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import fastifyCompress from '@fastify/compress'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import fastifyStatic from '@fastify/static'
const fastify = Fastify({ logger: true })

await fastify.register(cors, { origin: true })
await fastify.register(cookie)
await fastify.register(jwt, { secret: 'test' })
await fastify.register(fastifyCompress, { threshold: 1024 })
await fastify.register(swagger, { openapi: { info: { title: 'API', version: '1.0.0' } } })
await fastify.register(swaggerUi, { routePrefix: '/docs' })

console.log('[1] Plugins done')

const distPath = path.resolve(process.cwd(), 'dist')
if (fs.existsSync(distPath)) {
  await fastify.register(fastifyStatic, { root: distPath, index: ['index.html'] })
  fastify.setNotFoundHandler((request, reply) => {
    if (request.method === 'GET' && !request.url.startsWith('/api/')) {
      return reply.sendFile('index.html')
    }
    reply.code(404).send({ error: 'Not Found' })
  })
  console.log('[1.1] Static assets enabled')
}

const {
  getProjectsRoute,
  getProjectByIdRoute,
  createProjectRoute,
  updateProjectRoute,
  deleteProjectRoute
} = await import('./routes/projects.js')
await getProjectsRoute(fastify)
await getProjectByIdRoute(fastify)
await createProjectRoute(fastify)
await updateProjectRoute(fastify)
await deleteProjectRoute(fastify)
console.log('[2] Projects done')

const {
  getTasksRoute,
  getTaskDetailRoute,
  createTaskRoute,
  updateTaskRoute,
  deleteTaskRoute
} = await import('./routes/tasks.js')
await getTasksRoute(fastify)
await getTaskDetailRoute(fastify)
await createTaskRoute(fastify)
await updateTaskRoute(fastify)
await deleteTaskRoute(fastify)
console.log('[3] Tasks done')

import authRoutes from './routes/auth.js'
await fastify.register(authRoutes, { prefix: '/api/v1/auth' })
console.log('[4] Auth done')

const {
  getSkillsRoute,
  getSkillByIdRoute,
  createSkillRoute,
  updateSkillRoute,
  deleteSkillRoute
} = await import('./routes/skills.js')
await getSkillsRoute(fastify)
await getSkillByIdRoute(fastify)
await createSkillRoute(fastify)
await updateSkillRoute(fastify)
await deleteSkillRoute(fastify)
console.log('[5] Skills done')

import pointsRoutes from './routes/points.js'
await fastify.register(pointsRoutes)
console.log('[6] Points done')

import reviewRoutes from './routes/review.js'
await fastify.register(reviewRoutes)
console.log('[7] Review done')

import settlementRoutes from './routes/settlement.js'
await fastify.register(settlementRoutes)
console.log('[8] Settlement done')

import disputeRoutes from './routes/dispute.js'
await fastify.register(disputeRoutes)
console.log('[9] Dispute done')

import antiCheatRoutes from './routes/anti-cheat.js'
await fastify.register(antiCheatRoutes)
console.log('[10] Anti-cheat done')

import aiAgentRoutes from './routes/ai-agent.js'
await fastify.register(aiAgentRoutes)
console.log('[11] AI-agent done')

import githubOAuthRoutes from './routes/github-oauth.js'
await fastify.register(githubOAuthRoutes)
console.log('[12] GitHub OAuth done')

import authRefreshRoutes from './routes/auth-refresh.js'
await fastify.register(authRefreshRoutes)
console.log('[13] Auth-refresh done')

import notificationRoutes from './routes/notifications.js'
await fastify.register(notificationRoutes)
console.log('[14] Notifications done')

const { registerAnalyticsRoutes } = await import('./routes/analytics.js')
await registerAnalyticsRoutes(fastify)
console.log('[15] Analytics done')

fastify.get('/health', async () => ({ status: 'ok' }))

const port = Number(process.env.PORT || 4000)
await fastify.listen({ port, host: '0.0.0.0' })
console.log('[16] Server running!')
