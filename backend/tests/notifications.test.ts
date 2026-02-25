import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { createUser } from './helpers/seed'
import { prisma } from './setup'

describe('Notifications API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('lists and marks notifications', async () => {
    const user = await createUser()
    const token = app.jwt.sign({ userId: user.id, email: user.email, role: user.role })

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        title: 'Test',
        message: 'Hello'
      }
    })

    const list = await request
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`)
    expect(list.status).toBe(200)

    const mark = await request
      .put(`/api/v1/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${token}`)
    expect(mark.status).toBe(200)
  })

  it('handles unread count, mark all, delete, and auth checks', async () => {
    const user = await createUser()
    const other = await createUser()
    const token = app.jwt.sign({ userId: user.id, email: user.email, role: user.role })
    const otherToken = app.jwt.sign({ userId: other.id, email: other.email, role: other.role })

    const resUnauthorized = await request.get('/api/v1/notifications')
    expect(resUnauthorized.status).toBe(401)

    const invalidPage = await request
      .get('/api/v1/notifications?page=0&pageSize=10')
      .set('Authorization', `Bearer ${token}`)
    expect(invalidPage.status).toBe(400)

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SYSTEM',
        title: 'Another',
        message: 'Hi'
      }
    })

    const unread = await request
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`)
    expect(unread.status).toBe(200)

    const forbidden = await request
      .put(`/api/v1/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${otherToken}`)
    expect(forbidden.status).toBe(403)

    const markAll = await request
      .put('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${token}`)
    expect(markAll.status).toBe(200)

    const deleteMissing = await request
      .delete('/api/v1/notifications/not-found')
      .set('Authorization', `Bearer ${token}`)
    expect(deleteMissing.status).toBe(404)

    const deleteForbidden = await request
      .delete(`/api/v1/notifications/${notification.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
    expect(deleteForbidden.status).toBe(403)

    const deleteOk = await request
      .delete(`/api/v1/notifications/${notification.id}`)
      .set('Authorization', `Bearer ${token}`)
    expect(deleteOk.status).toBe(200)
  })
})
