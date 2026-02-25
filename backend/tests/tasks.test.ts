import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { createProject, createTask } from './helpers/seed'

describe('Tasks API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('lists tasks', async () => {
    const project = await createProject()
    await createTask({ projectId: project.id })

    const res = await request.get('/api/v1/tasks')
    expect(res.status).toBe(200)
    expect(res.body.data.tasks.length).toBeGreaterThan(0)
  })

  it('rejects invalid pagination', async () => {
    const page = await request.get('/api/v1/tasks?page=0&pageSize=10')
    expect(page.status).toBe(400)

    const pageSize = await request.get('/api/v1/tasks?page=1&pageSize=0')
    expect(pageSize.status).toBe(400)
  })

  it('creates, updates, and deletes a task', async () => {
    const project = await createProject()

    const created = await request.post('/api/v1/tasks').send({
      title: 'Task A',
      description: 'Desc',
      projectId: project.id,
      budget: 100,
      skills: ['typescript']
    })
    expect(created.status).toBe(201)
    const taskId = created.body.data.id

    const updated = await request.put(`/api/v1/tasks/${taskId}`).send({
      title: 'Task Updated',
      budget: 200
    })
    expect(updated.status).toBe(200)
    expect(updated.body.data.title).toBe('Task Updated')

    const del = await request.delete(`/api/v1/tasks/${taskId}`)
    expect(del.status).toBe(204)
  })

  it('validates create task payload', async () => {
    const project = await createProject({ title: 'Task validation project' })
    const missingTitle = await request.post('/api/v1/tasks').send({
      title: '',
      description: 'desc',
      projectId: project.id
    })
    expect(missingTitle.status).toBe(400)

    const negativeBudget = await request.post('/api/v1/tasks').send({
      title: 'Bad budget',
      description: 'desc',
      projectId: project.id,
      budget: -1
    })
    expect(negativeBudget.status).toBe(400)

    const invalidDate = await request.post('/api/v1/tasks').send({
      title: 'Bad date',
      description: 'desc',
      projectId: project.id,
      dueAt: 'not-a-date'
    })
    expect(invalidDate.status).toBe(400)

    const missingProject = await request.post('/api/v1/tasks').send({
      title: 'Missing project',
      description: 'desc',
      projectId: 'not-found'
    })
    expect(missingProject.status).toBe(404)
  })

  it('validates update and delete flows', async () => {
    const task = await createTask({ title: 'Task to validate' })

    const invalidBudget = await request.put(`/api/v1/tasks/${task.id}`).send({ budget: -10 })
    expect(invalidBudget.status).toBe(400)

    const invalidDeadline = await request.put(`/api/v1/tasks/${task.id}`).send({ dueAt: 'bad-date' })
    expect(invalidDeadline.status).toBe(400)

    const emptyTitle = await request.put(`/api/v1/tasks/${task.id}`).send({ title: ' ' })
    expect(emptyTitle.status).toBe(400)

    const emptyDesc = await request.put(`/api/v1/tasks/${task.id}`).send({ description: ' ' })
    expect(emptyDesc.status).toBe(400)

    const missing = await request.put('/api/v1/tasks/not-found').send({ title: 'X' })
    expect(missing.status).toBe(404)

    const deleted = await request.delete(`/api/v1/tasks/${task.id}`)
    expect(deleted.status).toBe(204)

    const missingDelete = await request.delete('/api/v1/tasks/not-found')
    expect(missingDelete.status).toBe(404)
  })

  it('returns task detail', async () => {
    const project = await createProject()
    const task = await createTask({ projectId: project.id })

    const res = await request.get(`/api/v1/tasks/${task.id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe(task.id)
  })

  it('returns 404 for missing task detail', async () => {
    const res = await request.get('/api/v1/tasks/not-found')
    expect(res.status).toBe(404)
  })
})
