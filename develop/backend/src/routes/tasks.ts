import { FastifyInstance } from 'fastify'
import { prisma } from '../app'

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
  status: 'OPEN' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  budget: number
  projectId: string
  projectTitle: string
  assigneeName: string | null
  skills: string[]
  deadline: string | null
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
  }>('/api/v1/tasks', async (request, reply) => {
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
          },
          skills: {
            select: {
              skillId: true
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
        skills: task.skills.map(s => s.skillId),
        deadline: task.deadline?.toISOString() || null,
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
  }>('/api/v1/tasks/:id', async (request, reply) => {
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
          skills: {
            select: {
              skillId: true,
              description: true
            }
          },
          reviews: {
            select: {
              id: true,
              status: true,
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
          skills: task.skills.map(s => s.skillId),
          reviews: task.reviews.map(r => ({
            id: r.id,
            status: r.status,
            comment: r.comment,
            createdAt: r.createdAt.toISOString()
          })),
          deadline: task.deadline?.toISOString() || null,
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
  deadline?: string
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
    status: 'OPEN' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
    budget: number
    projectId: string
    projectTitle: string
    assigneeName: string | null
    skills: string[]
    deadline: string | null
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
 * - skills: 技能列表（可选）
 * - deadline: 截止日期（可选，ISO 8601格式）
 */
export async function createTaskRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post<{
    Body: CreateTaskBody
  }>('/api/v1/tasks', async (request, reply) => {
    try {
      const { title, description, projectId, budget = 0, skills = [], deadline } = request.body

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
      if (deadline) {
        const deadlineDate = new Date(deadline)
        if (isNaN(deadlineDate.getTime())) {
          return reply.status(400).send({
            success: false,
            error: '截止日期格式无效，请使用 ISO 8601 格式'
          })
        }
      }

      // 生成任务ID（模拟）
      const taskId = `task-${Date.now()}`

      // 创建任务（模拟数据）
      const task = {
        id: taskId,
        title: title.trim(),
        description: description.trim(),
        status: 'OPEN' as const,
        budget,
        projectId: projectId.trim(),
        projectTitle: '示例项目',
        assigneeName: null as const,
        skills: skills || [],
        deadline: deadline ? new Date(deadline).toISOString() : null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // 格式化响应数据
      const formattedTask: CreateTaskResponse['data'] = {
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
  status?: 'OPEN' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  budget?: number
  skills?: string[]
  deadline?: string
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
    status: 'OPEN' | 'IN_PROGRESS' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
    budget: number
    projectId: string
    projectTitle: string
    assigneeName: string | null
    skills: string[]
    deadline: string | null
    createdAt: string
    updatedAt: string
  }
}

/**
 * 更新任务
 * PUT /api/v1/tasks/:id
 * 
 * 请求体（全部可选，支持部分更新）：
 * - title: 任务标题（可选）
 * - description: 任务描述（可选）
 * - status: 任务状态（可选）
 * - budget: 任务预算（可选）
 * - skills: 技能列表（可选）
 * - deadline: 截止日期（可选，ISO 8601格式）
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
      const { title, description, status, budget, skills, deadline } = request.body

      // 验证 budget 字段
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

      // 验证状态值
      const validStatuses = ['OPEN', 'IN_PROGRESS', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CANCELLED']
      if (status && !validStatuses.includes(status)) {
        return reply.status(400).send({
          success: false,
          error: '无效的任务状态'
        })
      }

      // 验证标题长度（如果提供）
      if (title !== undefined && title.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          error: '任务标题不能为空'
        })
      }

      // 验证描述长度（如果提供）
      if (description !== undefined && description.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          error: '任务描述不能为空'
        })
      }

      // 查找任务（模拟数据）
      const taskId = id
      const taskExists = true // 模拟任务存在

      if (!taskExists) {
        return reply.status(404).send({
          success: false,
          error: '任务不存在'
        })
      }

      // 构建更新数据
      const updateData: any = {}
      if (title !== undefined) updateData.title = title.trim()
      if (description !== undefined) updateData.description = description.trim()
      if (status !== undefined) updateData.status = status
      if (budget !== undefined) updateData.budget = budget
      if (skills !== undefined) updateData.skills = skills
      if (deadline !== undefined) updateData.deadline = new Date(deadline)
      updateData.updatedAt = new Date()

      // 模拟更新后的任务数据
      const updatedTask = {
        id: taskId,
        title: updateData.title || '原任务标题',
        description: updateData.description || '原任务描述',
        status: updateData.status || 'OPEN',
        budget: updateData.budget || 0,
        projectId: 'project-1',
        projectTitle: 'AI代码审查工具',
        assigneeName: null,
        skills: updateData.skills || [],
        deadline: updateData.deadline?.toISOString() || null,
        createdAt: new Date(),
        updatedAt: updateData.updatedAt
      }

      // 格式化响应数据
      const formattedTask: UpdateTaskResponse['data'] = {
        id: updatedTask.id,
        title: updatedTask.title,
        description: updatedTask.description,
        status: updatedTask.status,
        budget: updatedTask.budget,
        projectId: updatedTask.projectId,
        projectTitle: updatedTask.projectTitle,
        assigneeName: updatedTask.assigneeName,
        skills: updatedTask.skills,
        deadline: updatedTask.deadline,
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
 * 删除任务响应类型
 */
interface DeleteTaskResponse {
  success: boolean
  data: {
    id: string
    title: string
    message: string
  }
}

/**
 * 删除任务
 * DELETE /api/v1/tasks/:id
 * 
 * 路径参数：
 * - id: 任务ID（必填）
 * 
 * 返回：
 * - 200: 删除成功
 * - 404: 任务不存在
 * - 500: 服务器内部错误
 */
export async function deleteTaskRoute(fastify: FastifyInstance): Promise<void> {
  fastify.delete<{
    Params: {
      id: string
    }
  }>('/api/v1/tasks/:id', async (request, reply) => {
    try {
      const { id } = request.params

      // 模拟查找任务
      const taskId = id
      const taskExists = true // 模拟任务存在

      // 任务不存在
      if (!taskExists) {
        return reply.status(404).send({
          success: false,
          error: '任务不存在'
        })
      }

      // 模拟删除成功
      const deletedTask = {
        id: taskId,
        title: '已删除任务',
        message: '任务删除成功'
      }

      // 返回响应
      const response: DeleteTaskResponse = {
        success: true,
        data: {
          id: deletedTask.id,
          title: deletedTask.title,
          message: deletedTask.message
        }
      }

      return reply.status(200).send(response)
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
