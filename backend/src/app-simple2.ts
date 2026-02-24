import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import fastifyCompress from '@fastify/compress'
import swagger from '@fastify/swagger'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const fastify = Fastify({ logger: true })
const prisma = new PrismaClient()

await fastify.register(cors, { origin: true })
await fastify.register(jwt, { secret: process.env.JWT_SECRET || 'secret' })
await fastify.register(fastifyCompress, { threshold: 1024 })
await fastify.register(swagger, { openapi: { info: { title: 'API', version: '1.0.0' } } })

fastify.get('/', async () => ({ hello: 'world' }))

fastify.listen({ port: 4000, host: '0.0.0.0' }, (err, address) => {
  if (err) { console.error(err); process.exit(1) }
  console.log(`Server at ${address}`)
})
