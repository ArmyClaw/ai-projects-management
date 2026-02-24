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

// 添加项目路由 - use correct path
const { getProjectsRoute } = await import('./routes/projects.js')
await getProjectsRoute(fastify)
console.log('[2] Projects routes done')

fastify.get('/', async () => ({ hello: 'world' }))

await fastify.listen({ port: 4000, host: '0.0.0.0' })
console.log('[3] Server running!')
