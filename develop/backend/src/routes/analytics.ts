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
      let totalExpense = 0
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
