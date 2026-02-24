import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import fastifyCompress from '@fastify/compress'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()
const fastify = Fastify({ logger: true })
const prisma = new PrismaClient()

await fastify.register(cors, { origin: true })
await fastify.register(jwt, { secret: 'test' })
await fastify.register(fastifyCompress, { threshold: 1024 })
await fastify.register(swagger, { openapi: { info: { title: 'API', version: '1.0.0' } } })
await fastify.register(swaggerUi, { routePrefix: '/docs' })

console.log('[1] Plugins done')

const { getProjectsRoute } = await import('./routes/projects.js')
await getProjectsRoute(fastify)
console.log('[2] Projects done')

const { getTasksRoute } = await import('./routes/tasks.js')
await getTasksRoute(fastify)
console.log('[3] Tasks done')

import authRoutes from './routes/auth.js'
await fastify.register(authRoutes, { prefix: '/api/v1/auth' })
console.log('[4] Auth done')

const { getSkillsRoute } = await import('./routes/skills.js')
await getSkillsRoute(fastify)
console.log('[5] Skills done')

import pointsRoutes from './routes/points'
await fastify.register(pointsRoutes, { prefix: '/api/v1' })
console.log('[6] Points done')

import reviewRoutes from './routes/review'
await fastify.register(reviewRoutes, { prefix: '/api/v1' })
console.log('[7] Review done')

import settlementRoutes from './routes/settlement'
await fastify.register(settlementRoutes, { prefix: '/api/v1' })
console.log('[8] Settlement done')

import disputeRoutes from './routes/dispute'
await fastify.register(disputeRoutes, { prefix: '/api/v1' })
console.log('[9] Dispute done')

import antiCheatRoutes from './routes/anti-cheat'
await fastify.register(antiCheatRoutes, { prefix: '/api/v1' })
console.log('[10] Anti-cheat done')

import aiAgentRoutes from './routes/ai-agent'
await fastify.register(aiAgentRoutes, { prefix: '/api/v1' })
console.log('[11] AI-agent done')

import githubOAuthRoutes from './routes/github-oauth'
await fastify.register(githubOAuthRoutes, { prefix: '/api/v1' })
console.log('[12] GitHub OAuth done')

import authRefreshRoutes from './routes/auth-refresh'
await fastify.register(authRefreshRoutes, { prefix: '/api/v1/auth' })
console.log('[13] Auth-refresh done')

import notificationRoutes from './routes/notifications'
await fastify.register(notificationRoutes, { prefix: '/api/v1' })
console.log('[14] Notifications done')

fastify.get('/', async () => ({ hello: 'world' }))

await fastify.listen({ port: 4000, host: '0.0.0.0' })
console.log('[15] Server running!')
