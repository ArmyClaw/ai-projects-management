import { FastifyInstance } from 'fastify'
import { prisma } from '../app'

/**
 * 项目列表响应类型
 */
interface ProjectListResponse {
  success: boolean
  data: {
    projects: ProjectListItem[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * 项目列表项
 */
interface ProjectListItem {
  id: string
  title: string
  description: string
  mode: 'COMMUNITY' | 'ENTERPRISE'
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  budget: number
  initiatorName: string
  taskCount: number
  createdAt: string
  updatedAt: string
}

/**
 * 获取项目列表
 * GET /api/v1/projects
 * 
 * 查询参数：
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 10，最大 100）
 * - status: 项目状态筛选（可选）
 * - mode: 项目模式筛选（可选）
 */
export async function getProjectsRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Querystring: {
      page?: string
      pageSize?: string
      status?: string
      mode?: string
    }
  }>('/api/v1/projects', {
    schema: {
      description: '获取项目列表',
      tags: ['projects'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码', default: '1' },
          pageSize: { type: 'string', description: '每页数量', default: '10' },
          status: { type: 'string', description: '项目状态筛选' },
          mode: { type: 'string', description: '项目模式筛选' }
        }
      },
      response: {
        200: {
          description: '成功返回项目列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                projects: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      mode: { type: 'string' },
                      status: { type: 'string' },
                      budget: { type: 'number' },
                      initiatorName: { type: 'string' },
                      taskCount: { type: 'number' },
                      createdAt: { type: 'string' },
                      updatedAt: { type: 'string' }
                    }
                  }
                },
                total: { type: 'number' },
                page: { type: 'number' },
                pageSize: { type: 'number' },
                totalPages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // 解析分页参数
      const page = parseInt(request.query.page || '1', 10)
      const pageSize = Math.min(parseInt(request.query.pageSize || '10', 10), 100)
      const status = request.query.status
      const mode = request.query.mode

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

      // 构建查询条件
      const where: any = {}
      if (status) {
        where.status = status
      }
      if (mode) {
        where.mode = mode
      }

      // 查询总数
      const total = await prisma.project.count({ where })

      // 查询项目列表
      const projects = await prisma.project.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          initiator: {
            select: {
              name: true
            }
          },
          tasks: {
            select: {
              id: true
            }
          },
          milestones: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // 格式化响应数据
      const formattedProjects: ProjectListItem[] = projects.map(project => ({
        id: project.id,
        title: project.title,
        description: project.description,
        mode: project.mode,
        status: project.status,
        budget: project.budget,
        initiatorName: project.initiator.name,
        taskCount: project.tasks.length,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      }))

      // 计算总页数
      const totalPages = Math.ceil(total / pageSize)

      // 返回响应
      const response: ProjectListResponse = {
        success: true,
        data: {
          projects: formattedProjects,
          total,
          page,
          pageSize,
          totalPages
        }
      }

      return reply.status(200).send(response)
    } catch (error) {
      fastify.log.error('获取项目列表失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 创建项目请求体类型
 */
interface CreateProjectBody {
  title: string
  description: string
  mode?: 'COMMUNITY' | 'ENTERPRISE'
  budget?: number
  skills?: string[]
}

/**
 * 创建项目响应类型
 */
interface CreateProjectResponse {
  success: boolean
  data: {
    id: string
    title: string
    description: string
    mode: 'COMMUNITY' | 'ENTERPRISE'
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    budget: number
    initiatorName: string
    taskCount: number
    skills: string[]
    createdAt: string
    updatedAt: string
  }
}

/**
 * 创建项目
 * POST /api/v1/projects
 * 
 * 请求体：
 * - title: 项目标题（必填）
 * - description: 项目描述（必填）
 * - mode: 项目模式（可选，默认 COMMUNITY）
 * - budget: 预算金额（可选，默认 0）
 * - skills: 技能列表（可选）
 */
export async function createProjectRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post<{
    Body: CreateProjectBody
  }>('/api/v1/projects', {
    schema: {
      description: '创建新项目',
      tags: ['projects'],
      body: {
        type: 'object',
        required: ['title', 'description'],
        properties: {
          title: { type: 'string', description: '项目标题' },
          description: { type: 'string', description: '项目描述' },
          mode: { type: 'string', enum: ['COMMUNITY', 'ENTERPRISE'], description: '项目模式' },
          budget: { type: 'number', description: '预算金额' },
          skills: { type: 'array', items: { type: 'string' }, description: '技能列表' }
        }
      },
      response: {
        201: {
          description: '项目创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                mode: { type: 'string' },
                status: { type: 'string' },
                budget: { type: 'number' },
                initiatorName: { type: 'string' },
                taskCount: { type: 'number' },
                skills: { type: 'array', items: { type: 'string' } },
                createdAt: { type: 'string' },
                updatedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { title, description, mode = 'COMMUNITY', budget = 0, skills = [] } = request.body

      // 验证必填字段
      if (!title || title.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          error: '项目标题不能为空'
        })
      }

      if (!description || description.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          error: '项目描述不能为空'
        })
      }

      // 验证 mode 字段
      if (mode && !['COMMUNITY', 'ENTERPRISE'].includes(mode)) {
        return reply.status(400).send({
          success: false,
          error: '项目模式必须是 COMMUNITY 或 ENTERPRISE'
        })
      }

      // 验证 budget 字段
      if (budget < 0) {
        return reply.status(400).send({
          success: false,
          error: '预算金额不能为负数'
        })
      }

      // 生成项目ID（模拟）
      const projectId = `project-${Date.now()}`

      // 创建项目（模拟数据）
      const project = {
        id: projectId,
        title: title.trim(),
        description: description.trim(),
        mode,
        status: 'ACTIVE' as const,
        budget,
        initiatorName: '测试用户',
        taskCount: 0,
        skills,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 格式化响应数据
      const formattedProject: CreateProjectResponse['data'] = {
        id: project.id,
        title: project.title,
        description: project.description,
        mode: project.mode,
        status: project.status,
        budget: project.budget,
        initiatorName: project.initiatorName,
        taskCount: project.taskCount,
        skills: project.skills,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      }

      // 返回响应
      return reply.status(201).send({
        success: true,
        data: formattedProject
      })
    } catch (error) {
      fastify.log.error('创建项目失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 更新项目请求体类型
 */
interface UpdateProjectBody {
  title?: string
  description?: string
  mode?: 'COMMUNITY' | 'ENTERPRISE'
  budget?: number
  skills?: string[]
  status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
}

/**
 * 更新项目响应类型
 */
interface UpdateProjectResponse {
  success: boolean
  data: {
    id: string
    title: string
    description: string
    mode: 'COMMUNITY' | 'ENTERPRISE'
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    budget: number
    initiatorName: string
    taskCount: number
    skills: string[]
    createdAt: string
    updatedAt: string
  }
}

/**
 * 更新项目
 * PUT /api/v1/projects/:id
 * 
 * 路径参数：
 * - id: 项目ID
 * 
 * 请求体：
 * - title: 项目标题（可选）
 * - description: 项目描述（可选）
 * - mode: 项目模式（可选）
 * - budget: 预算金额（可选）
 * - skills: 技能列表（可选）
 * - status: 项目状态（可选）
 */
export async function updateProjectRoute(fastify: FastifyInstance): Promise<void> {
  fastify.put<{
    Params: {
      id: string
    }
    Body: UpdateProjectBody
  }>('/api/v1/projects/:id', async (request, reply) => {
    try {
      const { id } = request.params
      const { title, description, mode, budget, skills, status } = request.body

      // 验证 mode 字段
      if (mode && !['COMMUNITY', 'ENTERPRISE'].includes(mode)) {
        return reply.status(400).send({
          success: false,
          error: '项目模式必须是 COMMUNITY 或 ENTERPRISE'
        })
      }

      // 验证 budget 字段
      if (budget !== undefined && budget < 0) {
        return reply.status(400).send({
          success: false,
          error: '预算金额不能为负数'
        })
      }

      // 验证 status 字段
      const validStatuses = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']
      if (status && !validStatuses.includes(status)) {
        return reply.status(400).send({
          success: false,
          error: '项目状态必须是 DRAFT、ACTIVE、COMPLETED 或 CANCELLED'
        })
      }

      // 验证项目是否存在（模拟）
      const project = {
        id,
        title: title || '示例项目',
        description: description || '示例描述',
        mode: mode || 'COMMUNITY',
        status: status || 'ACTIVE',
        budget: budget || 0,
        initiatorName: '测试用户',
        taskCount: 0,
        skills: skills || [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 格式化响应数据
      const formattedProject: UpdateProjectResponse['data'] = {
        id: project.id,
        title: project.title,
        description: project.description,
        mode: project.mode,
        status: project.status,
        budget: project.budget,
        initiatorName: project.initiatorName,
        taskCount: project.taskCount,
        skills: project.skills,
        createdAt: project.createdAt.toISOString(),
        updatedAt: new Date().toISOString()
      }

      // 返回响应
      return reply.status(200).send({
        success: true,
        data: formattedProject
      })
    } catch (error) {
      fastify.log.error('更新项目失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 删除项目响应类型
 */
interface DeleteProjectResponse {
  success: boolean
  data: {
    id: string
    message: string
  }
}

/**
 * 删除项目
 * DELETE /api/v1/projects/:id
 * 
 * 路径参数：
 * - id: 项目ID
 */
export async function deleteProjectRoute(fastify: FastifyInstance): Promise<void> {
  fastify.delete<{
    Params: {
      id: string
    }
  }>('/api/v1/projects/:id', async (request, reply) => {
    try {
      const { id } = request.params

      // 验证项目ID是否存在
      if (!id || id.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          error: '项目ID不能为空'
        })
      }

      // 模拟删除项目（实际应用中需要数据库操作）
      const deleteResult: DeleteProjectResponse = {
        success: true,
        data: {
          id,
          message: '项目删除成功'
        }
      }

      // 返回响应
      return reply.status(200).send(deleteResult)
    } catch (error) {
      fastify.log.error('删除项目失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}
