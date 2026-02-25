import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { createProject } from './helpers/seed'

describe('Projects API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('lists projects with pagination', async () => {
    await createProject({ title: 'Project A' })
    const res = await request.get('/api/v1/projects?page=1&pageSize=10')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.projects.length).toBeGreaterThan(0)
  })

  it('rejects invalid pagination', async () => {
    const page = await request.get('/api/v1/projects?page=0&pageSize=10')
    expect(page.status).toBe(400)

    const pageSize = await request.get('/api/v1/projects?page=1&pageSize=0')
    expect(pageSize.status).toBe(400)
  })

  it('returns project detail', async () => {
    const project = await createProject({ title: 'Detail Project' })
    const res = await request.get(`/api/v1/projects/${project.id}`)

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(project.id)
    expect(res.body.data.title).toBe('Detail Project')
  })

  it('creates project with validation', async () => {
    const invalid = await request.post('/api/v1/projects').send({ title: '' })
    expect(invalid.status).toBe(400)

    const ok = await request.post('/api/v1/projects').send({
      title: 'New Project',
      description: 'Desc',
      mode: 'COMMUNITY',
      budget: 1000
    })
    expect(ok.status).toBe(201)
    expect(ok.body.data.title).toBe('New Project')
    expect(ok.body.data.initiatorId).toBeTruthy()
  })

  it('validates project mode and budget', async () => {
    const invalidMode = await request.post('/api/v1/projects').send({
      title: 'Bad Mode',
      description: 'desc',
      mode: 'INVALID',
      budget: 100
    })
    expect(invalidMode.status).toBe(400)

    const invalidBudget = await request.post('/api/v1/projects').send({
      title: 'Bad Budget',
      description: 'desc',
      budget: -1
    })
    expect(invalidBudget.status).toBe(400)
  })

  it('updates and deletes project', async () => {
    const project = await createProject({ title: 'Project to update' })
    const update = await request.put(`/api/v1/projects/${project.id}`).send({ title: 'Updated' })
    expect(update.status).toBe(200)
    expect(update.body.data.title).toBe('Updated')

    const del = await request.delete(`/api/v1/projects/${project.id}`)
    expect(del.status).toBe(200)
  })

  it('rejects invalid updates and missing projects', async () => {
    const missing = await request.put('/api/v1/projects/not-found').send({ title: 'X' })
    expect(missing.status).toBe(404)

    const project = await createProject({ title: 'Project to validate' })
    const badMode = await request.put(`/api/v1/projects/${project.id}`).send({ mode: 'INVALID' })
    expect(badMode.status).toBe(400)

    const badStatus = await request.put(`/api/v1/projects/${project.id}`).send({ status: 'WRONG' })
    expect(badStatus.status).toBe(400)

    const badBudget = await request.put(`/api/v1/projects/${project.id}`).send({ budget: -10 })
    expect(badBudget.status).toBe(400)
  })

  it('returns 404 when project detail missing', async () => {
    const res = await request.get('/api/v1/projects/not-found')
    expect(res.status).toBe(404)
  })
})
