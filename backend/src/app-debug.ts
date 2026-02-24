import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import fastifyCompress from '@fastify/compress'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'
import { createWebSocketServer, setGlobalFastifyInstance } from './services/websocket.js'

dotenv.config()
console.log('[1] dotenv done')

const fastify = Fastify({
  logger: true,
  serializerOpts: {
    rounding: 'floor'
  },
  disableRequestLogging: process.env.NODE_ENV === 'production'
})
console.log('[2] Fastify created')

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})
console.log('[3] Prisma created')

await fastify.register(cors, {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
})
console.log('[4] CORS registered')

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key'
})
console.log('[5] JWT registered')

await fastify.register(fastifyCompress, {
  threshold: 1024,
  brotliOptions: { quality: 6 },
  gzipOptions: { level: 6 }
})
console.log('[6] Compress registered')

await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'AI Project Manager API',
      description: 'AI项目管理系统后端API文档',
      version: '1.0.0'
    },
    servers: [{ url: 'http://localhost:4000', description: '开发服务器' }],
    tags: [
      { name: 'projects', description: '项目管理' },
      { name: 'tasks', description: '任务管理' }
    ]
  }
})
console.log('[7] Swagger registered')

await fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: { docExpansion: 'list', deepLinking: false },
  staticCSP: true,
  transformSpecification: (swaggerObject) => swaggerObject,
  transformSpecificationClone: true
})
console.log('[8] SwaggerUI registered')

fastify.get('/', async () => ({ hello: 'world' }))
console.log('[9] Root route added')

// Skip all other routes for now

// WebSocket (disabled)
// createWebSocketServer(fastify.server, { corsOrigin: true, jwtSecret: 'test' })
// setGlobalFastifyInstance(fastify)

console.log('[10] About to start server')

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: '0.0.0.0' })
    console.log('[11] Server running!')
  } catch (err) {
    console.error('[ERROR]', err)
    process.exit(1)
  }
}

start()
