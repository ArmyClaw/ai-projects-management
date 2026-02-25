import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { buildTestApp } from './helpers/app'
import type { FastifyInstance } from 'fastify'

describe('Auth API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('registers, logs in, and fetches profile', async () => {
    const unique = Date.now()
    const register = await request
      .post('/api/v1/auth/register')
      .send({ email: `auth_user_${unique}@example.com`, username: `auth_user_${unique}`, password: 'Password123' })

    expect(register.status).toBe(201)
    expect(register.body.success).toBe(true)

    const login = await request
      .post('/api/v1/auth/login')
      .send({ email: `auth_user_${unique}@example.com`, password: 'Password123' })

    expect(login.status).toBe(200)
    expect(login.body.data.token).toBeDefined()
  })

  it('rejects invalid credentials', async () => {
    const res = await request
      .post('/api/v1/auth/login')
      .send({ email: 'not-exist@example.com', password: 'Password123' })

    expect(res.status).toBe(401)
  })

  it('validates registration fields and uniqueness', async () => {
    const missing = await request.post('/api/v1/auth/register').send({ email: '', username: '', password: '' })
    expect(missing.status).toBe(400)

    const invalidEmail = await request.post('/api/v1/auth/register').send({
      email: 'bad-email',
      username: 'user_bad_email',
      password: 'Password123'
    })
    expect(invalidEmail.status).toBe(400)

    const weakPassword = await request.post('/api/v1/auth/register').send({
      email: 'weak@example.com',
      username: 'weak_user',
      password: 'short'
    })
    expect(weakPassword.status).toBe(400)

    const unique = Date.now()
    const first = await request.post('/api/v1/auth/register').send({
      email: `dup_${unique}@example.com`,
      username: `dup_${unique}`,
      password: 'Password123'
    })
    expect(first.status).toBe(201)

    const duplicate = await request.post('/api/v1/auth/register').send({
      email: `dup_${unique}@example.com`,
      username: `dup_${unique}_2`,
      password: 'Password123'
    })
    expect(duplicate.status).toBe(400)
  })

  it('rejects login with missing fields', async () => {
    const res = await request.post('/api/v1/auth/login').send({ email: '' })
    expect(res.status).toBe(400)
  })
})
