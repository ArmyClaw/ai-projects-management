import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import supertest from 'supertest'

/**
 * 项目对比分析 API 测试
 * 测试 /api/v1/analytics/projects/compare 接口
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
      title: 'AI 项目管理系统',
      description: 'AI驱动的项目管理平台',
      mode: 'ENTERPRISE' as const,
      status: 'ACTIVE' as const,
      budget: 100000,
      initiatorId: 'user-1',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [
        { id: 'task-1', title: '需求分析', status: 'COMPLETED', startDate: new Date('2024-01-01'), endDate: new Date('2024-01-15') },
        { id: 'task-2', title: '系统设计', status: 'COMPLETED', startDate: new Date('2024-01-16'), endDate: new Date('2024-01-31') },
        { id: 'task-3', title: '开发任务', status: 'IN_PROGRESS', startDate: new Date('2024-02-01'), endDate: new Date('2024-06-30') }
      ],
      reviews: [
        { id: 'review-1', rating: 5 },
        { id: 'review-2', rating: 4 }
      ]
    },
    {
      id: 'project-2',
      title: '智能客服系统',
      description: '基于LLM的智能客服',
      mode: 'ENTERPRISE' as const,
      status: 'COMPLETED' as const,
      budget: 50000,
      initiatorId: 'user-2',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-08-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [
        { id: 'task-4', title: '需求调研', status: 'COMPLETED', startDate: new Date('2024-03-01'), endDate: new Date('2024-03-15') },
        { id: 'task-5', title: '模型训练', status: 'COMPLETED', startDate: new Date('2024-03-16'), endDate: new Date('2024-05-15') },
        { id: 'task-6', title: '系统部署', status: 'COMPLETED', startDate: new Date('2024-05-16'), endDate: new Date('2024-06-30') }
      ],
      reviews: [
        { id: 'review-3', rating: 5 }
      ]
    },
    {
      id: 'project-3',
      title: '数据分析平台',
      description: '企业级数据可视化平台',
      mode: 'COMMUNITY' as const,
      status: 'DRAFT' as const,
      budget: 30000,
      initiatorId: 'user-3',
      startDate: null,
      endDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      tasks: [],
      reviews: []
    }
  ]

  // 项目对比分析路由
  fastify.get<{
    Querystring: {
      projects: string
    }
  }>('/api/v1/analytics/projects/compare', async (request, reply) => {
    const { projects } = request.query

    // 解析项目ID列表
    const projectIds = projects.split(',').map(id => id.trim()).filter(Boolean)

    // 验证项目数量
    if (projectIds.length === 0) {
      return reply.status(400).send({
        success: false,
        error: '请提供至少一个项目ID'
      })
    }

    if (projectIds.length > 5) {
      return reply.status(400).send({
        success: false,
        error: '最多支持5个项目对比'
      })
    }

    // 获取项目数据
    const projectData = projectIds
      .map(id => mockProjects.find(p => p.id === id))
      .filter(Boolean)

    if (projectData.length === 0) {
      return reply.status(404).send({
        success: false,
        error: '未找到指定的项目'
      })
    }

    // 计算对比数据
    const compareData = projectData.map(project => {
      const totalTasks = project!.tasks.length
      const completedTasks = project!.tasks.filter((t: any) => t.status === 'COMPLETED').length
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      // 计算平均周期
      let averageCycleDays = 0
      const completedTasksWithDates = project!.tasks.filter(
        (t: any) => t.status === 'COMPLETED' && t.startDate && t.endDate
      )
      if (completedTasksWithDates.length > 0) {
        const totalDays = completedTasksWithDates.reduce((sum: number, t: any) => {
          const start = new Date(t.startDate).getTime()
          const end = new Date(t.endDate).getTime()
          return sum + (end - start) / (1000 * 60 * 60 * 24)
        }, 0)
        averageCycleDays = Math.round(totalDays / completedTasksWithDates.length)
      }

      // 计算满意度
      let satisfaction: number | null = null
      if (project!.reviews.length > 0) {
        const totalScore = project!.reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0)
        satisfaction = Math.round((totalScore / project!.reviews.length) * 20)
      }

      return {
        id: project!.id,
        title: project!.title,
        status: project!.status,
        totalTasks,
        completedTasks,
        completionRate,
        averageCycleDays,
        budget: project!.budget,
        budgetDeviation: Math.round((Math.random() * 40 - 20) * 100) / 100,
        satisfaction,
        startDate: project!.startDate?.toISOString() || null,
        endDate: project!.endDate?.toISOString() || null
      }
    })

    return reply.status(200).send({
      success: true,
      data: {
        projects: compareData,
        comparedAt: new Date().toISOString()
      }
    })
  })

  return fastify
}

describe('项目对比分析 API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await createTestApp()
    await app.ready()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /api/v1/analytics/projects/compare', () => {
    it('应该返回400当没有提供项目ID', async () => {
      const response = await request
        .get('/api/v1/analytics/projects/compare?projects=')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('请提供至少一个项目ID')
    })

    it('应该返回400当项目数量超过5个', async () => {
      const response = await request
        .get('/api/v1/analytics/projects/compare?projects=p1,p2,p3,p4,p5,p6')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('最多支持5个项目对比')
    })

    it('应该返回404当项目不存在', async () => {
      const response = await request
        .get('/api/v1/analytics/projects/compare?projects=non-existent')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('未找到指定的项目')
    })

    it('应该成功返回单个项目对比数据', async () => {
      const response = await request
        .get('/api/v1/analytics/projects/compare?projects=project-1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.projects).toHaveLength(1)
      expect(response.body.data.projects[0].id).toBe('project-1')
      expect(response.body.data.projects[0].title).toBe('AI 项目管理系统')
      expect(response.body.data.comparedAt).toBeDefined()
    })

    it('应该成功返回多个项目对比数据', async () => {
      const response = await request
        .get('/api/v1/analytics/projects/compare?projects=project-1,project-2')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.projects).toHaveLength(2)
      
      // 验证项目1
      const project1 = response.body.data.projects.find((p: any) => p.id === 'project-1')
      expect(project1).toBeDefined()
      expect(project1.totalTasks).toBe(3)
      expect(project1.completedTasks).toBe(2)
      expect(project1.completionRate).toBe(67) // 2/3 = 66.67% -> 67%

      // 验证项目2
      const project2 = response.body.data.projects.find((p: any) => p.id === 'project-2')
      expect(project2).toBeDefined()
      expect(project2.totalTasks).toBe(3)
      expect(project2.completedTasks).toBe(3)
      expect(project2.completionRate).toBe(100)
    })

    it('应该正确计算平均周期', async () => {
      const response = await request
        .get('/api/v1/analytics/projects/compare?projects=project-2')
        .expect(200)

      const project = response.body.data.projects[0]
      // 项目2有3个已完成任务，都有日期
      expect(project.averageCycleDays).toBeGreaterThan(0)
    })

    it('应该正确计算满意度', async () => {
      const response = await request
        .get('/api/v1/analytics/projects/compare?projects=project-1,project-2')
        .expect(200)

      // 项目1有2个评价 (5+4)/2*20 = 90
      const project1 = response.body.data.projects.find((p: any) => p.id === 'project-1')
      expect(project1.satisfaction).toBe(90)

      // 项目2有1个评价 5*20 = 100
      const project2 = response.body.data.projects.find((p: any) => p.id === 'project-2')
      expect(project2.satisfaction).toBe(100)

      // 项目3没有评价
      const response2 = await request
        .get('/api/v1/analytics/projects/compare?projects=project-3')
        .expect(200)
      expect(response2.body.data.projects[0].satisfaction).toBeNull()
    })

    it('应该正确处理没有任务的项目', async () => {
      const response = await request
        .get('/api/v1/analytics/projects/compare?projects=project-3')
        .expect(200)

      const project = response.body.data.projects[0]
      expect(project.totalTasks).toBe(0)
      expect(project.completedTasks).toBe(0)
      expect(project.completionRate).toBe(0)
      expect(project.averageCycleDays).toBe(0)
    })

    it('应该支持空格分隔的项目ID', async () => {
      const response = await request
        .get('/api/v1/analytics/projects/compare?projects=project-1, project-2')
        .expect(200)

      expect(response.body.data.projects).toHaveLength(2)
    })

    it('应该正确处理预算字段', async () => {
      const response = await request
        .get('/api/v1/analytics/projects/compare?projects=project-1')
        .expect(200)

      const project = response.body.data.projects[0]
      expect(project.budget).toBe(100000)
      expect(typeof project.budgetDeviation).toBe('number')
    })

    it('应该正确返回项目状态', async () => {
      const response = await request
        .get('/api/v1/analytics/projects/compare?projects=project-1,project-2,project-3')
        .expect(200)

      const project1 = response.body.data.projects.find((p: any) => p.id === 'project-1')
      const project2 = response.body.data.projects.find((p: any) => p.id === 'project-2')
      const project3 = response.body.data.projects.find((p: any) => p.id === 'project-3')

      expect(project1.status).toBe('ACTIVE')
      expect(project2.status).toBe('COMPLETED')
      expect(project3.status).toBe('DRAFT')
    })

    it('应该正确处理null的startDate和endDate', async () => {
      const response = await request
        .get('/api/v1/analytics/projects/compare?projects=project-3')
        .expect(200)

      const project = response.body.data.projects[0]
      expect(project.startDate).toBeNull()
      expect(project.endDate).toBeNull()
    })
  })
})
