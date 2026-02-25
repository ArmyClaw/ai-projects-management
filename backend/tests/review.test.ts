import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { buildTestApp } from './helpers/app'
import { createProject, createTask } from './helpers/seed'

describe('Review API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await buildTestApp()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  it('submits task and reviews', async () => {
    const project = await createProject()
    const task = await createTask({ projectId: project.id, status: 'CLAIMED' })

    const submit = await request.post(`/api/v1/tasks/${task.id}/submit`).send({
      repoUrl: 'https://github.com/example/repo',
      description: 'submission'
    })
    expect(submit.status).toBe(201)

    const review = await request.post(`/api/v1/tasks/${task.id}/review`).send({
      result: 'APPROVED',
      scores: [4, 5],
      comment: 'good'
    })
    expect(review.status).toBe(200)
    expect(review.body.data.result).toBe('APPROVED')
  })

  it('validates submission and review errors', async () => {
    const missingRepo = await request.post('/api/v1/tasks/not-found/submit').send({})
    expect(missingRepo.status).toBe(400)

    const missingTask = await request.post('/api/v1/tasks/not-found/submit').send({ repoUrl: 'https://x.com' })
    expect(missingTask.status).toBe(404)

    const project = await createProject()
    const openTask = await createTask({ projectId: project.id, status: 'OPEN' })
    const badStatus = await request.post(`/api/v1/tasks/${openTask.id}/submit`).send({ repoUrl: 'https://x.com' })
    expect(badStatus.status).toBe(400)

    const claimedTask = await createTask({ projectId: project.id, status: 'CLAIMED' })
    const submit = await request.post(`/api/v1/tasks/${claimedTask.id}/submit`).send({ repoUrl: 'https://x.com' })
    expect(submit.status).toBe(201)

    const missingScores = await request.post(`/api/v1/tasks/${claimedTask.id}/review`).send({ result: 'APPROVED', scores: [] })
    expect(missingScores.status).toBe(400)

    const missingSubmissionTask = await createTask({ projectId: project.id, status: 'CLAIMED' })
    const noSubmission = await request.post(`/api/v1/tasks/${missingSubmissionTask.id}/review`).send({
      result: 'APPROVED',
      scores: [5]
    })
    expect(noSubmission.status).toBe(400)
  })
})
