import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { createUser } from './helpers/seed'

describe('Anti-cheat API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('submits skill test and portfolio verify', async () => {
    const user = await createUser()

    const skillTest = await request.post('/api/v1/anti-cheat/skill-test').send({
      userId: user.id,
      testType: 'typescript',
      score: 80,
      antiCheat: { duration: 120 }
    })
    expect(skillTest.status).toBe(200)

    const portfolio = await request.post('/api/v1/anti-cheat/portfolio-verify').send({
      userId: user.id,
      portfolioUrl: 'https://example.com/portfolio',
      verificationType: 'AI_AUTO'
    })
    expect(portfolio.status).toBe(200)
  })
})
