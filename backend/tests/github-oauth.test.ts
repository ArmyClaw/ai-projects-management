import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'

describe('GitHub OAuth API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('gets oauth url and handles callback', async () => {
    const auth = await request.get('/api/v1/auth/github')
    expect(auth.status).toBe(200)
    const state = auth.body.data.state
    const cookie = auth.headers['set-cookie'][0]

    const callback = await request
      .get(`/api/v1/auth/github/callback?code=test-code&state=${state}`)
      .set('Cookie', cookie)

    expect(callback.status).toBe(200)
    expect(callback.body.data.token).toBeDefined()
  })
})
