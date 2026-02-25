import { beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'

const envPath = fileURLToPath(new URL('../.env.test', import.meta.url))
config({ path: envPath, override: false })
process.env.NODE_ENV = 'test'
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5433/ai_project_test'
}

export const prisma = new PrismaClient()

beforeAll(async () => {
  await prisma.$connect()
})

afterAll(async () => {
  await prisma.$disconnect()
})
