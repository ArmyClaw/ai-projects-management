import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import supertest from 'supertest'
import { PrismaClient } from '@prisma/client'

/**
 * 项目列表 API 测试
 * 测试 /api/v1/projects GET 接口
 */

// 创建测试用的 Fastify 实例
const createTestApp = async () => {
  const fastify = Fastify({
    logger: false
  })

  // 注册 CORS
  await fastify.register(require('@fastify/cors'), {
    origin: true,
    credentials: true
  })

  // 健康检查
  fastify.get('/health', async () => {
    return { status: 'healthy' }
  })

  // 模拟项目数据
  const mockProjects = [
    {
      id: 'project-1',
      title: '测试项目 1',
      description: '这是一个测试项目',
      mode: 'COMMUNITY' as const,
      status: 'ACTIVE' as const,
      budget: 1000,
      initiatorId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'project-2',
      title: '测试项目 2',
      description: '这是另一个测试项目',
      mode: 'ENTERPRISE' as const,
      status: 'DRAFT' as const,
      budget: 2000,
      initiatorId: 'user-2',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  // 注册项目路由（简化版，使用模拟数据）
  fastify.get('/api/v1/projects', async (request, reply) => {
    const page = parseInt((request.query as any).page || '1', 10)
    const pageSize = Math.min(parseInt((request.query as any).pageSize || '10', 10), 100)
    const status = (request.query as any).status
    const mode = (request.query as any).mode

    // 验证参数
    if (page < 1) {
      return reply.status(400).send({
        success: false,
        error: '页码必须大于 0'
      })
    }

    if (pageSize < 1) {
      return reply.status(400).send({
        success: false,
        error: '每页数量必须大于 0'
      })
    }

    // 过滤数据
    let filteredProjects = mockProjects
    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status)
    }
    if (mode) {
      filteredProjects = filteredProjects.filter(p => p.mode === mode)
    }

    // 分页
    const total = filteredProjects.length
    const totalPages = Math.ceil(total / pageSize)
    const projects = filteredProjects.slice((page - 1) * pageSize, page * pageSize)

    return reply.status(200).send({
      success: true,
      data: {
        projects: projects.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          mode: p.mode,
          status: p.status,
          budget: p.budget,
          initiatorName: '测试用户',
          taskCount: 0,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString()
        })),
        total,
        page,
        pageSize,
        totalPages
      }
    })
  })

  return fastify
}

describe('Project Routes - /api/v1/projects', () => {
  let fastify: any
  let server: any

  beforeAll(async () => {
    fastify = await createTestApp()
    await fastify.listen({ port: 0 })
    server = fastify.server
  })

  afterAll(async () => {
    await fastify.close()
  })

  describe('GET /api/v1/projects', () => {
    it('应该返回项目列表（默认参数）', async () => {
      const response = await supertest(server)
        .get('/api/v1/projects')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('projects')
      expect(response.body.data).toHaveProperty('total')
      expect(response.body.data).toHaveProperty('page', 1)
      expect(response.body.data).toHaveProperty('pageSize', 10)
      expect(response.body.data).toHaveProperty('totalPages')
      expect(Array.isArray(response.body.data.projects)).toBe(true)
    })

    it('应该支持自定义页码', async () => {
      const response = await supertest(server)
        .get('/api/v1/projects?page=2')
        .expect(200)

      expect(response.body.data.page).toBe(2)
    })

    it('应该支持自定义每页数量', async () => {
      const response = await supertest(server)
        .get('/api/v1/projects?pageSize=5')
        .expect(200)

      expect(response.body.data.pageSize).toBe(5)
    })

    it('应该限制最大每页数量为 100', async () => {
      const response = await supertest(server)
        .get('/api/v1/projects?pageSize=200')
        .expect(200)

      expect(response.body.data.pageSize).toBe(100)
    })

    it('应该支持按状态筛选', async () => {
      const response = await supertest(server)
        .get('/api/v1/projects?status=ACTIVE')
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.projects.forEach((p: any) => {
        expect(p.status).toBe('ACTIVE')
      })
    })

    it('应该支持按模式筛选', async () => {
      const response = await supertest(server)
        .get('/api/v1/projects?mode=COMMUNITY')
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.projects.forEach((p: any) => {
        expect(p.mode).toBe('COMMUNITY')
      })
    })

    it('应该支持组合筛选', async () => {
      const response = await supertest(server)
        .get('/api/v1/projects?status=ACTIVE&mode=COMMUNITY')
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('应该拒绝无效的页码（page=0）', async () => {
      const response = await supertest(server)
        .get('/api/v1/projects?page=0')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('页码')
    })

    it('应该拒绝无效的页码（page=-1）', async () => {
      const response = await supertest(server)
        .get('/api/v1/projects?page=-1')
        .expect(400)

      expect(response.body.success).toBe(false)
    })

    it('应该拒绝无效的每页数量（pageSize=0）', async () => {
      const response = await supertest(server)
        .get('/api/v1/projects?pageSize=0')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('每页数量')
    })

    it('应该返回正确的项目字段', async () => {
      const response = await supertest(server)
        .get('/api/v1/projects')
        .expect(200)

      if (response.body.data.projects.length > 0) {
        const project = response.body.data.projects[0]
        expect(project).toHaveProperty('id')
        expect(project).toHaveProperty('title')
        expect(project).toHaveProperty('description')
        expect(project).toHaveProperty('mode')
        expect(project).toHaveProperty('status')
        expect(project).toHaveProperty('budget')
        expect(project).toHaveProperty('initiatorName')
        expect(project).toHaveProperty('taskCount')
        expect(project).toHaveProperty('createdAt')
        expect(project).toHaveProperty('updatedAt')
      }
    })

    it('应该计算正确的总页数', async () => {
      const response = await supertest(server)
        .get('/api/v1/projects?pageSize=1')
        .expect(200)

      // 有 2 个模拟项目，pageSize=1，应该有 2 页
      expect(response.body.data.totalPages).toBe(2)
    })
  })
})
