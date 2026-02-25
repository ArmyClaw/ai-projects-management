import { FastifyInstance } from 'fastify'
import { prisma } from '../prisma-client.js'

/**
 * 任务列表响应类型
 */
interface TaskListResponse {
  success: boolean
  data: {
    tasks: TaskListItem[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * 任务列表项
 */
interface TaskListItem {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'CLAIMED' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'
  budget: number
  projectId: string
  projectTitle: string
  assigneeName: string | null
  requiredSkills: string[]
  dueAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * 获取任务列表
 * GET /api/v1/tasks
 * 
 * 查询参数：
 * - page: 页码（默认 1）
 * - pageSize: 每页数量（默认 10，最大 100）
 * - status: 任务状态筛选（可选）
 * - projectId: 项目ID筛选（可选）
 * - assigneeId: 负责人ID筛选（可选）
 */
export async function getTasksRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Querystring: {
      page?: string
      pageSize?: string
      status?: string
      projectId?: string
      assigneeId?: string
    }
  }>('/api/v1/tasks', {
    schema: {
      description: '获取任务列表',
      tags: ['tasks'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', description: '页码', default: '1' },
          pageSize: { type: 'string', description: '每页数量', default: '10' },
          status: { type: 'string', description: '任务状态筛选' },
          projectId: { type: 'string', description: '项目ID筛选' },
          assigneeId: { type: 'string', description: '负责人ID筛选' }
        }
      },
      response: {
        200: {
          description: '成功返回任务列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                tasks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      status: { type: 'string' },
                      budget: { type: 'number' },
                      projectId: { type: 'string' },
                      projectTitle: { type: 'string' },
                      assigneeName: { type: ['string', 'null'] },
                      requiredSkills: { type: 'array', items: { type: 'string' } },
                      dueAt: { type: ['string', 'null'] },
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
      const projectId = request.query.projectId
      const assigneeId = request.query.assigneeId

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
      if (projectId) {
        where.projectId = projectId
      }
      if (assigneeId) {
        where.assigneeId = assigneeId
      }

      // 查询总数
      const total = await prisma.task.count({ where })

      // 查询任务列表
      const tasks = await prisma.task.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          project: {
            select: {
              id: true,
              title: true
            }
          },
          assignee: {
            select: {
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // 格式化响应数据
      const formattedTasks: TaskListItem[] = tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        budget: task.budget,
        projectId: task.project.id,
        projectTitle: task.project.title,
        assigneeName: task.assignee?.name || null,
        requiredSkills: task.requiredSkills || [],
        dueAt: task.dueAt?.toISOString() || null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString()
      }))

      // 计算总页数
      const totalPages = Math.ceil(total / pageSize)

      // 返回响应
      const response: TaskListResponse = {
        success: true,
        data: {
          tasks: formattedTasks,
          total,
          page,
          pageSize,
          totalPages
        }
      }

      return reply.status(200).send(response)
    } catch (error) {
      fastify.log.error('获取任务列表失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 获取单个任务详情
 * GET /api/v1/tasks/:id
 */
export async function getTaskDetailRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Params: {
      id: string
    }
  }>('/api/v1/tasks/:id', {
    schema: {
      description: '获取单个任务详情',
      tags: ['tasks'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '任务ID' }
        }
      },
      response: {
        200: {
          description: '成功返回任务详情',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                budget: { type: 'number' },
                project: { type: 'object' },
                assignee: { type: ['object', 'null'] },
                requiredSkills: { type: 'array', items: { type: 'string' } },
                reviews: { type: 'array' },
                dueAt: { type: ['string', 'null'] },
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
      const { id } = request.params

      // 查询任务详情
      const task = await prisma.task.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              title: true,
              description: true,
              budget: true,
              mode: true
            }
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reviews: {
            select: {
              id: true,
              result: true,
              comment: true,
              createdAt: true
            }
          }
        }
      })

      if (!task) {
        return reply.status(404).send({
          success: false,
          error: '任务不存在'
        })
      }

      // 格式化响应数据
      const response = {
        success: true,
        data: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          budget: task.budget,
          project: task.project,
          assignee: task.assignee ? {
            id: task.assignee.id,
            name: task.assignee.name
          } : null,
          requiredSkills: task.requiredSkills || [],
          reviews: task.reviews.map(r => ({
            id: r.id,
            status: r.result,
            comment: r.comment,
            createdAt: r.createdAt.toISOString()
          })),
          dueAt: task.dueAt?.toISOString() || null,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString()
        }
      }

      return reply.status(200).send(response)
    } catch (error) {
      fastify.log.error('获取任务详情失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 创建任务请求体类型
 */
interface CreateTaskBody {
  title: string
  description: string
  projectId: string
  budget?: number
  skills?: string[]
  requiredSkills?: string[]
  deadline?: string
  dueAt?: string
}

/**
 * 创建任务响应类型
 */
interface CreateTaskResponse {
  success: boolean
  data: {
    id: string
    title: string
    description: string
    status: 'OPEN' | 'CLAIMED' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'
    budget: number
    projectId: string
    projectTitle: string
    assigneeName: string | null
    requiredSkills: string[]
    dueAt: string | null
    createdAt: string
    updatedAt: string
  }
}

/**
 * 创建任务
 * POST /api/v1/tasks
 * 
 * 请求体：
 * - title: 任务标题（必填）
 * - description: 任务描述（必填）
 * - projectId: 项目ID（必填）
 * - budget: 任务预算（可选，默认 0）
 * - requiredSkills: 技能列表（可选）
 * - skills: 技能列表（兼容字段）
 * - dueAt: 截止日期（可选，ISO 8601格式）
 * - deadline: 截止日期（兼容字段）
 */
export async function createTaskRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post<{
    Body: CreateTaskBody
  }>('/api/v1/tasks', {
    schema: {
      description: '创建新任务',
      tags: ['tasks'],
      body: {
        type: 'object',
        required: ['title', 'description', 'projectId'],
        properties: {
          title: { type: 'string', description: '任务标题' },
          description: { type: 'string', description: '任务描述' },
          projectId: { type: 'string', description: '项目ID' },
          budget: { type: 'number', description: '任务预算' },
          requiredSkills: { type: 'array', items: { type: 'string' }, description: '技能列表' },
          skills: { type: 'array', items: { type: 'string' }, description: '技能列表（兼容字段）' },
          dueAt: { type: 'string', description: '截止日期（ISO 8601格式）' },
          deadline: { type: 'string', description: '截止日期（兼容字段）' }
        }
      },
      response: {
        201: {
          description: '任务创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string' },
                budget: { type: 'number' },
                projectId: { type: 'string' },
                projectTitle: { type: 'string' },
                assigneeName: { type: ['string', 'null'] },
                requiredSkills: { type: 'array', items: { type: 'string' } },
                dueAt: { type: ['string', 'null'] },
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
      const { title, description, projectId, budget = 0, skills, requiredSkills, deadline, dueAt } = request.body
      const finalSkills = requiredSkills ?? skills ?? []
      const finalDueAt = dueAt ?? deadline

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

      // 验证 budget 字段
      if (budget < 0) {
        return reply.status(400).send({
          success: false,
          error: '预算金额不能为负数'
        })
      }

      // 验证 deadline 格式（如果提供）
      if (finalDueAt) {
        const deadlineDate = new Date(finalDueAt)
        if (isNaN(deadlineDate.getTime())) {
          return reply.status(400).send({
            success: false,
            error: '截止日期格式无效，请使用 ISO 8601 格式'
          })
        }
      }

      const project = await prisma.project.findUnique({ where: { id: projectId } })
      if (!project) {
        return reply.status(404).send({
          success: false,
          error: '项目不存在'
        })
      }

      const task = await prisma.task.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          status: 'OPEN',
          budget,
          projectId: projectId.trim(),
          requiredSkills: finalSkills,
          dueAt: finalDueAt ? new Date(finalDueAt) : null
        }
      })

      // 格式化响应数据
      const formattedTask: CreateTaskResponse['data'] = {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        budget: task.budget,
        projectId: task.projectId,
        projectTitle: project.title,
        assigneeName: null,
        requiredSkills: task.requiredSkills || [],
        dueAt: task.dueAt?.toISOString() || null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString()
      }

      // 返回响应
      return reply.status(201).send({
        success: true,
        data: formattedTask
      })
    } catch (error) {
      fastify.log.error('创建任务失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 更新任务请求体类型
 */
interface UpdateTaskBody {
  title?: string
  description?: string
  budget?: number
  skills?: string[]
  requiredSkills?: string[]
  deadline?: string
  dueAt?: string
}

/**
 * 更新任务响应类型
 */
interface UpdateTaskResponse {
  success: boolean
  data: {
    id: string
    title: string
    description: string
    status: 'OPEN' | 'CLAIMED' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED'
    budget: number
    projectId: string
    projectTitle: string
    assigneeName: string | null
    requiredSkills: string[]
    dueAt: string | null
    createdAt: string
    updatedAt: string
  }
}

/**
 * 更新任务
 * PUT /api/v1/tasks/:id
 * 
 * 请求体（均为可选字段）：
 * - title: 任务标题
 * - description: 任务描述
 * - budget: 任务预算
 * - requiredSkills: 技能列表
 * - skills: 技能列表（兼容字段）
 * - dueAt: 截止日期（ISO 8601格式）
 * - deadline: 截止日期（兼容字段）
 */
export async function updateTaskRoute(fastify: FastifyInstance): Promise<void> {
  fastify.put<{
    Params: {
      id: string
    }
    Body: UpdateTaskBody
  }>('/api/v1/tasks/:id', async (request, reply) => {
    try {
      const { id } = request.params
      const { title, description, budget, skills, requiredSkills, deadline, dueAt } = request.body
      const finalSkills = requiredSkills ?? skills
      const finalDueAt = dueAt ?? deadline

      // 验证 budget 字段（如果提供）
      if (budget !== undefined && budget < 0) {
        return reply.status(400).send({
          success: false,
          error: '预算金额不能为负数'
        })
      }

      // 验证 deadline 格式（如果提供）
      if (finalDueAt) {
        const deadlineDate = new Date(finalDueAt)
        if (isNaN(deadlineDate.getTime())) {
          return reply.status(400).send({
            success: false,
            error: '截止日期格式无效，请使用 ISO 8601 格式'
          })
        }
      }

      // 验证 title 格式（如果提供）
      if (title !== undefined && title.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          error: '任务标题不能为空'
        })
      }

      // 验证 description 格式（如果提供）
      if (description !== undefined && description.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          error: '任务描述不能为空'
        })
      }

      const existing = await prisma.task.findUnique({ where: { id } })
      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: '任务不存在'
        })
      }

      const updatedTask = await prisma.task.update({
        where: { id },
        data: {
          title: title?.trim() ?? undefined,
          description: description?.trim() ?? undefined,
          budget: budget ?? undefined,
          requiredSkills: finalSkills ?? undefined,
          dueAt: finalDueAt ? new Date(finalDueAt) : undefined
        },
        include: {
          project: { select: { title: true } }
        }
      })

      // 格式化响应数据
      const formattedTask: UpdateTaskResponse['data'] = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        budget: updatedTask.budget,
        projectId: updatedTask.projectId,
        projectTitle: updatedTask.project.title,
        assigneeName: null,
        requiredSkills: updatedTask.requiredSkills || [],
        dueAt: updatedTask.dueAt?.toISOString() || null,
        createdAt: updatedTask.createdAt.toISOString(),
        updatedAt: updatedTask.updatedAt.toISOString()
      }

      // 返回响应
      return reply.status(200).send({
        success: true,
        data: formattedTask
      })
    } catch (error) {
      fastify.log.error('更新任务失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 删除任务
 * DELETE /api/v1/tasks/:id
 * 
 * 路径参数：
 * - id: 任务ID
 * 
 * 响应：
 * - 204 No Content: 删除成功
 * - 404 Not Found: 任务不存在
 * - 500 Internal Server Error: 服务器错误
 */
export async function deleteTaskRoute(fastify: FastifyInstance): Promise<void> {
  fastify.delete<{
    Params: {
      id: string
    }
  }>('/api/v1/tasks/:id', async (request, reply) => {
    try {
      const { id } = request.params

      const existing = await prisma.task.findUnique({ where: { id } })
      if (!existing) {
        return reply.status(404).send({
          success: false,
          error: '任务不存在'
        })
      }

      await prisma.task.delete({ where: { id } })
      return reply.status(204).send()
    } catch (error) {
      fastify.log.error('删除任务失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

export default { getTasksRoute, getTaskDetailRoute, createTaskRoute, updateTaskRoute, deleteTaskRoute }
