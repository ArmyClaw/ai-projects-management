import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'

describe('Skills API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('creates and fetches skill', async () => {
    const created = await request.post('/api/v1/skills').send({
      name: 'Skill A',
      description: 'Skill description',
      tags: ['a', 'b'],
      definition: { prompts: [], workflow: [], qualityStandard: {} }
    })

    expect(created.status).toBe(201)
    const skillId = created.body.data.id

    const fetched = await request.get(`/api/v1/skills/${skillId}`)
    expect(fetched.status).toBe(200)
    expect(fetched.body.data.name).toBe('Skill A')
  })

  it('lists skills', async () => {
    const res = await request.get('/api/v1/skills?page=1&pageSize=10')
    expect(res.status).toBe(200)
    expect(res.body.data.skills).toBeDefined()
  })

  it('validates skill creation payload', async () => {
    const missing = await request.post('/api/v1/skills').send({
      name: '',
      description: '',
      definition: {}
    })
    expect(missing.status).toBe(400)

    const invalidDefinition = await request.post('/api/v1/skills').send({
      name: 'Skill Invalid',
      description: 'desc',
      definition: { prompts: [] }
    })
    expect(invalidDefinition.status).toBe(400)
  })

  it('updates and deletes skill with validation', async () => {
    const created = await request.post('/api/v1/skills').send({
      name: 'Skill Update',
      description: 'desc',
      tags: ['x'],
      definition: { prompts: [], workflow: [], qualityStandard: {} }
    })
    expect(created.status).toBe(201)
    const skillId = created.body.data.id

    const badUpdate = await request.put(`/api/v1/skills/${skillId}`).send({
      definition: { prompts: [] }
    })
    expect(badUpdate.status).toBe(400)

    const update = await request.put(`/api/v1/skills/${skillId}`).send({
      description: 'updated'
    })
    expect(update.status).toBe(200)

    const deleted = await request.delete(`/api/v1/skills/${skillId}`)
    expect(deleted.status).toBe(200)

    const missingDelete = await request.delete('/api/v1/skills/not-found')
    expect(missingDelete.status).toBe(404)
  })

  it('returns 404 for missing skill detail', async () => {
    const res = await request.get('/api/v1/skills/not-found')
    expect(res.status).toBe(404)
  })
})
