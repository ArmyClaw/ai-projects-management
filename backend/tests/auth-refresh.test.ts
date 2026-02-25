import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { createUser } from './helpers/seed'

describe('Auth Refresh API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('refreshes token with refresh token format and existing user', async () => {
    const user = await createUser()
    const refreshToken = `refresh_${user.id}_${Date.now()}`

    const res = await request
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.accessToken).toBeDefined()
  })

  it('returns current user with valid access token', async () => {
    const user = await createUser()
    const accessToken = app.jwt.sign({ userId: user.id, email: user.email, role: user.role })

    const res = await request
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(user.id)
  })

  it('verifies token validity', async () => {
    const token = app.jwt.sign({ userId: 'user-1', email: 'u@example.com', role: 'PARTICIPANT' })
    const res = await request
      .post('/api/v1/auth/verify')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.valid).toBe(true)
  })

  it('rejects refresh without bearer token and invalid formats', async () => {
    const missing = await request.post('/api/v1/auth/refresh')
    expect(missing.status).toBe(401)

    const invalid = await request
      .post('/api/v1/auth/refresh')
      .set('Authorization', 'Bearer short')
    expect(invalid.status).toBe(401)
  })

  it('rejects refresh for revoked or unknown user token', async () => {
    const revokedToken = `refresh_revoked_${Date.now()}`
    await request.post('/api/v1/auth/logout').set('Authorization', `Bearer ${revokedToken}`)

    const revoked = await request
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${revokedToken}`)
    expect(revoked.status).toBe(401)

    const unknownUserToken = `refresh_unknown_${Date.now()}`
    const unknown = await request
      .post('/api/v1/auth/refresh')
      .set('Authorization', `Bearer ${unknownUserToken}`)
    expect(unknown.status).toBe(401)
  })

  it('handles current user auth failures', async () => {
    const missing = await request.get('/api/v1/auth/me')
    expect(missing.status).toBe(401)

    const bad = await request
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer bad-token')
    expect(bad.status).toBe(401)

    const inactive = await createUser({ status: 'INACTIVE' })
    const accessToken = app.jwt.sign({ userId: inactive.id, email: inactive.email, role: inactive.role })
    const res = await request
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(403)
  })

  it('returns invalid for verify without token or revoked token', async () => {
    const missing = await request.post('/api/v1/auth/verify')
    expect(missing.status).toBe(200)
    expect(missing.body.data.valid).toBe(false)

    const token = app.jwt.sign({ userId: 'user-2', email: 'u2@example.com', role: 'PARTICIPANT' })
    await request.post('/api/v1/auth/logout').set('Authorization', `Bearer ${token}`)

    const revoked = await request
      .post('/api/v1/auth/verify')
      .set('Authorization', `Bearer ${token}`)
    expect(revoked.status).toBe(200)
    expect(revoked.body.data.valid).toBe(false)
  })
})
