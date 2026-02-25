import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { createTask } from './helpers/seed'

describe('AI Agent API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('creates agent, lists agents, triggers action', async () => {
    const created = await request.post('/api/v1/ai-agents').send({ type: 'TASK_COMPLETER' })
    expect(created.status).toBe(201)
    const agentId = created.body.data.id

    const list = await request.get('/api/v1/ai-agents')
    expect(list.status).toBe(200)

    const task = await createTask()
    const action = await request.post(`/api/v1/ai-agents/${agentId}/action`).send({
      action: 'CLAIM_TASK',
      targetId: task.id
    })
    expect(action.status).toBe(200)
  })
})
