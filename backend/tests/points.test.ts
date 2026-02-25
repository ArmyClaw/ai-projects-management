import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { createUser, createPoints } from './helpers/seed'
import { prisma } from './setup'

describe('Points API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns user points balance', async () => {
    const user = await createUser()
    await createPoints(user.id, 300)

    const res = await request.get(`/api/v1/users/${user.id}/points`)
    expect(res.status).toBe(200)
    expect(res.body.data.points).toBe(300)
  })

  it('returns points transactions', async () => {
    const user = await createUser()
    await createPoints(user.id, 100)
    await prisma.pointTransaction.create({
      data: {
        userId: user.id,
        amount: 50,
        balanceBefore: 100,
        balanceAfter: 150,
        type: 'BONUS',
        description: 'bonus'
      }
    })

    const res = await request.get(`/api/v1/users/${user.id}/points/transactions`)
    expect(res.status).toBe(200)
    expect(res.body.data.transactions.length).toBe(1)
  })

  it('returns 404 for missing user points', async () => {
    const res = await request.get('/api/v1/users/not-found/points')
    expect(res.status).toBe(404)
  })

  it('returns 404 for missing user transactions', async () => {
    const res = await request.get('/api/v1/users/not-found/points/transactions')
    expect(res.status).toBe(404)
  })

  it('handles transactions pagination', async () => {
    const user = await createUser()
    await prisma.pointTransaction.create({
      data: {
        userId: user.id,
        amount: 10,
        balanceBefore: 0,
        balanceAfter: 10,
        type: 'BONUS',
        description: 'bonus'
      }
    })

    const res = await request.get(`/api/v1/users/${user.id}/points/transactions?page=1&pageSize=1`)
    expect(res.status).toBe(200)
    expect(res.body.data.page).toBe(1)
  })
})
