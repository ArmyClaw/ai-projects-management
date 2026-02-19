import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import Fastify from 'fastify'
import supertest from 'supertest'

/**
 * 任务列表 API 测试
 * 测试 /api/v1/tasks GET 接口
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

  // 模拟任务数据
  const mockTasks = [
    {
      id: 'task-1',
      title: '实现用户认证模块',
      description: '需要实现用户登录注册功能',
      status: 'OPEN' as const,
      budget: 500,
      projectId: 'project-1',
      projectTitle: 'AI代码审查工具',
      assigneeName: null as const,
      skills: ['TypeScript', 'Fastify'],
      deadline: new Date('2026-02-25'),
      createdAt: new Date('2026-02-15'),
      updatedAt: new Date('2026-02-15')
    },
    {
      id: 'task-2',
      title: '前端界面开发',
      description: '实现用户管理界面',
      status: 'IN_PROGRESS' as const,
      budget: 800,
      projectId: 'project-1',
      projectTitle: 'AI代码审查工具',
      assigneeName: '张三',
      skills: ['Vue.js', 'TypeScript'],
      deadline: new Date('2026-03-01'),
      createdAt: new Date('2026-02-14'),
      updatedAt: new Date('2026-02-16')
    },
    {
      id: 'task-3',
      title: '数据库设计',
      description: '设计项目数据库结构',
      status: 'SUBMITTED' as const,
      budget: 300,
      projectId: 'project-2',
      projectTitle: '数据分析平台',
      assigneeName: '李四',
      skills: ['PostgreSQL', 'Prisma'],
      deadline: new Date('2026-02-20'),
      createdAt: new Date('2026-02-10'),
      updatedAt: new Date('2026-02-18')
    }
  ]

  // 任务列表路由
  fastify.get('/api/v1/tasks', async (request, reply) => {
    const page = parseInt((request.query as any).page || '1', 10)
    const pageSize = Math.min(parseInt((request.query as any).pageSize || '10', 10), 100)
    const status = (request.query as any).status
    const projectId = (request.query as any).projectId
    const assigneeId = (request.query as any).assigneeId

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
    let filteredTasks = mockTasks
    if (status) {
      filteredTasks = filteredTasks.filter(t => t.status === status)
    }
    if (projectId) {
      filteredTasks = filteredTasks.filter(t => t.projectId === projectId)
    }
    if (assigneeId) {
      filteredTasks = filteredTasks.filter(t => t.assigneeName !== null)
    }

    // 分页
    const total = filteredTasks.length
    const totalPages = Math.ceil(total / pageSize)
    const tasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize)

    return reply.status(200).send({
      success: true,
      data: {
        tasks: tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status,
          budget: t.budget,
          projectId: t.projectId,
          projectTitle: t.projectTitle,
          assigneeName: t.assigneeName,
          skills: t.skills,
          deadline: t.deadline?.toISOString() || null,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString()
        })),
        total,
        page,
        pageSize,
        totalPages
      }
    })
  })

  // 任务详情路由
  fastify.get('/api/v1/tasks/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const task = mockTasks.find(t => t.id === id)

    if (!task) {
      return reply.status(404).send({
        success: false,
        error: '任务不存在'
      })
    }

    return reply.status(200).send({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        budget: task.budget,
        project: {
          id: task.projectId,
          title: task.projectTitle
        },
        assignee: task.assigneeName ? {
          id: 'user-1',
          name: task.assigneeName
        } : null,
        skills: task.skills,
        reviews: [],
        deadline: task.deadline?.toISOString() || null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString()
      }
    })
  })

  // 创建任务路由
  fastify.post('/api/v1/tasks', async (request, reply) => {
    const { title, description, projectId, budget = 0, skills = [], deadline } = request.body as any

    // 验证必填字段
    if (!title || title.trim().length === 0) {
      return reply.status(400).send({
        success: false,
        error: '任务标题不能为空'
      })
    }

    if (!description || description.trim().length === 0) {
      return reply.status(400).send({
        success: false,
        error: '任务描述不能为空'
      })
    }

    if (!projectId || projectId.trim().length === 0) {
      return reply.status(400).send({
        success: false,
        error: '项目ID不能为空'
      })
    }

    if (budget < 0) {
      return reply.status(400).send({
        success: false,
        error: '预算金额不能为负数'
      })
    }

    // 生成任务ID
    const taskId = `task-${Date.now()}`

    // 创建任务
    const task = {
      id: taskId,
      title: title.trim(),
      description: description.trim(),
      status: 'OPEN',
      budget,
      projectId: projectId.trim(),
      projectTitle: '示例项目',
      assigneeName: null,
      skills: skills || [],
      deadline: deadline ? new Date(deadline).toISOString() : null,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    return reply.status(201).send({
      success: true,
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        budget: task.budget,
        projectId: task.projectId,
        projectTitle: task.projectTitle,
        assigneeName: task.assigneeName,
        skills: task.skills,
        deadline: task.deadline,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString()
      }
    })
  })

  // 更新任务路由（模拟）
  const updateTaskMock = {
    id: 'task-1',
    title: '实现用户认证模块',
    description: '需要实现用户登录注册功能',
    status: 'OPEN',
    budget: 500,
    projectId: 'project-1',
    projectTitle: 'AI代码审查工具',
    assigneeName: null,
    skills: ['TypeScript', 'Fastify'],
    deadline: new Date('2026-02-25'),
    createdAt: new Date('2026-02-15'),
    updatedAt: new Date('2026-02-15')
  }

  fastify.put<{
    Params: { id: string }
    Body: {
      title?: string
      description?: string
      budget?: number
      skills?: string[]
      deadline?: string
    }
  }>('/api/v1/tasks/:id', async (request, reply) => {
    const { id } = request.params
    const { title, description, budget, skills, deadline } = request.body

    // 验证任务是否存在
    if (id !== 'task-1') {
      return reply.status(404).send({
        success: false,
        error: '任务不存在'
      })
    }

    // 验证预算不能为负数
    if (budget !== undefined && budget < 0) {
      return reply.status(400).send({
        success: false,
        error: '预算金额不能为负数'
      })
    }

    // 验证 deadline 格式（如果提供）
    if (deadline) {
      const deadlineDate = new Date(deadline)
      if (isNaN(deadlineDate.getTime())) {
        return reply.status(400).send({
          success: false,
          error: '截止日期格式无效，请使用 ISO 8601 格式'
        })
      }
    }

    // 更新任务数据
    const updatedTask = {
      ...updateTaskMock,
      title: title || updateTaskMock.title,
      description: description || updateTaskMock.description,
      budget: budget !== undefined ? budget : updateTaskMock.budget,
      skills: skills || updateTaskMock.skills,
      deadline: deadline ? new Date(deadline) : updateTaskMock.deadline,
      updatedAt: new Date()
    }

    return reply.status(200).send({
      success: true,
      data: {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        budget: updatedTask.budget,
        projectId: updatedTask.projectId,
        projectTitle: updatedTask.projectTitle,
        assigneeName: updatedTask.assigneeName,
        skills: updatedTask.skills,
        deadline: updatedTask.deadline?.toISOString() || null,
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString()
      }
    })
  })

  return fastify
}

describe('Task Routes - /api/v1/tasks', () => {
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

  describe('GET /api/v1/tasks', () => {
    it('应该返回任务列表（默认参数）', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('tasks')
      expect(response.body.data).toHaveProperty('total')
      expect(response.body.data).toHaveProperty('page', 1)
      expect(response.body.data).toHaveProperty('pageSize', 10)
      expect(response.body.data).toHaveProperty('totalPages')
      expect(Array.isArray(response.body.data.tasks)).toBe(true)
    })

    it('应该支持自定义页码', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks?page=2')
        .expect(200)

      expect(response.body.data.page).toBe(2)
    })

    it('应该支持自定义每页数量', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks?pageSize=5')
        .expect(200)

      expect(response.body.data.pageSize).toBe(5)
    })

    it('应该限制最大每页数量为 100', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks?pageSize=200')
        .expect(200)

      expect(response.body.data.pageSize).toBe(100)
    })

    it('应该支持按状态筛选', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks?status=OPEN')
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.tasks.forEach((t: any) => {
        expect(t.status).toBe('OPEN')
      })
    })

    it('应该支持按项目ID筛选', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks?projectId=project-1')
        .expect(200)

      expect(response.body.success).toBe(true)
      response.body.data.tasks.forEach((t: any) => {
        expect(t.projectId).toBe('project-1')
      })
    })

    it('应该支持组合筛选', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks?status=OPEN&projectId=project-1')
        .expect(200)

      expect(response.body.success).toBe(true)
    })

    it('应该拒绝无效的页码（page=0）', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks?page=0')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('页码')
    })

    it('应该拒绝无效的每页数量（pageSize=0）', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks?pageSize=0')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('每页数量')
    })

    it('应该返回正确的任务字段', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks')
        .expect(200)

      if (response.body.data.tasks.length > 0) {
        const task = response.body.data.tasks[0]
        expect(task).toHaveProperty('id')
        expect(task).toHaveProperty('title')
        expect(task).toHaveProperty('description')
        expect(task).toHaveProperty('status')
        expect(task).toHaveProperty('budget')
        expect(task).toHaveProperty('projectId')
        expect(task).toHaveProperty('projectTitle')
        expect(task).toHaveProperty('skills')
        expect(task).toHaveProperty('createdAt')
        expect(task).toHaveProperty('updatedAt')
      }
    })

    it('应该计算正确的总页数', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks?pageSize=1')
        .expect(200)

      // 有 3 个模拟任务，pageSize=1，应该有 3 页
      expect(response.body.data.totalPages).toBe(3)
    })
  })

  describe('GET /api/v1/tasks/:id', () => {
    it('应该返回任务详情', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks/task-1')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe('task-1')
      expect(response.body.data.title).toBe('实现用户认证模块')
      expect(response.body.data.status).toBe('OPEN')
      expect(response.body.data.budget).toBe(500)
      expect(response.body.data.project.title).toBe('AI代码审查工具')
      expect(response.body.data.skills).toContain('TypeScript')
      expect(response.body.data.skills).toContain('Fastify')
    })

    it('应该返回404当任务不存在', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks/invalid-id')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('不存在')
    })

    it('任务详情应该包含所有必要字段', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks/task-1')
        .expect(200)

      const task = response.body.data
      expect(task).toHaveProperty('id')
      expect(task).toHaveProperty('title')
      expect(task).toHaveProperty('description')
      expect(task).toHaveProperty('status')
      expect(task).toHaveProperty('budget')
      expect(task).toHaveProperty('project')
      expect(task).toHaveProperty('assignee')
      expect(task).toHaveProperty('skills')
      expect(task).toHaveProperty('reviews')
      expect(task).toHaveProperty('deadline')
      expect(task).toHaveProperty('createdAt')
      expect(task).toHaveProperty('updatedAt')
    })

    it('未分配任务应该返回null assignee', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks/task-1')
        .expect(200)

      expect(response.body.data.assignee).toBe(null)
    })

    it('已分配任务应该返回assignee信息', async () => {
      const response = await supertest(server)
        .get('/api/v1/tasks/task-2')
        .expect(200)

      expect(response.body.data.assignee).not.toBe(null)
      expect(response.body.data.assignee.name).toBe('张三')
    })
  })

  describe('POST /api/v1/tasks', () => {
    it('应该成功创建任务', async () => {
      const response = await supertest(server)
        .post('/api/v1/tasks')
        .send({
          title: '新任务测试',
          description: '这是一个测试任务',
          projectId: 'project-1',
          budget: 500,
          skills: ['TypeScript', 'Fastify']
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.title).toBe('新任务测试')
      expect(response.body.data.description).toBe('这是一个测试任务')
      expect(response.body.data.status).toBe('OPEN')
      expect(response.body.data.budget).toBe(500)
      expect(response.body.data.projectId).toBe('project-1')
      expect(response.body.data.skills).toContain('TypeScript')
      expect(response.body.data.skills).toContain('Fastify')
      expect(response.body.data.assigneeName).toBe(null)
    })

    it('应该验证必填字段 - 标题为空', async () => {
      const response = await supertest(server)
        .post('/api/v1/tasks')
        .send({
          description: '任务描述',
          projectId: 'project-1'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('标题')
    })

    it('应该验证必填字段 - 描述为空', async () => {
      const response = await supertest(server)
        .post('/api/v1/tasks')
        .send({
          title: '任务标题',
          projectId: 'project-1'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('描述')
    })

    it('应该验证必填字段 - 项目ID为空', async () => {
      const response = await supertest(server)
        .post('/api/v1/tasks')
        .send({
          title: '任务标题',
          description: '任务描述'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('项目ID')
    })

    it('应该验证预算不能为负数', async () => {
      const response = await supertest(server)
        .post('/api/v1/tasks')
        .send({
          title: '任务标题',
          description: '任务描述',
          projectId: 'project-1',
          budget: -100
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('预算')
    })

    it('应该支持可选字段 - deadline', async () => {
      const response = await supertest(server)
        .post('/api/v1/tasks')
        .send({
          title: '带截止日期的任务',
          description: '这是一个有截止日期的任务',
          projectId: 'project-1',
          deadline: '2026-12-31T23:59:59Z'
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.deadline).toContain('2026-12-31')
    })

    it('应该支持空技能列表', async () => {
      const response = await supertest(server)
        .post('/api/v1/tasks')
        .send({
          title: '无技能要求的任务',
          description: '这是一个没有技能要求的任务',
          projectId: 'project-1',
          skills: []
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.skills).toEqual([])
    })

    it('应该使用默认值 - budget=0', async () => {
      const response = await supertest(server)
        .post('/api/v1/tasks')
        .send({
          title: '免费任务',
          description: '这是一个免费任务',
          projectId: 'project-1'
        })
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.budget).toBe(0)
    })
  })

  /**
   * PUT /api/v1/tasks/:id 更新任务 API 测试
   */
  describe('PUT /api/v1/tasks/:id', () => {
    it('应该成功更新任务标题', async () => {
      const response = await supertest(server)
        .put('/api/v1/tasks/task-1')
        .send({
          title: '更新后的任务标题'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe('更新后的任务标题')
      expect(response.body.data.status).toBe('OPEN')
    })

    it('应该成功更新任务描述', async () => {
      const response = await supertest(server)
        .put('/api/v1/tasks/task-1')
        .send({
          description: '更新后的任务描述'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.description).toBe('更新后的任务描述')
    })

    it('应该成功更新任务预算', async () => {
      const response = await supertest(server)
        .put('/api/v1/tasks/task-1')
        .send({
          budget: 1000
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.budget).toBe(1000)
    })

    it('应该成功更新任务技能列表', async () => {
      const response = await supertest(server)
        .put('/api/v1/tasks/task-1')
        .send({
          skills: ['Vue.js', 'Node.js']
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.skills).toEqual(['Vue.js', 'Node.js'])
    })

    it('应该成功更新任务截止日期', async () => {
      const response = await supertest(server)
        .put('/api/v1/tasks/task-1')
        .send({
          deadline: '2026-03-31T23:59:59Z'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.deadline).toContain('2026-03-31')
    })

    it('应该支持批量更新多个字段', async () => {
      const response = await supertest(server)
        .put('/api/v1/tasks/task-1')
        .send({
          title: '批量更新任务',
          description: '这是批量更新的描述',
          budget: 1500,
          skills: ['Python', 'FastAPI', 'PostgreSQL']
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe('批量更新任务')
      expect(response.body.data.description).toBe('这是批量更新的描述')
      expect(response.body.data.budget).toBe(1500)
      expect(response.body.data.skills).toEqual(['Python', 'FastAPI', 'PostgreSQL'])
    })

    it('应该验证预算不能为负数', async () => {
      const response = await supertest(server)
        .put('/api/v1/tasks/task-1')
        .send({
          budget: -100
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('预算')
    })

    it('应该验证截止日期格式无效', async () => {
      const response = await supertest(server)
        .put('/api/v1/tasks/task-1')
        .send({
          deadline: 'invalid-date'
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('截止日期')
    })

    it('应该返回404当任务不存在', async () => {
      const response = await supertest(server)
        .put('/api/v1/tasks/invalid-id')
        .send({
          title: '不存在的任务'
        })
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('不存在')
    })

    it('更新后应该返回完整的任务信息', async () => {
      const response = await supertest(server)
        .put('/api/v1/tasks/task-1')
        .send({
          title: '完整更新测试'
        })
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data).toHaveProperty('title')
      expect(response.body.data).toHaveProperty('description')
      expect(response.body.data).toHaveProperty('status')
      expect(response.body.data).toHaveProperty('budget')
      expect(response.body.data).toHaveProperty('projectId')
      expect(response.body.data).toHaveProperty('projectTitle')
      expect(response.body.data).toHaveProperty('assigneeName')
      expect(response.body.data).toHaveProperty('skills')
      expect(response.body.data).toHaveProperty('deadline')
      expect(response.body.data).toHaveProperty('createdAt')
      expect(response.body.data).toHaveProperty('updatedAt')
    })

    it('不更新任何字段应该返回原数据', async () => {
      const response = await supertest(server)
        .put('/api/v1/tasks/task-1')
        .send({})
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.title).toBe('实现用户认证模块')
      expect(response.body.data.budget).toBe(500)
    })
  })
})
