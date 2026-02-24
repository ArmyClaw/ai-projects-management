/**
 * AIAgent模拟API路由
 * 
 * 提供AIAgent模拟API，用于冷启动支持和社区活跃度：
 * - POST /api/v1/ai-agents - 创建模拟用户
 * - GET /api/v1/ai-agents - 查询AIAgent列表
 * - POST /api/v1/ai-agents/:id/action - 触发Agent行为
 */

import { FastifyInstance } from 'fastify'
import { PrismaClient, User } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * AIAgent类型定义
 */
interface AIAgentType {
  id: string
  name: string
  description: string
  behaviors: string[]
}

interface AIAgentCreateBody {
  type: string
  name?: string
  initialPoints?: number
  skills?: string[]
  avatar?: string
}

interface AIAgentQueryParams {
  status?: string
  page?: string
  pageSize?: string
}

interface AIAgentActionBody {
  action: string
  targetId?: string
  params?: Record<string, unknown>
}

interface AIAgentResult {
  success: boolean
  action?: string
  message?: string
  taskId?: string
  qualityScore?: number
  reward?: number
  newPoints?: number
  error?: string
  skillId?: string
  projectId?: string
}

/**
 * 支持的AIAgent类型
 */
const AGENT_TYPES: Record<string, AIAgentType> = {
  TASK_COMPLETER: {
    id: 'TASK_COMPLETER',
    name: '任务完成者',
    description: '定期认领和完成任务',
    behaviors: ['CLAIM_TASK', 'COMPLETE_TASK', 'SUBMIT_TASK']
  },
  REVIEWER: {
    id: 'REVIEWER',
    name: '评审员',
    description: '定期进行任务验收评审',
    behaviors: ['REVIEW_TASK', 'APPROVE_TASK', 'REJECT_TASK']
  },
  SKILL_SHARER: {
    id: 'SKILL_SHARER',
    name: '技能分享者',
    description: '创建和分享Skill',
    behaviors: ['CREATE_SKILL', 'UPDATE_SKILL']
  },
  PROJECT_INITIATOR: {
    id: 'PROJECT_INITIATOR',
    name: '项目发起者',
    description: '定期发起项目',
    behaviors: ['CREATE_PROJECT', 'ADD_MILESTONE', 'CLOSE_PROJECT']
  }
}

/**
 * POST /api/v1/ai-agents - 创建模拟用户
 */
export async function createAIAgentRoute(fastify: FastifyInstance) {
  fastify.post<{
    Body: {
      type: string
      name?: string
      initialPoints?: number
      skills?: string[]
      avatar?: string
    }
  }>('/api/v1/ai-agents', {
    schema: {
      description: '创建AI代理',
      tags: ['ai-agent'],
      body: {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['TASK_COMPLETER', 'REVIEWER', 'SKILL_SHARER', 'PROJECT_INITIATOR'], description: 'Agent类型' },
          name: { type: 'string', description: 'Agent名称' },
          initialPoints: { type: 'number', description: '初始积分' },
          skills: { type: 'array', items: { type: 'string' }, description: '技能列表' },
          avatar: { type: 'string', description: '头像URL' }
        }
      },
      response: {
        201: {
          description: '创建成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'string' },
                name: { type: 'string' },
                avatar: { type: 'string' },
                points: { type: 'number' },
                skills: { type: 'array', items: { type: 'string' } },
                status: { type: 'string' },
                agentType: { type: 'object' },
                createdAt: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { type, name, initialPoints, skills, avatar } = request.body as AIAgentCreateBody

    // 验证类型
    if (!type || !AGENT_TYPES[type]) {
      reply.status(400)
      return { 
        success: false, 
        error: `无效的Agent类型，可用类型: ${Object.keys(AGENT_TYPES).join(', ')}` 
      }
    }

    try {
      // 生成唯一名称
      const agentName = name || `${AGENT_TYPES[type].name}_${Date.now()}`
      
      // 创建模拟用户
      const agent = await prisma.user.create({
        data: {
          email: `ai-agent-${Date.now()}@aipm.local`,
          name: agentName,
          avatar: avatar || null,
          role: 'PARTICIPANT',
          status: 'ACTIVE',
          points: initialPoints || 100
        }
      })

      return {
        success: true,
        data: {
          id: agent.id,
          type,
          name: agent.name,
          avatar: agent.avatar,
          points: agent.points,
          skills: skills || [],
          status: agent.status,
          agentType: AGENT_TYPES[type],
          createdAt: agent.createdAt.toISOString()
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '创建AIAgent失败' }
    }
  })
}

/**
 * GET /api/v1/ai-agents - 查询AIAgent列表
 */
export async function getAIAgentsRoute(fastify: FastifyInstance) {
  fastify.get<{
    Querystring: {
      status?: string
      page?: string
      pageSize?: string
    }
  }>('/api/v1/ai-agents', {
    schema: {
      description: '查询AI代理列表',
      tags: ['ai-agent'],
      querystring: {
        type: 'object',
        properties: {
          status: { type: 'string', description: '状态筛选' },
          page: { type: 'string', default: '1', description: '页码' },
          pageSize: { type: 'string', default: '10', description: '每页数量' }
        }
      },
      response: {
        200: {
          description: '成功返回AI代理列表',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                agents: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      avatar: { type: 'string' },
                      points: { type: 'number' },
                      status: { type: 'string' },
                      type: { type: 'string' },
                      agentType: { type: 'object' }
                    }
                  }
                },
                total: { type: 'number' },
                page: { type: 'number' },
                pageSize: { type: 'number' },
                totalPages: { type: 'number' },
                agentTypes: { type: 'array' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { status, page, pageSize } = request.query as AIAgentQueryParams

    const pageNum = Math.max(1, Number(page) || 1)
    const pageSizeNum = Math.min(100, Math.max(1, Number(pageSize) || 10))

    try {
      // 查询AIAgent（通过邮箱前缀识别）
      const where: { email: { startsWith: string }; status?: string } = {
        email: { startsWith: 'ai-agent-' }
      }
      
      if (status) {
        where.status = status
      }

      const [agents, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (pageNum - 1) * pageSizeNum,
          take: pageSizeNum,
          select: {
            id: true,
            name: true,
            avatar: true,
            points: true,
            status: true,
            createdAt: true
          }
        }),
        prisma.user.count({ where })
      ])

      const totalPages = Math.ceil(total / pageSizeNum)

      // 为每个Agent推断类型（简化处理）
      const agentsWithType = agents.map(agent => ({
        ...agent,
        type: 'TASK_COMPLETER', // 默认类型
        agentType: AGENT_TYPES.TASK_COMPLETER
      }))

      return {
        success: true,
        data: {
          agents: agentsWithType,
          total,
          page: pageNum,
          pageSize: pageSizeNum,
          totalPages,
          agentTypes: Object.values(AGENT_TYPES)
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '查询AIAgent列表失败' }
    }
  })
}

/**
 * POST /api/v1/ai-agents/:id/action - 触发Agent行为
 */
export async function triggerAIAgentActionRoute(fastify: FastifyInstance) {
  fastify.post<{
    Params: { id: string }
    Body: {
      action: string
      targetId?: string
      params?: Record<string, unknown>
    }
  }>('/api/v1/ai-agents/:id/action', {
    schema: {
      description: '触发AI代理行为',
      tags: ['ai-agent'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Agent ID' }
        }
      },
      body: {
        type: 'object',
        required: ['action'],
        properties: {
          action: { type: 'string', description: '行为类型' },
          targetId: { type: 'string', description: '目标ID' },
          params: { type: 'object', description: '行为参数' }
        }
      },
      response: {
        200: {
          description: '行为执行成功',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                agentId: { type: 'string' },
                agentName: { type: 'string' },
                action: { type: 'string' },
                targetId: { type: 'string' },
                success: { type: 'boolean' },
                message: { type: 'string' },
                taskId: { type: 'string' },
                qualityScore: { type: 'number' },
                reward: { type: 'number' },
                newPoints: { type: 'number' },
                error: { type: 'string' },
                skillId: { type: 'string' },
                projectId: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    const { id: agentId } = request.params as { id: string }
    const { action, targetId, params } = request.body as AIAgentActionBody

    // 验证必填字段
    if (!action) {
      reply.status(400)
      return { success: false, error: '缺少行为类型' }
    }

    try {
      // 验证Agent是否存在
      const agent = await prisma.user.findUnique({
        where: { id: agentId },
        select: { id: true, name: true, points: true, status: true }
      })

      if (!agent) {
        reply.status(404)
        return { success: false, error: 'AIAgent不存在' }
      }

      if (agent.status !== 'ACTIVE') {
        reply.status(400)
        return { success: false, error: 'AIAgent未激活' }
      }

      // 根据行为类型处理
      let result: AIAgentResult = { success: true, action }

      switch (action) {
        case 'CLAIM_TASK':
          // 模拟认领任务
          result = await simulateClaimTask(agentId, targetId)
          break
          
        case 'COMPLETE_TASK':
          // 模拟完成任务
          result = await simulateCompleteTask(agentId, targetId)
          break
          
        case 'SUBMIT_TASK':
          // 模拟提交任务
          result = await simulateSubmitTask(agentId, targetId)
          break
          
        case 'REVIEW_TASK':
          // 模拟评审任务
          result = await simulateReviewTask(agentId, targetId)
          break
          
        case 'APPROVE_TASK':
          // 模拟通过评审
          result = await simulateApproveTask(agentId, targetId)
          break
          
        case 'REJECT_TASK':
          // 模拟拒绝评审
          result = await simulateRejectTask(agentId, targetId)
          break
          
        case 'CREATE_SKILL':
          // 模拟创建Skill
          result = await simulateCreateSkill(agentId, params)
          break
          
        case 'CREATE_PROJECT':
          // 模拟创建项目
          result = await simulateCreateProject(agentId, params)
          break
          
        default:
          result = { success: false, error: '不支持的行为类型' }
      }

      return {
        success: result.success,
        data: {
          agentId,
          agentName: agent.name,
          action,
          targetId,
          ...result
        }
      }
    } catch (error) {
      request.log.error(error)
      reply.status(500)
      return { success: false, error: '执行AIAgent行为失败' }
    }
  })
}

/**
 * 模拟认领任务
 */
async function simulateClaimTask(agentId: string, taskId?: string) {
  if (!taskId) {
    return { success: false, error: '缺少任务ID' }
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        assigneeId: agentId,
        status: 'CLAIMED'
      }
    })

    return { 
      success: true, 
      message: `Agent ${agentId} 成功认领任务 ${taskId}`,
      taskId 
    }
  } catch (error) {
    return { success: false, error: '认领任务失败' }
  }
}

/**
 * 模拟完成任务
 */
async function simulateCompleteTask(agentId: string, taskId?: string) {
  if (!taskId) {
    return { success: false, error: '缺少任务ID' }
  }

  try {
    // 随机生成完成质量分数 (4.0-5.0)
    const qualityScore = 4 + Math.random()
    const reward = Math.floor(qualityScore * 100)

    // 更新任务状态
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'SUBMITTED' }
    })

    // 更新Agent积分
    const agent = await prisma.user.findUnique({ where: { id: agentId } })
    if (agent) {
      await prisma.user.update({
        where: { id: agentId },
        data: { points: agent.points + reward }
      })
    }

    return { 
      success: true, 
      message: '任务完成',
      qualityScore,
      reward,
      newPoints: (agent?.points || 0) + reward
    }
  } catch (error) {
    return { success: false, error: '完成任务失败' }
  }
}

/**
 * 模拟提交任务
 */
async function simulateSubmitTask(agentId: string, taskId?: string) {
  return { 
    success: true, 
    message: '任务已提交等待验收',
    taskId 
  }
}

/**
 * 模拟评审任务
 */
async function simulateReviewTask(agentId: string, taskId?: string) {
  return { 
    success: true, 
    message: '开始评审',
    taskId 
  }
}

/**
 * 模拟通过评审
 */
async function simulateApproveTask(agentId: string, taskId?: string) {
  return { 
    success: true, 
    message: '验收通过',
    taskId 
  }
}

/**
 * 模拟拒绝评审
 */
async function simulateRejectTask(agentId: string, taskId?: string) {
  return { 
    success: true, 
    message: '验收拒绝',
    taskId 
  }
}

/**
 * 模拟创建Skill
 * @param _agentId - 代理ID（预留参数）
 * @param _params - 创建参数
 * @returns 创建结果
 */
async function simulateCreateSkill(_agentId: string, _params?: Record<string, unknown>): Promise<AIAgentResult> {
  return { 
    success: true, 
    message: 'Skill创建成功',
    skillId: `skill-${Date.now()}`
  }
}

/**
 * 模拟创建项目
 * @param _agentId - 代理ID（预留参数）
 * @param _params - 创建参数
 * @returns 创建结果
 */
async function simulateCreateProject(_agentId: string, _params?: Record<string, unknown>): Promise<AIAgentResult> {
  return { 
    success: true, 
    message: '项目创建成功',
    projectId: `project-${Date.now()}`
  }
}

/**
 * AIAgent API路由注册
 */
export default async function aiAgentRoutes(fastify: FastifyInstance) {
  await createAIAgentRoute(fastify)
  await getAIAgentsRoute(fastify)
  await triggerAIAgentActionRoute(fastify)
}
