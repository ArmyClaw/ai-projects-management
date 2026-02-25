import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { createProject, createTask, createUser } from './helpers/seed'
import { prisma } from './setup'

describe('Dispute API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('creates and arbitrates dispute', async () => {
    const initiator = await createUser()
    const assignee = await createUser()
    const project = await createProject({ initiatorId: initiator.id })
    const task = await createTask({ projectId: project.id, assigneeId: assignee.id })

    const created = await request.post('/api/v1/disputes').send({
      taskId: task.id,
      initiatorId: initiator.id,
      reason: '质量问题'
    })
    expect(created.status).toBe(201)

    const disputeId = created.body.data.id
    const arbitrate = await request.post(`/api/v1/disputes/${disputeId}/arbitrate`).send({
      decision: 'SUSTAIN_INITIATOR',
      decisionReason: '证据充分',
      refundAmount: 10
    })
    expect(arbitrate.status).toBe(200)
    expect(arbitrate.body.data.status).toBe('CLOSED')

    const list = await request.get(`/api/v1/disputes?userId=${initiator.id}`)
    expect(list.status).toBe(200)
    expect(list.body.data.disputes.length).toBeGreaterThan(0)
  })

  it('validates dispute creation and arbitration errors', async () => {
    const missing = await request.post('/api/v1/disputes').send({ taskId: '', initiatorId: '', reason: '' })
    expect(missing.status).toBe(400)

    const notFound = await request.post('/api/v1/disputes').send({
      taskId: 'not-found',
      initiatorId: 'user-x',
      reason: 'x'
    })
    expect(notFound.status).toBe(404)

    const initiator = await createUser()
    const assignee = await createUser()
    const project = await createProject({ initiatorId: initiator.id })
    const task = await createTask({ projectId: project.id, assigneeId: assignee.id })
    const unauthorized = await request.post('/api/v1/disputes').send({
      taskId: task.id,
      initiatorId: 'someone-else',
      reason: 'bad'
    })
    expect(unauthorized.status).toBe(403)

    const created = await request.post('/api/v1/disputes').send({
      taskId: task.id,
      initiatorId: assignee.id,
      reason: 'bad'
    })
    expect(created.status).toBe(201)
    const disputeId = created.body.data.id

    const missingDecision = await request.post(`/api/v1/disputes/${disputeId}/arbitrate`).send({})
    expect(missingDecision.status).toBe(400)

    const notFoundArb = await request.post('/api/v1/disputes/not-found/arbitrate').send({
      decision: 'SUSTAIN_INITIATOR',
      decisionReason: 'x'
    })
    expect(notFoundArb.status).toBe(404)

    await request.post(`/api/v1/disputes/${disputeId}/arbitrate`).send({
      decision: 'SUSTAIN_INITIATOR',
      decisionReason: 'x'
    })

    const closed = await request.post(`/api/v1/disputes/${disputeId}/arbitrate`).send({
      decision: 'SUSTAIN_INITIATOR',
      decisionReason: 'x'
    })
    expect(closed.status).toBe(400)
  })
})
