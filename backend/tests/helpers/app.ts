import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import compress from '@fastify/compress'

import authRoutes from '../../src/routes/auth.js'
import {
  getProjectsRoute,
  getProjectByIdRoute,
  createProjectRoute,
  updateProjectRoute,
  deleteProjectRoute
} from '../../src/routes/projects.js'
import {
  getTasksRoute,
  getTaskDetailRoute,
  createTaskRoute,
  updateTaskRoute,
  deleteTaskRoute
} from '../../src/routes/tasks.js'
import {
  getSkillsRoute,
  getSkillByIdRoute,
  createSkillRoute,
  updateSkillRoute,
  deleteSkillRoute
} from '../../src/routes/skills.js'
import pointsRoutes from '../../src/routes/points.js'
import reviewRoutes from '../../src/routes/review.js'
import settlementRoutes from '../../src/routes/settlement.js'
import disputeRoutes from '../../src/routes/dispute.js'
import antiCheatRoutes from '../../src/routes/anti-cheat.js'
import aiAgentRoutes from '../../src/routes/ai-agent.js'
import githubOAuthRoutes from '../../src/routes/github-oauth.js'
import authRefreshRoutes from '../../src/routes/auth-refresh.js'
import notificationRoutes from '../../src/routes/notifications.js'
import { registerAnalyticsRoutes } from '../../src/routes/analytics.js'

export async function buildTestApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: false })

  await app.register(cors, { origin: true })
  await app.register(cookie)
  await app.register(jwt, { secret: process.env.JWT_SECRET || 'test-secret' })
  await app.register(compress, { threshold: 1024 })

  app.addHook('preHandler', async (request) => {
    const authHeader = request.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        const decoded = app.jwt.verify(token) as { userId?: string; id?: string; email?: string; role?: string }
        const id = decoded.userId || decoded.id
        if (id) {
          ;(request as any).user = { id, email: decoded.email, role: decoded.role }
        }
      } catch {
        // ignore invalid token for test hook
      }
    }
  })

  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await getProjectsRoute(app)
  await getProjectByIdRoute(app)
  await createProjectRoute(app)
  await updateProjectRoute(app)
  await deleteProjectRoute(app)

  await getTasksRoute(app)
  await getTaskDetailRoute(app)
  await createTaskRoute(app)
  await updateTaskRoute(app)
  await deleteTaskRoute(app)

  await getSkillsRoute(app)
  await getSkillByIdRoute(app)
  await createSkillRoute(app)
  await updateSkillRoute(app)
  await deleteSkillRoute(app)
  await app.register(pointsRoutes)
  await app.register(reviewRoutes)
  await app.register(settlementRoutes)
  await app.register(disputeRoutes)
  await app.register(antiCheatRoutes)
  await app.register(aiAgentRoutes)
  await app.register(githubOAuthRoutes)
  await app.register(authRefreshRoutes)
  await app.register(notificationRoutes)
  await registerAnalyticsRoutes(app)

  app.get('/health', async () => ({ status: 'ok' }))

  await app.ready()
  return app
}
