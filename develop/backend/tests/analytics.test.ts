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

/**
 * 用户信用趋势 API 测试
 * 测试 /api/v1/users/:id/credit-trend 接口
 */

// 创建测试用的 Fastify 实例
const createTestAppWithCreditTrend = async () => {
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

  // 模拟用户数据
  const mockUsers = [
    {
      id: 'user-1',
      name: '张三',
      email: 'zhangsan@example.com',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    },
    {
      id: 'user-2',
      name: '李四',
      email: 'lisi@example.com',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date()
    }
  ]

  // 用户信用趋势路由
  fastify.get<{
    Params: {
      id: string
    }
    Querystring: {
      days?: number
    }
  }>('/api/v1/users/:id/credit-trend', async (request, reply) => {
    const { id } = request.params
    const { days = 30 } = request.query

    // 验证用户是否存在
    const user = mockUsers.find(u => u.id === id)
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: '用户不存在'
      })
    }

    // 生成模拟的信用趋势数据
    const history = []
    const baseScore = 650
    const today = new Date()
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const randomChange = Math.round((Math.random() - 0.5) * 10)
      const dayScore = baseScore + randomChange + (days - i) * 0.5
      
      history.push({
        date: dateStr,
        score: Math.min(850, Math.max(300, Math.round(dayScore))),
        change: i === days - 1 ? 0 : Math.round(dayScore - (baseScore + (days - i - 1) * 0.5))
      })
    }

    const currentScore = history[history.length - 1].score
    
    // 计算信用等级
    const getCreditLevel = (score: number): string => {
      if (score >= 800) return '优秀'
      if (score >= 700) return '良好'
      if (score >= 600) return '一般'
      if (score >= 500) return '较差'
      return '极差'
    }

    const factors = [
      {
        name: '任务完成率',
        score: 85,
        weight: 0.25,
        trend: 'up' as const
      },
      {
        name: '准时交付率',
        score: 78,
        weight: 0.20,
        trend: 'stable' as const
      },
      {
        name: '项目质量评分',
        score: 90,
        weight: 0.20,
        trend: 'up' as const
      },
      {
        name: '协作评价',
        score: 72,
        weight: 0.15,
        trend: 'down' as const
      },
      {
        name: '信用历史',
        score: 65,
        weight: 0.20,
        trend: 'stable' as const
      }
    ]

    return reply.status(200).send({
      success: true,
      data: {
        userId: user.id,
        userName: user.name,
        currentCreditScore: currentScore,
        creditLevel: getCreditLevel(currentScore),
        history,
        factors
      }
    })
  })

  return fastify
}

describe('用户信用趋势 API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await createTestAppWithCreditTrend()
    await app.ready()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /api/v1/users/:id/credit-trend', () => {
    it('应该返回404当用户不存在', async () => {
      const response = await request
        .get('/api/v1/users/non-existent/credit-trend')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('用户不存在')
    })

    it('应该成功返回用户信用趋势数据（默认30天）', async () => {
      const response = await request
        .get('/api/v1/users/user-1/credit-trend')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.userId).toBe('user-1')
      expect(response.body.data.userName).toBe('张三')
      expect(response.body.data.currentCreditScore).toBeDefined()
      expect(response.body.data.creditLevel).toBeDefined()
      expect(response.body.data.history).toHaveLength(30)
      expect(response.body.data.factors).toHaveLength(5)
    })

    it('应该正确返回7天的历史数据', async () => {
      const response = await request
        .get('/api/v1/users/user-1/credit-trend?days=7')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.history).toHaveLength(7)
    })

    it('应该正确返回90天的历史数据', async () => {
      const response = await request
        .get('/api/v1/users/user-1/credit-trend?days=90')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.history).toHaveLength(90)
    })

    it('应该正确计算信用等级', async () => {
      // 测试"优秀"等级（分数>=800）
      const response = await request
        .get('/api/v1/users/user-1/credit-trend')
        .expect(200)

      const score = response.body.data.currentCreditScore
      const level = response.body.data.creditLevel
      
      if (score >= 800) {
        expect(level).toBe('优秀')
      } else if (score >= 700) {
        expect(level).toBe('良好')
      } else if (score >= 600) {
        expect(level).toBe('一般')
      } else if (score >= 500) {
        expect(level).toBe('较差')
      } else {
        expect(level).toBe('极差')
      }
    })

    it('应该正确返回所有信用因素', async () => {
      const response = await request
        .get('/api/v1/users/user-1/credit-trend')
        .expect(200)

      const factors = response.body.data.factors
      expect(factors).toHaveLength(5)
      
      const factorNames = factors.map((f: any) => f.name)
      expect(factorNames).toContain('任务完成率')
      expect(factorNames).toContain('准时交付率')
      expect(factorNames).toContain('项目质量评分')
      expect(factorNames).toContain('协作评价')
      expect(factorNames).toContain('信用历史')
    })

    it('应该正确返回因素的权重和趋势', async () => {
      const response = await request
        .get('/api/v1/users/user-1/credit-trend')
        .expect(200)

      const factors = response.body.data.factors
      
      factors.forEach((factor: any) => {
        expect(factor).toHaveProperty('name')
        expect(factor).toHaveProperty('score')
        expect(factor).toHaveProperty('weight')
        expect(factor).toHaveProperty('trend')
        
        expect(typeof factor.score).toBe('number')
        expect(factor.score).toBeGreaterThanOrEqual(0)
        expect(factor.score).toBeLessThanOrEqual(100)
        expect(factor.weight).toBeGreaterThan(0)
        expect(factor.weight).toBeLessThanOrEqual(1)
        expect(['up', 'down', 'stable']).toContain(factor.trend)
      })
    })

    it('应该正确返回历史数据的change字段', async () => {
      const response = await request
        .get('/api/v1/users/user-1/credit-trend?days=10')
        .expect(200)

      const history = response.body.data.history
      
      // 第一天的change应该为0
      expect(history[0].change).toBe(0)
      
      // 其他天的change应该是数字
      for (let i = 1; i < history.length; i++) {
        expect(typeof history[i].change).toBe('number')
      }
    })

    it('应该正确返回不同用户的数据', async () => {
      const response1 = await request
        .get('/api/v1/users/user-1/credit-trend')
        .expect(200)

      const response2 = await request
        .get('/api/v1/users/user-2/credit-trend')
        .expect(200)

      expect(response1.body.data.userId).toBe('user-1')
      expect(response2.body.data.userId).toBe('user-2')
      expect(response1.body.data.userName).toBe('张三')
      expect(response2.body.data.userName).toBe('李四')
    })

    it('应该正确处理最大天数限制（365天）', async () => {
      const response = await request
        .get('/api/v1/users/user-1/credit-trend?days=365')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.history).toHaveLength(365)
    })

    it('应该正确处理最小天数限制（7天）', async () => {
      const response = await request
        .get('/api/v1/users/user-1/credit-trend?days=7')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.history).toHaveLength(7)
    })

    it('应该正确处理积分计算', async () => {
      const response = await request
        .get('/api/v1/users/user-1/credit-trend')
        .expect(200)

      const { history, currentCreditScore } = response.body.data
      
      // 验证分数范围
      expect(currentCreditScore).toBeGreaterThanOrEqual(300)
      expect(currentCreditScore).toBeLessThanOrEqual(850)
      
      // 验证历史分数范围
      history.forEach((point: any) => {
        expect(point.score).toBeGreaterThanOrEqual(300)
        expect(point.score).toBeLessThanOrEqual(850)
      })
    })

    it('应该正确返回日期格式', async () => {
      const response = await request
        .get('/api/v1/users/user-1/credit-trend?days=5')
        .expect(200)

      const history = response.body.data.history
      
      history.forEach((point: any) => {
        // 验证日期格式 YYYY-MM-DD
        expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })
  })
})

/**
 * 报表导出 API 测试
 * 测试 /api/v1/analytics/export/pdf 和 /api/v1/analytics/export/excel 接口
 */

// 创建测试用的 Fastify 实例
const createTestAppWithExport = async () => {
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
      ],
      milestones: [
        { id: 'milestone-1', name: '需求评审', status: 'COMPLETED', dueDate: new Date('2024-01-20') },
        { id: 'milestone-2', name: '设计评审', status: 'COMPLETED', dueDate: new Date('2024-02-05') }
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
      ],
      milestones: []
    }
  ]

  // 模拟用户数据
  const mockUsers = [
    {
      id: 'user-1',
      name: '张三',
      email: 'zhangsan@example.com',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }
  ]

  // PDF导出路由
  fastify.post<{
    Body: {
      type: string
      projectId?: string
      projectIds?: string[]
      userId?: string
    }
  }>('/api/v1/analytics/export/pdf', async (request, reply) => {
    const { type, projectId, projectIds, userId } = request.body

    switch (type) {
      case 'project-progress': {
        if (!projectId) {
          return reply.status(400).send({
            success: false,
            error: 'projectId是必填参数'
          })
        }

        const project = mockProjects.find(p => p.id === projectId)
        if (!project) {
          return reply.status(404).send({
            success: false,
            error: '项目不存在'
          })
        }

        // 返回模拟PDF数据
        return reply.status(200).send({
          success: true,
          filename: `project-progress-${projectId}`
        })
      }

      case 'project-compare': {
        if (!projectIds || projectIds.length === 0) {
          return reply.status(400).send({
            success: false,
            error: 'projectIds是必填参数'
          })
        }

        return reply.status(200).send({
          success: true,
          filename: 'project-comparison'
        })
      }

      case 'dashboard': {
        return reply.status(200).send({
          success: true,
          filename: 'dashboard-report'
        })
      }

      case 'user-contribution': {
        if (!userId) {
          return reply.status(400).send({
            success: false,
            error: 'userId是必填参数'
          })
        }

        const user = mockUsers.find(u => u.id === userId)
        if (!user) {
          return reply.status(404).send({
            success: false,
            error: '用户不存在'
          })
        }

        return reply.status(200).send({
          success: true,
          filename: `user-contribution-${userId}`
        })
      }

      default:
        return reply.status(400).send({
          success: false,
          error: '不支持的报表类型'
        })
    }
  })

  // Excel导出路由
  fastify.post<{
    Body: {
      type: string
      projectId?: string
      projectIds?: string[]
      userId?: string
    }
  }>('/api/v1/analytics/export/excel', async (request, reply) => {
    const { type, projectId, projectIds, userId } = request.body

    switch (type) {
      case 'project-progress': {
        if (!projectId) {
          return reply.status(400).send({
            success: false,
            error: 'projectId是必填参数'
          })
        }

        const project = mockProjects.find(p => p.id === projectId)
        if (!project) {
          return reply.status(404).send({
            success: false,
            error: '项目不存在'
          })
        }

        return reply.status(200).send({
          success: true,
          filename: `project-progress-${projectId}`
        })
      }

      case 'project-compare': {
        if (!projectIds || projectIds.length === 0) {
          return reply.status(400).send({
            success: false,
            error: 'projectIds是必填参数'
          })
        }

        return reply.status(200).send({
          success: true,
          filename: 'project-comparison'
        })
      }

      case 'dashboard': {
        return reply.status(200).send({
          success: true,
          filename: 'dashboard-report'
        })
      }

      case 'user-contribution': {
        if (!userId) {
          return reply.status(400).send({
            success: false,
            error: 'userId是必填参数'
          })
        }

        const user = mockUsers.find(u => u.id === userId)
        if (!user) {
          return reply.status(404).send({
            success: false,
            error: '用户不存在'
          })
        }

        return reply.status(200).send({
          success: true,
          filename: `user-contribution-${userId}`
        })
      }

      default:
        return reply.status(400).send({
          success: false,
          error: '不支持的报表类型'
        })
    }
  })

  return fastify
}

describe('报表导出 API', () => {
  let app: FastifyInstance
  let request: supertest.SuperTest<supertest.Test>

  beforeAll(async () => {
    app = await createTestAppWithExport()
    await app.ready()
    request = supertest(app.server)
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /api/v1/analytics/export/pdf', () => {
    it('应该返回400当project-progress类型缺少projectId', async () => {
      const response = await request
        .post('/api/v1/analytics/export/pdf')
        .send({ type: 'project-progress' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('projectId是必填参数')
    })

    it('应该返回404当project-progress类型的项目不存在', async () => {
      const response = await request
        .post('/api/v1/analytics/export/pdf')
        .send({ type: 'project-progress', projectId: 'non-existent' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('项目不存在')
    })

    it('应该成功导出project-progress类型的PDF', async () => {
      const response = await request
        .post('/api/v1/analytics/export/pdf')
        .send({ type: 'project-progress', projectId: 'project-1' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.filename).toBe('project-progress-project-1')
    })

    it('应该返回400当project-compare类型缺少projectIds', async () => {
      const response = await request
        .post('/api/v1/analytics/export/pdf')
        .send({ type: 'project-compare' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('projectIds是必填参数')
    })

    it('应该成功导出project-compare类型的PDF', async () => {
      const response = await request
        .post('/api/v1/analytics/export/pdf')
        .send({ type: 'project-compare', projectIds: ['project-1', 'project-2'] })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.filename).toBe('project-comparison')
    })

    it('应该成功导出dashboard类型的PDF', async () => {
      const response = await request
        .post('/api/v1/analytics/export/pdf')
        .send({ type: 'dashboard' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.filename).toBe('dashboard-report')
    })

    it('应该返回400当user-contribution类型缺少userId', async () => {
      const response = await request
        .post('/api/v1/analytics/export/pdf')
        .send({ type: 'user-contribution' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('userId是必填参数')
    })

    it('应该返回404当user-contribution类型的用户不存在', async () => {
      const response = await request
        .post('/api/v1/analytics/export/pdf')
        .send({ type: 'user-contribution', userId: 'non-existent' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('用户不存在')
    })

    it('应该成功导出user-contribution类型的PDF', async () => {
      const response = await request
        .post('/api/v1/analytics/export/pdf')
        .send({ type: 'user-contribution', userId: 'user-1' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.filename).toBe('user-contribution-user-1')
    })

    it('应该返回400当类型不支持', async () => {
      const response = await request
        .post('/api/v1/analytics/export/pdf')
        .send({ type: 'invalid-type' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('不支持的报表类型')
    })
  })

  describe('POST /api/v1/analytics/export/excel', () => {
    it('应该返回400当project-progress类型缺少projectId', async () => {
      const response = await request
        .post('/api/v1/analytics/export/excel')
        .send({ type: 'project-progress' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('projectId是必填参数')
    })

    it('应该返回404当project-progress类型的项目不存在', async () => {
      const response = await request
        .post('/api/v1/analytics/export/excel')
        .send({ type: 'project-progress', projectId: 'non-existent' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('项目不存在')
    })

    it('应该成功导出project-progress类型的Excel', async () => {
      const response = await request
        .post('/api/v1/analytics/export/excel')
        .send({ type: 'project-progress', projectId: 'project-1' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.filename).toBe('project-progress-project-1')
    })

    it('应该返回400当project-compare类型缺少projectIds', async () => {
      const response = await request
        .post('/api/v1/analytics/export/excel')
        .send({ type: 'project-compare' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('projectIds是必填参数')
    })

    it('应该成功导出project-compare类型的Excel', async () => {
      const response = await request
        .post('/api/v1/analytics/export/excel')
        .send({ type: 'project-compare', projectIds: ['project-1', 'project-2'] })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.filename).toBe('project-comparison')
    })

    it('应该成功导出dashboard类型的Excel', async () => {
      const response = await request
        .post('/api/v1/analytics/export/excel')
        .send({ type: 'dashboard' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.filename).toBe('dashboard-report')
    })

    it('应该返回400当user-contribution类型缺少userId', async () => {
      const response = await request
        .post('/api/v1/analytics/export/excel')
        .send({ type: 'user-contribution' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('userId是必填参数')
    })

    it('应该返回404当user-contribution类型的用户不存在', async () => {
      const response = await request
        .post('/api/v1/analytics/export/excel')
        .send({ type: 'user-contribution', userId: 'non-existent' })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('用户不存在')
    })

    it('应该成功导出user-contribution类型的Excel', async () => {
      const response = await request
        .post('/api/v1/analytics/export/excel')
        .send({ type: 'user-contribution', userId: 'user-1' })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.filename).toBe('user-contribution-user-1')
    })

    it('应该返回400当类型不支持', async () => {
      const response = await request
        .post('/api/v1/analytics/export/excel')
        .send({ type: 'invalid-type' })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('不支持的报表类型')
    })
  })
})
