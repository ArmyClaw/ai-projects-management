/**
 * 报表分析 API 路由
 * 
 * 提供项目进度、甘特图、里程碑、个人贡献、财务、数据看板等功能
 */

import { FastifyInstance } from 'fastify'
import { prisma } from '../app'

/**
 * 获取项目进度
 * GET /api/v1/projects/:id/progress
 */
export async function getProjectProgressRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Params: {
      id: string
    }
  }>('/api/v1/projects/:id/progress', {
    schema: {
      description: '获取项目进度',
      tags: ['analytics'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '项目ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                status: { type: 'string' },
                totalTasks: { type: 'number' },
                completedTasks: { type: 'number' },
                progressPercentage: { type: 'number' },
                totalMilestones: { type: 'number' },
                completedMilestones: { type: 'number' },
                startDate: { type: ['string', 'null'] },
                endDate: { type: ['string', 'null'] },
                daysRemaining: { type: ['number', 'null'] }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params

      // 获取项目信息
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          tasks: true,
          milestones: true
        }
      })

      if (!project) {
        return reply.status(404).send({
          success: false,
          error: '项目不存在'
        })
      }

      // 计算进度
      const totalTasks = project.tasks.length
      const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      const totalMilestones = project.milestones.length
      const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED').length

      // 计算剩余天数
      let daysRemaining: number | null = null
      if (project.endDate) {
        const endDate = new Date(project.endDate)
        const now = new Date()
        const diffTime = endDate.getTime() - now.getTime()
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      return reply.status(200).send({
        success: true,
        data: {
          id: project.id,
          title: project.title,
          status: project.status,
          totalTasks,
          completedTasks,
          progressPercentage,
          totalMilestones,
          completedMilestones,
          startDate: project.startDate?.toISOString() || null,
          endDate: project.endDate?.toISOString() || null,
          daysRemaining
        }
      })
    } catch (error) {
      fastify.log.error('获取项目进度失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 获取甘特图数据
 * GET /api/v1/projects/:id/gantt
 */
export async function getProjectGanttRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Params: {
      id: string
    }
  }>('/api/v1/projects/:id/gantt', {
    schema: {
      description: '获取项目甘特图数据',
      tags: ['analytics'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '项目ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                projectId: { type: 'string' },
                projectName: { type: 'string' },
                tasks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      startDate: { type: 'string' },
                      endDate: { type: 'string' },
                      status: { type: 'string' },
                      progress: { type: 'number' },
                      dependencies: { type: 'array', items: { type: 'string' } }
                    }
                  }
                },
                milestones: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      dueDate: { type: 'string' },
                      status: { type: 'string' }
                    }
                  }
                },
                startDate: { type: 'string' },
                endDate: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params

      // 获取项目及任务、里程碑
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          tasks: {
            orderBy: { startDate: 'asc' }
          },
          milestones: {
            orderBy: { dueDate: 'asc' }
          }
        }
      })

      if (!project) {
        return reply.status(404).send({
          success: false,
          error: '项目不存在'
        })
      }

      // 格式化任务数据
      const tasks = project.tasks.map(task => ({
        id: task.id,
        name: task.title,
        startDate: task.startDate?.toISOString() || new Date().toISOString(),
        endDate: task.endDate?.toISOString() || new Date().toISOString(),
        status: task.status,
        progress: task.status === 'COMPLETED' ? 100 : (task.status === 'IN_PROGRESS' ? 50 : 0),
        dependencies: [] // 可以从任务关系表中获取
      }))

      // 格式化里程碑数据
      const milestones = project.milestones.map(m => ({
        id: m.id,
        name: m.name,
        dueDate: m.dueDate.toISOString(),
        status: m.status
      }))

      // 计算项目时间范围
      const allDates = [
        ...tasks.map(t => new Date(t.startDate).getTime()),
        ...tasks.map(t => new Date(t.endDate).getTime())
      ]
      const startDate = allDates.length > 0 
        ? new Date(Math.min(...allDates)).toISOString() 
        : new Date().toISOString()
      const endDate = allDates.length > 0 
        ? new Date(Math.max(...allDates)).toISOString() 
        : new Date().toISOString()

      return reply.status(200).send({
        success: true,
        data: {
          projectId: project.id,
          projectName: project.title,
          tasks,
          milestones,
          startDate,
          endDate
        }
      })
    } catch (error) {
      fastify.log.error('获取甘特图数据失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 获取里程碑列表
 * GET /api/v1/projects/:id/milestones
 */
export async function getProjectMilestonesRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Params: {
      id: string
    }
    Querystring: {
      status?: string
    }
  }>('/api/v1/projects/:id/milestones', {
    schema: {
      description: '获取项目里程碑列表',
      tags: ['analytics'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '项目ID' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'OVERDUE'] }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  dueDate: { type: 'string' },
                  status: { type: 'string' },
                  completedAt: { type: ['string', 'null'] }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const { status } = request.query

      // 构建查询条件
      const where: any = { projectId: id }
      if (status) {
        where.status = status
      }

      const milestones = await prisma.milestone.findMany({
        where,
        orderBy: { dueDate: 'asc' }
      })

      return reply.status(200).send({
        success: true,
        data: milestones.map(m => ({
          id: m.id,
          name: m.name,
          description: m.description,
          dueDate: m.dueDate.toISOString(),
          status: m.status,
          completedAt: m.completedAt?.toISOString() || null
        }))
      })
    } catch (error) {
      fastify.log.error('获取里程碑列表失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 创建里程碑
 * POST /api/v1/projects/:id/milestones
 */
export async function createProjectMilestoneRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post<{
    Params: {
      id: string
    }
    Body: {
      name: string
      description: string
      dueDate: string
    }
  }>('/api/v1/projects/:id/milestones', {
    schema: {
      description: '创建项目里程碑',
      tags: ['analytics'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '项目ID' }
        }
      },
      body: {
        type: 'object',
        required: ['name', 'dueDate'],
        properties: {
          name: { type: 'string', minLength: 1, description: '里程碑名称' },
          description: { type: 'string', description: '里程碑描述' },
          dueDate: { type: 'string', format: 'date-time', description: '截止日期' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                dueDate: { type: 'string' },
                status: { type: 'string' },
                completedAt: { type: ['string', 'null'] }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const { name, description = '', dueDate } = request.body

      // 验证项目是否存在
      const project = await prisma.project.findUnique({
        where: { id }
      })

      if (!project) {
        return reply.status(404).send({
          success: false,
          error: '项目不存在'
        })
      }

      // 创建里程碑
      const milestone = await prisma.milestone.create({
        data: {
          projectId: id,
          name,
          description,
          dueDate: new Date(dueDate),
          status: 'PENDING'
        }
      })

      return reply.status(201).send({
        success: true,
        data: {
          id: milestone.id,
          name: milestone.name,
          description: milestone.description,
          dueDate: milestone.dueDate.toISOString(),
          status: milestone.status,
          completedAt: milestone.completedAt?.toISOString() || null
        }
      })
    } catch (error) {
      fastify.log.error('创建里程碑失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 获取个人贡献统计
 * GET /api/v1/users/:id/contributions
 */
export async function getUserContributionsRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Params: {
      id: string
    }
  }>('/api/v1/users/:id/contributions', {
    schema: {
      description: '获取用户贡献统计',
      tags: ['analytics'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '用户ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                userName: { type: 'string' },
                totalTasks: { type: 'number' },
                completedTasks: { type: 'number' },
                completionRate: { type: 'number' },
                totalPoints: { type: 'number' },
                rank: { type: 'number' },
                weeklyActivity: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string' },
                      taskCount: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params

      // 获取用户信息
      const user = await prisma.user.findUnique({
        where: { id }
      })

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: '用户不存在'
        })
      }

      // 获取用户任务统计
      const tasks = await prisma.task.findMany({
        where: { assigneeId: id }
      })

      const totalTasks = tasks.length
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
      const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      // 获取用户积分
      const points = await prisma.point.findFirst({
        where: { userId: id }
      })
      const totalPoints = points?.amount || 0

      // 计算排名（基于积分）
      const allPoints = await prisma.point.findMany({
        select: { userId: true, amount: true }
      })
      const sortedPoints = allPoints.sort((a, b) => b.amount - a.amount)
      const rank = sortedPoints.findIndex(p => p.userId === id) + 1

      // 生成最近7天活动数据
      const weeklyActivity = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayTasks = tasks.filter(t => {
          const taskDate = t.createdAt.toISOString().split('T')[0]
          return taskDate === dateStr
        })

        weeklyActivity.push({
          date: dateStr,
          taskCount: dayTasks.length
        })
      }

      return reply.status(200).send({
        success: true,
        data: {
          userId: user.id,
          userName: user.name,
          totalTasks,
          completedTasks,
          completionRate,
          totalPoints,
          rank,
          weeklyActivity
        }
      })
    } catch (error) {
      fastify.log.error('获取用户贡献统计失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 获取用户财务信息
 * GET /api/v1/users/:id/finance
 */
export async function getUserFinanceRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Params: {
      id: string
    }
  }>('/api/v1/users/:id/finance', {
    schema: {
      description: '获取用户财务信息',
      tags: ['analytics'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '用户ID' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                totalIncome: { type: 'number' },
                totalExpense: { type: 'number' },
                balance: { type: 'number' },
                pendingSettlement: { type: 'number' },
                transactions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string' },
                      amount: { type: 'number' },
                      description: { type: 'string' },
                      projectId: { type: ['string', 'null'] },
                      projectName: { type: ['string', 'null'] },
                      createdAt: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params

      // 验证用户是否存在
      const user = await prisma.user.findUnique({
        where: { id }
      })

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: '用户不存在'
        })
      }

      // 获取用户结算记录（模拟数据）
      const settlements = await prisma.settlement.findMany({
        where: { userId: id },
        include: {
          project: {
            select: { title: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })

      // 计算财务汇总
      let totalIncome = 0
      const totalExpense = 0
      let pendingSettlement = 0

      const transactions = settlements.map(s => {
        const amount = s.amount
        if (s.status === 'COMPLETED') {
          totalIncome += amount
        } else if (s.status === 'PENDING') {
          pendingSettlement += amount
        }

        return {
          id: s.id,
          type: 'INCOME',
          amount,
          description: s.description || '项目结算',
          projectId: s.projectId,
          projectName: s.project?.title || null,
          createdAt: s.createdAt.toISOString()
        }
      })

      const balance = totalIncome - totalExpense

      return reply.status(200).send({
        success: true,
        data: {
          userId: user.id,
          totalIncome,
          totalExpense,
          balance,
          pendingSettlement,
          transactions
        }
      })
    } catch (error) {
      fastify.log.error('获取用户财务信息失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 获取数据看板
 * GET /api/v1/analytics/dashboard
 */
export async function getDashboardRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/v1/analytics/dashboard', {
    schema: {
      description: '获取数据看板统计',
      tags: ['analytics'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                totalProjects: { type: 'number' },
                activeProjects: { type: 'number' },
                completedProjects: { type: 'number' },
                totalTasks: { type: 'number' },
                completedTasks: { type: 'number' },
                totalUsers: { type: 'number' },
                activeUsers: { type: 'number' },
                totalPoints: { type: 'number' },
                recentActivity: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string' },
                      projectCount: { type: 'number' },
                      taskCount: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      // 获取项目统计
      const [totalProjects, activeProjects, completedProjects] = await Promise.all([
        prisma.project.count(),
        prisma.project.count({ where: { status: 'ACTIVE' } }),
        prisma.project.count({ where: { status: 'COMPLETED' } })
      ])

      // 获取任务统计
      const [totalTasks, completedTasks] = await Promise.all([
        prisma.task.count(),
        prisma.task.count({ where: { status: 'COMPLETED' } })
      ])

      // 获取用户统计
      const [totalUsers, activeUsers] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 最近7天活跃
            }
          }
        })
      ])

      // 获取总积分
      const pointsAgg = await prisma.point.aggregate({
        _sum: { amount: true }
      })
      const totalPoints = pointsAgg._sum.amount || 0

      // 生成最近7天活动数据
      const recentActivity = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayStart = new Date(dateStr)
        const dayEnd = new Date(dateStr)
        dayEnd.setDate(dayEnd.getDate() + 1)

        const [projectCount, taskCount] = await Promise.all([
          prisma.project.count({
            where: {
              createdAt: {
                gte: dayStart,
                lt: dayEnd
              }
            }
          }),
          prisma.task.count({
            where: {
              createdAt: {
                gte: dayStart,
                lt: dayEnd
              }
            }
          })
        ])

        recentActivity.push({
          date: dateStr,
          projectCount,
          taskCount
        })
      }

      return reply.status(200).send({
        success: true,
        data: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalTasks,
          completedTasks,
          totalUsers,
          activeUsers,
          totalPoints,
          recentActivity
        }
      })
    } catch (error) {
      fastify.log.error('获取数据看板失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 项目对比分析
 * GET /api/v1/analytics/projects/compare
 */
export async function getProjectsCompareRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Querystring: {
      projects: string
    }
  }>('/api/v1/analytics/projects/compare', {
    schema: {
      description: '项目对比分析',
      tags: ['analytics'],
      querystring: {
        type: 'object',
        required: ['projects'],
        properties: {
          projects: { type: 'string', description: '逗号分隔的项目ID列表（最多5个）' }
        }
      },
      response: {
        200: {
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
                      status: { type: 'string' },
                      totalTasks: { type: 'number' },
                      completedTasks: { type: 'number' },
                      completionRate: { type: 'number' },
                      averageCycleDays: { type: 'number' },
                      budget: { type: 'number' },
                      budgetDeviation: { type: 'number' },
                      satisfaction: { type: ['number', 'null'] },
                      startDate: { type: ['string', 'null'] },
                      endDate: { type: ['string', 'null'] }
                    }
                  }
                },
                comparedAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
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

      // 获取项目及其任务数据
      const projectData = await Promise.all(
        projectIds.map(async (id) => {
          const project = await prisma.project.findUnique({
            where: { id },
            include: {
              tasks: true,
              reviews: true
            }
          })
          return project
        })
      )

      // 过滤掉不存在的项目
      const existingProjects = projectData.filter(p => p !== null)

      if (existingProjects.length === 0) {
        return reply.status(404).send({
          success: false,
          error: '未找到指定的项目'
        })
      }

      // 计算每个项目的对比数据
      const compareData = existingProjects.map(project => {
        if (!project) return null

        const totalTasks = project.tasks.length
        const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        // 计算平均周期（天）
        let averageCycleDays = 0
        const completedTasksWithDates = project.tasks.filter(
          t => t.status === 'COMPLETED' && t.startDate && t.endDate
        )
        if (completedTasksWithDates.length > 0) {
          const totalDays = completedTasksWithDates.reduce((sum, t) => {
            const start = new Date(t.startDate!).getTime()
            const end = new Date(t.endDate!).getTime()
            return sum + (end - start) / (1000 * 60 * 60 * 24)
          }, 0)
          averageCycleDays = Math.round(totalDays / completedTasksWithDates.length)
        }

        // 计算预算偏差
        const budget = project.budget || 0
        // 模拟预算偏差计算（实际应该基于实际支出）
        const budgetDeviation = budget > 0 ? Math.round((Math.random() * 40 - 20) * 100) / 100 : 0

        // 计算满意度（基于评价）
        let satisfaction: number | null = null
        if (project.reviews.length > 0) {
          const totalScore = project.reviews.reduce((sum, r) => sum + (r.rating || 0), 0)
          satisfaction = Math.round((totalScore / project.reviews.length) * 20) // 转换为100分制
        }

        return {
          id: project.id,
          title: project.title,
          status: project.status,
          totalTasks,
          completedTasks,
          completionRate,
          averageCycleDays,
          budget,
          budgetDeviation,
          satisfaction,
          startDate: project.startDate?.toISOString() || null,
          endDate: project.endDate?.toISOString() || null
        }
      }).filter(Boolean)

      return reply.status(200).send({
        success: true,
        data: {
          projects: compareData,
          comparedAt: new Date().toISOString()
        }
      })
    } catch (error) {
      fastify.log.error('获取项目对比数据失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 获取用户信用趋势
 * GET /api/v1/users/:id/credit-trend
 */
export async function getUserCreditTrendRoute(fastify: FastifyInstance): Promise<void> {
  fastify.get<{
    Params: {
      id: string
    }
    Querystring: {
      days?: number
    }
  }>('/api/v1/users/:id/credit-trend', {
    schema: {
      description: '获取用户信用趋势数据',
      tags: ['analytics'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: '用户ID' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          days: { type: 'number', description: '查询天数（默认30天）', minimum: 7, maximum: 365 }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                userName: { type: 'string' },
                currentCreditScore: { type: 'number' },
                creditLevel: { type: 'string' },
                history: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      date: { type: 'string' },
                      score: { type: 'number' },
                      change: { type: 'number' }
                    }
                  }
                },
                factors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      score: { type: 'number' },
                      weight: { type: 'number' },
                      trend: { type: 'string', enum: ['up', 'down', 'stable'] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params
      const { days = 30 } = request.query

      // 验证用户是否存在
      const user = await prisma.user.findUnique({
        where: { id }
      })

      if (!user) {
        return reply.status(404).send({
          success: false,
          error: '用户不存在'
        })
      }

      // 生成模拟的信用趋势数据
      // 实际项目中应该从数据库读取历史信用记录
      const history = []
      const baseScore = 650 // 基础信用分
      const today = new Date()
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        // 模拟分数波动
        const randomChange = Math.round((Math.random() - 0.5) * 10)
        const dayScore = baseScore + randomChange + (days - i) * 0.5 // 总体趋势向上
        
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

      // 信用影响因素
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
    } catch (error) {
      fastify.log.error('获取用户信用趋势失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 导出报表为PDF
 * POST /api/v1/analytics/export/pdf
 */
export async function exportPdfRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post<{
    Body: {
      type: 'project-progress' | 'project-compare' | 'dashboard' | 'user-contribution'
      projectId?: string
      projectIds?: string[]
      userId?: string
    }
  }>('/api/v1/analytics/export/pdf', {
    schema: {
      description: '导出报表为PDF',
      tags: ['analytics'],
      body: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ['project-progress', 'project-compare', 'dashboard', 'user-contribution'],
            description: '报表类型'
          },
          projectId: { type: 'string', description: '项目ID（project-progress类型必填）' },
          projectIds: {
            type: 'array',
            items: { type: 'string' },
            description: '项目ID数组（project-compare类型必填）'
          },
          userId: { type: 'string', description: '用户ID（user-contribution类型必填）' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            filename: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { type, projectId, projectIds, userId } = request.body

      // 动态导入PDF导出服务
      const { exportProjectProgressToPdf, exportProjectCompareToPdf, exportDashboardToPdf, downloadPdf } = await import('../services/pdf-export')

      let filename = ''
      let pdfBlob: Blob | null = null

      switch (type) {
        case 'project-progress': {
          if (!projectId) {
            return reply.status(400).send({
              success: false,
              error: 'projectId是必填参数'
            })
          }

          // 获取项目进度数据
          const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
              tasks: true,
              milestones: true
            }
          })

          if (!project) {
            return reply.status(404).send({
              success: false,
              error: '项目不存在'
            })
          }

          const totalTasks = project.tasks.length
          const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length
          const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
          const totalMilestones = project.milestones.length
          const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED').length

          let daysRemaining: number | null = null
          if (project.endDate) {
            const endDate = new Date(project.endDate)
            const now = new Date()
            const diffTime = endDate.getTime() - now.getTime()
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          }

          const progressData = {
            id: project.id,
            title: project.title,
            status: project.status,
            totalTasks,
            completedTasks,
            progressPercentage,
            totalMilestones,
            completedMilestones,
            startDate: project.startDate?.toISOString() || null,
            endDate: project.endDate?.toISOString() || null,
            daysRemaining
          }

          pdfBlob = exportProjectProgressToPdf(progressData)
          filename = `project-progress-${projectId}`
          break
        }

        case 'project-compare': {
          if (!projectIds || projectIds.length === 0) {
            return reply.status(400).send({
              success: false,
              error: 'projectIds是必填参数'
            })
          }

          // 获取项目数据
          const projects = await Promise.all(
            projectIds.map(id => prisma.project.findUnique({
              where: { id },
              include: { tasks: true, reviews: true }
            }))
          )

          const existingProjects = projects.filter(p => p !== null)

          if (existingProjects.length === 0) {
            return reply.status(404).send({
              success: false,
              error: '未找到指定的项目'
            })
          }

          const compareData = existingProjects.map(project => {
            if (!project) return null

            const totalTasks = project.tasks.length
            const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            let averageCycleDays = 0
            const completedTasksWithDates = project.tasks.filter(
              t => t.status === 'COMPLETED' && t.startDate && t.endDate
            )
            if (completedTasksWithDates.length > 0) {
              const totalDays = completedTasksWithDates.reduce((sum, t) => {
                const start = new Date(t.startDate!).getTime()
                const end = new Date(t.endDate!).getTime()
                return sum + (end - start) / (1000 * 60 * 60 * 24)
              }, 0)
              averageCycleDays = Math.round(totalDays / completedTasksWithDates.length)
            }

            let satisfaction: number | null = null
            if (project.reviews.length > 0) {
              const totalScore = project.reviews.reduce((sum, r) => sum + (r.rating || 0), 0)
              satisfaction = Math.round((totalScore / project.reviews.length) * 20)
            }

            return {
              id: project.id,
              title: project.title,
              status: project.status,
              totalTasks,
              completedTasks,
              completionRate,
              averageCycleDays,
              budget: project.budget || 0,
              budgetDeviation: 0,
              satisfaction,
              startDate: project.startDate?.toISOString() || null,
              endDate: project.endDate?.toISOString() || null
            }
          }).filter(Boolean) as any[]

          pdfBlob = exportProjectCompareToPdf(compareData)
          filename = 'project-comparison'
          break
        }

        case 'dashboard': {
          // 获取看板数据
          const [totalProjects, activeProjects, completedProjects, totalTasks, completedTasks, totalUsers, activeUsers] = await Promise.all([
            prisma.project.count(),
            prisma.project.count({ where: { status: 'ACTIVE' } }),
            prisma.project.count({ where: { status: 'COMPLETED' } }),
            prisma.task.count(),
            prisma.task.count({ where: { status: 'COMPLETED' } }),
            prisma.user.count(),
            prisma.user.count({
              where: {
                updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
              }
            })
          ])

          const pointsAgg = await prisma.point.aggregate({
            _sum: { amount: true }
          })
          const totalPoints = pointsAgg._sum.amount || 0

          // 生成最近7天活动数据
          const recentActivity = []
          for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            
            const dayStart = new Date(dateStr)
            const dayEnd = new Date(dateStr)
            dayEnd.setDate(dayEnd.getDate() + 1)

            const [projectCount, taskCount] = await Promise.all([
              prisma.project.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
              prisma.task.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } })
            ])

            recentActivity.push({ date: dateStr, projectCount, taskCount })
          }

          const dashboardData = {
            totalProjects,
            activeProjects,
            completedProjects,
            totalTasks,
            completedTasks,
            totalUsers,
            activeUsers,
            totalPoints,
            recentActivity
          }

          pdfBlob = exportDashboardToPdf(dashboardData)
          filename = 'dashboard-report'
          break
        }

        case 'user-contribution': {
          if (!userId) {
            return reply.status(400).send({
              success: false,
              error: 'userId是必填参数'
            })
          }

          const user = await prisma.user.findUnique({
            where: { id: userId }
          })

          if (!user) {
            return reply.status(404).send({
              success: false,
              error: '用户不存在'
            })
          }

          const tasks = await prisma.task.findMany({
            where: { assigneeId: userId }
          })

          const totalTasks = tasks.length
          const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

          const points = await prisma.point.findFirst({
            where: { userId }
          })
          const totalPoints = points?.amount || 0

          const allPoints = await prisma.point.findMany({
            select: { userId: true, amount: true }
          })
          const sortedPoints = allPoints.sort((a, b) => b.amount - a.amount)
          const rank = sortedPoints.findIndex(p => p.userId === userId) + 1

          const weeklyActivity = []
          for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            
            const dayTasks = tasks.filter(t => t.createdAt.toISOString().split('T')[0] === dateStr)

            weeklyActivity.push({
              date: dateStr,
              taskCount: dayTasks.length
            })
          }

          const contributionData = {
            userId: user.id,
            userName: user.name,
            totalTasks,
            completedTasks,
            completionRate,
            totalPoints,
            rank,
            weeklyActivity
          }

          // 动态导入简化的PDF生成
          const { jsPDF } = await import('jspdf')
          const doc = new jsPDF()
          doc.setFontSize(20)
          doc.text('个人贡献报告', 105, 20, { align: 'center' })
          
          doc.setFontSize(12)
          doc.text(`用户名: ${contributionData.userName}`, 20, 40)
          doc.text(`总任务: ${contributionData.totalTasks}`, 20, 50)
          doc.text(`已完成: ${contributionData.completedTasks}`, 20, 60)
          doc.text(`完成率: ${contributionData.completionRate}%`, 20, 70)
          doc.text(`总积分: ${contributionData.totalPoints}`, 20, 80)
          doc.text(`排名: #${contributionData.rank}`, 20, 90)

          pdfBlob = doc.output('blob')
          filename = `user-contribution-${userId}`
          break
        }

        default:
          return reply.status(400).send({
            success: false,
            error: '不支持的报表类型'
          })
      }

      if (pdfBlob) {
        // 设置响应头
        reply.header('Content-Type', 'application/pdf')
        reply.header('Content-Disposition', `attachment; filename="${filename}.pdf"`)
        
        return reply.status(200).send(pdfBlob)
      }

      return reply.status(500).send({
        success: false,
        error: '生成PDF失败'
      })
    } catch (error) {
      fastify.log.error('导出PDF失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}

/**
 * 导出报表为Excel
 * POST /api/v1/analytics/export/excel
 */
export async function exportExcelRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post<{
    Body: {
      type: 'project-progress' | 'project-compare' | 'dashboard' | 'user-contribution'
      projectId?: string
      projectIds?: string[]
      userId?: string
    }
  }>('/api/v1/analytics/export/excel', {
    schema: {
      description: '导出报表为Excel',
      tags: ['analytics'],
      body: {
        type: 'object',
        required: ['type'],
        properties: {
          type: {
            type: 'string',
            enum: ['project-progress', 'project-compare', 'dashboard', 'user-contribution'],
            description: '报表类型'
          },
          projectId: { type: 'string', description: '项目ID（project-progress类型必填）' },
          projectIds: {
            type: 'array',
            items: { type: 'string' },
            description: '项目ID数组（project-compare类型必填）'
          },
          userId: { type: 'string', description: '用户ID（user-contribution类型必填）' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            filename: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { type, projectId, projectIds, userId } = request.body

      // 动态导入Excel导出服务
      const { 
        exportProjectProgressToExcel, 
        exportProjectCompareToExcel, 
        exportDashboardToExcel,
        exportUserContributionToExcel 
      } = await import('../services/excel-export')

      let filename = ''
      let excelBlob: Blob | null = null

      switch (type) {
        case 'project-progress': {
          if (!projectId) {
            return reply.status(400).send({
              success: false,
              error: 'projectId是必填参数'
            })
          }

          const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
              tasks: true,
              milestones: true
            }
          })

          if (!project) {
            return reply.status(404).send({
              success: false,
              error: '项目不存在'
            })
          }

          const totalTasks = project.tasks.length
          const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length
          const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
          const totalMilestones = project.milestones.length
          const completedMilestones = project.milestones.filter(m => m.status === 'COMPLETED').length

          let daysRemaining: number | null = null
          if (project.endDate) {
            const endDate = new Date(project.endDate)
            const now = new Date()
            const diffTime = endDate.getTime() - now.getTime()
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          }

          const progressData = {
            id: project.id,
            title: project.title,
            status: project.status,
            totalTasks,
            completedTasks,
            progressPercentage,
            totalMilestones,
            completedMilestones,
            startDate: project.startDate?.toISOString() || null,
            endDate: project.endDate?.toISOString() || null,
            daysRemaining
          }

          excelBlob = exportProjectProgressToExcel(progressData)
          filename = `project-progress-${projectId}`
          break
        }

        case 'project-compare': {
          if (!projectIds || projectIds.length === 0) {
            return reply.status(400).send({
              success: false,
              error: 'projectIds是必填参数'
            })
          }

          const projects = await Promise.all(
            projectIds.map(id => prisma.project.findUnique({
              where: { id },
              include: { tasks: true, reviews: true }
            }))
          )

          const existingProjects = projects.filter(p => p !== null)

          if (existingProjects.length === 0) {
            return reply.status(404).send({
              success: false,
              error: '未找到指定的项目'
            })
          }

          const compareData = existingProjects.map(project => {
            if (!project) return null

            const totalTasks = project.tasks.length
            const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

            let averageCycleDays = 0
            const completedTasksWithDates = project.tasks.filter(
              t => t.status === 'COMPLETED' && t.startDate && t.endDate
            )
            if (completedTasksWithDates.length > 0) {
              const totalDays = completedTasksWithDates.reduce((sum, t) => {
                const start = new Date(t.startDate!).getTime()
                const end = new Date(t.endDate!).getTime()
                return sum + (end - start) / (1000 * 60 * 60 * 24)
              }, 0)
              averageCycleDays = Math.round(totalDays / completedTasksWithDates.length)
            }

            let satisfaction: number | null = null
            if (project.reviews.length > 0) {
              const totalScore = project.reviews.reduce((sum, r) => sum + (r.rating || 0), 0)
              satisfaction = Math.round((totalScore / project.reviews.length) * 20)
            }

            return {
              id: project.id,
              title: project.title,
              status: project.status,
              totalTasks,
              completedTasks,
              completionRate,
              averageCycleDays,
              budget: project.budget || 0,
              budgetDeviation: 0,
              satisfaction,
              startDate: project.startDate?.toISOString() || null,
              endDate: project.endDate?.toISOString() || null
            }
          }).filter(Boolean) as any[]

          excelBlob = exportProjectCompareToExcel(compareData)
          filename = 'project-comparison'
          break
        }

        case 'dashboard': {
          const [totalProjects, activeProjects, completedProjects, totalTasks, completedTasks, totalUsers, activeUsers] = await Promise.all([
            prisma.project.count(),
            prisma.project.count({ where: { status: 'ACTIVE' } }),
            prisma.project.count({ where: { status: 'COMPLETED' } }),
            prisma.task.count(),
            prisma.task.count({ where: { status: 'COMPLETED' } }),
            prisma.user.count(),
            prisma.user.count({
              where: {
                updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
              }
            })
          ])

          const pointsAgg = await prisma.point.aggregate({
            _sum: { amount: true }
          })
          const totalPoints = pointsAgg._sum.amount || 0

          const recentActivity = []
          for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            
            const dayStart = new Date(dateStr)
            const dayEnd = new Date(dateStr)
            dayEnd.setDate(dayEnd.getDate() + 1)

            const [projectCount, taskCount] = await Promise.all([
              prisma.project.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } }),
              prisma.task.count({ where: { createdAt: { gte: dayStart, lt: dayEnd } } })
            ])

            recentActivity.push({ date: dateStr, projectCount, taskCount })
          }

          const dashboardData = {
            totalProjects,
            activeProjects,
            completedProjects,
            totalTasks,
            completedTasks,
            totalUsers,
            activeUsers,
            totalPoints,
            recentActivity
          }

          excelBlob = exportDashboardToExcel(dashboardData)
          filename = 'dashboard-report'
          break
        }

        case 'user-contribution': {
          if (!userId) {
            return reply.status(400).send({
              success: false,
              error: 'userId是必填参数'
            })
          }

          const user = await prisma.user.findUnique({
            where: { id: userId }
          })

          if (!user) {
            return reply.status(404).send({
              success: false,
              error: '用户不存在'
            })
          }

          const tasks = await prisma.task.findMany({
            where: { assigneeId: userId }
          })

          const totalTasks = tasks.length
          const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length
          const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

          const points = await prisma.point.findFirst({
            where: { userId }
          })
          const totalPoints = points?.amount || 0

          const allPoints = await prisma.point.findMany({
            select: { userId: true, amount: true }
          })
          const sortedPoints = allPoints.sort((a, b) => b.amount - a.amount)
          const rank = sortedPoints.findIndex(p => p.userId === userId) + 1

          const weeklyActivity = []
          for (let i = 6; i >= 0; i--) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            
            const dayTasks = tasks.filter(t => t.createdAt.toISOString().split('T')[0] === dateStr)

            weeklyActivity.push({
              date: dateStr,
              taskCount: dayTasks.length
            })
          }

          const contributionData = {
            userId: user.id,
            userName: user.name,
            totalTasks,
            completedTasks,
            completionRate,
            totalPoints,
            rank,
            weeklyActivity
          }

          excelBlob = exportUserContributionToExcel(contributionData)
          filename = `user-contribution-${userId}`
          break
        }

        default:
          return reply.status(400).send({
            success: false,
            error: '不支持的报表类型'
          })
      }

      if (excelBlob) {
        reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        reply.header('Content-Disposition', `attachment; filename="${filename}.xlsx"`)
        
        return reply.status(200).send(excelBlob)
      }

      return reply.status(500).send({
        success: false,
        error: '生成Excel失败'
      })
    } catch (error) {
      fastify.log.error('导出Excel失败:', error)
      return reply.status(500).send({
        success: false,
        error: '服务器内部错误'
      })
    }
  })
}
