import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { createUser } from './helpers/seed'

describe('Settlement API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('creates and lists settlements', async () => {
    const user = await createUser()

    const created = await request.post('/api/v1/settlements').send({
      userId: user.id,
      amount: 500,
      type: 'TASK_COMPLETE'
    })

    expect(created.status).toBe(201)

    const list = await request.get(`/api/v1/settlements?userId=${user.id}`)
    expect(list.status).toBe(200)
    expect(list.body.data.settlements.length).toBeGreaterThan(0)
  })

  it('validates settlement inputs and missing user', async () => {
    const badAmount = await request.post('/api/v1/settlements').send({
      userId: 'user-1',
      amount: 0,
      type: 'TASK_COMPLETE'
    })
    expect(badAmount.status).toBe(400)

    const missingUser = await request.post('/api/v1/settlements').send({
      userId: 'not-found',
      amount: 10,
      type: 'BONUS'
    })
    expect(missingUser.status).toBe(404)
  })

  it('handles settlement pagination', async () => {
    const list = await request.get('/api/v1/settlements?page=1&pageSize=1')
    expect(list.status).toBe(200)
    expect(list.body.data.page).toBe(1)
  })
})
