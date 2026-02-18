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
  }>('/api/v1/projects', async (request, reply) => {
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
  }>('/api/v1/projects', async (request, reply) => {
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

export { getProjectsRoute, createProjectRoute }
